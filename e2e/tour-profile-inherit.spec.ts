import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * E2E-BELEG: /tour übernimmt Name/Bild/Land aus /app (profiles). Nur LESEN, keine Mutation.
 *  - Profil-Chip oben rechts im Planer zeigt das Profilbild (web-avatars-URL) statt Initialen.
 *  - Setup-Schritt 1 zeigt einen Identitäts-Block (Name + Wohnort) als „aus deinem Profil"
 *    übernommene Angabe; nur Ranking/Pässe bleiben Eingabe.
 */
const EMAIL = process.env.E2E_EMAIL || "";
const PASSWORD = process.env.E2E_PASSWORD || "";
const GATE_CODE = process.env.E2E_GATE_CODE || "50805080";

function envVal(name: string): string {
  if (process.env[name]) return process.env[name] as string;
  try { const m = readFileSync(".env.local", "utf8").match(new RegExp("^" + name + "=(.*)$", "m")); return m ? m[1].trim().replace(/^["']|["']$/g, "") : ""; } catch { return ""; }
}

async function login(page: Page) {
  await page.request.post("/api/unlock", { data: { code: GATE_CODE } });
  await page.goto("/app");
  await page.locator('input[type="email"]').first().fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await page.getByRole("button", { name: /^EINLOGGEN$|^LOG IN$/ }).click();
  await expect(page.locator('input[type="email"]')).toHaveCount(0, { timeout: 45_000 });
}

test("/tour übernimmt Bild/Name/Land aus dem Profil (Chip + Identitäts-Block)", async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, "E2E creds fehlen");
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.route(/tpembars\.com/, (r) => r.abort());

  await login(page);

  // Setup-Schritt 1: Identitäts-Block „aus deinem Profil".
  await page.goto("/tour/setup?step=1");
  await expect(page.getByText(/aus deinem Profil|from your profile/).first(), "Identitäts-Block-Label").toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/Das braucht Matchup Tour zusätzlich|What Matchup Tour needs on top/).first(), "Abschnitt: tour-spezifische Eingaben").toBeVisible();
  // Der übernommene Wohnort (Stadt) erscheint im Block.
  await expect(page.getByText(/zurich/i).first(), "übernommener Wohnort").toBeVisible();

  // Planer: der Profil-Chip zeigt das Profilbild (web-avatars-URL).
  await page.goto("/tour");
  await expect(page.locator('img[src*="web-avatars"]').first(), "Profilbild im Chip statt Initialen").toBeVisible({ timeout: 30_000 });

  console.log("[PROFILE] Identitäts-Block ✓ · übernommener Wohnort ✓ · Chip-Profilbild ✓");
});
