import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * E2E-BELEG: Beispiel-Spieler im „Vor Ort"-Reiter. Reine Anzeige (nie in player_presence):
 * ein Hinweis über der Liste UND ein „Beispiel"-Merkmal je Eintrag; KEIN Anschreiben/Kontakt.
 * Nur lesen — keine DB-Mutation, kein Snapshot/Restore nötig.
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

test("/tour Vor Ort: Beispiel-Spieler mit Hinweis + Merkmal, ohne Anschreiben-Knopf", async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, "E2E creds fehlen");
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.route(/tpembars\.com/, (r) => r.abort());

  await login(page);
  await page.goto("/tour");
  const catalog = page.locator("aside").first();
  const detail = page.locator("aside").last();

  // Ein Turnier öffnen (Como-Challenger liegt in Europa → im Standard-Katalog).
  await catalog.getByRole("button", { name: /Como/i }).first().click();
  await expect(detail.getByRole("button", { name: /^Vor Ort$|^On site$/ }), "Reiter Vor Ort").toBeVisible({ timeout: 20_000 });
  await detail.getByRole("button", { name: /^Vor Ort$|^On site$/ }).click();

  // Hinweis über der Liste.
  await expect(detail.getByText(/Beispiele zur Veranschaulichung|Examples for illustration/).first(), "Beispiel-Hinweis").toBeVisible({ timeout: 10_000 });
  // Merkmal je Eintrag: mindestens eine „Beispiel"-Pille.
  const badges = detail.getByText(/^Beispiel$|^Example$/);
  await expect(badges.first(), "Beispiel-Merkmal").toBeVisible();
  expect(await badges.count(), "fünf Beispiel-Einträge").toBe(5);

  // Kein Anschreiben-Knopf: im Vor-Ort-Reiter gibt es (ohne eigenes Opt-in) keine
  // „Anschreiben"-Schaltfläche — die Beispiele bringen keine dazu.
  await expect(detail.getByRole("button", { name: /^Anschreiben$|^Message$/ }), "keine Anschreiben-Knöpfe").toHaveCount(0);

  console.log("[DEMO] Hinweis ✓ · 5 Beispiel-Merkmale ✓ · kein Anschreiben-Knopf ✓");
});
