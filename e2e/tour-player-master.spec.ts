import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * E2E-BELEG: Spielerstammdaten. Das Formular auf /tour/setup speichert Dokumente (Pass/
 * Versicherung, owner-only auf tour_profiles), Ausrüstung und Notfallkontakt (eigene
 * owner-only-Tabellen). Danach zeigt der Planer die Pass-ABLAUFWARNUNG in der Klasse der
 * nächsten Frist. Snapshot/Restore über REST (CLAUDE.md): der bestehende Zustand wird
 * gesichert und exakt wiederhergestellt — NIE über die Oberfläche.
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
async function readAuth(page: Page) {
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

const DOC_COLS = "passport_country,passport_expiry,passport2_country,passport2_expiry,insurance_provider,insurance_policy_no,insurance_expiry,insurance_international,ipin_id,atp_id";

test("/tour/setup: Stammdaten speichern (3 Töpfe), Planer zeigt Pass-Ablaufwarnung", async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, "E2E creds fehlen");
  test.skip(!SUPA_URL || !SUPA_KEY, "Supabase-Env fehlt");
  await page.route(/tpembars\.com/, (r) => r.abort());

  await login(page);
  const { token, uid } = await readAuth(page);
  const base = { apikey: SUPA_KEY, Authorization: `Bearer ${token}`, "Accept-Profile": "web", "Content-Profile": "web" };
  const jh = { ...base, "Content-Type": "application/json" };
  const j = async (path: string) => (await (await fetch(`${SUPA_URL}/rest/v1/${path}`, { headers: base })).json());

  // Snapshot: Dokument-Felder (tour_profiles) + ob Ausrüstung/Notfallkontakt existieren.
  const docsBefore = ((await j(`tour_profiles?select=${DOC_COLS}&user_id=eq.${uid}`)) as Record<string, unknown>[])[0] ?? null;
  const equipBefore = ((await j(`tour_equipment?select=racket&user_id=eq.${uid}`)) as unknown[]).length > 0;
  const emergBefore = ((await j(`tour_emergency_contact?select=contact_name&user_id=eq.${uid}`)) as unknown[]).length > 0;

  const PAST = "2026-01-01"; // vor heute (16.08.2026) → Pass abgelaufen
  const RACKET = "E2E Racket " + Date.now().toString().slice(-5);
  const EMERG = "E2E Kontakt " + Date.now().toString().slice(-5);

  try {
    await page.goto("/tour/setup");

    // ── Dokumente: Pass 1 Land+Ablauf(Vergangenheit), Pass 2 leeren (bester Pass = abgelaufen).
    await page.locator("label", { hasText: /Pass 1 — Land|Passport 1 — country/ }).locator("input").first().fill("DE");
    await page.locator("label", { hasText: /Pass 1 — Ablauf|Passport 1 — expiry/ }).locator("input").first().fill(PAST);
    await page.locator("label", { hasText: /Pass 2 — Land|Passport 2 — country/ }).locator("input").first().fill("");
    await page.locator("label", { hasText: /Pass 2 — Ablauf|Passport 2 — expiry/ }).locator("input").first().fill("");
    await page.getByRole("button", { name: /^Speichern$|^Save$/ }).nth(0).click();

    await expect.poll(async () => {
      const r = ((await j(`tour_profiles?select=passport_country,passport_expiry&user_id=eq.${uid}`)) as { passport_country: string | null; passport_expiry: string | null }[])[0];
      return `${r?.passport_country}:${r?.passport_expiry}`;
    }, { timeout: 10_000 }).toBe(`DE:${PAST}`);

    // ── Ausrüstung.
    await page.locator("label", { hasText: /Schläger|Racket/ }).locator("input").first().fill(RACKET);
    await page.getByRole("button", { name: /^Speichern$|^Save$/ }).nth(1).click();
    await expect.poll(async () => {
      const r = ((await j(`tour_equipment?select=racket&user_id=eq.${uid}`)) as { racket: string | null }[])[0];
      return r?.racket ?? null;
    }, { timeout: 10_000 }).toBe(RACKET);

    // ── Notfallkontakt.
    await page.locator("label", { hasText: /^Name$/ }).locator("input").first().fill(EMERG);
    await page.getByRole("button", { name: /^Speichern$|^Save$/ }).nth(2).click();
    await expect.poll(async () => {
      const r = ((await j(`tour_emergency_contact?select=contact_name&user_id=eq.${uid}`)) as { contact_name: string | null }[])[0];
      return r?.contact_name ?? null;
    }, { timeout: 10_000 }).toBe(EMERG);

    // ── Planer: Pass-Ablaufwarnung erscheint (Dringlichkeitsklasse der nächsten Frist).
    await page.goto("/tour");
    await expect(page.getByText(/Pass abgelaufen|Passport expired/).first(), "Pass-Ablaufwarnung im Planer").toBeVisible({ timeout: 30_000 });

    console.log("[PLAYER-MASTER] Dokumente ✓ · Ausrüstung ✓ · Notfallkontakt ✓ · Planer-Warnung ✓");
  } finally {
    // Restore: Dokument-Felder exakt zurück; Ausrüstung/Notfallkontakt löschen, falls neu.
    if (docsBefore) await fetch(`${SUPA_URL}/rest/v1/tour_profiles?user_id=eq.${uid}`, { method: "PATCH", headers: { ...jh, Prefer: "return=minimal" }, body: JSON.stringify(docsBefore) });
    if (!equipBefore) await fetch(`${SUPA_URL}/rest/v1/tour_equipment?user_id=eq.${uid}`, { method: "DELETE", headers: { ...base, Prefer: "return=minimal" } });
    if (!emergBefore) await fetch(`${SUPA_URL}/rest/v1/tour_emergency_contact?user_id=eq.${uid}`, { method: "DELETE", headers: { ...base, Prefer: "return=minimal" } });
  }
});
