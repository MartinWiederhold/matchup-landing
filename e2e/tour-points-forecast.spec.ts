import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * E2E-BELEG: Rangprognose. Das Formular auf /tour/points erfasst zählende Ergebnisse in
 * web.tour_result_history (owner-only). Danach zeigt die Seite den gerechneten Stand, den
 * Ausblick (+4/+8/+12 Wochen) und den Verfallsplan. Zwei synthetische Ergebnisse:
 *  - Challenger 125 · Achtelfinale (8 Pkt), Woche 2025-09 → Verfall in ~2 Wochen
 *  - Challenger 125 · Titel (125 Pkt), Woche 2026-06 → fällt lange nicht
 * Erwartet: Stand 133; +4 Wochen 125 (−8). Snapshot/Restore über REST (CLAUDE.md): die
 * angelegten Zeilen werden am Ende an ihrem Namen wieder entfernt — NIE über die Oberfläche.
 */
const EMAIL = process.env.E2E_EMAIL || "";
const PASSWORD = process.env.E2E_PASSWORD || "";
const GATE_CODE = process.env.E2E_GATE_CODE || "50805080";

function envVal(name: string): string {
  if (process.env[name]) return process.env[name] as string;
  try { const m = readFileSync(".env.local", "utf8").match(new RegExp("^" + name + "=(.*)$", "m")); return m ? m[1].trim().replace(/^["']|["']$/g, "") : ""; } catch { return ""; }
}
const SUPA_URL = envVal("NEXT_PUBLIC_SUPABASE_URL");
const SUPA_KEY = envVal("NEXT_PUBLIC_SUPABASE_ANON_KEY");

const R1 = "E2E Wien Challenger";
const R2 = "E2E Paris Challenger";

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

async function addResult(page: Page, name: string, categoryValue: string, roundValue: string, date: string) {
  await page.locator("label", { hasText: /^Turnier$|^Tournament$/ }).locator("input").first().fill(name);
  await page.locator("label", { hasText: /Kategorie|Category/ }).locator("select").first().selectOption(categoryValue);
  await page.locator("label", { hasText: /Erreichte Runde|Round reached/ }).locator("select").first().selectOption(roundValue);
  await page.locator("label", { hasText: /Datum der Turnierwoche|Tournament week date/ }).locator("input").first().fill(date);
  await page.getByRole("button", { name: /^Erfassen$|^Record$/ }).click();
}

test("/tour/points: Ergebnis erfassen, Stand + Ausblick + Verfallsplan", async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, "E2E creds fehlen");
  test.skip(!SUPA_URL || !SUPA_KEY, "Supabase-Env fehlt");
  await page.route(/tpembars\.com/, (r) => r.abort());

  await login(page);
  const { token } = await readAuth(page);
  const base = { apikey: SUPA_KEY, Authorization: `Bearer ${token}`, "Accept-Profile": "web", "Content-Profile": "web" };
  const j = async (path: string) => (await (await fetch(`${SUPA_URL}/rest/v1/${path}`, { headers: base })).json());
  const delByName = async (n: string) => { await fetch(`${SUPA_URL}/rest/v1/tour_result_history?tournament_name=eq.${encodeURIComponent(n)}`, { method: "DELETE", headers: { ...base, Prefer: "return=minimal" } }); };

  // Vorbedingung: unsere Testnamen sind nicht vorhanden (aus früherem Lauf säubern).
  await delByName(R1); await delByName(R2);

  try {
    await page.goto("/tour/points");

    await addResult(page, R1, "challenger_125", "R16", "2025-09-03"); // → Montag 2025-09-01, Verfall 2026-08-31
    await expect.poll(async () => ((await j(`tour_result_history?select=tournament_monday&tournament_name=eq.${encodeURIComponent(R1)}`)) as { tournament_monday: string }[])[0]?.tournament_monday, { timeout: 10_000 }).toBe("2025-09-01");

    await addResult(page, R2, "challenger_125", "W", "2026-06-03"); // Titel, fällt lange nicht
    await expect.poll(async () => ((await j(`tour_result_history?select=id&tournament_name=in.(%22${encodeURIComponent(R1)}%22,%22${encodeURIComponent(R2)}%22)`)) as unknown[]).length, { timeout: 10_000 }).toBe(2);

    // Stand aus der Historie: 8 + 125 = 133.
    await expect(page.getByText(/\b133\b/).first(), "Punktestand 133").toBeVisible({ timeout: 10_000 });
    // Ausblick +4 Wochen: die 8 Punkte fallen weg → Kachel zeigt „−8 fallen weg".
    await expect(page.getByText(/[−-]8\s*(fallen weg|fall off)/).first(), "Ausblick −8").toBeVisible();
    // Verfallsplan nennt das ablaufende Turnier.
    await expect(page.getByText(new RegExp(R1)).first(), "Verfallsplan zeigt das Turnier").toBeVisible();
    // Ehrlichkeit: Punkte, keine Ränge.
    await expect(page.getByText(/keine Ränge|not ranks/).first(), "Punkte, keine Ränge benannt").toBeVisible();

    console.log("[POINTS] Stand 133 ✓ · Ausblick −8 ✓ · Verfallsplan ✓ · keine-Ränge-Hinweis ✓");
  } finally {
    await delByName(R1); await delByName(R2);
  }
});
