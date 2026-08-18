import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * E2E-BELEG: Turnier-Ordner (Bucket tour-documents, owner-only + signierte Links).
 * Zwei Konten. A lädt über die Oberfläche eine Datei hoch und öffnet sie über einen
 * signierten Link. B (Wegwerf-Konto, vom Test angelegt + gelöscht) sieht sie NICHT und
 * kann sie NICHT löschen — die Stelle, an der ein pfad-basierter Schutz sonst durchlässig
 * ist. Zuletzt: Zeile löschen entfernt die DATEI mit (MU-017-Lehre, belegt statt behauptet).
 *
 * Aufräumen über REST: A-Zeilen + A-DATEI im Bucket entfernt (ein Testlauf, der eine Datei
 * liegen lässt, wäre genau das Waisenproblem), Saison-Seed zurück, B komplett gelöscht.
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
const BUCKET = "tour-documents";

const svc = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Accept-Profile": "web", "Content-Profile": "web" };
const svcJson = { ...svc, "Content-Type": "application/json" };
const adminAuth = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" };
const rest = (p: string) => `${SUPA_URL}/rest/v1/${p}`;
async function svcGet<T>(p: string): Promise<T> { return (await fetch(rest(p), { headers: svc })).json() as Promise<T>; }

// ── Storage-REST-Helfer (mit beliebigem Bearer-Token) ──────────────────────────
async function stSign(token: string, path: string): Promise<{ ok: boolean; url: string | null }> {
  const r = await fetch(`${SUPA_URL}/storage/v1/object/sign/${BUCKET}/${path}`, {
    method: "POST", headers: { apikey: SUPA_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ expiresIn: 300 }),
  });
  if (!r.ok) return { ok: false, url: null };
  const j = await r.json();
  return { ok: true, url: j.signedURL ? `${SUPA_URL}/storage/v1${j.signedURL}` : null };
}
async function stList(token: string, prefix: string): Promise<{ name: string }[]> {
  const r = await fetch(`${SUPA_URL}/storage/v1/object/list/${BUCKET}`, {
    method: "POST", headers: { apikey: SUPA_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ prefix, limit: 100 }),
  });
  return r.ok ? ((await r.json()) as { name: string }[]) : [];
}
async function stRemove(token: string, paths: string[]): Promise<void> {
  await fetch(`${SUPA_URL}/storage/v1/object/${BUCKET}`, {
    method: "DELETE", headers: { apikey: SUPA_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ prefixes: paths }),
  });
}

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
async function passwordToken(email: string, password: string): Promise<string> {
  const r = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: { apikey: SUPA_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }),
  });
  const j = await r.json();
  return j.access_token as string;
}

test("/tour Unterlagen: Upload + signierter Link; B gesperrt; Zeile-löschen nimmt die Datei mit", async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, "E2E creds fehlen");
  test.skip(!SUPA_URL || !SUPA_KEY || !SERVICE_KEY, "Supabase-Env fehlt");
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1600, height: 1200 });
  await page.route(/tpembars\.com/, (r) => r.abort());

  await login(page, EMAIL, PASSWORD);
  const uidA = await uidOf(page);
  const aToken = await passwordToken(EMAIL, PASSWORD);

  const today = new Date().toISOString().slice(0, 10);
  const tt = (await svcGet<{ id: string; city: string }[]>(`tour_tournaments?select=id,city&valid_to=is.null&tournament_monday=gte.${today}&order=tournament_monday.asc&limit=1`))[0];
  expect(tt, "ein kommendes Turnier").toBeTruthy();
  const tid = tt.id, city = tt.city;
  const prefix = `${uidA}/${tid}`;

  const inSeason = (await svcGet<unknown[]>(`tour_season_plan?select=tournament_id&user_id=eq.${uidA}&tournament_id=eq.${tid}`)).length > 0;
  // Saubere Ausgangslage: keine A-Dokumente/Dateien für dieses Turnier.
  await fetch(rest(`tour_tournament_document?user_id=eq.${uidA}&tournament_id=eq.${tid}`), { method: "DELETE", headers: { ...svc, Prefer: "return=minimal" } });
  { const objs = await stList(aToken, prefix); if (objs.length) await stRemove(aToken, objs.map((o) => `${prefix}/${o.name}`)); }

  let bUid = "";
  const bEmail = `e2e-docs-${Date.now()}@example.com`;
  const bPass = `E2e-docs-${Date.now()}!Zq`;

  try {
    if (!inSeason) await fetch(rest("tour_season_plan"), { method: "POST", headers: { ...svcJson, Prefer: "return=minimal" }, body: JSON.stringify({ user_id: uidA, tournament_id: tid }) });

    // Wegwerf-Konto B (Auth + Profil).
    const created = await (await fetch(`${SUPA_URL}/auth/v1/admin/users`, { method: "POST", headers: adminAuth, body: JSON.stringify({ email: bEmail, password: bPass, email_confirm: true }) })).json();
    bUid = created.id as string;
    expect(bUid, "B angelegt").toBeTruthy();
    await fetch(rest("profiles"), { method: "POST", headers: { ...svcJson, Prefer: "return=minimal" }, body: JSON.stringify({
      id: bUid, display_name: "E2E Docs", first_name: "E2E", age: 25, gender: "male", city: "Teststadt",
      country: "DE", country_name: "E2E-Land", sports: ["tennis"], skill_level: "intermediate", goals: ["training"], profile_image: "https://example.com/e2e.png",
    }) });
    const bToken = await passwordToken(bEmail, bPass);
    expect(bToken, "B-Token").toBeTruthy();

    // ── A lädt über die Oberfläche eine Datei hoch ─────────────────────────────
    await page.goto("/tour");
    const catalog = page.locator("aside").first();
    const detail = page.locator("aside").last();
    await catalog.getByRole("button", { name: new RegExp(city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") }).first().click();
    await detail.getByRole("button", { name: /^Unterlagen$|^Documents$/ }).click();
    await expect(detail.getByText(/Turnier-Ordner|Tournament folder/).first()).toBeVisible({ timeout: 20_000 });

    const [chooser] = await Promise.all([
      page.waitForEvent("filechooser"),
      detail.getByRole("button", { name: /^Datei hinzufügen$|^Add file$/ }).first().click(),
    ]);
    await chooser.setFiles({ name: "factsheet.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\nE2E test document\n%%EOF") });

    // DB-Beleg: genau eine Zeile, Pfad merken.
    let path = "";
    await expect.poll(async () => {
      const rows = await svcGet<{ storage_path: string; kind: string }[]>(`tour_tournament_document?select=storage_path,kind&user_id=eq.${uidA}&tournament_id=eq.${tid}`);
      if (rows[0]) path = rows[0].storage_path;
      return rows.length;
    }, { timeout: 15_000 }).toBe(1);
    expect(path.startsWith(prefix + "/"), "Pfad unter <uid>/<tid>/").toBeTruthy();
    console.log("[DOCS] A hat hochgeladen:", path);

    // ── A öffnet über den signierten Link (fetch → 200, Inhalt da) ─────────────
    const aSign = await stSign(aToken, path);
    expect(aSign.ok && aSign.url, "A kann signieren").toBeTruthy();
    const aGet = await fetch(aSign.url as string);
    expect(aGet.status, "signierter Link liefert die Datei").toBe(200);
    expect((await aGet.text()).length, "Inhalt vorhanden").toBeGreaterThan(0);
    console.log("[DOCS] A öffnet über signierten Link ✓");

    // ── B sieht sie NICHT und kann NICHT löschen ───────────────────────────────
    const bSign = await stSign(bToken, path);
    expect(bSign.ok, "B darf NICHT signieren").toBeFalsy();
    const bList = await stList(bToken, prefix);
    expect(bList.length, "B sieht A's Ordner NICHT").toBe(0);
    await stRemove(bToken, [path]); // B versucht zu löschen
    const stillThere = await stSign(aToken, path); // A signiert weiterhin → Datei noch da
    expect(stillThere.ok, "nach B-Löschversuch: Datei bleibt").toBeTruthy();
    console.log("[DOCS] B gesperrt (kein Signieren, kein Löschen) ✓");

    // ── Zeile löschen (über die Oberfläche) nimmt die Datei mit (MU-017) ───────
    await detail.getByRole("button", { name: /^Entfernen$|^Remove$/ }).first().click();
    await expect.poll(async () => (await svcGet<unknown[]>(`tour_tournament_document?select=id&user_id=eq.${uidA}&tournament_id=eq.${tid}`)).length, { timeout: 15_000 }).toBe(0);
    await expect.poll(async () => (await stList(aToken, prefix)).length, { timeout: 15_000 }).toBe(0);
    expect((await stSign(aToken, path)).ok, "Datei ist weg (kein Signieren mehr)").toBeFalsy();
    console.log("[DOCS] Zeile gelöscht → Datei weg ✓");
  } finally {
    // A: etwaige Reste (Zeilen + DATEI im Bucket) entfernen — kein Waise.
    const objs = await stList(aToken, prefix).catch(() => []);
    if (objs.length) await stRemove(aToken, objs.map((o) => `${prefix}/${o.name}`)).catch(() => {});
    await fetch(rest(`tour_tournament_document?user_id=eq.${uidA}&tournament_id=eq.${tid}`), { method: "DELETE", headers: { ...svc, Prefer: "return=minimal" } }).catch(() => {});
    if (!inSeason) await fetch(rest(`tour_season_plan?user_id=eq.${uidA}&tournament_id=eq.${tid}`), { method: "DELETE", headers: { ...svc, Prefer: "return=minimal" } }).catch(() => {});
    // B komplett weg (Profil + Auth-User).
    if (bUid) {
      await fetch(rest("rpc/admin_delete_user"), { method: "POST", headers: svcJson, body: JSON.stringify({ target: bUid }) }).catch(() => {});
      await fetch(`${SUPA_URL}/auth/v1/admin/users/${bUid}`, { method: "DELETE", headers: adminAuth }).catch(() => {});
    }
  }
});
