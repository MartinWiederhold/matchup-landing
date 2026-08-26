import { test, expect, type Page, type ConsoleMessage } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * Voller /tour2-Durchlauf am Testkonto. Schreiben nur über die Oberfläche wie ein
 * Nutzer; Snapshot/Restore ausschließlich REST (JWT + Anon-Key, RLS). Am Ende
 * ist das Konto wieder B0.
 */
function envVal(name: string): string {
  if (process.env[name]) return process.env[name] as string;
  for (const f of [".env.e2e", ".env.local"]) {
    try {
      const m = readFileSync(f, "utf8").match(new RegExp("^" + name + "=(.*)$", "m"));
      if (m) return m[1].trim().replace(/^["']|["']$/g, "");
    } catch { /* fehlt */ }
  }
  return "";
}

const EMAIL = envVal("E2E_EMAIL");
const PASSWORD = envVal("E2E_PASSWORD");
const GATE_CODE = envVal("E2E_GATE_CODE") || envVal("SITE_GATE_TOKEN") || "50805080";
const SUPA_URL = envVal("NEXT_PUBLIC_SUPABASE_URL");
const SUPA_KEY = envVal("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const RESULT_NAME = "E2E-Walk-Result";
const DOC_SCOPE = "ZZ";

type StepLog = { step: string; ok: boolean; ms: number; errors: string[]; note: string };

async function login(page: Page) {
  await page.request.post("/api/unlock", { data: { code: GATE_CODE } });
  await page.goto("/app");
  await page.locator('input[type="email"]').first().fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await page.getByRole("button", { name: /^EINLOGGEN$|^LOG IN$/ }).click();
  await expect(page.locator('input[type="email"]')).toHaveCount(0, { timeout: 45_000 });
}

async function readAuth(page: Page): Promise<{ token: string; uid: string }> {
  const a = await page.evaluate(() => {
    for (const k of Object.keys(localStorage)) {
      if (/^sb-.*-auth-token$/.test(k)) {
        let raw = localStorage.getItem(k) as string;
        if (raw.startsWith("base64-")) raw = atob(raw.slice(7));
        try {
          const j = JSON.parse(raw);
          return { token: j.access_token as string, uid: (j.user?.id ?? j.currentSession?.user?.id) as string };
        } catch { /* weiter */ }
      }
    }
    return null;
  });
  expect(a?.token && a?.uid, "Session lesbar").toBeTruthy();
  return a as { token: string; uid: string };
}

function rest(token: string) {
  const h = { apikey: SUPA_KEY, Authorization: `Bearer ${token}` };
  const get = async (path: string) => {
    const r = await fetch(`${SUPA_URL}/rest/v1/${path}`, { headers: { ...h, "Accept-Profile": "web" }, signal: AbortSignal.timeout(12_000) });
    if (!r.ok) throw new Error(`GET ${path} ${r.status}`);
    return r.json();
  };
  const del = async (path: string) => {
    const r = await fetch(`${SUPA_URL}/rest/v1/${path}`, { method: "DELETE", headers: { ...h, "Content-Profile": "web", Prefer: "return=minimal" }, signal: AbortSignal.timeout(12_000) });
    if (!r.ok) throw new Error(`DELETE ${path} ${r.status}`);
  };
  return {
    seasonIds: async (): Promise<string[]> =>
      ((await get("tour_season_plan?select=tournament_id")) as { tournament_id: string }[])
        .map((x) => x.tournament_id)
        .sort(),
    resultIds: async (): Promise<string[]> =>
      ((await get("tour_result_history?select=id")) as { id: string }[]).map((x) => x.id).sort(),
    docIds: async (): Promise<string[]> =>
      ((await get("tour_travel_document?select=id")) as { id: string }[]).map((x) => x.id).sort(),
    presenceKeys: async (uid: string): Promise<string[]> =>
      ((await get(`player_presence?select=tournament_id&user_id=eq.${uid}`)) as { tournament_id: string }[])
        .map((x) => x.tournament_id)
        .sort(),
    budget: async (uid: string): Promise<number | null> => {
      const rows = (await get(`tour_profiles?select=season_budget&user_id=eq.${uid}`)) as { season_budget: number | null }[];
      return rows[0]?.season_budget ?? null;
    },
    deleteSeasonNotIn: async (keep: string[]) => {
      const now = await (async () =>
        ((await get("tour_season_plan?select=tournament_id")) as { tournament_id: string }[]).map((x) => x.tournament_id))();
      const drop = now.filter((id) => !keep.includes(id));
      if (drop.length === 0) return;
      await del(`tour_season_plan?tournament_id=in.(${drop.join(",")})`);
    },
    deleteResultsByName: async (name: string) => {
      await del(`tour_result_history?tournament_name=eq.${encodeURIComponent(name)}`);
    },
    deleteDocsNotIn: async (keep: string[]) => {
      const now = ((await get("tour_travel_document?select=id")) as { id: string }[]).map((x) => x.id);
      for (const id of now.filter((x) => !keep.includes(x))) {
        await del(`tour_travel_document?id=eq.${id}`);
      }
    },
    deletePresenceNotIn: async (uid: string, keep: string[]) => {
      const now = ((await get(`player_presence?select=tournament_id&user_id=eq.${uid}`)) as { tournament_id: string }[])
        .map((x) => x.tournament_id);
      for (const tid of now.filter((x) => !keep.includes(x))) {
        await del(`player_presence?user_id=eq.${uid}&tournament_id=eq.${tid}`);
      }
    },
    restoreBudget: async (uid: string, budget: number | null) => {
      const r = await fetch(`${SUPA_URL}/rest/v1/tour_profiles?user_id=eq.${uid}`, {
        method: "PATCH",
        headers: { ...h, "Content-Type": "application/json", "Content-Profile": "web", Prefer: "return=minimal" },
        body: JSON.stringify({ season_budget: budget }),
        signal: AbortSignal.timeout(12_000),
      });
      if (!r.ok) throw new Error(`PATCH tour_profiles ${r.status}`);
    },
    fingerprint: async (uid: string) => {
      const [season, results, docs, presence, budget] = await Promise.all([
        (async () =>
          ((await get("tour_season_plan?select=tournament_id")) as { tournament_id: string }[])
            .map((x) => x.tournament_id)
            .sort())(),
        (async () => ((await get("tour_result_history?select=id")) as { id: string }[]).map((x) => x.id).sort())(),
        (async () => ((await get("tour_travel_document?select=id")) as { id: string }[]).map((x) => x.id).sort())(),
        (async () =>
          ((await get(`player_presence?select=tournament_id&user_id=eq.${uid}`)) as { tournament_id: string }[])
            .map((x) => x.tournament_id)
            .sort())(),
        (async () => {
          const rows = (await get(`tour_profiles?select=season_budget&user_id=eq.${uid}`)) as { season_budget: number | null }[];
          return rows[0]?.season_budget ?? null;
        })(),
      ]);
      return { season, results, docs, presence, budget };
    },
  };
}

function isNoise(msg: string): boolean {
  return /Download the React DevTools|tpembars|favicon|hydration|HMR|Fast Refresh|net::ERR_BLOCKED/i.test(msg);
}

async function waitCatalog(page: Page) {
  await expect(page.getByRole("textbox", { name: /Saisonbudget|Season budget/ })).toHaveValue(/\d+/, { timeout: 45_000 });
  await page.waitForFunction(
    () => !/Loading tournaments|Turniere werden geladen/.test(document.body.innerText),
    { timeout: 45_000 },
  );
}

/** Lokales Budgetfeld — persistiert nicht in tour_profiles, nur für den Optimierer-Lauf. */
async function setSeasonBudgetField(page: Page, euro: string) {
  const box = page.getByRole("textbox", { name: /Saisonbudget|Season budget/ });
  await expect(box).toBeVisible({ timeout: 20_000 });
  await box.fill(euro);
  await expect(box).toHaveValue(euro);
}

async function clickPlanSeason(page: Page) {
  const plan = page.getByRole("button", { name: /Saison planen|Plan my season/ });
  await expect(plan).toBeVisible({ timeout: 45_000 });
  await expect(plan).toBeEnabled();
  await plan.click();
}

test("/tour2 voller Nutzer-Durchlauf — REST-Restore auf B0", async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, "E2E_EMAIL/E2E_PASSWORD fehlen");
  test.skip(!SUPA_URL || !SUPA_KEY, "Supabase-Env fehlt");
  test.setTimeout(300_000);

  const logs: StepLog[] = [];
  let bucket: string[] = [];
  const onCons = (m: ConsoleMessage) => {
    if (m.type() === "error") {
      const t = m.text();
      if (!isNoise(t)) bucket.push(`console: ${t.slice(0, 240)}`);
    }
  };
  const onErr = (e: Error) => bucket.push(`page: ${String(e).slice(0, 240)}`);
  page.on("console", onCons);
  page.on("pageerror", onErr);
  await page.route(/tpembars\.com/, (r) => r.abort());

  const run = async (name: string, fn: () => Promise<string>) => {
    bucket = [];
    const t0 = Date.now();
    let ok = false;
    let note = "";
    try {
      note = await fn();
      ok = true;
    } catch (e) {
      note = String(e).slice(0, 400);
      ok = false;
      throw e;
    } finally {
      logs.push({ step: name, ok, ms: Date.now() - t0, errors: [...bucket], note });
      console.log(`${ok ? "OK" : "FAIL"}  ${name}  ${Date.now() - t0}ms  ${note}`);
    }
  };

  await login(page);
  const { token, uid } = await readAuth(page);
  const db = rest(token);
  const B0 = await db.fingerprint(uid);
  const prefs0 = await page.evaluate(() => ({
    nights: localStorage.getItem("mu_tour_nights"),
    buffer: localStorage.getItem("mu_tour_buffer_days"),
    maxPicks: localStorage.getItem("mu_tour_max_picks"),
    maxStreak: localStorage.getItem("mu_tour_max_streak"),
  }));

  try {
    await run("1 Overview", async () => {
      await page.goto("/tour2", { waitUntil: "domcontentloaded" });
      await expect(page.locator("h1").first()).toBeVisible({ timeout: 45_000 });
      const h1 = (await page.locator("h1").first().textContent()) ?? "";
      expect(/Overview|Übersicht|Matchup Tour/i.test(h1 + (await page.locator("body").innerText()).slice(0, 200)) || h1.length > 0).toBeTruthy();
      await expect(page.getByRole("navigation").or(page.getByRole("link", { name: /Finder|Turniere finden/i })).first()).toBeVisible({ timeout: 15_000 });
      return `h1=${h1.trim()}`;
    });

    await run("2 Finder", async () => {
      await page.goto("/tour2/finder", { waitUntil: "domcontentloaded" });
      const countRe = /\d+\s+(Turniere|tournaments)/i;
      await expect(page.getByText(countRe).first()).toBeVisible({ timeout: 45_000 });
      const before = (await page.getByText(countRe).first().textContent()) ?? "";
      const chip = page.getByRole("button", { name: /Nächste 4 Wochen|Next 4 weeks/ });
      await chip.click();
      await page.waitForTimeout(600);
      const after = (await page.getByText(countRe).first().textContent()) ?? "";
      const add = page.getByRole("button", { name: /Zur Saison hinzufügen|Add to season/ });
      await expect(add.first()).toBeVisible({ timeout: 10_000 });
      await add.first().click();
      await page.waitForTimeout(800);
      const ids = await db.seasonIds();
      const added = ids.filter((x) => !B0.season.includes(x));
      expect(added.length, "Finder hat ein Turnier in die Saison gelegt").toBeGreaterThan(0);
      await page.locator("button").filter({ hasText: /,/ }).first().click().catch(async () => {
        await page.locator(".t2-row, li button").first().click();
      });
      await page.waitForTimeout(500);
      return `count ${before.trim()} → ${after.trim()}; added=${added.length}`;
    });

    await run("3 Season Optimierer", async () => {
      await page.goto("/tour2/season", { waitUntil: "domcontentloaded" });
      await waitCatalog(page);
      // Die kuratierte Saison liegt schon über 6.000 € — ohne höheres Restbudget
      // kommt nur die Meldung „Budget ausgeschöpft“, kein Overlay.
      await setSeasonBudgetField(page, "25000");
      await clickPlanSeason(page);
      const take = page.getByRole("button", { name: /Übernehmen|Take over/ });
      await expect(take, "Optimierer-Overlay nach Plan").toBeVisible({ timeout: 45_000 });
      const overlay = page.getByText(/\d+\s+(Turniere|tournaments)\s+\u00b7/i);
      const note = ((await overlay.first().textContent()) ?? "").trim();
      const before = (await db.seasonIds()).length;
      await take.click();
      await expect.poll(async () => (await db.seasonIds()).length, { timeout: 25_000 }).toBeGreaterThan(before);
      return `${note} → übernommen`;
    });

    await run("4 Ranking", async () => {
      await page.goto("/tour2/ranking", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: /Punkte, keine Ränge|Points, not ranks/i })).toBeVisible({ timeout: 30_000 });
      await page.locator("label", { hasText: /^Turnier$|^Tournament$/ }).locator("input").first().fill(RESULT_NAME);
      await page.locator("label", { hasText: /Kategorie|Category/ }).locator("select").first().selectOption("challenger_125");
      await page.locator("label", { hasText: /Runde|Round/ }).locator("select").first().selectOption("R16");
      await page.locator("label", { hasText: /Datum|date/i }).locator("input").first().fill("2026-02-02");
      await page.getByRole("button", { name: /^Erfassen$|^Record$/ }).click();
      await expect(page.getByText(RESULT_NAME).first()).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(/\+4\s+(Wochen|weeks)/i).first()).toBeVisible();
      await expect(page.getByText(/\+8\s+(Wochen|weeks)/i).first()).toBeVisible();
      await expect(page.getByText(/\+12\s+(Wochen|weeks)/i).first()).toBeVisible();
      return "Ergebnis + Ausblick 4/8/12";
    });

    await run("5 Travel", async () => {
      await page.goto("/tour2/travel", { waitUntil: "domcontentloaded" });
      await expect(page.getByText(/Geplante Kosten|Planned costs/i).first()).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText(/Erfasste Ausgaben|Recorded expenses/i).first()).toBeVisible();
      const body = await page.locator("body").innerText();
      expect(/Reisezeit|travel time|CO₂|CO2|Vorsaison|last season/i.test(body)).toBeFalsy();
      return "geplant ≠ erfasst, ohne Reisezeit/CO2";
    });

    await run("6 Documents", async () => {
      await page.goto("/tour2/documents", { waitUntil: "domcontentloaded" });
      const add = page.getByRole("button", { name: /^Hinzufügen$|^Add$/ });
      await expect(add).toBeVisible({ timeout: 20_000 });
      await add.scrollIntoViewIfNeeded();
      await add.click();
      await expect(page.getByText(/ESTA|ZZ|other|Sonstiges/i).first()).toBeVisible({ timeout: 15_000 });
      const extra = (await db.docIds()).filter((id) => !B0.docs.includes(id));
      expect(extra.length, "Dokument angelegt").toBeGreaterThan(0);
      return `+${extra.length} Reisedokument`;
    });

    await run("7 Network Präsenz", async () => {
      const season = await db.seasonIds();
      const extra = season.filter((id) => !B0.season.includes(id));
      const tid = extra[0] ?? season[0];
      expect(tid, "ein Saison-Turnier für Präsenz").toBeTruthy();
      await page.goto(`/tour2/season?id=${tid}`, { waitUntil: "domcontentloaded" });
      const onsite = page.getByRole("button", { name: /Vor Ort|On site/i });
      await expect(onsite).toBeVisible({ timeout: 45_000 });
      await onsite.click();
      await page.getByPlaceholder(/Kontakt|Contact/i).fill("e2e@example.com");
      await page.getByText(/Trainingspartner|hitting partner/i).first().click();
      await page.getByRole("button", { name: /Eintragen|List me|Aktualisieren|Update/i }).first().click();
      await page.waitForTimeout(1200);
      const pres = await db.presenceKeys(uid);
      const added = pres.filter((x) => !B0.presence.includes(x));
      expect(added.length, "Präsenz-Zeile").toBeGreaterThan(0);
      await page.goto("/tour2/network", { waitUntil: "domcontentloaded" });
      await expect(page.getByText(/Trainingsslots|Training slots/i).first()).toBeVisible({ timeout: 20_000 });
      return `presence +${added.length}`;
    });

    await run("8 Profil → Optimierer", async () => {
      await page.goto("/tour2/profile", { waitUntil: "domcontentloaded" });
      await expect(page.getByText(/Nach welchen Regeln|What rules should the app/i).first()).toBeVisible({ timeout: 30_000 });
      const cap = page.locator("label", { hasText: /Höchstens Turniere|Max tournaments/ }).locator("input");
      await expect(cap).toBeVisible();
      await cap.fill("1");
      await page.waitForTimeout(300);
      const stored = await page.evaluate(() => localStorage.getItem("mu_tour_max_picks"));
      expect(stored).toBe("1");

      await db.deleteSeasonNotIn(B0.season);
      await page.goto("/tour2/season", { waitUntil: "domcontentloaded" });
      await waitCatalog(page);
      await page.getByRole("button", { name: /Weitere Filter|More filters/ }).click();
      const sheetCap = page.locator("label", { hasText: /Höchstens Turniere|Max tournaments/ }).locator("input");
      await expect(sheetCap, "Planer liest Cap aus Profil-Storage").toHaveValue("1");
      await page.locator("div.absolute.inset-0.bg-black\\/50").click({ position: { x: 8, y: 8 } });
      await setSeasonBudgetField(page, "25000");
      await clickPlanSeason(page);
      const take = page.getByRole("button", { name: /Übernehmen|Take over/ });
      await expect(take, "Vorschlag nach Profil-Cap").toBeVisible({ timeout: 45_000 });
      const text = ((await page.getByText(/\d+\s+(Turniere|tournaments)\s+\u00b7/i).first().textContent()) ?? "").trim();
      expect(text, "Vorschlag begrenzt auf 1 Turnier aus Profil-Cap").toMatch(/^1\s/);
      await page.getByRole("button", { name: /Anders versuchen|Try differently/ }).click();
      return `max_picks=1 im Storage + Filterblatt; Overlay „${text}“`;
    });
  } finally {
    try {
      await db.deleteSeasonNotIn(B0.season);
      await db.deleteResultsByName(RESULT_NAME);
      await db.deleteDocsNotIn(B0.docs);
      await db.deletePresenceNotIn(uid, B0.presence);
      // Debounce 700 ms in SeasonWorkspace kann season_budget noch auf 25000 schreiben.
      await page.waitForTimeout(1_200);
      await db.restoreBudget(uid, B0.budget);
    } catch (e) {
      console.log("REST-Restore Fehler", e);
    }
    try {
      await page.evaluate((p) => {
        const set = (k: string, v: string | null) => {
          if (v == null) localStorage.removeItem(k);
          else localStorage.setItem(k, v);
        };
        set("mu_tour_nights", p.nights);
        set("mu_tour_buffer_days", p.buffer);
        set("mu_tour_max_picks", p.maxPicks);
        set("mu_tour_max_streak", p.maxStreak);
      }, prefs0);
    } catch { /* Browser schon zu */ }
    console.log("\n=== /tour2 Walkthrough ===");
    for (const s of logs) {
      console.log(`${s.ok ? "OK" : "FAIL"}  ${s.step}  ${s.ms}ms  ${s.errors.length} err  ${s.note}`);
      for (const e of s.errors) console.log(`    ${e}`);
    }
    let after = null as Awaited<ReturnType<typeof db.fingerprint>> | null;
    for (let i = 0; i < 4 && !after; i++) {
      try { after = await db.fingerprint(uid); } catch {
        await page.waitForTimeout(1500 * (i + 1));
      }
    }
    expect(after, "Fingerprint nach Restore").toBeTruthy();
    expect(after, "Konto nach Restore = B0").toEqual(B0);
  }
});
