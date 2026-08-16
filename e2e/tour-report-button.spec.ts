import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * E2E-BELEG: Melde-Knopf im Turnierdetail. Bei Status 'planned' steht direkt unter dem Titel
 * ein prominenter „Melden"-Knopf; EIN Klick setzt den Entry-Status auf 'entered' (statt den
 * Editor zu öffnen), und der Knopf wird grün „Gemeldet". Snapshot/Restore über REST (CLAUDE.md):
 * die Planzeile wird auf 'planned' gesetzt, danach exakt zurückgestellt; das automatisch
 * geschriebene Event wird entfernt.
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
type PlanRow = { id: string; status: string; alternate_position: number | null; fee_paid: boolean };

test("/tour Melde-Knopf: ein Klick setzt entered, Knopf wird gruen Gemeldet", async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, "E2E creds fehlen");
  test.skip(!SUPA_URL || !SUPA_KEY, "Supabase-Env fehlt");
  await page.route(/tpembars\.com/, (r) => r.abort());

  await login(page);
  const { token, uid } = await readAuth(page);
  const base = { apikey: SUPA_KEY, Authorization: `Bearer ${token}`, "Accept-Profile": "web", "Content-Profile": "web" };
  const jh = { ...base, "Content-Type": "application/json" };
  const j = async (path: string) => await (await fetch(`${SUPA_URL}/rest/v1/${path}`, { headers: base })).json();

  // Como-Challenger als stabiles Ziel (wie im Entry-Status-Beleg).
  const como = ((await j(`tour_tournaments?select=id&city=ilike.*como*&series=eq.challenger&valid_to=is.null&order=tournament_monday.asc&limit=1`)) as { id: string }[])[0]?.id ?? null;
  expect(como, "ein Como-Challenger im Kalender").toBeTruthy();
  const seasonIds = new Set(((await j(`tour_season_plan?select=tournament_id`)) as { tournament_id: string }[]).map((x) => x.tournament_id));
  const seeded = !seasonIds.has(como as string);
  if (seeded) await fetch(`${SUPA_URL}/rest/v1/tour_season_plan`, { method: "POST", headers: { ...jh, Prefer: "return=minimal" }, body: JSON.stringify({ user_id: uid, tournament_id: como }) });

  const plan = ((await j(`tour_season_plan?select=id,status,alternate_position,fee_paid&tournament_id=eq.${como}`)) as PlanRow[])[0];
  expect(plan, "Planzeile vorhanden").toBeTruthy();
  const planId = plan.id;
  const snap = plan;
  const keepEvents = ((await j(`tour_entry_events?select=id&plan_id=eq.${planId}`)) as { id: string }[]).map((e) => e.id);

  // Ausgangslage 'planned' erzwingen, damit der Melde-Knopf erscheint.
  await fetch(`${SUPA_URL}/rest/v1/tour_season_plan?id=eq.${planId}`, { method: "PATCH", headers: { ...jh, Prefer: "return=minimal" }, body: JSON.stringify({ status: "planned", alternate_position: null }) });

  try {
    await page.goto("/tour");
    const catalog = page.locator("aside").first();
    const detail = page.locator("aside").last();

    await catalog.getByRole("button", { name: /Como/i }).first().click();
    // Der prominente Melde-Knopf steht bereit.
    const meld = detail.getByRole("button", { name: /^Melden$|^Enter$/ });
    await expect(meld, "Melde-Knopf sichtbar (Status planned)").toBeVisible({ timeout: 20_000 });

    await meld.click();

    // Beleg DB: Status ist jetzt 'entered'.
    await expect.poll(async () => ((await j(`tour_season_plan?select=status&id=eq.${planId}`)) as { status: string }[])[0]?.status, { timeout: 10_000 }).toBe("entered");

    // Beleg UI: grüner „Gemeldet"/„Entered"-Knopf.
    await expect(detail.getByRole("button", { name: /Gemeldet|Entered/ }).first(), "grüner Gemeldet-Knopf").toBeVisible({ timeout: 10_000 });

    console.log("[MELDEN] Klick -> status entered ok, Knopf gruen Gemeldet ok");
  } finally {
    const notIn = keepEvents.length ? `&id=not.in.(${keepEvents.join(",")})` : "";
    await fetch(`${SUPA_URL}/rest/v1/tour_entry_events?plan_id=eq.${planId}${notIn}`, { method: "DELETE", headers: { ...base, Prefer: "return=minimal" } });
    if (seeded) await fetch(`${SUPA_URL}/rest/v1/tour_season_plan?tournament_id=eq.${como}`, { method: "DELETE", headers: { ...base, Prefer: "return=minimal" } });
    else await fetch(`${SUPA_URL}/rest/v1/tour_season_plan?id=eq.${planId}`, { method: "PATCH", headers: { ...jh, Prefer: "return=minimal" }, body: JSON.stringify({ status: snap.status, alternate_position: snap.alternate_position, fee_paid: snap.fee_paid }) });
  }
});
