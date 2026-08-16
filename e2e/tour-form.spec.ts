import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * E2E-BELEG: Leistungsauswertung. web.tour_events ist im Prod-Konto leer — der Test SEEDET
 * daher synthetische Matches über REST (Snapshot/Restore, CLAUDE.md): 3 Sand-Matches (2 S,
 * 1 N → 67 %) + 4 Hart-Matches (1 S, 3 N → 25 %). Erwartet: Gesamtquote 43 % bei 7
 * entschiedenen, und die Quote nennt IMMER ihre Grundlage (n). Am Ende werden exakt die
 * angelegten Zeilen wieder entfernt — NIE über die Oberfläche.
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

// Zwei uuid-Turniere mit bekanntem Belag (aus tour_tournaments).
const CLAY = "bd415720-8e43-4eba-9e76-94117fed6a88"; // Naples, clay
const HARD = "bebf3741-5df5-4e94-b2b5-295d42d9fbcd"; // Zahra, hard

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

test("/tour/form: Siegquoten mit Grundlage (synthetisch geseedet), dann restauriert", async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, "E2E creds fehlen");
  test.skip(!SUPA_URL || !SUPA_KEY, "Supabase-Env fehlt");
  await page.route(/tpembars\.com/, (r) => r.abort());

  await login(page);
  const { token, uid } = await readAuth(page);
  const base = { apikey: SUPA_KEY, Authorization: `Bearer ${token}`, "Accept-Profile": "web", "Content-Profile": "web" };
  const jh = { ...base, "Content-Type": "application/json" };

  const today = new Date().toISOString().slice(0, 10);
  const mk = (tid: string, won: boolean) => ({ user_id: uid, kind: "match", title: "E2E Match", event_date: today, tournament_id: tid, won, round: "R16" });
  const seed = [mk(CLAY, true), mk(CLAY, true), mk(CLAY, false), mk(HARD, true), mk(HARD, false), mk(HARD, false), mk(HARD, false)];

  const res = await fetch(`${SUPA_URL}/rest/v1/tour_events`, { method: "POST", headers: { ...jh, Prefer: "return=representation" }, body: JSON.stringify(seed) });
  const created = (await res.json()) as { id: string }[];
  const ids = created.map((r) => r.id);
  expect(ids.length, "7 Matches geseedet").toBe(7);

  try {
    await page.goto("/tour/form");

    // Gesamtquote 43 % (3/7) mit Grundlage „7 entschieden/decided".
    await expect(page.getByText(/\b43\s*%/).first(), "Gesamtquote 43 %").toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/\b7\s*(entschieden|decided)\b/).first(), "Grundlage 7 entschieden").toBeVisible();

    // Sand-Zeile: 67 % (2/3), Grundlage n=3 (der Punkt: kleine Basis ist sichtbar).
    await expect(page.getByText(/Sand|Clay/).first(), "Belag-Label Sand/Clay").toBeVisible();
    await expect(page.getByText(/\b67\s*%/).first(), "Sand-Quote 67 %").toBeVisible();
    await expect(page.getByText(/\b3\s*(entschieden|decided)\b/).first(), "Grundlage 3 entschieden (kleine Basis benannt)").toBeVisible();

    // Hart-Zeile: 25 % (1/4).
    await expect(page.getByText(/Hartplatz|Hard/).first(), "Belag-Label Hartplatz/Hard").toBeVisible();
    await expect(page.getByText(/\b25\s*%/).first(), "Hart-Quote 25 %").toBeVisible();

    // Was mangels Feld nicht geht, ist benannt (Gegnerstärke, MU-039).
    await expect(page.getByText(/Gegnerstärke|opponent strength/).first(), "Gegnerstärke benannt statt geschätzt").toBeVisible();

    console.log("[FORM] Gesamt 43 % · Sand 67 % (n=3) · Hart 25 % · Grundlage sichtbar · Gegnerstärke benannt ✓");
  } finally {
    // Restore: exakt die angelegten Zeilen entfernen.
    if (ids.length) await fetch(`${SUPA_URL}/rest/v1/tour_events?id=in.(${ids.join(",")})`, { method: "DELETE", headers: { ...base, Prefer: "return=minimal" } });
  }
});
