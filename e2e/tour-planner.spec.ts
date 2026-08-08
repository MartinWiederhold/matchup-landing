import { test, expect, type Page } from "@playwright/test";

/**
 * E2E: /tour Saisonplaner (Schritt 1 + 2) gegen den LOKALEN Dev-Server, echter Login.
 *
 * Prüft die vier vom Auftraggeber genannten Dinge:
 *  2) Karte zentriert nach Schritt 1 auf den Wohnort (Screenshot).
 *  3) Region-/Zeitraumwechsel ändert die Turnierzahl im Rahmen: „nur Schweiz" < „alle
 *     Länder" (Assertion + Screenshots).
 *  4) Karte bleibt beim Scrollen stehen (sticky): y-Position vor/nach dem Scrollen.
 *  (1) wird separat per DB geprüft — hat das Konto Koordinaten.)
 *
 * BEWUSST NICHT-SCHREIBEND: der Test klickt KEINEN Speichern-Knopf. Region und
 * Zeitraum sind reiner Komponenten-Zustand (keine DB). Das Konto bleibt unverändert;
 * es gibt daher nichts aufzuräumen (separat per DB-Vergleich vorher/nachher belegt).
 *
 * Zugangsdaten AUSSCHLIESSLICH über Env (E2E_EMAIL/E2E_PASSWORD, optional E2E_GATE_CODE)
 * — nie in dieser Datei. Nur gegen den lokalen Dev-Server.
 */

const EMAIL = process.env.E2E_EMAIL || "";
const PASSWORD = process.env.E2E_PASSWORD || "";
const GATE_CODE = process.env.E2E_GATE_CODE || "50805080";
const SHOTS = "e2e/artifacts";

const RX = {
  loginBtn: /^EINLOGGEN$|^LOG IN$/,
  step1: /Profil|Profile/,
  step2: /Rahmen|Frame/,
  regionCh: /Nur Schweiz|Switzerland only/,
  regionAll: /Alle Länder|All countries/,
  coverage: /(\d+)\s+(Turniere im Rahmen|tournaments in frame)/,
};

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
async function frameCount(page: Page): Promise<number> {
  const txt = await page.getByText(RX.coverage).first().innerText();
  const m = txt.match(/\d+/);
  return m ? Number(m[0]) : NaN;
}
// Map-Element (maplibre-Container).
const mapEl = (page: Page) => page.locator(".maplibregl-map").first();

test("/tour Saisonplaner: Kartensprung, Rahmen-Zählung, Sticky-Karte", async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, "E2E_EMAIL/E2E_PASSWORD nicht gesetzt");

  await unlockGate(page);
  await login(page);
  await page.goto("/tour");

  // Planer geladen: beide Schritt-Köpfe da.
  await expect(page.getByRole("button", { name: RX.step1 })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: RX.step2 })).toBeVisible();

  // ── Punkt 2: Karte zentriert auf den Wohnort (Schritt 1 offen → keine Kandidaten) ──
  await page.getByRole("button", { name: RX.step1 }).click();
  await expect(mapEl(page)).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(1500); // maplibre: Kacheln/Zentrierung setzen lassen
  await mapEl(page).screenshot({ path: `${SHOTS}/tour-01-step1-home.png` });

  // ── Punkt 3: Rahmen-Zählung ändert sich mit der Region ──
  await page.getByRole("button", { name: RX.step2 }).click();
  await expect(page.getByText(RX.coverage).first()).toBeVisible({ timeout: 20_000 });

  await page.getByRole("button", { name: RX.regionCh }).click();
  await page.waitForTimeout(400);
  const countCh = await frameCount(page);
  await page.screenshot({ path: `${SHOTS}/tour-02-region-ch.png` });

  await page.getByRole("button", { name: RX.regionAll }).click();
  await page.waitForTimeout(400);
  const countAll = await frameCount(page);
  await page.screenshot({ path: `${SHOTS}/tour-03-region-all.png` });

  expect(Number.isFinite(countCh) && Number.isFinite(countAll), "beide Zahlen lesbar").toBeTruthy();
  expect(countAll, `„alle Länder" (${countAll}) muss mehr sein als „nur Schweiz" (${countCh})`).toBeGreaterThan(countCh);

  // ── Punkt 4: Karte bleibt beim Scrollen stehen (sticky) ──
  const before = await mapEl(page).boundingBox();
  await page.evaluate(() => window.scrollBy(0, 700));
  await page.waitForTimeout(400);
  const after = await mapEl(page).boundingBox();
  expect(before && after, "Map-Box lesbar").toBeTruthy();
  const dy = Math.abs((after!.y) - (before!.y));
  expect(dy, `Karte darf beim Scrollen kaum wandern (Δy=${Math.round(dy)}px), sonst nicht sticky`).toBeLessThan(60);
});
