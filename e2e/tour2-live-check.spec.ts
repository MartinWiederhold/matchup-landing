import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * Live-Beleg nach Deploy: Tagesblick, Kalender/Gantt, Travel ohne Kalender,
 * Finder-Zeile statt Filterwand. REST-Snapshot/Restore; ein Termin nur als
 * Nachweis (Titel E2E-Glance-Hit), danach weg.
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
const HIT = "E2E-Glance-Hit";

async function login(page: Page) {
  await page.request.post("/api/unlock", { data: { code: GATE_CODE } });
  await page.goto("/app");
  await page.locator('input[type="email"]').first().fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await page.getByRole("button", { name: /^EINLOGGEN$|^LOG IN$/ }).click();
  const alert = page.getByRole("alert");
  try {
    await expect(page.locator('input[type="email"]')).toHaveCount(0, { timeout: 45_000 });
  } catch (e) {
    const msg = ((await alert.textContent()) ?? "").trim();
    throw new Error(`Login blieb auf /app. Alert: ${msg || "—"}`);
  }
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
  expect(a?.token && a?.uid).toBeTruthy();
  return a as { token: string; uid: string };
}

test("/tour2 Live-Check Tagesblick Finder Kalender", async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD || !SUPA_URL || !SUPA_KEY, "E2E-Env fehlt");
  test.setTimeout(180_000);

  await login(page);
  const { token, uid } = await readAuth(page);
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
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

  const season = (await get("tour_season_plan?select=tournament_id")) as { tournament_id: string }[];
  const seasonIds = season.map((x) => x.tournament_id);
  let cityToday: string | null = null;
  if (seasonIds.length) {
    const tours = (await get(`tour_tournaments?select=id,city,tournament_monday&id=in.(${seasonIds.join(",")})`)) as { id: string; city: string | null; tournament_monday: string }[];
    const covers = (monday: string, iso: string) => {
      const t0 = Date.parse(monday + "T00:00:00Z");
      const d = Date.parse(iso + "T00:00:00Z");
      return d >= t0 && d <= t0 + 6 * 86_400_000;
    };
    cityToday = tours.find((x) => covers(x.tournament_monday, today))?.city ?? null;
  }

  const slotRows = seasonIds.length
    ? ((await get(`tour_training_slot?select=id,user_id,slot_date,tournament_id&slot_date=in.(${today},${tomorrow})&tournament_id=in.(${seasonIds.join(",")})`)) as { id: string; user_id: string }[])
    : [];
  const slotIds = slotRows.map((s) => s.id);
  const accepted = slotIds.length
    ? ((await get(`tour_training_slot_response?select=slot_id,responder_id,status&slot_id=in.(${slotIds.join(",")})&status=eq.accepted`)) as { slot_id: string; responder_id: string }[])
    : [];
  const hasAcceptedSlot = accepted.some((r) => {
    const s = slotRows.find((x) => x.id === r.slot_id);
    return s && (s.user_id === uid || r.responder_id === uid);
  });

  const ins = await fetch(`${SUPA_URL}/rest/v1/tour_events`, {
    method: "POST",
    headers: { ...h, "Content-Type": "application/json", "Content-Profile": "web", Prefer: "return=minimal" },
    body: JSON.stringify({
      user_id: uid, kind: "physio", title: HIT, event_date: today, event_time: "09:00",
      end_time: null, note: null, tournament_id: null, won: null, score: null, round: null, opponent: null,
    }),
    signal: AbortSignal.timeout(12_000),
  });
  expect(ins.ok || ins.status === 409, `Termin-Seed ${ins.status}`).toBeTruthy();

  const notes: string[] = [];
  try {
    await page.goto("/tour2", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Heute und morgen|Today and tomorrow/i })).toBeVisible({ timeout: 45_000 });
    const cal = page.getByRole("link", { name: /Kalender|Calendar/ }).first();
    await expect(cal).toBeVisible();
    await expect(page.getByText(HIT).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("09:00").first()).toBeVisible();
    notes.push(`Termin ${HIT} 09:00`);
    if (cityToday) {
      await expect(page.getByText(cityToday, { exact: false }).first()).toBeVisible();
      notes.push(`Stadt ${cityToday}`);
    } else {
      notes.push("keine Turnierwoche heute");
    }
    const withName = await page.getByText(/\bmit |\bwith /i).count();
    notes.push(withName > 0 || hasAcceptedSlot ? `Zusage-UI ${withName} REST-accepted=${hasAcceptedSlot}` : "keine Slot-Zusage mit Namen");

    await cal.click();
    await expect(page).toHaveURL(/\/tour2\/calendar/, { timeout: 20_000 });
    notes.push("→ /tour2/calendar");

    await page.getByRole("link", { name: /Zeitstrahl|Timeline/ }).first().click();
    await expect(page).toHaveURL(/\/tour2\/timeline/, { timeout: 20_000 });
    await expect(page.getByText(/Zeitstrahl|Timeline|Spur/i).first()).toBeVisible({ timeout: 20_000 });
    notes.push("→ /tour2/timeline");

    await page.goto("/tour2/travel", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/Geplante Kosten|Planned costs/i).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('a[href="/tour2/calendar"]')).toHaveCount(0);
    notes.push("Travel ohne Kalender-Link");

    await page.evaluate(() => { try { sessionStorage.setItem("mu_t2_nav0", String(performance.now())); } catch { /* egal */ } });
    const t0 = Date.now();
    await page.goto("/tour2/finder", { waitUntil: "domcontentloaded" });
    const add = page.getByRole("button", { name: /Zur Saison hinzufügen|Add to season/ }).first();
    await expect(add).toBeVisible({ timeout: 45_000 });
    const toList = Date.now() - t0;
    const box = await add.boundingBox();
    expect(box, "erste Zeile im Viewport").toBeTruthy();
    expect(box!.y, "Liste ohne Scrollen").toBeLessThan(520);
    const marks = await page.evaluate(() => {
      try { return JSON.parse(sessionStorage.getItem("mu_t2_marks") ?? "[]") as { step?: string; switchMs?: number }[]; } catch { return []; }
    });
    const finderMark = [...marks].reverse().find((m) => m.step === "area:finder");
    await expect(page.getByRole("button", { name: /Nächste 4 Wochen|Next 4 weeks/ })).toHaveCount(0);
    await page.getByRole("button", { name: /^Filter$|^Filters$/ }).click();
    await expect(page.getByRole("button", { name: /Nächste 4 Wochen|Next 4 weeks/ })).toBeVisible();
    await page.getByRole("button", { name: /Nächste 4 Wochen|Next 4 weeks/ }).click();
    await page.locator("div.absolute.inset-0.bg-black\\/40").click({ position: { x: 8, y: 8 } });
    const chip = page.locator("span").filter({ hasText: /Nächste 4 Wochen|Next 4 weeks/ }).first();
    await expect(chip).toBeVisible();
    await chip.getByRole("button").click();
    await expect(page.locator("span").filter({ hasText: /Nächste 4 Wochen|Next 4 weeks/ })).toHaveCount(0);
    notes.push(`Finder Liste ${toList}ms y=${Math.round(box!.y)} mark=${finderMark?.switchMs ?? "–"}ms Chip an/aus`);
    console.log("LIVE", notes.join(" | "));
  } finally {
    await del(`tour_events?title=eq.${encodeURIComponent(HIT)}`);
  }
});
