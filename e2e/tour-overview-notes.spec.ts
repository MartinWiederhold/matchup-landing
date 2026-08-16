import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * E2E-BELEG: Übersicht-Reiter. Teil 1: „Punkte je Runde" + „Belag" sichtbar. Teil 2:
 * Fact-Sheet-Notiz erfassbar und als EIGENE Notiz gekennzeichnet (nicht wie Bestandsdaten).
 * Snapshot/Restore über REST (CLAUDE.md): das geklickte Turnier kann eine beliebige Como-
 * Edition sein → wir identifizieren die gespeicherte Notiz über die EINDEUTIGE Hotel-Marke
 * und stellen den vorherigen Stand exakt wieder her (bzw. löschen die neu angelegte Zeile).
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
async function readAuth(page: Page): Promise<{ token: string; uid: string }> {
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
type Note = { fee_amount: number | string | null; fee_currency: string | null; training_courts: string | null; conditions: string | null; official_hotel: string | null; tournament_id: string };

test("/tour Übersicht: Punkte je Runde + Belag sichtbar; Fact-Sheet-Notiz erfassbar & gekennzeichnet", async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, "E2E creds fehlen");
  test.skip(!SUPA_URL || !SUPA_KEY, "Supabase-Env fehlt");
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.route(/tpembars\.com/, (r) => r.abort());
  await login(page);
  const { token, uid } = await readAuth(page);
  const base = { apikey: SUPA_KEY, Authorization: `Bearer ${token}`, "Accept-Profile": "web", "Content-Profile": "web" };
  const jh = { ...base, "Content-Type": "application/json" };
  const j = async (path: string) => await (await fetch(`${SUPA_URL}/rest/v1/${path}`, { headers: base })).json();

  // Snapshot ALLER eigenen Notizen (für exakten Restore der geklickten Edition).
  const NOTE_COLS = "fee_amount,fee_currency,training_courts,conditions,official_hotel,tournament_id";
  const beforeAll = (await j(`tour_tournament_note?select=${NOTE_COLS}&user_id=eq.${uid}`)) as Note[];
  const HOTEL = "E2E Hotel " + Date.now().toString().slice(-6);
  let savedTid = "";

  try {
    await page.goto("/tour");
    const catalog = page.locator("aside").first();
    const detail = page.locator("aside").last();
    await catalog.getByRole("button", { name: /Como/i }).first().click();

    // Teil 1: Übersicht zeigt Punkte je Runde + Belag.
    await expect(detail.getByText(/Punkte je Runde|Points per round/).first(), "Punkte je Runde").toBeVisible({ timeout: 20_000 });
    await expect(detail.getByText(/Belag|Surface/).first(), "Belag").toBeVisible();

    // Teil 2: Notiz erfassen.
    await detail.getByRole("button", { name: /^erfassen$|^bearbeiten$|^add$|^edit$/ }).click();
    await detail.locator("label", { hasText: /^Meldegebühr$|^Entry fee$/ }).locator("input").first().fill("40");
    await detail.locator("label", { hasText: /^Währung$|^Currency$/ }).locator("input").first().fill("EUR");
    await detail.locator("label", { hasText: /Offizielles Hotel|Official hotel/ }).locator("input").first().fill(HOTEL);
    await detail.getByRole("button", { name: /^Speichern$|^Save$/ }).click();

    // Beleg DB: Notiz gespeichert (identifiziert über die eindeutige Hotel-Marke).
    await expect.poll(async () => {
      const rows = (await j(`tour_tournament_note?select=${NOTE_COLS}&official_hotel=eq.${encodeURIComponent(HOTEL)}`)) as Note[];
      if (rows[0]) savedTid = rows[0].tournament_id;
      return rows[0] ? `${Math.round(Number(rows[0].fee_amount))}|${rows[0].official_hotel}` : null;
    }, { timeout: 10_000 }).toBe(`40|${HOTEL}`);

    // Beleg UI: als EIGENE NOTIZ gekennzeichnet + Werte sichtbar.
    await expect(detail.getByText(/^Eigene Notiz$|^Own note$/).first(), "Eigene-Notiz-Merkmal").toBeVisible({ timeout: 10_000 });
    await expect(detail.getByText(new RegExp(HOTEL)).first(), "Hotel-Notiz sichtbar").toBeVisible();
    await expect(detail.getByText(/40 EUR/).first(), "Gebühr-Notiz sichtbar").toBeVisible();

    console.log("[OVERVIEW] Punkte je Runde ✓ · Belag ✓ · Notiz gespeichert + als eigene Notiz gekennzeichnet ✓");
  } finally {
    if (savedTid) {
      const prior = beforeAll.find((n) => n.tournament_id === savedTid);
      if (prior) {
        const { tournament_id, ...fields } = prior;
        await fetch(`${SUPA_URL}/rest/v1/tour_tournament_note?tournament_id=eq.${savedTid}&user_id=eq.${uid}`, { method: "PATCH", headers: { ...jh, Prefer: "return=minimal" }, body: JSON.stringify(fields) });
      } else {
        await fetch(`${SUPA_URL}/rest/v1/tour_tournament_note?tournament_id=eq.${savedTid}&user_id=eq.${uid}`, { method: "DELETE", headers: { ...base, Prefer: "return=minimal" } });
      }
    }
  }
});
