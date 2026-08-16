import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * E2E-BELEG: Morgen-Dashboard. In der rechten Spalte von /tour (kein Turnier gewählt) steht
 * die Fünf-Minuten-Übersicht mit dem Block HANDLUNGSBEDARF. Wir seeden EIN zählendes Ergebnis,
 * dessen Punkte in ~2 Wochen verfallen (über REST) — dann muss das Dashboard den Punkt
 * „Punkte verfallen" zeigen UND per Klick nach /tour/points führen (Weg zur Handlung).
 * Snapshot/Restore über REST: die Zeile wird am Ende an ihrem Namen entfernt.
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
const NAME = "E2E Board Verfall";

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

test("/tour: Morgen-Dashboard zeigt Handlungsbedarf und führt zur Erledigung", async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, "E2E creds fehlen");
  test.skip(!SUPA_URL || !SUPA_KEY, "Supabase-Env fehlt");
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.route(/tpembars\.com/, (r) => r.abort());

  await login(page);
  const { token, uid } = await readAuth(page);
  const base = { apikey: SUPA_KEY, Authorization: `Bearer ${token}`, "Accept-Profile": "web", "Content-Profile": "web" };
  const jh = { ...base, "Content-Type": "application/json" };
  const delByName = async () => { await fetch(`${SUPA_URL}/rest/v1/tour_result_history?tournament_name=eq.${encodeURIComponent(NAME)}`, { method: "DELETE", headers: { ...base, Prefer: "return=minimal" } }); };

  // Challenger 125 · Achtelfinale (8 Pkt). Turnierwoche ~350 Tage her → Verfall (Woche+364)
  // liegt ~2 Wochen in der Zukunft, also im +4-Wochen-Fenster — unabhängig vom realen Datum.
  const monday = new Date(Date.now() - 350 * 86_400_000).toISOString().slice(0, 10);
  await delByName();
  const res = await fetch(`${SUPA_URL}/rest/v1/tour_result_history`, { method: "POST", headers: { ...jh, Prefer: "return=minimal" }, body: JSON.stringify({ user_id: uid, tournament_name: NAME, category: "challenger_125", round: "R16", tournament_monday: monday }) });
  expect(res.ok, "Ergebnis geseedet").toBeTruthy();

  try {
    await page.goto("/tour");

    // Der Handlungsbedarf-Block ist da.
    await expect(page.getByText(/^Handlungsbedarf$|^Action needed$/).first(), "Block Handlungsbedarf").toBeVisible({ timeout: 30_000 });

    // Der Punkt „Punkte verfallen" (8) steht in der Ampel …
    const item = page.getByText(/8 (Punkte verfallen|points fall off)/).first();
    await expect(item, "Handlungspunkt: Punkte verfallen").toBeVisible({ timeout: 10_000 });

    // … und führt per Klick an die Stelle der Erledigung (/tour/points).
    await item.click();
    await expect(page).toHaveURL(/\/tour\/points/, { timeout: 15_000 });

    console.log("[BOARD] Handlungsbedarf sichtbar ✓ · Punkte-Verfall ✓ · Klick → /tour/points ✓");
  } finally {
    await delByName();
  }
});
