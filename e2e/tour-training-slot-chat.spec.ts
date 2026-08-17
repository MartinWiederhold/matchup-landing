import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * E2E-BELEG: Trainingsslot-Chat (may_match Zweig 4). Zwei Konten, zwei Browser-Kontexte.
 * A bietet einen Slot an, B (Wegwerf-Konto) meldet sich, A sagt zu — danach erscheint bei
 * BEIDEN der Chat-Knopf, der Chat öffnet sich und eine Nachricht kommt bei B an. Bei 'pending'
 * darf KEIN Knopf da sein (der Policy-Beweis deckt die DB-Seite ab; hier zählt die Oberfläche).
 *
 * Snapshot/Restore über REST: A's Slot (+ Antworten per Cascade) wird entfernt, A's Saison-Seed
 * zurückgenommen; B wird komplett abgeräumt — admin_delete_user löscht Match, Nachrichten und
 * Profil (der Match ist der leicht vergessene Teil), danach der Auth-User via GoTrue-Admin.
 * Schreiben passiert bewusst über die Oberfläche NUR dort, wo der Test genau das beweisen soll
 * (anbieten/melden/zusagen/chatten); alles Aufräumen läuft über REST mit IDs.
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
const SERVICE_KEY = envVal("SUPABASE_SERVICE_ROLE_KEY");

// Service-Role-Header (umgeht RLS) — nur serverseitig im Test, nie im Client.
const svc = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Accept-Profile": "web", "Content-Profile": "web" };
const svcJson = { ...svc, "Content-Type": "application/json" };
const adminAuth = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" };
const rest = (p: string) => `${SUPA_URL}/rest/v1/${p}`;
async function svcGet<T>(p: string): Promise<T> { return (await fetch(rest(p), { headers: svc })).json() as Promise<T>; }

async function login(page: Page, email: string, password: string) {
  await page.request.post("/api/unlock", { data: { code: GATE_CODE } });
  await page.goto("/app");
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.getByRole("button", { name: /^EINLOGGEN$|^LOG IN$/ }).click();
  await expect(page.locator('input[type="email"]')).toHaveCount(0, { timeout: 45_000 });
}
async function uidOf(page: Page): Promise<string> {
  const a = await page.evaluate(() => {
    for (const k of Object.keys(localStorage)) {
      if (/^sb-.*-auth-token$/.test(k)) {
        let raw = localStorage.getItem(k) as string;
        if (raw.startsWith("base64-")) raw = atob(raw.slice(7));
        try { const j = JSON.parse(raw); return (j.user?.id ?? j.currentSession?.user?.id) as string; } catch { /* weiter */ }
      }
    }
    return null;
  });
  expect(a, "Session lesbar").toBeTruthy();
  return a as string;
}

// „Vor Ort"-Reiter eines Turniers öffnen (nach reload / Erst-Öffnen).
async function openOnsite(page: Page, city: string) {
  await page.goto("/tour");
  const catalog = page.locator("aside").first();
  const detail = page.locator("aside").last();
  await catalog.getByRole("button", { name: new RegExp(city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") }).first().click();
  await detail.getByRole("button", { name: /^Vor Ort$|^On site$/ }).click();
  await expect(detail.getByText(/Slots vor Ort|Slots on site/).first()).toBeVisible({ timeout: 20_000 });
  return detail;
}

test("/tour Slot-Chat: Zusage öffnet den Chat bei beiden; pending zeigt keinen Knopf", async ({ page, browser }) => {
  test.skip(!EMAIL || !PASSWORD, "E2E creds fehlen");
  test.skip(!SUPA_URL || !SUPA_KEY || !SERVICE_KEY, "Supabase-Env fehlt");
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1600, height: 1200 });
  await page.route(/tpembars\.com/, (r) => r.abort());

  // ── Konto A (Slot-Eigentümer) ────────────────────────────────────────────────
  await login(page, EMAIL, PASSWORD);
  const uidA = await uidOf(page);

  // Ein Turnier, dessen Woche noch läuft/kommt (damit die Slot-Auswahl Tage zeigt).
  const today = new Date().toISOString().slice(0, 10);
  const tt = (await svcGet<{ id: string; city: string }[]>(`tour_tournaments?select=id,city&valid_to=is.null&tournament_monday=gte.${today}&order=tournament_monday.asc&limit=1`))[0];
  expect(tt, "ein kommendes Turnier").toBeTruthy();
  const tid = tt.id, city = tt.city;

  // ── Wegwerf-Konto B (Melder) anlegen: Auth-User + Profil ─────────────────────
  const bEmail = `e2e-slotchat-${Date.now()}@example.com`;
  const bPass = `E2e-slot-${Date.now()}!Zq`;
  let bUid = "";
  const inSeasonA = (await svcGet<unknown[]>(`tour_season_plan?select=tournament_id&user_id=eq.${uidA}&tournament_id=eq.${tid}`)).length > 0;
  // Saubere Ausgangslage: etwaige A-Slots für dieses Turnier (Test-Artefakte früherer Läufe)
  // vorab entfernen — sonst schaltet der Chip-Klick einen bestehenden Slot AUS statt neu anzulegen.
  await fetch(rest(`tour_training_slot?user_id=eq.${uidA}&tournament_id=eq.${tid}`), { method: "DELETE", headers: { ...svc, Prefer: "return=minimal" } });

  let contextB: import("@playwright/test").BrowserContext | null = null;
  try {
    const created = await (await fetch(`${SUPA_URL}/auth/v1/admin/users`, { method: "POST", headers: adminAuth, body: JSON.stringify({ email: bEmail, password: bPass, email_confirm: true }) })).json();
    bUid = created.id as string;
    expect(bUid, "B-Auth-User angelegt").toBeTruthy();
    await fetch(rest("profiles"), { method: "POST", headers: { ...svcJson, Prefer: "return=minimal" }, body: JSON.stringify({
      id: bUid, display_name: "E2E Melder", first_name: "E2E", age: 25, gender: "male",
      city: "Teststadt", country: "DE", country_name: "E2E-Land", sports: ["tennis"], skill_level: "intermediate",
      goals: ["training"], profile_image: "https://example.com/e2e.png",
    }) });

    // Beide brauchen das Turnier in der Saison, um es im Katalog zu öffnen.
    if (!inSeasonA) await fetch(rest("tour_season_plan"), { method: "POST", headers: { ...svcJson, Prefer: "return=minimal" }, body: JSON.stringify({ user_id: uidA, tournament_id: tid }) });
    await fetch(rest("tour_season_plan"), { method: "POST", headers: { ...svcJson, Prefer: "return=minimal" }, body: JSON.stringify({ user_id: bUid, tournament_id: tid }) });

    // ── A bietet einen Slot an (Nachmittags-Block der ersten Zukunfts-Zeile) ────
    let detailA = await openOnsite(page, city);
    await detailA.getByRole("button", { name: /nachm\. 14–17|afternoon 14–17/ }).first().click();
    const [slot] = await (async () => {
      let rows: { id: string; slot_date: string }[] = [];
      await expect.poll(async () => {
        rows = await svcGet<{ id: string; slot_date: string; time_block: string }[]>(`tour_training_slot?select=id,slot_date,time_block&user_id=eq.${uidA}&tournament_id=eq.${tid}&time_block=eq.afternoon`);
        return rows.length;
      }, { timeout: 10_000 }).toBe(1);
      return rows;
    })();
    console.log("[SLOT-CHAT] A hat Slot angeboten:", slot.slot_date, "afternoon");

    // ── B meldet sich über die Oberfläche ──────────────────────────────────────
    contextB = await browser.newContext({ viewport: { width: 1600, height: 1200 } });
    const pageB = await contextB.newPage();
    await pageB.route(/tpembars\.com/, (r) => r.abort());
    await login(pageB, bEmail, bPass);
    let detailB = await openOnsite(pageB, city);
    await detailB.getByRole("button", { name: /^Melden$|^Respond$/ }).first().click();

    // DB-Beleg: Antwort existiert, Status pending.
    await expect.poll(async () => (await svcGet<{ status: string }[]>(`tour_training_slot_response?select=status&slot_id=eq.${slot.id}&responder_id=eq.${bUid}`))[0]?.status, { timeout: 10_000 }).toBe("pending");

    // pending → B sieht „Angefragt", aber KEINEN Chat-Knopf.
    await expect(detailB.getByText(/^Angefragt$|^Requested$/).first()).toBeVisible();
    await expect(detailB.getByRole("button", { name: /^Chat$/ }), "pending: kein Chat-Knopf bei B").toHaveCount(0);
    console.log("[SLOT-CHAT] B gemeldet (pending) — kein Chat-Knopf ✓");

    // ── A lädt neu, sieht die Anfrage (pending, kein Knopf), sagt zu ────────────
    detailA = await openOnsite(page, city);
    await expect(detailA.getByRole("button", { name: /^Zusagen$|^Accept$/ }).first(), "A sieht Anfrage").toBeVisible({ timeout: 15_000 });
    await expect(detailA.getByRole("button", { name: /^Chat$/ }), "pending: kein Chat-Knopf bei A").toHaveCount(0);
    await detailA.getByRole("button", { name: /^Zusagen$|^Accept$/ }).first().click();

    // accepted → A sieht jetzt den Chat-Knopf.
    await expect(detailA.getByRole("button", { name: /^Chat$/ }).first(), "accepted: Chat-Knopf bei A").toBeVisible({ timeout: 15_000 });
    await expect.poll(async () => (await svcGet<{ status: string }[]>(`tour_training_slot_response?select=status&slot_id=eq.${slot.id}&responder_id=eq.${bUid}`))[0]?.status, { timeout: 10_000 }).toBe("accepted");
    console.log("[SLOT-CHAT] A hat zugesagt — Chat-Knopf bei A ✓");

    // ── B lädt neu, sieht „Zugesagt" + Chat-Knopf ──────────────────────────────
    detailB = await openOnsite(pageB, city);
    await expect(detailB.getByText(/^Zugesagt$|^Accepted$/).first()).toBeVisible({ timeout: 15_000 });
    await expect(detailB.getByRole("button", { name: /^Chat$/ }).first(), "accepted: Chat-Knopf bei B").toBeVisible();
    console.log("[SLOT-CHAT] Chat-Knopf bei BEIDEN ✓");

    // ── A öffnet den Chat und schickt eine Nachricht ───────────────────────────
    const msg = `E2E Slot-Chat ${Date.now()}`;
    await detailA.getByRole("button", { name: /^Chat$/ }).first().click();
    const inputA = page.getByPlaceholder(/^Nachricht …$|^Message …$/);
    await expect(inputA).toBeVisible({ timeout: 15_000 });
    await inputA.fill(msg);
    await page.getByRole("button", { name: /^Senden$|^Send$/ }).click();
    await expect(page.getByText(msg).first(), "Nachricht steht in A's Chat").toBeVisible({ timeout: 15_000 });

    // ── B öffnet den Chat — die Nachricht kommt an ─────────────────────────────
    await detailB.getByRole("button", { name: /^Chat$/ }).first().click();
    await expect(pageB.getByText(msg).first(), "Nachricht kommt bei B an").toBeVisible({ timeout: 20_000 });
    console.log("[SLOT-CHAT] Nachricht bei B angekommen ✓");
  } finally {
    // Jeder Schritt einzeln abgesichert, damit ein Fehler die B-Aufräumung nicht überspringt.
    const step = async (fn: () => Promise<unknown>) => { try { await fn(); } catch { /* Aufräumen best effort */ } };
    // A: angelegte Slots weg (Antworten cascaden über den Slot-FK).
    await step(() => fetch(rest(`tour_training_slot?user_id=eq.${uidA}&tournament_id=eq.${tid}`), { method: "DELETE", headers: { ...svc, Prefer: "return=minimal" } }));
    if (!inSeasonA) await step(() => fetch(rest(`tour_season_plan?user_id=eq.${uidA}&tournament_id=eq.${tid}`), { method: "DELETE", headers: { ...svc, Prefer: "return=minimal" } }));
    // B komplett: Match + Nachrichten + Profil (+ Saison-Seed per Cascade), dann Auth-User.
    if (bUid) {
      await step(() => fetch(rest("rpc/admin_delete_user"), { method: "POST", headers: svcJson, body: JSON.stringify({ target: bUid }) }));
      await step(() => fetch(`${SUPA_URL}/auth/v1/admin/users/${bUid}`, { method: "DELETE", headers: adminAuth }));
    }
    await step(() => contextB?.close() ?? Promise.resolve());
  }
});
