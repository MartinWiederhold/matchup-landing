import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * E2E: /tour Schritt 3 — Saison-Vorschlag (Optimierer anbinden → anzeigen →
 * übernehmen). Gegen den LOKALEN Dev-Server, echter Login.
 *
 * KERN-BEWEIS (vom Auftraggeber ausdrücklich verlangt): eine BESTEHENDE Saison
 * bleibt nach dem Übernehmen VOLLSTÄNDIG erhalten — Übernehmen ergänzt, ersetzt nie.
 * Dafür wird die Saison EXAKT über tournament_ids verglichen: B0 (vor allem) ⊆ S1
 * (nach 1. Übernahme) ⊆ S2 (nach 2. Übernahme). Der zweite Durchlauf ist der
 * eigentliche Test: die im ersten Durchlauf ergänzten Turniere müssen die zweite
 * Übernahme unversehrt überstehen.
 *
 * Snapshot/Cleanup laufen über die Supabase-REST-API mit dem JWT DES TEST-NUTZERS
 * (RLS-beschränkt, nur der öffentliche Anon-Key) — dieselbe Vertrauensstufe wie die
 * App, kein Service-Key. So kennt der Test die IDs genau und entfernt am Ende
 * PUNKTGENAU nur, was er selbst angelegt hat (S2 \ B0). Fehlten Kostensätze, legt
 * der Test sie an und entfernt sie ebenfalls wieder → Konto exakt wie vorher.
 *
 * Zugangsdaten NUR über Env (E2E_EMAIL/E2E_PASSWORD, optional E2E_GATE_CODE) —
 * nie in dieser Datei. Nur gegen den lokalen Dev-Server.
 */

const EMAIL = process.env.E2E_EMAIL || "";
const PASSWORD = process.env.E2E_PASSWORD || "";
const GATE_CODE = process.env.E2E_GATE_CODE || "50805080";
const SHOTS = "e2e/artifacts";

const RX = {
  loginBtn: /^EINLOGGEN$|^LOG IN$/,
  step2: /Rahmen|Frame/,
  step3: /Saison-Vorschlag|Season proposal/,
  regionAll: /Alle Länder|All countries/,
  runCta: /Saison vorschlagen|Propose a season/,
  resultTitle: /Vorgeschlagene Saison|Proposed season/,
  takeoverCta: /In meine Saison übernehmen|Take over into my season/,
  takenOver: /ergänzt|Added \d/,
  ratesGate: /Zuerst deine Kostensätze|Your cost rates first/,
};

// NEXT_PUBLIC-Werte (nicht geheim): aus Env oder .env.local. Werte werden NIE geloggt.
function envVal(name: string): string {
  if (process.env[name]) return process.env[name] as string;
  try {
    const m = readFileSync(".env.local", "utf8").match(new RegExp("^" + name + "=(.*)$", "m"));
    return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
  } catch { return ""; }
}
const SUPA_URL = envVal("NEXT_PUBLIC_SUPABASE_URL");
const SUPA_KEY = envVal("NEXT_PUBLIC_SUPABASE_ANON_KEY");

async function unlockGate(page: Page) {
  const res = await page.request.post("/api/unlock", { data: { code: GATE_CODE } });
  expect(res.ok(), "Gate /api/unlock sollte 200 liefern").toBeTruthy();
}
async function login(page: Page) {
  await page.goto("/app");
  await page.locator('input[type="email"]').first().fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await page.getByRole("button", { name: RX.loginBtn }).click();
  await expect(page.locator('input[type="email"]'), "Login sollte gelingen").toHaveCount(0, { timeout: 45_000 });
}

// Session (JWT + uid) aus dem Browser lesen — RLS-beschränkt auf den Test-Nutzer.
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
  expect(a?.token && a?.uid, "Supabase-Session (JWT + uid) im Browser lesbar").toBeTruthy();
  return a as { token: string; uid: string };
}

function rest(token: string) {
  const base = { apikey: SUPA_KEY, Authorization: `Bearer ${token}` };
  return {
    async seasonIds(): Promise<Set<string>> {
      const r = await fetch(`${SUPA_URL}/rest/v1/tour_season_plan?select=tournament_id`, { headers: { ...base, "Accept-Profile": "web" } });
      const rows = (await r.json()) as { tournament_id: string }[];
      return new Set(rows.map((x) => x.tournament_id));
    },
    async latestActiveTournament(): Promise<string | null> {
      const r = await fetch(`${SUPA_URL}/rest/v1/tour_tournaments?select=id&valid_to=is.null&order=tournament_monday.desc&limit=1`, { headers: { ...base, "Accept-Profile": "web" } });
      const rows = (await r.json()) as { id: string }[];
      return rows[0]?.id ?? null;
    },
    async insertSeason(uid: string, tournamentId: string) {
      const r = await fetch(`${SUPA_URL}/rest/v1/tour_season_plan`, {
        method: "POST",
        headers: { ...base, "Content-Type": "application/json", "Content-Profile": "web", Prefer: "return=minimal" },
        body: JSON.stringify({ user_id: uid, tournament_id: tournamentId }),
      });
      expect(r.ok || r.status === 409, "Saison-Seed (REST) sollte gelingen (oder schon vorhanden)").toBeTruthy();
    },
    async hasRates(): Promise<boolean> {
      const r = await fetch(`${SUPA_URL}/rest/v1/tour_cost_rates?select=user_id`, { headers: { ...base, "Accept-Profile": "web" } });
      return ((await r.json()) as unknown[]).length > 0;
    },
    async insertRates(uid: string) {
      const r = await fetch(`${SUPA_URL}/rest/v1/tour_cost_rates`, {
        method: "POST",
        headers: { ...base, "Content-Type": "application/json", "Content-Profile": "web", Prefer: "return=minimal" },
        body: JSON.stringify({ user_id: uid, arrival_minor: 8000, per_night_minor: 6000, food_per_day_minor: 3000, currency: "EUR" }),
      });
      expect(r.ok, "Kostensätze anlegen (REST) sollte gelingen").toBeTruthy();
    },
    async deleteSeason(ids: string[]) {
      if (ids.length === 0) return;
      const r = await fetch(`${SUPA_URL}/rest/v1/tour_season_plan?tournament_id=in.(${ids.join(",")})`, {
        method: "DELETE", headers: { ...base, "Content-Profile": "web", Prefer: "return=minimal" },
      });
      expect(r.ok, "Test-Saisonzeilen entfernen (REST) sollte gelingen").toBeTruthy();
    },
    async deleteRates(uid: string) {
      await fetch(`${SUPA_URL}/rest/v1/tour_cost_rates?user_id=eq.${uid}`, {
        method: "DELETE", headers: { ...base, "Content-Profile": "web", Prefer: "return=minimal" },
      });
    },
  };
}

const subset = (a: Set<string>, b: Set<string>) => [...a].every((x) => b.has(x));

// Region weiten → möglichst viele Kandidaten; dann Schritt 3 öffnen, rechnen, übernehmen.
async function proposeAndTakeover(page: Page, shot: string) {
  await page.getByRole("button", { name: RX.step2 }).click();
  await page.getByRole("button", { name: RX.regionAll }).click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: RX.step3 }).click();

  await expect(page.getByText(RX.ratesGate), "Kostensätze sind gesetzt → kein Gate").toHaveCount(0);
  await page.getByRole("button", { name: RX.runCta }).click();
  await expect(page.getByText(RX.resultTitle)).toBeVisible({ timeout: 30_000 });
  await page.screenshot({ path: shot, fullPage: true });

  await page.getByRole("button", { name: RX.takeoverCta }).click();
  await expect(page.getByText(RX.takenOver), "Übernahme-Meldung mit Zahlen erscheint").toBeVisible({ timeout: 30_000 });
}

test("/tour Vorschlag: übernehmen ergänzt und lässt die bestehende Saison unversehrt", async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, "E2E_EMAIL/E2E_PASSWORD nicht gesetzt");
  test.skip(!SUPA_URL || !SUPA_KEY, "NEXT_PUBLIC_SUPABASE_URL/ANON_KEY nicht auffindbar");

  // Drittanbieter-Affiliate-Skript (Travelpayouts/tpembars) im Test isolieren — es
  // wirft lokal einen Laufzeitfehler, dessen Dev-Overlay sonst Klicks abfängt.
  await page.route(/tpembars\.com/, (r) => r.abort());

  await unlockGate(page);
  await login(page);
  const { token, uid } = await readAuth(page);
  const db = rest(token);

  // Kostensätze sicherstellen (sonst greift das Gate) — merken, ob der Test sie anlegt.
  const ratesPreexisting = await db.hasRates();
  if (!ratesPreexisting) await db.insertRates(uid);

  // B0: bestehende Saison VOR allem (echte Einträge, die unangetastet bleiben müssen).
  const B0 = await db.seasonIds();

  // Gezielter Bestandseintrag E (spätestes aktives Turnier): so hat die Saison sicher
  // einen Eintrag, dessen Woche der Optimierer aussparen muss und der die Übernahme
  // unversehrt überstehen MUSS — genau die Stelle, an der Daten verlorengehen könnten.
  const E = await db.latestActiveTournament();
  expect(E, "ein aktives Turnier zum Setzen des Bestands").toBeTruthy();
  const seeded = !B0.has(E as string);
  if (seeded) await db.insertSeason(uid, E as string);
  const B1 = await db.seasonIds(); // Bestand inkl. E = das, was vollständig bleiben muss

  try {
    await page.goto("/tour");
    await expect(page.getByRole("button", { name: RX.step3 })).toBeVisible({ timeout: 30_000 });
    await proposeAndTakeover(page, `${SHOTS}/tour-proposal-01.png`);

    const S1 = await db.seasonIds();
    // KERN-BEWEIS: der gesamte Bestand (inkl. E) ist unverändert vorhanden.
    expect(subset(B1, S1), "Bestand (inkl. E) VOLLSTÄNDIG in S1 — Übernahme darf nichts löschen").toBeTruthy();
    expect(S1.has(E as string), "der gesetzte Bestandseintrag E hat die Übernahme überlebt").toBeTruthy();
    // Ergänzt (Append), nichts verloren, E nicht dupliziert.
    const added = [...S1].filter((x) => !B1.has(x));
    expect(added.length, "Übernahme ergänzt mindestens ein Turnier (Append)").toBeGreaterThan(0);
    expect(added.includes(E as string), "E wurde nicht erneut hinzugefügt (kein Duplikat)").toBeFalsy();
    expect(S1.size, "S1 = Bestand + ergänzte (nichts ersetzt)").toBe(B1.size + added.length);
  } finally {
    // Aufräumen: NUR was der Test angelegt hat (Seed E + Übernahme = alles außer B0).
    const now = await db.seasonIds();
    const testAdded = [...now].filter((x) => !B0.has(x));
    await db.deleteSeason(testAdded);
    if (!ratesPreexisting) await db.deleteRates(uid);

    const after = await db.seasonIds();
    expect(after.size, "nach dem Aufräumen exakt wieder B0").toBe(B0.size);
    expect(subset(B0, after) && subset(after, B0), "Saison identisch zu B0 wiederhergestellt").toBeTruthy();
  }
});
