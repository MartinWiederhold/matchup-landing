import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * E2E-BELEG: Wochen-Pipeline zeigt kommende Wochen inkl. LÜCKE; die Entscheidung ist direkt
 * änderbar und persistiert. Snapshot/Restore der Saison über REST (CLAUDE.md) — es werden zwei
 * ZUKÜNFTIGE Turniere (2+ Wochen auseinander → garantiert eine Lücke dazwischen) frisch in die
 * Saison gelegt und am Ende wieder entfernt.
 */
const EMAIL = process.env.E2E_EMAIL || "";
const PASSWORD = process.env.E2E_PASSWORD || "";
const GATE_CODE = process.env.E2E_GATE_CODE || "50805080";
const DAY = 86_400_000;

function envVal(name: string): string {
  if (process.env[name]) return process.env[name] as string;
  try { const m = readFileSync(".env.local", "utf8").match(new RegExp("^" + name + "=(.*)$", "m")); return m ? m[1].trim().replace(/^["']|["']$/g, "") : ""; } catch { return ""; }
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
async function readAuth(page: Page) {
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

test("/tour/pipeline: Lücke sichtbar, Entscheidung ändern persistiert", async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, "E2E creds fehlen");
  test.skip(!SUPA_URL || !SUPA_KEY, "Supabase-Env fehlt");

  await page.route(/tpembars\.com/, (r) => r.abort());
  await login(page);
  const { token, uid } = await readAuth(page);
  const base = { apikey: SUPA_KEY, Authorization: `Bearer ${token}`, "Accept-Profile": "web", "Content-Profile": "web" };

  const seasonIds = async () => new Set((await (await fetch(`${SUPA_URL}/rest/v1/tour_season_plan?select=tournament_id`, { headers: base })).json() as { tournament_id: string }[]).map((x) => x.tournament_id));
  const B0 = await seasonIds();

  // Zukünftige Turniere holen, die NOCH NICHT in der Saison sind; A = erstes, B = erstes ≥ A+14 Tage.
  const today = new Date().toISOString().slice(0, 10);
  const fut = await (await fetch(`${SUPA_URL}/rest/v1/tour_tournaments?select=id,city,tournament_monday&valid_to=is.null&tournament_monday=gt.${today}&order=tournament_monday.asc&limit=200`, { headers: base })).json() as { id: string; city: string | null; tournament_monday: string }[];
  const fresh = fut.filter((x) => !B0.has(x.id) && x.city);
  const A = fresh[0];
  expect(A, "ein zukünftiges Turnier A").toBeTruthy();
  const B = fresh.find((x) => Date.parse(x.tournament_monday) >= Date.parse(A.tournament_monday) + 14 * DAY);
  expect(B, "ein zweites Turnier B ≥ 2 Wochen nach A").toBeTruthy();

  const seed = async (id: string) => { const r = await fetch(`${SUPA_URL}/rest/v1/tour_season_plan`, { method: "POST", headers: { ...base, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ user_id: uid, tournament_id: id }) }); expect(r.ok || r.status === 409).toBeTruthy(); };
  await seed(A.id);
  await seed((B as typeof A).id);

  try {
    await page.goto("/tour/pipeline");
    // Beide Turniere erscheinen; dazwischen mindestens eine sichtbare Lücke.
    await expect(page.getByText(new RegExp(A.city as string, "i")).first(), "Turnier A in der Pipeline").toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(new RegExp((B as typeof A).city as string, "i")).first(), "Turnier B in der Pipeline").toBeVisible();
    await expect(page.getByText(/^Freie Woche$|^Free week$/).first(), "Lücke sichtbar (Erholungswoche)").toBeVisible();

    // Entscheidung für A auf „Spielen/Play" — direkt in der Tabellenzeile (breite Tabelle).
    const selectA = page.locator("table tr", { hasText: A.city as string }).first().locator("select");
    await expect(selectA, "Entscheidungs-Auswahl in A-Zeile").toBeVisible({ timeout: 15_000 });
    await selectA.selectOption("play", { timeout: 15_000 });
    // Beleg: persistiert in der DB.
    await expect.poll(async () => {
      const d = await (await fetch(`${SUPA_URL}/rest/v1/tour_season_plan?select=decision&tournament_id=eq.${A.id}`, { headers: base })).json() as { decision: string }[];
      return d[0]?.decision;
    }, { timeout: 10_000 }).toBe("play");

    console.log("[PIPELINE] Turnier A+B sichtbar ✓ · Lücke sichtbar ✓ · Entscheidung play persistiert ✓");
  } finally {
    await fetch(`${SUPA_URL}/rest/v1/tour_season_plan?tournament_id=in.(${A.id},${(B as typeof A).id})`, { method: "DELETE", headers: { ...base, Prefer: "return=minimal" } });
    const after = await seasonIds();
    expect(after.size, "Saison wie vorher").toBe(B0.size);
  }
});
