import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * BELEG (der ehrliche Teil): Heute hat KEIN ITF-Turnier eine offene Frist, der Dienst würde
 * real nichts verschicken. Trotzdem beweisbar — die Cron-Route rechnet im TROCKENLAUF gegen
 * ECHTE Turnierdaten zu einem SIMULIERTEN Zeitpunkt (?now=…), ohne Versand/Log.
 *
 * Vorgehen: ein echtes ITF-Turnier in die Saison des Testkontos legen, now auf „Meldeschluss
 * − 72h" setzen → die Route muss GENAU entry_72h als würde-senden melden (und nicht entry_24h,
 * dessen Zeitpunkt dann noch 48h weg ist). Snapshot/Restore der Saison über REST (CLAUDE.md).
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
const CRON_SECRET = envVal("CRON_SECRET");

const DAY = 86_400_000, HOUR = 3_600_000;

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
  expect(a?.token && a?.uid, "Session lesbar").toBeTruthy();
  return a as { token: string; uid: string };
}

test("/api/tour/reminders Trockenlauf: ITF-Turnier bei −72h ⇒ genau entry_72h (echte Daten, simulierte Zeit)", async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, "E2E creds fehlen");
  test.skip(!SUPA_URL || !SUPA_KEY, "Supabase-Env fehlt");
  test.skip(!CRON_SECRET, "CRON_SECRET fehlt");

  await login(page);
  const { token, uid } = await readAuth(page);
  const base = { apikey: SUPA_KEY, Authorization: `Bearer ${token}`, "Accept-Profile": "web", "Content-Profile": "web" };

  // Ein echtes aktives ITF-Turnier (Fristen bekannt) — Montag egal, die Zeit simulieren wir.
  const tr = await (await fetch(`${SUPA_URL}/rest/v1/tour_tournaments?select=id,tournament_monday&series=eq.itf_wtt&valid_to=is.null&order=tournament_monday.desc&limit=1`, { headers: base })).json() as { id: string; tournament_monday: string }[];
  expect(tr[0], "ein aktives ITF-Turnier vorhanden").toBeTruthy();
  const tid = tr[0].id;
  const mondayMs = Date.parse(tr[0].tournament_monday + "T00:00:00Z");
  const entry = mondayMs - 18 * DAY + 14 * HOUR; // ITF: Meldeschluss = Montag − 18 Tage, 14:00 UTC
  const nowMinus72 = new Date(entry - 72 * HOUR).toISOString();
  const nowAfter = new Date(entry + 1 * HOUR).toISOString(); // nach der Frist → nie senden

  // Snapshot + Seed: Turnier in die Saison (Status default 'planned' → Melde-Erinnerung greift).
  const seasonIds = async () => new Set((await (await fetch(`${SUPA_URL}/rest/v1/tour_season_plan?select=tournament_id`, { headers: base })).json() as { tournament_id: string }[]).map((x) => x.tournament_id));
  const B0 = await seasonIds();
  const seeded = !B0.has(tid);
  if (seeded) {
    const r = await fetch(`${SUPA_URL}/rest/v1/tour_season_plan`, { method: "POST", headers: { ...base, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ user_id: uid, tournament_id: tid }) });
    expect(r.ok || r.status === 409).toBeTruthy();
  }

  try {
    // Trockenlauf bei −72h: die Route MUSS entry_72h für dieses Turnier/diesen Nutzer melden.
    const res = await page.request.get(`/api/tour/reminders?dryRun=1&secret=${encodeURIComponent(CRON_SECRET)}&now=${encodeURIComponent(nowMinus72)}`);
    expect(res.ok(), "Route antwortet").toBeTruthy();
    const body = await res.json() as { dryRun: boolean; would_send: { userId: string; tournamentId: string; kind: string }[] };
    expect(body.dryRun).toBe(true);
    const mine = body.would_send.filter((w) => w.userId === uid && w.tournamentId === tid);
    expect(mine.map((w) => w.kind), "genau entry_72h fällig (nicht entry_24h)").toEqual(["entry_72h"]);

    // Nach der Frist: NIE senden (der springende Punkt bei Rückzugs-/Meldefristen).
    const res2 = await page.request.get(`/api/tour/reminders?dryRun=1&secret=${encodeURIComponent(CRON_SECRET)}&now=${encodeURIComponent(nowAfter)}`);
    const body2 = await res2.json() as { would_send: { userId: string; tournamentId: string; kind: string }[] };
    expect(body2.would_send.some((w) => w.userId === uid && w.tournamentId === tid), "nach der Frist nichts").toBe(false);

    console.log("[REMINDERS] Trockenlauf: −72h ⇒ entry_72h ✓ · nach der Frist ⇒ nichts ✓");
  } finally {
    if (seeded) await fetch(`${SUPA_URL}/rest/v1/tour_season_plan?tournament_id=eq.${tid}`, { method: "DELETE", headers: { ...base, Prefer: "return=minimal" } });
    const after = await seasonIds();
    expect(after.size, "Saison wie vorher").toBe(B0.size);
  }
});
