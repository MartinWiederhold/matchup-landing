import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * E2E-BELEG: Wildcard-Verwaltung. Je Turnier ein Turnierdirektor-Kontakt + append-only
 * Verlauf. Der Test klappt die Karte eines Saison-Turniers auf, speichert einen Kontakt
 * (Direktorname), hängt ein Verlaufs-Ereignis an, löscht es wieder — und belegt jeden
 * Schritt über REST. Snapshot/Restore über REST (CLAUDE.md): der bestehende Kontakt +
 * seine Ereignisse werden vorher gesichert und am Ende exakt wiederhergestellt (oder der
 * neu angelegte Kontakt entfernt) — NIE über die Oberfläche.
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

type Contact = { id: string; director_name: string | null; email: string | null; phone: string | null; federation: string | null; note: string | null; wildcard_type: string | null; requested_on: string | null; outcome: string | null };

test("/tour/wildcards: Kontakt speichern, Verlauf anhängen + löschen, alles persistiert", async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, "E2E creds fehlen");
  test.skip(!SUPA_URL || !SUPA_KEY, "Supabase-Env fehlt");
  await page.route(/tpembars\.com/, (r) => r.abort());

  await login(page);
  const { token } = await readAuth(page);
  const base = { apikey: SUPA_KEY, Authorization: `Bearer ${token}`, "Accept-Profile": "web", "Content-Profile": "web" };
  const jh = { ...base, "Content-Type": "application/json" };
  const j = async (path: string) => (await (await fetch(`${SUPA_URL}/rest/v1/${path}`, { headers: base })).json());

  // Ein Saison-Turnier (uuid) + seine Stadt (zum Auffinden der Karte in der UI).
  const plan = await j(`tour_season_plan?select=tournament_id&limit=1`) as { tournament_id: string }[];
  expect(plan[0], "ein Saison-Turnier").toBeTruthy();
  const A = plan[0].tournament_id;
  const tt = await j(`tour_tournaments?select=city,country,name&id=eq.${A}`) as { city: string | null; country: string | null; name: string | null }[];
  const city = tt[0]?.city || tt[0]?.name || "";
  expect(city, "Turnier hat einen Namen/Stadt").toBeTruthy();
  const cityRe = new RegExp(city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  // Snapshot: bestehender Kontakt (voller Zeilenzustand) + Ereignis-IDs.
  const beforeContact = ((await j(`tour_wildcard_contact?select=id,director_name,email,phone,federation,note,wildcard_type,requested_on,outcome&tournament_id=eq.${A}`)) as Contact[])[0] ?? null;
  const beforeEventIds = beforeContact ? ((await j(`tour_wildcard_events?select=id&contact_id=eq.${beforeContact.id}`)) as { id: string }[]).map((x) => x.id) : [];

  const stamp = Date.now().toString().slice(-6);
  const DIRECTOR = `E2E Direktor ${stamp}`;
  const DETAIL = `E2E Anruf ${stamp}`;

  try {
    await page.goto("/tour/wildcards");

    // Karte des Turniers A aufklappen (Kopf-Knopf trägt die Stadt).
    await page.getByRole("button", { name: cityRe }).first().click();

    // Kontakt speichern: Direktorname setzen.
    const dirInput = page.locator("label", { hasText: /Turnierdirektor|Tournament director/ }).locator("input").first();
    await dirInput.fill(DIRECTOR);
    await page.getByRole("button", { name: /^Kontakt speichern$|^Save contact$/ }).click();

    // Beleg DB: Kontakt für A trägt den Direktornamen.
    let contactId = "";
    await expect.poll(async () => {
      const rows = await j(`tour_wildcard_contact?select=id,director_name&tournament_id=eq.${A}`) as { id: string; director_name: string | null }[];
      if (rows[0]) contactId = rows[0].id;
      return rows[0]?.director_name ?? null;
    }, { timeout: 10_000 }).toBe(DIRECTOR);

    // Verlauf anhängen: Detail füllen, Ereignis hinzufügen (Art-Default = Erstkontakt).
    await page.locator("label", { hasText: /^Detail/ }).locator("input").first().fill(DETAIL);
    await page.getByRole("button", { name: /^Hinzufügen$|^Add$/ }).click();

    // Beleg DB: genau ein NEUES Ereignis (contacted) mit dem Detail.
    let newEventId = "";
    await expect.poll(async () => {
      const rows = await j(`tour_wildcard_events?select=id,kind,detail&contact_id=eq.${contactId}`) as { id: string; kind: string; detail: string | null }[];
      const fresh = rows.filter((r) => !beforeEventIds.includes(r.id));
      if (fresh[0]) newEventId = fresh[0].id;
      return fresh.map((r) => `${r.kind}:${r.detail}`);
    }, { timeout: 10_000 }).toEqual([`contacted:${DETAIL}`]);

    // Beleg UI: das Ereignis steht im Verlauf.
    await expect(page.getByText(new RegExp(DETAIL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))).first(), "Ereignis im Verlauf sichtbar").toBeVisible({ timeout: 10_000 });

    // Löschen: append-only → ✕ entfernt das Ereignis.
    await page.getByRole("button", { name: /Ereignis löschen|Delete event/ }).first().click();
    await expect.poll(async () => {
      const rows = await j(`tour_wildcard_events?select=id&id=eq.${newEventId}`) as { id: string }[];
      return rows.length;
    }, { timeout: 10_000 }).toBe(0);

    console.log("[WILDCARDS] Kontakt gespeichert ✓ · Verlauf angehängt + persistiert ✓ · gelöscht ✓");
  } finally {
    // Restore: bestehenden Kontakt exakt zurücksetzen bzw. den neu angelegten entfernen.
    if (beforeContact) {
      const { id, ...fields } = beforeContact;
      await fetch(`${SUPA_URL}/rest/v1/tour_wildcard_contact?id=eq.${id}`, { method: "PATCH", headers: { ...jh, Prefer: "return=minimal" }, body: JSON.stringify(fields) });
      const notIn = beforeEventIds.length ? `&id=not.in.(${beforeEventIds.join(",")})` : "";
      await fetch(`${SUPA_URL}/rest/v1/tour_wildcard_events?contact_id=eq.${id}${notIn}`, { method: "DELETE", headers: { ...base, Prefer: "return=minimal" } });
    } else {
      // Kontakt neu → löschen (cascade entfernt die Ereignisse).
      await fetch(`${SUPA_URL}/rest/v1/tour_wildcard_contact?tournament_id=eq.${A}`, { method: "DELETE", headers: { ...base, Prefer: "return=minimal" } });
    }
  }
});
