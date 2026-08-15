import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * E2E-BELEG (Etappe a des /tour-Vier-Spalten-Umbaus): das Turnierdetail ist in vier
 * Reiter zerlegt — Übersicht · Vor Ort · Dienstleister · Buchen — und JEDER Reiter hat
 * Inhalt. Ein leerer Reiter wäre der stille Prop-Verlust (Hauptgefahr, MU-037-Klasse).
 *
 * Es wird ein Turnier gewählt, das in ALLEN Reitern Daten hat: Como (15 Dienstleister im
 * 50-km-Umkreis). Seed/Restore der Saison laufen über die Supabase-REST-API mit dem JWT
 * des Testnutzers (RLS, Anon-Key) — NIE über die Oberfläche.
 *
 * Zugangsdaten NUR über Env (E2E_EMAIL/E2E_PASSWORD, optional E2E_GATE_CODE).
 */
const EMAIL = process.env.E2E_EMAIL || "";
const PASSWORD = process.env.E2E_PASSWORD || "";
const GATE_CODE = process.env.E2E_GATE_CODE || "50805080";
const SHOTS = "e2e/artifacts";

function envVal(name: string): string {
  if (process.env[name]) return process.env[name] as string;
  try {
    const m = readFileSync(".env.local", "utf8").match(new RegExp("^" + name + "=(.*)$", "m"));
    return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
  } catch { return ""; }
}
const SUPA_URL = envVal("NEXT_PUBLIC_SUPABASE_URL");
const SUPA_KEY = envVal("NEXT_PUBLIC_SUPABASE_ANON_KEY");

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
        try { const j = JSON.parse(raw); return { token: j.access_token as string, uid: (j.user?.id ?? j.currentSession?.user?.id) as string }; } catch { /* weiter */ }
      }
    }
    return null;
  });
  expect(a?.token && a?.uid, "Supabase-Session lesbar").toBeTruthy();
  return a as { token: string; uid: string };
}
function rest(token: string) {
  const base = { apikey: SUPA_KEY, Authorization: `Bearer ${token}`, "Accept-Profile": "web", "Content-Profile": "web" };
  return {
    async seasonIds(): Promise<Set<string>> {
      const r = await fetch(`${SUPA_URL}/rest/v1/tour_season_plan?select=tournament_id`, { headers: base });
      return new Set(((await r.json()) as { tournament_id: string }[]).map((x) => x.tournament_id));
    },
    async comoTournament(): Promise<string | null> {
      // Bewusst ein CHALLENGER in Como (ATP-Zweig): so trägt der „Weg zur Meldung"-ⓘ die
      // PlayerZone-App-Verweise — genau die Info, die aus der Sichtfläche hinter das ⓘ zog.
      const r = await fetch(`${SUPA_URL}/rest/v1/tour_tournaments?select=id&city=ilike.*como*&series=eq.challenger&valid_to=is.null&order=tournament_monday.asc&limit=1`, { headers: base });
      return ((await r.json()) as { id: string }[])[0]?.id ?? null;
    },
    async insertSeason(uid: string, id: string) {
      const r = await fetch(`${SUPA_URL}/rest/v1/tour_season_plan`, { method: "POST", headers: { ...base, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ user_id: uid, tournament_id: id }) });
      expect(r.ok || r.status === 409, "Saison-Seed (REST)").toBeTruthy();
    },
    async deleteSeason(ids: string[]) {
      if (!ids.length) return;
      await fetch(`${SUPA_URL}/rest/v1/tour_season_plan?tournament_id=in.(${ids.join(",")})`, { method: "DELETE", headers: { ...base, Prefer: "return=minimal" } });
    },
  };
}

test("/tour Turnierdetail: alle vier Reiter haben Inhalt (Como)", async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, "E2E creds fehlen");
  test.skip(!SUPA_URL || !SUPA_KEY, "Supabase-Env fehlt");

  await page.route(/tpembars\.com/, (r) => r.abort()); // Affiliate-Skript isolieren
  await login(page);
  const { token, uid } = await readAuth(page);
  const db = rest(token);

  const B0 = await db.seasonIds();
  const como = await db.comoTournament();
  expect(como, "ein Como-Turnier im Kalender").toBeTruthy();
  const seeded = !B0.has(como as string);
  if (seeded) await db.insertSeason(uid, como as string);

  try {
    await page.goto("/tour");
    // Como in der Saisonliste wählen → Detail öffnet.
    const item = page.locator("aside button", { hasText: /Como/i }).first();
    await expect(item, "Como steht in der Saisonliste").toBeVisible({ timeout: 30_000 });
    await item.click();
    // Vier-Spalten-Umbau: das Detail lebt jetzt in der RECHTEN Detailspalte (eigene aside,
    // ≥1200 px inline) — nicht mehr in der Katalogspalte. Auf die aside mit der Reiter-Leiste scopen.
    const aside = page.locator("aside").last();
    await expect(aside.getByRole("button", { name: /^Overview$|^Übersicht$/ }), "Reiter-Leiste da").toBeVisible({ timeout: 20_000 });

    const clickTab = async (rx: RegExp) => { await aside.getByRole("button", { name: rx }).click(); await page.waitForTimeout(300); };

    // 1) Übersicht — VIER sichtbare Zeilen; alles Erklärende hinter „i", aber ERREICHBAR.
    // (Meldefrist trägt kein „i"; die anderen drei je eins → das ⓘ selbst belegt die Zeile.)
    await clickTab(/^Overview$|^Übersicht$/);
    await expect(aside.getByText(/^Meldefrist$|^Entry deadline$/i).first(), "Zeile 1: Meldefrist").toBeVisible({ timeout: 10_000 });
    await expect(aside.getByText(/Wochenkosten|Weekly cost/i).first(), "Zeile 2: Wochenkosten").toBeVisible();
    const entryInfo = aside.getByRole("button", { name: /Weg zur Meldung.*Details|How to enter.*details/i });
    const visaInfoBtn = aside.getByRole("button", { name: /Einreise.*Details|Entry.*details/i });
    await expect(entryInfo, "Zeile 4: Weg zur Meldung (i vorhanden)").toBeVisible();
    await expect(visaInfoBtn, "Zeile 3: Einreise (i vorhanden)").toBeVisible();
    // „Weg zur Meldung"-ⓘ öffnen → die App-Verweise (heute sichtbar) bleiben ERREICHBAR.
    await entryInfo.click();
    await expect(aside.getByRole("link", { name: /^iOS-App$|^iOS app$/ }).first(), "App-Link hinter dem i erreichbar").toBeVisible({ timeout: 8_000 });
    // Einreise-ⓘ öffnen → Grund/Datenstand/Konsulats-Hinweis bleiben ERREICHBAR.
    await visaInfoBtn.click();
    await expect(aside.getByText(/Konsulat|consulate|Profil|profile|Bestand|on file/i).first(), "Visa-Detail hinter dem i erreichbar").toBeVisible({ timeout: 8_000 });
    await aside.screenshot({ path: `${SHOTS}/tabs-1-overview.png` });

    // 2) Vor Ort — Präsenz-Formular (Eintragen-Knopf)
    await clickTab(/^On site$|^Vor Ort$/);
    await expect(aside.getByRole("button", { name: /^Eintragen$|^List me$/ }), "Vor Ort hat Inhalt (Präsenz-Formular)").toBeVisible({ timeout: 10_000 });
    await aside.screenshot({ path: `${SHOTS}/tabs-2-onsite.png` });

    // 3) Dienstleister — Titel + mindestens eine Anbieter-Zeile (Distanz "N km")
    await clickTab(/^Services$|^Dienstleister$/);
    await expect(aside.getByText(/Services on site|Dienstleister vor Ort/i).first(), "Dienstleister-Titel").toBeVisible({ timeout: 10_000 });
    await expect(aside.getByText(/\d+\s*km/).first(), "Dienstleister hat Inhalt (mind. eine Zeile)").toBeVisible({ timeout: 15_000 });
    await aside.screenshot({ path: `${SHOTS}/tabs-3-services.png` });

    // 4) Buchen — Flüge/Hotels/Mietwagen-Links
    await clickTab(/^Book$|^Buchen$/);
    await expect(aside.getByRole("link", { name: /Flights|Flüge/i }).first(), "Buchen hat Inhalt (Flug-Link)").toBeVisible({ timeout: 10_000 });
    await aside.screenshot({ path: `${SHOTS}/tabs-4-booking.png` });

    console.log("[TABS] Übersicht ✓ · Vor Ort ✓ · Dienstleister ✓ · Buchen ✓ — jeder Reiter hat Inhalt");
  } finally {
    const now = await db.seasonIds();
    await db.deleteSeason([...now].filter((x) => !B0.has(x)));
    const after = await db.seasonIds();
    expect(after.size, "nach Restore exakt wieder B0").toBe(B0.size);
  }
});
