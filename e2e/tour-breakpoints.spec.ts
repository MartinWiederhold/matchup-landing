import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * VISUELLER BELEG (Etappe b des /tour-Vier-Spalten-Umbaus): an jeder kritischen Breite
 * je EIN Screenshot mit Filterspalte ZU und einer mit Filterspalte OFFEN. Das ist die
 * Stelle, an der sich Spalten still überlappen würden. Nicht-schreibend (nur lesen +
 * Filter auf/zu) — kein Saison-Eingriff, keine REST-Mutation.
 *
 * Schwellen: 1520 (Filter darf inline stehen) · 1200 (Detailspalte inline) · 1024 (Mobile).
 * Drop-Reihenfolge Filter → Detail → Katalog; die Karte fällt nie weg.
 */
const EMAIL = process.env.E2E_EMAIL || "";
const PASSWORD = process.env.E2E_PASSWORD || "";
const GATE_CODE = process.env.E2E_GATE_CODE || "50805080";
const SHOTS = "e2e/artifacts";
const WIDTHS = [1600, 1520, 1440, 1280, 1200, 1024, 390];

function envVal(name: string): string {
  if (process.env[name]) return process.env[name] as string;
  try {
    const m = readFileSync(".env.local", "utf8").match(new RegExp("^" + name + "=(.*)$", "m"));
    return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
  } catch { return ""; }
}
const E2E_EMAIL = EMAIL || envVal("E2E_EMAIL");
const E2E_PASSWORD = PASSWORD || envVal("E2E_PASSWORD");

async function login(page: Page) {
  await page.request.post("/api/unlock", { data: { code: GATE_CODE } });
  await page.goto("/app");
  await page.locator('input[type="email"]').first().fill(E2E_EMAIL);
  await page.locator('input[type="password"]').first().fill(E2E_PASSWORD);
  await page.getByRole("button", { name: /^EINLOGGEN$|^LOG IN$/ }).click();
  await expect(page.locator('input[type="email"]')).toHaveCount(0, { timeout: 45_000 });
}

test("/tour Breakpoint-Screenshots: 1600/1520/1440/1280/1200/1024/390, je Filter zu + offen", async ({ page }) => {
  test.skip(!E2E_EMAIL || !E2E_PASSWORD, "E2E creds fehlen");
  await page.route(/tpembars\.com/, (r) => r.abort()); // Affiliate-Skript isolieren

  await login(page);
  await page.goto("/tour");
  // Katalog geladen (Startpunkt-Titel steht) — erst dann sind alle Spalten aussagekräftig.
  await expect(page.getByText(/Deine Saison|Your season/i).first()).toBeVisible({ timeout: 30_000 });

  const filterBtn = () => page.getByRole("button", { name: /^Filter$|^Filters$|^Filter\s*\d+$|^Filters\s*\d+$/ }).first();
  const closeBtn = () => page.getByRole("button", { name: /^Schliessen$|^Close$/ }).first();

  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(500); // resize → winW + Layout

    // Filter ZU
    await page.screenshot({ path: `${SHOTS}/bp-${w}-closed.png`, fullPage: false });

    // Filter OFFEN
    await filterBtn().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SHOTS}/bp-${w}-open.png`, fullPage: false });

    // wieder zu (Zustand trägt über die Breiten) — ✕ im Filterkopf
    await closeBtn().click();
    await page.waitForTimeout(300);
    console.log(`[BP] ${w}px ✓ zu + offen`);
  }
});
