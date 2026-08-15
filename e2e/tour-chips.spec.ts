import { test, expect, type Page } from "@playwright/test";

/**
 * E2E: Aktive-Filter-Chips oben im Katalog. Jeder abweichende Filter erscheint als Chip mit x;
 * das x setzt GENAU diesen Filter zurück, die anderen bleiben. NICHT-SCHREIBEND: Serie, Belag
 * und Zeitraum sind reiner Session-Zustand (frame) — kein DB-Schreiben, nichts aufzuräumen.
 * Budget wird bewusst NICHT angefasst (das würde tour_profiles.season_budget schreiben).
 *
 * Zugangsdaten NUR über Env (E2E_EMAIL/E2E_PASSWORD, optional E2E_GATE_CODE).
 */
const EMAIL = process.env.E2E_EMAIL || "";
const PASSWORD = process.env.E2E_PASSWORD || "";
const GATE_CODE = process.env.E2E_GATE_CODE || "50805080";

async function login(page: Page) {
  await page.request.post("/api/unlock", { data: { code: GATE_CODE } });
  await page.goto("/app");
  await page.locator('input[type="email"]').first().fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await page.getByRole("button", { name: /^EINLOGGEN$|^LOG IN$/ }).click();
  await expect(page.locator('input[type="email"]')).toHaveCount(0, { timeout: 45_000 });
}

test("/tour Filter-Chips: erscheinen je aktivem Filter, x entfernt nur diesen einen", async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, "E2E creds fehlen");
  await page.route(/tpembars\.com/, (r) => r.abort());

  await login(page);
  await page.goto("/tour");
  await expect(page.getByText(/Deine Saison|Your season/i).first()).toBeVisible({ timeout: 30_000 });

  // Filterspalte öffnen (bei 1280 px ein Drawer) → letzte aside = Filter.
  await page.getByRole("button", { name: /^Filters$|^Filter$/i }).first().click();
  const fp = page.locator("aside").last();

  // Drei abweichende Filter setzen: Serie (Challenger) · Belag (Sand/Clay) · Zeitraum (bis-Datum).
  await fp.getByRole("button", { name: /^ATP Challenger$/ }).click();
  await fp.getByRole("button", { name: /^Sand$|^Clay$/ }).click();
  await fp.locator('input[type="date"]').last().fill("2026-12-31");

  // Filter-Drawer schließen (✕ im Kopf) → die Chips im Katalog werden sichtbar.
  await fp.getByRole("button", { name: /^Schliessen$|^Close$/ }).first().click();
  await page.waitForTimeout(300);

  // Drei Chips da: Serie, Belag, Zeitraum (bis …).
  const serieChip = page.getByRole("button", { name: /^ATP Challenger$/ });
  const belagChip = page.getByRole("button", { name: /^Sand$|^Clay$/ });
  await expect(serieChip, "Serie-Chip").toBeVisible({ timeout: 8_000 });
  await expect(belagChip, "Belag-Chip").toBeVisible();
  await expect(page.getByText(/^bis |^until /i).first(), "Zeitraum-Chip").toBeVisible();

  // x am Belag-Chip klicken → NUR der Belag verschwindet, Serie + Zeitraum bleiben.
  await page.getByRole("button", { name: /^Sand entfernen$|^Remove Clay$/ }).click();
  await page.waitForTimeout(300);
  await expect(page.getByRole("button", { name: /^Sand$|^Clay$/ }), "Belag-Chip ist weg").toHaveCount(0);
  await expect(serieChip, "Serie-Chip bleibt").toBeVisible();
  await expect(page.getByText(/^bis |^until /i).first(), "Zeitraum-Chip bleibt").toBeVisible();

  console.log("[CHIPS] Serie+Belag+Zeitraum als Chips ✓ · x entfernt nur den Belag ✓ · Rest bleibt ✓");
});
