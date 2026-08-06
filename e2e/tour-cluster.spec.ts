import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";

/**
 * E2E: Cluster-Effekt in /tour (gegen den LOKALEN Dev-Server, echter Login).
 *
 *   a) Karte: zwei Turniere am selben Ort werden EIN Marker mit Anzahl (nicht zwei
 *      übereinander); der dritte, weit entfernte Ort ist ein eigener Marker.
 *   b) Saisonliste: das zweite Turnier am selben Ort zeigt „keine erneute Anreise".
 *   c) Kosten: zwei Anreisen statt drei (eine eingesparte ausgewiesen).
 *
 * Das Konto hat i. d. R. schon eine Saison. Deshalb wird alles als DELTA (vorher/nachher)
 * gemessen und robust gewählt:
 *  - Karte: Summe der Marker-Zählungen steigt um 3 (meine 3 Turniere), aber die Zahl der
 *    Marker um weniger als 3 → mindestens zwei teilen sich einen Punkt (Cluster).
 *  - Zwei gleiche Orte so gewählt, dass KEIN bestehender Saison-Eintrag dazwischen liegt
 *    (dann bleibt der zweite in der Saison direkt hinter dem ersten → „keine Anreise").
 *  - „keine Anreise"-Stationen auf /tour/costs als Delta (+1).
 *
 * ⚠ ACHTUNG — ECHTES KONTO, DATEN WERDEN ANGELEGT:
 *  - Zugangsdaten kommen AUSSCHLIESSLICH über die Env-Variablen `E2E_EMAIL` und
 *    `E2E_PASSWORD` (optional `E2E_GATE_CODE`). NIEMALS Zugangsdaten in diese Datei
 *    schreiben oder ins Repo committen.
 *  - Der Test läuft mit ECHTEM Login gegen ein ECHTES Konto und nimmt echte Turniere in
 *    dessen Saison auf. Er MUSS hinterher aufräumen: die `test.afterEach`-Hook unten
 *    entfernt AUSSCHLIESSLICH die von diesem Test aufgenommenen Turniere (Ort + exaktes
 *    Datum) und wartet dabei auf das DB-DELETE. Diese Hook nicht schwächen/entfernen, und
 *    keine fremden Saison-Einträge des Kontos anfassen.
 *  - Nur gegen den LOKALEN Dev-Server laufen lassen, nicht gegen Produktion.
 *
 * Texte werden DE ODER EN akzeptiert (Konto-Sprache steht nicht fest).
 */

const EMAIL = process.env.E2E_EMAIL || "";
const PASSWORD = process.env.E2E_PASSWORD || "";
const GATE_CODE = process.env.E2E_GATE_CODE || "50805080";
const SHOTS = "e2e/artifacts";
const DAY = 86_400_000;

const RX = {
  add: /Zur Saison hinzufügen|Add to season/i,
  inSeason: /In deiner Saison|In your season/i,
  remove: /Aus Saison entfernen|Remove from season/i,
  noArrival: /Keine erneute Anreise|No additional travel/i,
  saved: /eingesparte Anreisen|trips saved/i,
  noArrivalStation: /keine Anreise \(gleicher Ort\)|no travel \(same location\)/i,
  loginBtn: /^EINLOGGEN$|^LOG IN$/,
  spain: /,\s*(Spanien|Spain)\b/i,
  noCoords: /keine Turniere mit Koordinaten|No tournaments with coordinates/i,
};

const MONTHS: Record<string, number> = {};
["januar,january", "februar,february", "märz,march", "april,april", "mai,may", "juni,june",
 "juli,july", "august,august", "september,september", "oktober,october", "november,november", "dezember,december",
].forEach((pair, i) => pair.split(",").forEach((m) => (MONTHS[m] = i)));

function parseCardDate(line: string): number {
  const m = line.match(/(\d{1,2})\.?\s+(\p{L}+)\s+(\d{4})/u);
  if (!m) return NaN;
  const mi = MONTHS[m[2].toLowerCase()];
  return mi == null ? NaN : Date.UTC(Number(m[3]), mi, Number(m[1]));
}
function dateText(line: string): string {
  const m = line.match(/(\d{1,2}\.?\s+\p{L}+\s+\d{4})/u);
  return m ? m[1] : "";
}

const added: { city: string; date: string }[] = [];

async function unlockGate(page: Page) {
  const res = await page.request.post("/api/unlock", { data: { code: GATE_CODE } });
  expect(res.ok(), "Gate /api/unlock sollte 200 liefern").toBeTruthy();
}

async function login(page: Page) {
  await page.goto("/app");
  await page.locator('input[type="email"]').first().fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await page.getByRole("button", { name: RX.loginBtn }).click();
  await expect(page.locator('input[type="email"]'), "Login sollte gelingen").toHaveCount(0, { timeout: 45_000 });
}

/** /tour öffnen und die sichtbaren Marker messen: Anzahl + Summe der Anzahl-Badges (ohne Badge = 1). */
async function measureMap(page: Page): Promise<{ total: number; sumCounts: number }> {
  await page.goto("/tour");
  await Promise.race([
    page.locator(".maplibregl-canvas:visible").first().waitFor({ timeout: 60_000 }),
    page.getByText(RX.noCoords).first().waitFor({ timeout: 60_000 }),
  ]).catch(() => {});
  await page.locator(".maplibregl-marker:visible").first().waitFor({ timeout: 8_000 }).catch(() => {});
  const counts = await page.locator(".maplibregl-marker:visible").evaluateAll((els) =>
    els.map((e) => { const n = parseInt((e.textContent || "").trim(), 10); return Number.isFinite(n) && n > 0 ? n : 1; }),
  );
  return { total: counts.length, sumCounts: counts.reduce((a, b) => a + b, 0) };
}

/** /tour/costs öffnen und zählen, wie viele Stationen „keine Anreise (gleicher Ort)" zeigen. */
async function measureCostsNoArrival(page: Page): Promise<number> {
  await page.goto("/tour/costs");
  await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 45_000 });
  await page.locator("article, section").first().waitFor({ timeout: 20_000 }).catch(() => {});
  return page.getByText(RX.noArrivalStation).count();
}

test("Cluster-Effekt: gemeinsamer Ort, ein Marker, zwei Anreisen", async ({ page }) => {
  expect(EMAIL && PASSWORD, "E2E_EMAIL / E2E_PASSWORD müssen als Env gesetzt sein").toBeTruthy();
  fs.mkdirSync(SHOTS, { recursive: true });

  await unlockGate(page);
  await login(page);
  await page.addInitScript(() => { try { localStorage.setItem("mu_tour_setup_skipped", "1"); } catch { /* egal */ } });

  // Bestehende Saison-Montage lesen (um kein Fremd-Turnier zwischen meine zwei zu legen).
  await page.goto("/tour/season");
  await page.locator("article").first().waitFor({ timeout: 20_000 }).catch(() => {});
  const accountMondays = (await page.locator("article").evaluateAll((arts) =>
    arts.map((a) => a.querySelector("h2 + p")?.textContent?.trim() || ""),
  )).map(parseCardDate).filter((n) => Number.isFinite(n));

  // Basiswerte VOR dem Aufnehmen.
  const beforeMap = await measureMap(page);
  const beforeNoArrival = await measureCostsNoArrival(page);
  console.log(`Vorher: Marker=${beforeMap.total} (Summe Zählungen=${beforeMap.sumCounts}) · Kosten-Stationen ohne Anreise=${beforeNoArrival}`);

  // ── Turnierkalender: 2× Monastir (kein Fremd-Eintrag dazwischen) + 1× weit weg ──
  await page.goto("/tour/browse");
  await expect(page.locator("article").first()).toBeVisible({ timeout: 45_000 });
  await expect(page.getByRole("button", { name: RX.add }).first()).toBeVisible({ timeout: 30_000 });

  const cards = await page.locator("article").evaluateAll((arts) =>
    arts.map((a) => ({
      h2: a.querySelector("h2")?.textContent?.trim() || "",
      dateP: a.querySelector("h2 + p")?.textContent?.trim() || "",
      inSeason: a.querySelector('button[aria-pressed]')?.getAttribute("aria-pressed") === "true",
    })),
  );
  const free = cards.map((c, i) => ({ ...c, i, ms: parseCardDate(c.dateP) })).filter((c) => !c.inSeason && Number.isFinite(c.ms));

  // Freies Monastir-Paar mit kleinstem Abstand, zwischen dem KEIN bestehender Saison-Montag liegt.
  const monastir = free.filter((c) => /Monastir/i.test(c.h2)).sort((a, b) => a.ms - b.ms);
  let m1: (typeof monastir)[number] | null = null, m2: (typeof monastir)[number] | null = null, bestGap = Infinity;
  for (let i = 0; i < monastir.length; i++) {
    for (let j = i + 1; j < monastir.length; j++) {
      const gap = monastir[j].ms - monastir[i].ms;
      if (gap >= bestGap) continue;
      if (accountMondays.some((md) => md > monastir[i].ms && md < monastir[j].ms)) continue;
      m1 = monastir[i]; m2 = monastir[j]; bestGap = gap;
    }
  }
  expect(m1 && m2, "Ein freies Monastir-Paar ohne Fremd-Eintrag dazwischen sollte existieren").toBeTruthy();

  const after2 = free.filter((c) => c.ms > m2!.ms);
  const third = after2.find((c) => RX.spain.test(c.h2)) || after2.find((c) => !/Monastir/i.test(c.h2));
  const thirdKind = third && RX.spain.test(third.h2) ? "Spanien" : "anderer weit entfernter Ort (kein Spanien im Zeitfenster)";
  expect(third, "Ein drittes, späteres Turnier sollte auffindbar sein").toBeTruthy();

  const picks = [m1!, m2!, third!];
  console.log(`Gewählt: M1=${m1!.h2} (${dateText(m1!.dateP)}, Δ=${bestGap / DAY}d), M2=${m2!.h2} (${dateText(m2!.dateP)}), 3.=${third!.h2} (${dateText(third!.dateP)}) [${thirdKind}]`);

  for (const p of picks) {
    const card = page.locator("article").nth(p.i);
    await card.getByRole("button", { name: RX.add }).click();
    await expect(card.getByRole("button", { name: RX.inSeason })).toBeVisible({ timeout: 15_000 });
    added.push({ city: p.h2.split(",")[0].trim(), date: dateText(p.dateP) });
  }

  // ── (a) Karte ───────────────────────────────────────────────────────────────
  const afterMap = await measureMap(page);
  const mapSection = page.locator("section").filter({ has: page.locator(".maplibregl-canvas:visible") }).first();
  await mapSection.screenshot({ path: `${SHOTS}/a-map-cluster.png` });
  console.log(`Nachher: Marker=${afterMap.total} (Summe Zählungen=${afterMap.sumCounts}) · ΔMarker=${afterMap.total - beforeMap.total} ΔZählungen=${afterMap.sumCounts - beforeMap.sumCounts}`);
  expect(afterMap.sumCounts - beforeMap.sumCounts, "Meine drei Turniere erscheinen auf der Karte").toBe(3);
  expect(afterMap.total - beforeMap.total, "Weniger als drei neue Marker → die zwei gleichen Orte sind EIN Punkt").toBeLessThan(3);

  // ── (b) Saisonliste: mein 2. Monastir zeigt „keine erneute Anreise" ─────────
  const m2date = added[1].date;
  const monastirDetails = page.locator("details").filter({ hasText: "Monastir" });
  const mCount = await monastirDetails.count();
  let noArrivalVisible = false;
  let secondEntry = monastirDetails.first();
  for (let i = 0; i < mCount; i++) {
    const d = monastirDetails.nth(i);
    await d.locator("summary").click();
    if (m2date && (await d.getByText(m2date).count())) {
      secondEntry = d;
      noArrivalVisible = await d.getByText(RX.noArrival).isVisible().catch(() => false);
      break;
    }
    await d.locator("summary").click();
  }
  await secondEntry.screenshot({ path: `${SHOTS}/b-no-arrival.png` });
  console.log(`(b) "keine erneute Anreise" beim 2. Monastir (${m2date}) sichtbar: ${noArrivalVisible}`);
  expect(noArrivalVisible, "Das zweite Turnier am selben Ort zeigt keine erneute Anreise").toBeTruthy();

  // ── (c) Kosten: eine eingesparte Anreise dazu (Delta +1 Station ohne Anreise) ──
  await page.goto("/tour/costs");
  await expect(page.getByRole("heading").first()).toBeVisible();
  const arrivalInput = page.locator('input[placeholder="120"]').first();
  await arrivalInput.waitFor({ state: "visible", timeout: 20_000 });
  if (!(await arrivalInput.inputValue()).trim()) {
    await arrivalInput.fill("120");
    await page.locator('input[placeholder="50"]').first().fill("50");
    await page.locator('input[placeholder="30"]').first().fill("30");
    await page.locator('input[placeholder="7"]').first().fill("7");
    await page.getByRole("button", { name: /Speichern|Save/i }).first().click();
    console.log("(c) Kostensätze eingetragen (120/50/30, 7 Nächte).");
  } else {
    console.log("(c) Kostensätze bereits vorhanden — bestehende genutzt.");
  }
  await expect(page.getByText(RX.saved).first(), "Eine eingesparte Anreise sollte ausgewiesen sein").toBeVisible({ timeout: 20_000 });
  const savedText = await page.getByText(RX.saved).first().innerText();
  const afterNoArrival = await page.getByText(RX.noArrivalStation).count();
  const breakdown = page.locator("section").filter({ hasText: RX.saved }).first();
  await breakdown.screenshot({ path: `${SHOTS}/c-costs-arrivals.png` });
  console.log(`(c) "${savedText}" · Stationen ohne Anreise: vorher=${beforeNoArrival} nachher=${afterNoArrival}`);
  expect(afterNoArrival - beforeNoArrival, "Genau eine zusätzliche Station ohne Anreise → 2 Anreisen statt 3").toBe(1);
});

// Aufräumen: NUR die von diesem Test aufgenommenen Turniere (Ort + exaktes Datum) entfernen.
test.afterEach(async ({ page }) => {
  if (added.length === 0) return;
  try {
    await page.goto("/tour/season");
    await page.locator("article").first().waitFor({ timeout: 20_000 }).catch(() => {});
    for (const a of added) {
      const card = page.locator("article", { hasText: a.city }).filter({ hasText: a.date }).first();
      const btn = card.getByRole("button", { name: RX.remove });
      if (await btn.count()) {
        // Auf das tatsächliche DB-DELETE warten — sonst bricht der Browser die noch
        // laufenden Löschungen der letzten Einträge ab (optimistische UI entfernt die
        // Karte sofort, der Löschvorgang ist aber noch unterwegs).
        await Promise.all([
          page.waitForResponse((r) => r.url().includes("tour_season_plan") && r.request().method() === "DELETE", { timeout: 15_000 }).catch(() => null),
          btn.click(),
        ]);
        await expect(card).toHaveCount(0, { timeout: 10_000 }).catch(() => {});
      }
    }
  } finally {
    added.length = 0;
  }
});
