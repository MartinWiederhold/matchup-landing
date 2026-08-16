import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * E2E-BELEG: Turnier-Bilanz. Je Turnier Ausgaben/Einnahmen/Saldo; Einnahme erfassen
 * persistiert; die Kennzahl „Kosten je ATP-Punkt" sagt bei fehlenden Ergebnissen „keine
 * Ergebnisse erfasst" (statt zu rechnen) und trägt die Basis-Turnierzahl. Snapshot/Restore
 * über REST (CLAUDE.md): ein Test-Aufwand + eine Test-Einnahme werden angelegt und am Ende
 * entfernt; vorhandene Ausgaben/Einnahmen bleiben unangetastet.
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

test("/tour/finance: Bilanz je Turnier, Einnahme erfassen persistiert, Kennzahl ohne Ergebnisse", async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, "E2E creds fehlen");
  test.skip(!SUPA_URL || !SUPA_KEY, "Supabase-Env fehlt");
  await page.route(/tpembars\.com/, (r) => r.abort());

  await login(page);
  const { token, uid } = await readAuth(page);
  const base = { apikey: SUPA_KEY, Authorization: `Bearer ${token}`, "Accept-Profile": "web", "Content-Profile": "web" };
  const j = async (path: string) => (await (await fetch(`${SUPA_URL}/rest/v1/${path}`, { headers: base })).json());

  // Ein Saison-Turnier (uuid) wählen.
  const plan = await j(`tour_season_plan?select=tournament_id&limit=1`) as { tournament_id: string }[];
  expect(plan[0], "ein Saison-Turnier").toBeTruthy();
  const A = plan[0].tournament_id;

  // Snapshot: bestehende Einnahmen dieses Turniers (nur unsere neue später entfernen).
  const incBefore = (await j(`tour_income?select=id&tournament_id=eq.${A}`) as { id: string }[]).map((x) => x.id);

  // Test-Ausgabe seeden (Major Units, wie /app-Konvention).
  const today = new Date().toISOString().slice(0, 10);
  const expRes = await fetch(`${SUPA_URL}/rest/v1/tour_expenses`, { method: "POST", headers: { ...base, "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ user_id: uid, tournament_id: A, amount: "300.00", currency: "EUR", category: "flight", spent_on: today }) });
  const expId = ((await expRes.json()) as { id: string }[])[0]?.id;
  expect(expId, "Test-Ausgabe angelegt").toBeTruthy();

  try {
    await page.goto("/tour/finance");

    // Kennzahl ohne Ergebnisse: „keine Ergebnisse erfasst" + Basis-Turnierzahl.
    await expect(page.getByText(/no results recorded|keine Ergebnisse erfasst/i).first(), "Punkte-Kennzahl sagt: keine Ergebnisse").toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/based on [1-9]\d* recorded tournaments|auf Basis von [1-9]\d* erfassten Turnieren/i).first(), "Basis-Turnierzahl sichtbar").toBeVisible();

    // Einnahme erfassen: Sponsor 150 EUR, Turnier A.
    await page.getByPlaceholder("0.00").fill("150");
    await page.locator('select:has(option[value=""])').selectOption(A); // die Turnier-Auswahl (hat die „ohne Turnier"-Option)
    await page.getByRole("button", { name: /^Record$|^Erfassen$/ }).click();

    // Beleg DB: genau eine NEUE Einnahme (Sponsor, 150) für A.
    await expect.poll(async () => {
      const rows = await j(`tour_income?select=id,kind,amount&tournament_id=eq.${A}`) as { id: string; kind: string; amount: string }[];
      return rows.filter((r) => !incBefore.includes(r.id)).map((r) => `${r.kind}:${Math.round(Number(r.amount))}`);
    }, { timeout: 10_000 }).toEqual(["sponsor:150"]);

    // Beleg UI: die Bilanz-Karte von A zeigt die Sponsor-Einnahme.
    await expect(page.getByText(/^Sponsor$/).first(), "Sponsor-Einnahme in der Bilanz").toBeVisible({ timeout: 10_000 });

    console.log("[FINANCE] keine-Ergebnisse-Kennzahl ✓ · Basis ✓ · Einnahme erfasst + persistiert ✓");
  } finally {
    // Restore: Test-Ausgabe + neu angelegte Einnahmen dieses Turniers entfernen.
    if (expId) await fetch(`${SUPA_URL}/rest/v1/tour_expenses?id=eq.${expId}`, { method: "DELETE", headers: { ...base, Prefer: "return=minimal" } });
    const notIn = incBefore.length ? `&id=not.in.(${incBefore.join(",")})` : "";
    await fetch(`${SUPA_URL}/rest/v1/tour_income?tournament_id=eq.${A}${notIn}`, { method: "DELETE", headers: { ...base, Prefer: "return=minimal" } });
  }
});
