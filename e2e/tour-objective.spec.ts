import { test, expect, type Page } from "@playwright/test";

/**
 * E2E: Optimierer-Objektiv v3 in der Filterspalte. Umschalten auf „Meiste Punkte" zeigt
 * den Zielrunden-Wähler (Vorgabe 2. Runde / R16) und die Übersicht rechnet die erwarteten
 * Punkte der Saison (als Annahme markiert). „1. Runde" (R32) ⇒ 0 Punkte (Regel 9.03 G.2),
 * das Ergebnis sagt es. NICHT-SCHREIBEND: nur UI-Zustand (localStorage-Vorliebe), keine DB.
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

test("/tour Objektiv Meiste Punkte: Zielrunde + erwartete Punkte, R32-Nullfall", async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, "E2E creds fehlen");
  await page.route(/tpembars\.com/, (r) => r.abort());

  await login(page);
  await page.goto("/tour");
  await expect(page.getByText(/Deine Saison|Your season/i).first()).toBeVisible({ timeout: 30_000 });

  // Filterspalte öffnen (bei 1280 px ein Drawer) → letzte aside = Filter.
  await page.getByRole("button", { name: /^Filters$|^Filter$/i }).first().click();
  await page.waitForTimeout(400);
  const fp = page.locator("aside").last();

  // Auf „Meiste Punkte" umschalten → Zielrunde erscheint, Vorgabe R16 (2. Runde) aktiv.
  await fp.getByRole("button", { name: /^Meiste Punkte$|^Most points$/ }).click();
  const r16 = fp.getByRole("button", { name: /^Achtelfinale$|^Round of 16$/ });
  await expect(r16, "Zielrunden-Wähler ist da").toBeVisible({ timeout: 8_000 });
  await expect(r16, "Vorgabe R16 ist aktiv").toHaveClass(/bg-matchup/);

  // Übersicht (rechte Spalte) zeigt erwartete Punkte als Annahme.
  await expect(page.getByText(/Erwartete Punkte|Expected points/i).first(), "Übersicht zeigt erwartete Punkte").toBeVisible({ timeout: 8_000 });
  await expect(page.getByText(/Annahme:|assuming/i).first(), "als Annahme markiert").toBeVisible();

  // „1. Runde" (R32) ⇒ alle Turniere 0 Punkte; das Ergebnis sagt es (Regel 9.03 G.2).
  await fp.getByRole("button", { name: /^1\. Runde$|^First round$/ }).click();
  await page.waitForTimeout(300);
  await expect(page.getByText(/9\.03 G\.2/).first(), "R32-Nullfall wird benannt, nicht willkürlich gewählt").toBeVisible({ timeout: 8_000 });

  console.log("[OBJ] Meiste Punkte ✓ · Zielrunde R16 ✓ · erwartete Punkte ✓ · R32-Nullfall benannt ✓");
});
