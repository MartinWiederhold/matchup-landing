import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * E2E-BELEG: Trainingsslots. Im „Vor Ort"-Reiter bietet der Spieler einen Slot an (Tag der
 * Turnierwoche + Zeitblock); der Klick persistiert in web.tour_training_slot. Die Melde-/
 * Zusage-Logik ist über den DB-Policy-Beweis abgesichert (zwei Rollen). Snapshot/Restore über
 * REST: das gewählte Zukunfts-Turnier wird ggf. in die Saison geseedet und der angelegte Slot
 * am Ende entfernt.
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

test("/tour Vor Ort: Trainingsslot anbieten persistiert", async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, "E2E creds fehlen");
  test.skip(!SUPA_URL || !SUPA_KEY, "Supabase-Env fehlt");
  await page.setViewportSize({ width: 1600, height: 1200 });
  await page.route(/tpembars\.com/, (r) => r.abort());

  await login(page);
  const { token, uid } = await readAuth(page);
  const base = { apikey: SUPA_KEY, Authorization: `Bearer ${token}`, "Accept-Profile": "web", "Content-Profile": "web" };
  const jh = { ...base, "Content-Type": "application/json" };
  const j = async (path: string) => await (await fetch(`${SUPA_URL}/rest/v1/${path}`, { headers: base })).json();

  // Ein Turnier, dessen Woche NOCH läuft/kommt (damit die Slot-Auswahl Tage zeigt).
  const today = new Date().toISOString().slice(0, 10);
  const tt = ((await j(`tour_tournaments?select=id,city&valid_to=is.null&tournament_monday=gte.${today}&order=tournament_monday.asc&limit=1`)) as { id: string; city: string }[])[0];
  expect(tt, "ein kommendes Turnier").toBeTruthy();
  const tid = tt.id, city = tt.city;

  const inSeason = ((await j(`tour_season_plan?select=tournament_id&tournament_id=eq.${tid}`)) as unknown[]).length > 0;
  if (!inSeason) await fetch(`${SUPA_URL}/rest/v1/tour_season_plan`, { method: "POST", headers: { ...jh, Prefer: "return=minimal" }, body: JSON.stringify({ user_id: uid, tournament_id: tid }) });
  const beforeSlotIds = ((await j(`tour_training_slot?select=id&user_id=eq.${uid}&tournament_id=eq.${tid}`)) as { id: string }[]).map((x) => x.id);

  try {
    await page.goto("/tour");
    const catalog = page.locator("aside").first();
    const detail = page.locator("aside").last();
    await catalog.getByRole("button", { name: new RegExp(city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") }).first().click();
    await detail.getByRole("button", { name: /^Vor Ort$|^On site$/ }).click();

    // „Deine Slots anbieten" sichtbar → einen Zeitblock der ersten Zeile anklicken.
    await expect(detail.getByText(/Deine Slots anbieten|Offer your slots/).first(), "Slot-Editor").toBeVisible({ timeout: 20_000 });
    await detail.getByRole("button", { name: /nachm\. 14–17|afternoon 14–17/ }).first().click();

    // Beleg DB: genau ein NEUER Slot mit time_block='afternoon'.
    await expect.poll(async () => {
      const rows = (await j(`tour_training_slot?select=id,time_block&user_id=eq.${uid}&tournament_id=eq.${tid}`)) as { id: string; time_block: string }[];
      return rows.filter((r) => !beforeSlotIds.includes(r.id)).map((r) => r.time_block);
    }, { timeout: 10_000 }).toEqual(["afternoon"]);

    console.log("[SLOTS] Slot angeboten → persistiert (afternoon) ✓ · Turnier:", city);
  } finally {
    const keep = beforeSlotIds.length ? `&id=not.in.(${beforeSlotIds.join(",")})` : "";
    await fetch(`${SUPA_URL}/rest/v1/tour_training_slot?user_id=eq.${uid}&tournament_id=eq.${tid}${keep}`, { method: "DELETE", headers: { ...base, Prefer: "return=minimal" } });
    if (!inSeason) await fetch(`${SUPA_URL}/rest/v1/tour_season_plan?tournament_id=eq.${tid}&user_id=eq.${uid}`, { method: "DELETE", headers: { ...base, Prefer: "return=minimal" } });
  }
});
