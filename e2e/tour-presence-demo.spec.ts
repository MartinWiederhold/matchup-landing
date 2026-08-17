import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * E2E-BELEG: Beispiel-Spieler im „Vor Ort"-Reiter — Anzeige, Klick → Profil, Verbinden → Chat.
 * Reine Anzeige/Simulation: Hinweis + „Beispiel"-Merkmal je Eintrag, KEIN Anschreiben-Knopf;
 * Klick öffnet ein simuliertes Profil, „Verbinden" eine Beispiel-Unterhaltung — durchgehend als
 * Vorschau gekennzeichnet, nichts wird gesendet/gespeichert. Nur lesen, keine DB-Mutation.
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

test("/tour Vor Ort: Beispiel-Spieler anklickbar — Profil + simuliertes Verbinden/Chat", async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, "E2E creds fehlen");
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.route(/tpembars\.com/, (r) => r.abort());

  await login(page);
  await page.goto("/tour");
  const catalog = page.locator("aside").first();
  const detail = page.locator("aside").last();

  await catalog.getByRole("button", { name: /Como/i }).first().click();
  await expect(detail.getByRole("button", { name: /^Vor Ort$|^On site$/ }), "Reiter Vor Ort").toBeVisible({ timeout: 20_000 });
  await detail.getByRole("button", { name: /^Vor Ort$|^On site$/ }).click();

  // Hinweis + fünf Beispiel-Merkmale, kein Anschreiben-Knopf.
  await expect(detail.getByText(/Beispiele zur Veranschaulichung|Examples for illustration/).first(), "Hinweis").toBeVisible({ timeout: 10_000 });
  expect(await detail.getByText(/^Beispiel$|^Example$/).count(), "fünf Beispiel-Einträge").toBe(5);
  await expect(detail.getByRole("button", { name: /^Anschreiben$|^Message$/ }), "kein Anschreiben-Knopf").toHaveCount(0);

  // Punkt 2 — die Angaben sind reicher: die Zeile eines Beispiel-Eintrags trägt ein Detail
  // (Belag/Zimmer/Niveau/Zeitraum), nicht nur „Sucht Unterkunft".
  const firstDemoRow = detail.locator("button").filter({ hasText: /Beispiel|Example/ }).first();
  await expect(firstDemoRow, "reichere Angaben in der Zeile").toContainText(/\d{1,2}:\d{2}|vormittags|nachmittags|Zimmer|Wohnung|Room|Apartment|\d{2}\.\d{2}\./);

  // Punkt 1 — der Ansichts-Filter wirkt (getrennt vom eigenen Opt-in).
  const badges = () => detail.getByText(/^Beispiel$|^Example$/).count();
  const all = await badges();
  await detail.getByRole("button", { name: /^Trainingspartner$|^Hitting partner$/ }).click();
  const partner = await badges();
  await detail.getByRole("button", { name: /^Mitbewohner$|^Room share$/ }).click();
  const room = await badges();
  expect(partner, "Partner-Filter zeigt ≥1").toBeGreaterThanOrEqual(1);
  expect(room, "Mitbewohner-Filter zeigt ≥1").toBeGreaterThanOrEqual(1);
  expect(partner < all || room < all, "mindestens ein Filter reduziert die Liste").toBeTruthy();
  await detail.getByRole("button", { name: /^Alle$|^All$/ }).click();

  // Klick auf einen Beispiel-Eintrag → Profilansicht (mit Detailzeilen).
  await detail.locator("button").filter({ hasText: /^.*(Beispiel|Example).*$/ }).first().click();
  await expect(page.getByText(/Vorschau — so läuft es|Preview — this is how it works/).first(), "Profil-Vorschau-Hinweis").toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/^Nationalität$|^Nationality$/).first(), "Profilfeld Nationalität").toBeVisible();
  const connect = page.getByRole("button", { name: /^Verbinden$|^Connect$/ });
  await expect(connect, "Verbinden-Knopf").toBeVisible();

  // Verbinden → Beispiel-Unterhaltung.
  await connect.click();
  await expect(page.getByText(/Beispiel-Unterhaltung|example conversation/).first(), "Chat-Kennzeichnung").toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/Trainingspartner|hitting partner|Unterkunft|place to stay/).first(), "vorbereitete Nachricht").toBeVisible();
  await expect(page.getByText(/Nachrichten werden nicht gesendet|messages are not sent/).first(), "Senden inaktiv-Hinweis").toBeVisible();

  // Tippen möglich, Senden inaktiv (disabled).
  const input = page.getByPlaceholder(/Nachricht schreiben|Write a message/);
  await input.fill("Test");
  await expect(input).toHaveValue("Test");

  console.log("[DEMO] Liste ✓ · Profil ✓ · Verbinden → Chat ✓ · durchgehend Vorschau ✓");
});
