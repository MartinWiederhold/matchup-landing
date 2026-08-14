import { test, expect, type Page } from "@playwright/test";

/**
 * E2E: /tour Saisonplaner (Einzel-Panel „Season planner") gegen den LOKALEN Dev-Server,
 * echter Login. AUF DEN NEUEN STAND GEBRACHT (SeasonWorkspace-Umbau): der alte Schritt-
 * Flow (Profil/Rahmen/Vorschlag) und der „N Turniere im Rahmen"-Zähler existieren nicht
 * mehr; die Fläche ist ein einzelnes Panel (START POINT / FRAME / YOUR SEASON / Fill
 * cheapest season). Die Sticky-Karten-Prüfung entfällt: das Layout ist h-dvh ohne
 * Seiten-Scroll (das Panel scrollt intern).
 *
 * BEWUSST NICHT-SCHREIBEND: kein Speichern-Klick. Achtung — im neuen Planer PERSISTIEREN
 * Budget (saveSeasonBudget, entprellt) und das Aufnehmen/Entfernen von Turnieren SOFORT in
 * die DB. Dieser Test ändert daher WEDER Budget NOCH Saison: er tippt nur in die Suche
 * (ohne Auswahl), schaltet die Region (reiner Komponenten-Zustand) und öffnet das Länder-
 * Dropdown. Das Konto bleibt unverändert → nichts aufzuräumen.
 *
 * Zugangsdaten NUR über Env (E2E_EMAIL/E2E_PASSWORD, optional E2E_GATE_CODE).
 */
const EMAIL = process.env.E2E_EMAIL || "";
const PASSWORD = process.env.E2E_PASSWORD || "";
const GATE_CODE = process.env.E2E_GATE_CODE || "50805080";
const SHOTS = "e2e/artifacts";

const RX = {
  loginBtn: /^EINLOGGEN$|^LOG IN$/,
  startPoint: /START POINT|STARTPUNKT/i,
  frame: /^FRAME$|^RAHMEN$/i,
  season: /YOUR SEASON|DEINE SAISON/i,
  fill: /Fill cheapest season|Günstigste Saison/i,
  regionAll: /^All countries$|^Alle Länder$/i,
  regionEurope: /Europe & Mediterranean|Europa & Mittelmeer/i,
  countries: /Countries|Länder/i,
  chip: /Rank|Rang/,
  startInput: /search a city|Stadt suchen|Current:/i,
};
const mapEl = (page: Page) => page.locator(".maplibregl-map").first();

async function login(page: Page) {
  await page.request.post("/api/unlock", { data: { code: GATE_CODE } });
  await page.goto("/app");
  await page.locator('input[type="email"]').first().fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await page.getByRole("button", { name: RX.loginBtn }).click();
  await expect(page.locator('input[type="email"]'), "Login sollte gelingen").toHaveCount(0, { timeout: 45_000 });
}

test("/tour Saisonplaner: lädt, Startpunkt-Suche, Region, Länder-Zähler", async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, "E2E_EMAIL/E2E_PASSWORD nicht gesetzt");

  await login(page);
  await page.goto("/tour");

  // ── Planer geladen: die tragenden Abschnitte da (nicht der alte Schritt-Flow) ──
  await expect(page.getByText(RX.startPoint).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(RX.frame).first()).toBeVisible();
  await expect(page.getByText(RX.season).first()).toBeVisible();
  await expect(page.getByRole("button", { name: RX.fill })).toBeVisible();
  // Profil-Chip trägt den Wohnort (Beleg, dass das Konto Koordinaten hat → Intro unterdrückt).
  await expect(page.getByRole("button", { name: RX.chip }).first()).toBeVisible();

  // ── Karte sichtbar + auf den Wohnort zentriert (Screenshot als Beleg) ──
  await expect(mapEl(page)).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(1500);
  await mapEl(page).screenshot({ path: `${SHOTS}/planner-01-home.png` });

  // ── Startpunkt-Suche: „zurich" liefert Vorschläge (NUR tippen, NICHT auswählen → kein Schreiben) ──
  const inp = page.getByPlaceholder(RX.startInput).first();
  await inp.click();
  await inp.fill("");
  await inp.type("zurich", { delay: 40 });
  await page.waitForTimeout(1500); // Entprellung ~400ms + Nominatim
  const suggestions = page.locator("button, li, [role=option]").filter({ hasText: /Zürich|Zurich/i });
  await expect(suggestions.first(), "zurich sollte mindestens einen Vorschlag liefern").toBeVisible({ timeout: 10_000 });
  await page.screenshot({ path: `${SHOTS}/planner-02-search.png` });
  await page.keyboard.press("Escape").catch(() => {});

  // ── Region umschalten (reiner Komponenten-Zustand, kein Schreiben): aktiver Zustand wechselt ──
  const btnAll = page.getByRole("button", { name: RX.regionAll });
  const btnEurope = page.getByRole("button", { name: RX.regionEurope });
  await btnAll.click();
  await expect(btnAll, "All countries wird aktiv (matchup-Hintergrund)").toHaveClass(/bg-matchup/);
  await btnEurope.click();
  await expect(btnEurope, "Europe only wird aktiv").toHaveClass(/bg-matchup/);

  // ── Länder-Dropdown: Zähler je Land (countByCountry aus echten Turnierdaten) ──
  await page.getByRole("button", { name: RX.countries }).first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SHOTS}/planner-03-countries.png` });
  // Länder-Zeilen tragen je einen Zähler (span.tabular-nums = Turnierzahl je Land).
  await expect(page.locator("span.tabular-nums").first(), "Länder-Dropdown zeigt Zähler je Land").toBeVisible({ timeout: 8_000 });
});
