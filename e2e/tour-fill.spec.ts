import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * E2E-BELEG für MU-037: „Günstigste Saison füllen" ERGÄNZT und LÖSCHT NIE.
 *
 * Kern: eine bestehende (kuratierte) Saison — inklusive eines gezielt gesetzten Eintrags E
 * (spätestes aktives Turnier, den der Optimierer aussparen muss) — bleibt nach dem Füllen
 * VOLLSTÄNDIG erhalten: B1 (vor dem Füllen) ⊆ S1 (nach dem Füllen). Füllen ergänzt nur.
 *
 * Snapshot/Restore laufen über die Supabase-REST-API mit dem JWT DES TEST-NUTZERS
 * (RLS, nur der öffentliche Anon-Key) — NIE über die Oberfläche. So kennt der Test die IDs
 * genau und stellt am Ende exakt B0 wieder her (Lehre aus dem 14.08.: UI-getriebene
 * Schreibprüfungen können Kontodaten nicht zurückholen).
 *
 * Zugangsdaten NUR über Env (E2E_EMAIL/E2E_PASSWORD, optional E2E_GATE_CODE).
 */
const EMAIL = process.env.E2E_EMAIL || "";
const PASSWORD = process.env.E2E_PASSWORD || "";
const GATE_CODE = process.env.E2E_GATE_CODE || "50805080";

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
  expect(a?.token && a?.uid, "Supabase-Session (JWT + uid) lesbar").toBeTruthy();
  return a as { token: string; uid: string };
}

function rest(token: string) {
  const base = { apikey: SUPA_KEY, Authorization: `Bearer ${token}` };
  return {
    async seasonIds(): Promise<Set<string>> {
      const r = await fetch(`${SUPA_URL}/rest/v1/tour_season_plan?select=tournament_id`, { headers: { ...base, "Accept-Profile": "web" } });
      return new Set(((await r.json()) as { tournament_id: string }[]).map((x) => x.tournament_id));
    },
    async latestActiveTournament(): Promise<string | null> {
      const r = await fetch(`${SUPA_URL}/rest/v1/tour_tournaments?select=id&valid_to=is.null&order=tournament_monday.desc&limit=1`, { headers: { ...base, "Accept-Profile": "web" } });
      return ((await r.json()) as { id: string }[])[0]?.id ?? null;
    },
    async insertSeason(uid: string, tournamentId: string) {
      const r = await fetch(`${SUPA_URL}/rest/v1/tour_season_plan`, { method: "POST", headers: { ...base, "Content-Type": "application/json", "Content-Profile": "web", Prefer: "return=minimal" }, body: JSON.stringify({ user_id: uid, tournament_id: tournamentId }) });
      expect(r.ok || r.status === 409, "Saison-Seed (REST)").toBeTruthy();
    },
    async hasRates(): Promise<boolean> {
      const r = await fetch(`${SUPA_URL}/rest/v1/tour_cost_rates?select=user_id`, { headers: { ...base, "Accept-Profile": "web" } });
      return ((await r.json()) as unknown[]).length > 0;
    },
    async insertRates(uid: string) {
      const r = await fetch(`${SUPA_URL}/rest/v1/tour_cost_rates`, { method: "POST", headers: { ...base, "Content-Type": "application/json", "Content-Profile": "web", Prefer: "return=minimal" }, body: JSON.stringify({ user_id: uid, arrival_minor: 8000, per_night_minor: 6000, food_per_day_minor: 3000, currency: "EUR" }) });
      expect(r.ok, "Kostensätze anlegen (REST)").toBeTruthy();
    },
    async deleteSeason(ids: string[]) {
      if (ids.length === 0) return;
      const r = await fetch(`${SUPA_URL}/rest/v1/tour_season_plan?tournament_id=in.(${ids.join(",")})`, { method: "DELETE", headers: { ...base, "Content-Profile": "web", Prefer: "return=minimal" } });
      expect(r.ok, "Test-Saisonzeilen entfernen (REST)").toBeTruthy();
    },
    async deleteRates(uid: string) {
      await fetch(`${SUPA_URL}/rest/v1/tour_cost_rates?user_id=eq.${uid}`, { method: "DELETE", headers: { ...base, "Content-Profile": "web", Prefer: "return=minimal" } });
    },
    async getBudget(uid: string): Promise<number | null> {
      const r = await fetch(`${SUPA_URL}/rest/v1/tour_profiles?select=season_budget&user_id=eq.${uid}`, { headers: { ...base, "Accept-Profile": "web" } });
      return ((await r.json()) as { season_budget: number | null }[])[0]?.season_budget ?? null;
    },
    async setBudget(uid: string, val: number | null) {
      await fetch(`${SUPA_URL}/rest/v1/tour_profiles?user_id=eq.${uid}`, { method: "PATCH", headers: { ...base, "Content-Type": "application/json", "Content-Profile": "web", Prefer: "return=minimal" }, body: JSON.stringify({ season_budget: val }) });
    },
  };
}

const subset = (a: Set<string>, b: Set<string>) => [...a].every((x) => b.has(x));

test("/tour Füllen ergänzt und lässt die bestehende Saison unversehrt (MU-037)", async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, "E2E_EMAIL/E2E_PASSWORD nicht gesetzt");
  test.skip(!SUPA_URL || !SUPA_KEY, "NEXT_PUBLIC_SUPABASE_URL/ANON_KEY nicht auffindbar");

  await page.route(/tpembars\.com/, (r) => r.abort()); // Affiliate-Skript isolieren (fängt sonst Klicks ab)
  await login(page);
  const { token, uid } = await readAuth(page);
  const db = rest(token);

  const ratesPreexisting = await db.hasRates();
  if (!ratesPreexisting) await db.insertRates(uid);
  // Budget kurz hochsetzen (Snapshot+Restore), damit das Füllen Raum hat → beweist auch den Ergänzen-Pfad.
  const origBudget = await db.getBudget(uid);
  await db.setBudget(uid, 500000);

  const B0 = await db.seasonIds();
  const E = await db.latestActiveTournament();
  expect(E, "ein aktives Turnier zum Setzen des Bestands").toBeTruthy();
  const seeded = !B0.has(E as string);
  if (seeded) await db.insertSeason(uid, E as string);
  const B1 = await db.seasonIds(); // Bestand inkl. E — MUSS vollständig überleben

  try {
    await page.goto("/tour");
    const fillBtn = page.getByRole("button", { name: /Fill cheapest season|Günstigste Saison füllen/i });
    await expect(fillBtn).toBeEnabled({ timeout: 30_000 });
    await fillBtn.click();
    // Rückmeldung abwarten (wsFillDone erscheint nach dem Füllen).
    await expect(page.getByText(/tournaments added|Turniere ergänzt/i).first(), "Füllen meldet das Ergebnis").toBeVisible({ timeout: 30_000 });

    const S1 = await db.seasonIds();
    // KERN-BEWEIS: der gesamte Bestand (inkl. E) ist unverändert vorhanden — Füllen löscht nichts.
    expect(subset(B1, S1), "Bestand (inkl. E) VOLLSTÄNDIG in S1 — Füllen darf nichts löschen").toBeTruthy();
    expect(S1.has(E as string), "der gesetzte Bestandseintrag E hat das Füllen überlebt").toBeTruthy();
    // Nur ergänzt, nichts ersetzt, kein Duplikat.
    const added = [...S1].filter((x) => !B1.has(x));
    expect(S1.size, "S1 = Bestand + ergänzte (nichts entfernt)").toBe(B1.size + added.length);
    expect(added.length, "Füllen ergänzt tatsächlich mindestens ein Turnier (Ergänzen-Pfad)").toBeGreaterThan(0);
    console.log(`[MU-037] Bestand B1=${B1.size} → nach Füllen S1=${S1.size} (ergänzt=${added.length}, gelöscht=0)`);
  } finally {
    // Restore: NUR was der Test angelegt hat (Seed E + Füllung = alles außer B0) + Budget zurück.
    const now = await db.seasonIds();
    await db.deleteSeason([...now].filter((x) => !B0.has(x)));
    if (!ratesPreexisting) await db.deleteRates(uid);
    await db.setBudget(uid, origBudget);
    const after = await db.seasonIds();
    expect(after.size, "nach Restore exakt wieder B0").toBe(B0.size);
    expect(subset(B0, after) && subset(after, B0), "Saison identisch zu B0 wiederhergestellt").toBeTruthy();
  }
});
