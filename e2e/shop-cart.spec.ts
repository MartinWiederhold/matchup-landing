import { test, expect, type Page } from "@playwright/test";

/**
 * E2E: /shop verhält sich nach dem Warenkorb-Umbau (useState → geteilter Context)
 * UNVERÄNDERT — und der neue geteilte Korb greift auf /shop/setup/alcaraz.
 *
 * Prüft am echten lokalen Dev-Server (kein Login nötig, KEINE DB-Writes — reine
 * In-Memory-Demo): hinzufügen · Menge erhöhen · entfernen · Drawer öffnen/schließen ·
 * Kasse-Hinweis (Alert). Danach: Setup-Seite über den Link (Client-Nav) → Korb bleibt
 * erhalten und nimmt einen Alcaraz-Artikel dazu (Beweis: EIN geteilter Korb).
 *
 * Texte DE ODER EN (Locale steht nicht fest). Nur gegen den lokalen Dev-Server.
 */

const GATE_CODE = process.env.E2E_GATE_CODE || "50805080";
const SHOTS = "e2e/artifacts";

const OVERLAY = "div.fixed.inset-0.z-\\[60\\]";

async function unlockGate(page: Page) {
  const res = await page.request.post("/api/unlock", { data: { code: GATE_CODE } });
  expect(res.ok(), "Gate /api/unlock sollte 200 liefern").toBeTruthy();
}

const cartButton = (page: Page) => page.getByRole("button", { name: /Warenkorb|Cart/ });
async function cartCount(page: Page): Promise<number> {
  const txt = (await cartButton(page).innerText()).trim();
  const m = txt.match(/(\d+)\s*$/);
  return m ? Number(m[1]) : NaN;
}
async function drawerOpen(page: Page): Promise<boolean> {
  const cls = (await page.locator(OVERLAY).getAttribute("class")) || "";
  return /opacity-100/.test(cls);
}

test("/shop Warenkorb: hinzufügen, Menge, entfernen, Drawer, Kasse — plus geteilter Korb auf /shop/setup/alcaraz", async ({ page }) => {
  const dialogs: string[] = [];
  page.on("dialog", (d) => { dialogs.push(d.message()); d.accept().catch(() => {}); });

  await unlockGate(page);
  await page.goto("/shop");

  // 0) Start: Korb leer
  await expect(cartButton(page)).toBeVisible();
  expect(await cartCount(page), "Start: Korb leer").toBe(0);

  // 1) Produkt hinzufügen → Drawer öffnet, Zähler 1, Zeile + Preis sichtbar
  const addPureAero = page.getByRole("button", { name: /Pure Aero/ });
  await addPureAero.first().click();
  expect(await drawerOpen(page), "Drawer öffnet beim Hinzufügen").toBeTruthy();
  await expect(page.locator("aside").getByText("Pure Aero", { exact: false }).first()).toBeVisible();
  // „269 €" erscheint zweimal (Zeilenpreis UND Summe) — genau richtig bei 1 Artikel.
  await expect(page.locator("aside").getByText("269 €").first()).toBeVisible();
  expect(await cartCount(page), "Zähler nach 1× Add").toBe(1);
  await page.screenshot({ path: `${SHOTS}/shop-01-added.png` });

  // 2) Drawer schließen (✕ im Kopf) → Overlay inaktiv
  await page.locator("aside button", { hasText: "✕" }).first().click();
  await expect.poll(() => drawerOpen(page), { timeout: 5000 }).toBeFalsy();

  // 3) Menge erhöhen: nochmal dasselbe Produkt → (2×) und doppelter Preis
  await addPureAero.first().click();
  expect(await drawerOpen(page)).toBeTruthy();
  await expect(page.locator("aside").getByText(/Pure Aero \(2×\)/)).toBeVisible();
  await expect(page.locator("aside").getByText("538 €").first()).toBeVisible();
  expect(await cartCount(page), "Zähler nach 2× Add").toBe(2);

  // 4) Entfernen (✕ an der Zeile) → leer, Zähler 0
  await page.locator("aside button.text-neutral-400").first().click();
  await expect(page.locator("aside").getByText(/Dein Warenkorb ist leer|Your cart is empty/)).toBeVisible();
  expect(await cartCount(page), "Zähler nach Entfernen").toBe(0);

  // 5) Kasse-Hinweis (Demo-Alert): erst wieder etwas hineinlegen
  await page.locator(OVERLAY).click({ position: { x: 5, y: 5 } }); // Drawer schließen (Overlay-Klick)
  await expect.poll(() => drawerOpen(page), { timeout: 5000 }).toBeFalsy();
  await addPureAero.first().click();
  await page.getByRole("button", { name: /Zur Kasse|Checkout/ }).click();
  await expect.poll(() => dialogs.length, { timeout: 5000 }).toBeGreaterThan(0);
  expect(dialogs.join(" "), "Kasse ist ein Demo-Hinweis").toMatch(/Checkout-Demo|Checkout demo/);

  // 6) GETEILTER KORB: über den Link (Client-Navigation) zur Alcaraz-Seite
  await page.locator(OVERLAY).click({ position: { x: 5, y: 5 } });
  await expect.poll(() => drawerOpen(page), { timeout: 5000 }).toBeFalsy();
  await page.getByRole("link", { name: /Alcaraz/ }).first().click();
  await expect(page).toHaveURL(/\/shop\/setup\/alcaraz/);
  expect(await cartCount(page), "Korb bleibt beim Seitenwechsel erhalten").toBe(1);

  // Einen Alcaraz-Artikel hinzufügen → Zähler 2, beide Zeilen im selben Drawer
  await page.getByRole("button", { name: /In den Warenkorb|Add to cart/ }).first().click();
  expect(await cartCount(page), "geteilter Korb nimmt Alcaraz-Artikel dazu").toBe(2);
  await expect(page.locator("aside").getByText("Pure Aero", { exact: false }).first()).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/shop-02-shared-cart.png` });
});
