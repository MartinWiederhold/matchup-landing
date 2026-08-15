import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * E2E-BELEG: Entry-Status je Turnier. Der Editor im Detail schreibt bei JEDER Speicherung
 * automatisch ein Event (Verlauf ohne Zutun). Zwei Beobachtungen → Trend erscheint; bei
 * nur EINER → KEIN Marker.
 *
 * Snapshot/Restore über die Supabase-REST-API mit dem JWT DES TEST-NUTZERS (RLS, Anon-Key) —
 * NIE über die Oberfläche (CLAUDE.md). Der Test merkt sich den Status/Position der Planzeile
 * und die vorhandenen Event-IDs und stellt exakt diesen Stand wieder her.
 */
const EMAIL = process.env.E2E_EMAIL || "";
const PASSWORD = process.env.E2E_PASSWORD || "";
const GATE_CODE = process.env.E2E_GATE_CODE || "50805080";

function envVal(name: string): string {
  if (process.env[name]) return process.env[name] as string;
  try {
    const m = readFileSync(".env.local", "utf8").match(new RegExp("^" + name + "=(.*)$", "m"));
    return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
  } catch { return ""; }
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
  expect(a?.token && a?.uid, "Supabase-Session lesbar").toBeTruthy();
  return a as { token: string; uid: string };
}
type PlanRow = { id: string; status: string; alternate_position: number | null; fee_paid: boolean };
function rest(token: string) {
  const base = { apikey: SUPA_KEY, Authorization: `Bearer ${token}`, "Accept-Profile": "web", "Content-Profile": "web" };
  return {
    async seasonIds(): Promise<Set<string>> {
      const r = await fetch(`${SUPA_URL}/rest/v1/tour_season_plan?select=tournament_id`, { headers: base });
      return new Set(((await r.json()) as { tournament_id: string }[]).map((x) => x.tournament_id));
    },
    async comoChallenger(): Promise<string | null> {
      const r = await fetch(`${SUPA_URL}/rest/v1/tour_tournaments?select=id&city=ilike.*como*&series=eq.challenger&valid_to=is.null&order=tournament_monday.asc&limit=1`, { headers: base });
      return ((await r.json()) as { id: string }[])[0]?.id ?? null;
    },
    async insertSeason(uid: string, id: string) {
      const r = await fetch(`${SUPA_URL}/rest/v1/tour_season_plan`, { method: "POST", headers: { ...base, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ user_id: uid, tournament_id: id }) });
      expect(r.ok || r.status === 409, "Saison-Seed (REST)").toBeTruthy();
    },
    async planRow(tournamentId: string): Promise<PlanRow | null> {
      const r = await fetch(`${SUPA_URL}/rest/v1/tour_season_plan?select=id,status,alternate_position,fee_paid&tournament_id=eq.${tournamentId}`, { headers: base });
      return ((await r.json()) as PlanRow[])[0] ?? null;
    },
    async events(planId: string): Promise<{ id: string; status: string; alternate_position: number | null }[]> {
      const r = await fetch(`${SUPA_URL}/rest/v1/tour_entry_events?select=id,status,alternate_position&plan_id=eq.${planId}&order=created_at.asc`, { headers: base });
      return (await r.json()) as { id: string; status: string; alternate_position: number | null }[];
    },
    async deleteEventsExcept(planId: string, keepIds: string[]) {
      const notIn = keepIds.length ? `&id=not.in.(${keepIds.join(",")})` : "";
      await fetch(`${SUPA_URL}/rest/v1/tour_entry_events?plan_id=eq.${planId}${notIn}`, { method: "DELETE", headers: { ...base, Prefer: "return=minimal" } });
    },
    async restorePlan(planId: string, snap: PlanRow) {
      await fetch(`${SUPA_URL}/rest/v1/tour_season_plan?id=eq.${planId}`, { method: "PATCH", headers: { ...base, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ status: snap.status, alternate_position: snap.alternate_position, fee_paid: snap.fee_paid }) });
    },
    async deleteSeason(ids: string[]) {
      if (!ids.length) return;
      await fetch(`${SUPA_URL}/rest/v1/tour_season_plan?tournament_id=in.(${ids.join(",")})`, { method: "DELETE", headers: { ...base, Prefer: "return=minimal" } });
    },
  };
}

test("/tour Entry-Status: Editor schreibt Event automatisch; zweite Beobachtung → Trend; eine → kein Marker", async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, "E2E creds fehlen");
  test.skip(!SUPA_URL || !SUPA_KEY, "Supabase-Env fehlt");
  await page.route(/tpembars\.com/, (r) => r.abort());

  await login(page);
  const { token, uid } = await readAuth(page);
  const db = rest(token);

  const B0 = await db.seasonIds();
  const como = await db.comoChallenger();
  expect(como, "ein Como-Challenger im Kalender").toBeTruthy();
  const seeded = !B0.has(como as string);
  if (seeded) await db.insertSeason(uid, como as string);

  const plan = await db.planRow(como as string);
  expect(plan, "Planzeile vorhanden").toBeTruthy();
  const planId = (plan as PlanRow).id;
  const snap = plan as PlanRow;                       // Ausgangsstand für den Restore
  const keepEvents = (await db.events(planId)).map((e) => e.id); // vorhandene Events NICHT anfassen

  try {
    await page.goto("/tour");
    const catalog = page.locator("aside").first();
    const detail = page.locator("aside").last();

    // Como aus der Saisonliste öffnen → Detail rechts.
    await catalog.getByRole("button", { name: /Como/i }).first().click();
    await expect(detail.getByRole("button", { name: /^Overview$|^Übersicht$/ })).toBeVisible({ timeout: 20_000 });

    // ── 1. Beobachtung: Alternate #12 ─────────────────────────────────────────
    await detail.getByRole("button", { name: /^Planned$|^Geplant$/ }).click();     // Status-Pill → Editor auf
    await detail.getByRole("button", { name: /^Alternate$/ }).click();             // Status Alternate
    await detail.locator('input[type="number"]').fill("12");
    await detail.getByRole("button", { name: /^Set$|^Eintragen$/ }).click();

    // Beleg DB: genau EIN neues Event, Position 12.
    await expect.poll(async () => (await db.events(planId)).filter((e) => !keepEvents.includes(e.id)).length, { timeout: 10_000 }).toBe(1);
    const ev1 = (await db.events(planId)).filter((e) => !keepEvents.includes(e.id));
    expect(ev1[0].status).toBe("alternate");
    expect(ev1[0].alternate_position).toBe(12);

    // Beleg UI: Pill „Alternate #12" in der Saisonliste, und bei EINER Beobachtung KEIN Trend-Marker.
    await expect(catalog.getByText(/Alternate #12/).first(), "Pill Alternate #12").toBeVisible({ timeout: 10_000 });
    await expect(catalog.getByTitle(/moved up|moved down|unchanged|hochgerückt|abgerutscht|unverändert/), "kein Marker bei einer Beobachtung").toHaveCount(0);

    // ── 2. Beobachtung: Alternate #7 (hochgerückt) ────────────────────────────
    await detail.getByRole("button", { name: /Alternate #12/ }).click();           // Pill → Editor auf
    await detail.locator('input[type="number"]').fill("7");
    await detail.getByRole("button", { name: /^Set$|^Eintragen$/ }).click();

    // Beleg DB: jetzt ZWEI neue Events.
    await expect.poll(async () => (await db.events(planId)).filter((e) => !keepEvents.includes(e.id)).length, { timeout: 10_000 }).toBe(2);

    // Beleg UI: Pill „Alternate #7" + Trend-Marker (hochgerückt).
    await expect(catalog.getByText(/Alternate #7/).first(), "Pill Alternate #7").toBeVisible({ timeout: 10_000 });
    await expect(catalog.getByTitle(/moved up|hochgerückt/).first(), "Trend erscheint bei zwei Beobachtungen").toBeVisible({ timeout: 10_000 });

    console.log("[ENTRY] Auto-Event ✓ · 1 Beob. = kein Marker ✓ · 2 Beob. = Trend ✓");
  } finally {
    // Restore: die vom Test angelegten Events löschen; Planzeile zurücksetzen bzw. Seed entfernen.
    await db.deleteEventsExcept(planId, keepEvents);
    if (seeded) await db.deleteSeason([como as string]);
    else await db.restorePlan(planId, snap);
    const after = await db.seasonIds();
    expect(after.size, "nach Restore exakt wieder B0").toBe(B0.size);
  }
});
