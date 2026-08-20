// itf-import.mjs
//
// Importiert den ITF-Turnierkalender (World Tennis Tour Herren + Damen, sowie
// Junioren als BERICHT) nach web.tour_tournaments + web.tour_tournament_claims.
// Quelle: der offene ITF-Endpunkt TournamentApi/GetCalendar.
//
// TROCKENLAUF ist Voreinstellung: OHNE --write wird NICHTS geschrieben — es
// entsteht nur ein Bericht. Der Trockenlauf LIEST den Bestand (nur SELECT), um
// Dubletten zu melden; geschrieben (upsert) wird ausschließlich mit --write.
//
// Muster: scripts/wikipedia-import.mjs (Claims mit Herkunft, source_ref-Dedup,
// --write-Schalter). ABWEICHUNG: Der ITF-Endpunkt sitzt hinter Incapsula —
// nackter fetch bekommt eine Bot-Abwehr. Daher ein BROWSERARTIGER Client
// (Playwright/Chromium, bereits im Projekt) mit Pausen ≥ 2 s zwischen Abrufen.
//
// Ausführen (Trockenlauf):  node scripts/itf-import.mjs
// Scharf (schreibt!):        node scripts/itf-import.mjs --write
// Ergebnis:                  scripts/itf-import-report.md

import { writeFileSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const WRITE = process.argv.includes("--write");
const API = "https://www.itftennis.com/tennis/api/TournamentApi/GetCalendar";
const WARMUP = "https://www.itftennis.com/en/tournament-calendar/mens-world-tennis-tour-calendar/";
const CONTACT = "wiederhold.martin@web.de";
const PROJECT_REF = "dqeroewcdclgxujhubht";

// Confidence: beobachtet (aus dem Endpunkt) vs. abgeleitet (aus der Kategorie).
// Der Endpunkt liefert echtes Preisgeld → höhere Confidence als der abgeleitete
// Wikipedia-Wert (0.5), damit resolve-tournaments.mjs den echten Wert bevorzugt.
const CONF_OBSERVED = 0.9;

const PAUSE_MS = 3000; // ≥ 2 s gefordert; großzügiger gegen Incapsula-Drosselung
const TAKE = 100;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Zeitraum: ab heute bis Ende des Folgejahres.
const today = new Date();
const DATE_FROM = today.toISOString().slice(0, 10);
const DATE_TO = `${today.getUTCFullYear() + 1}-12-31`;

// circuitCode → Serie/Beschreibung. Junioren nur als Bericht (series-CHECK erlaubt
// sie NICHT — s. Bericht), daher writable=false.
const CIRCUITS = [
  { code: "MT", label: "Herren (M15/M25)", series: "itf_wtt", writable: true },
  { code: "WT", label: "Damen (W15–W100)", series: "itf_wtt", writable: true },
  { code: "JT", label: "Junioren (J30–J500)", series: "itf_juniors", writable: false },
];

// Ländername → ISO 3166-1 alpha-2 (VERBATIM aus wikipedia-import.mjs übernommen).
const COUNTRY_ISO = {
  "Germany": "DE", "France": "FR", "Italy": "IT", "Spain": "ES", "Portugal": "PT",
  "Netherlands": "NL", "Belgium": "BE", "Luxembourg": "LU", "Switzerland": "CH",
  "Austria": "AT", "United Kingdom": "GB", "Great Britain": "GB", "England": "GB",
  "Scotland": "GB", "Wales": "GB", "Ireland": "IE", "Denmark": "DK", "Sweden": "SE",
  "Norway": "NO", "Finland": "FI", "Iceland": "IS", "Poland": "PL",
  "Czech Republic": "CZ", "Czechia": "CZ", "Slovakia": "SK", "Hungary": "HU",
  "Slovenia": "SI", "Croatia": "HR", "Bosnia and Herzegovina": "BA", "Serbia": "RS",
  "Montenegro": "ME", "North Macedonia": "MK", "Kosovo": "XK", "Albania": "AL",
  "Greece": "GR", "Bulgaria": "BG", "Romania": "RO", "Moldova": "MD", "Ukraine": "UA",
  "Belarus": "BY", "Russia": "RU", "Lithuania": "LT", "Latvia": "LV", "Estonia": "EE",
  "Cyprus": "CY", "Malta": "MT", "Monaco": "MC", "San Marino": "SM", "Andorra": "AD",
  "Liechtenstein": "LI", "Georgia": "GE", "Armenia": "AM", "Azerbaijan": "AZ",
  "Turkey": "TR", "Turkiye": "TR", "Türkiye": "TR", "Tunisia": "TN", "Egypt": "EG",
  "Morocco": "MA", "Algeria": "DZ",
  "United States": "US", "USA": "US", "Canada": "CA", "Mexico": "MX", "Brazil": "BR",
  "Argentina": "AR", "Chile": "CL", "Colombia": "CO", "Peru": "PE", "Ecuador": "EC",
  "Bolivia": "BO", "Uruguay": "UY", "Paraguay": "PY", "Venezuela": "VE",
  "Dominican Republic": "DO", "Guatemala": "GT", "Bermuda": "BM",
  "China": "CN", "Chinese Taipei": "TW", "Taiwan": "TW", "Japan": "JP",
  "South Korea": "KR", "Korea": "KR", "India": "IN", "Thailand": "TH", "Vietnam": "VN",
  "Indonesia": "ID", "Malaysia": "MY", "Singapore": "SG", "Hong Kong": "HK",
  "Hong Kong, China": "HK", "Kazakhstan": "KZ", "Uzbekistan": "UZ", "Qatar": "QA",
  "Bahrain": "BH", "United Arab Emirates": "AE", "Saudi Arabia": "SA", "Kuwait": "KW",
  "Oman": "OM", "Israel": "IL", "Iran": "IR", "Lebanon": "LB", "Jordan": "JO",
  "Pakistan": "PK", "Sri Lanka": "LK",
  "Australia": "AU", "New Zealand": "NZ", "New Caledonia": "NC", "South Africa": "ZA",
  "Nigeria": "NG", "Kenya": "KE", "Rwanda": "RW", "Jamaica": "JM", "Ivory Coast": "CI",
  "Angola": "AO", "Botswana": "BW", "Guam": "GU", "El Salvador": "SV", "Costa Rica": "CR",
  "Republic of the Congo": "CG", "Congo": "CG",
  // Nachtrag nach ITF-Trockenlauf (unbekannte Namen aus §2b — meist ITF-Schreibvarianten):
  "China, P.R.": "CN", "Korea, Rep.": "KR", "Ghana": "GH", "Tajikistan": "TJ",
  "Panama": "PA", "Nicaragua": "NI", "Cameroon": "CM", "Zimbabwe": "ZW",
  "Kyrgyzstan": "KG", "Maldives": "MV", "Burundi": "BI", "Macau": "MO",
  "Honduras": "HN", "Mauritius": "MU", "Djibouti": "DJ", "Madagascar": "MG",
  "Bangladesh": "BD", "Fiji": "FJ", "Barbados": "BB", "Senegal": "SN",
  "Togo": "TG", "Reunion": "RE", "Trinidad & Tobago": "TT", "Puerto Rico": "PR",
};

// Montag der Kalenderwoche zu einem ISO-Datum (Turnierwoche beginnt Montag).
function mondayOf(iso) {
  const d = new Date(iso.slice(0, 10) + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return null;
  const shift = (d.getUTCDay() + 6) % 7; // Mo=0 … So=6
  d.setUTCDate(d.getUTCDate() - shift);
  return d.toISOString().slice(0, 10);
}
function parsePrize(v) {
  if (v == null) return null;
  const n = parseInt(String(v).replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}
function mapSurface(desc, code) {
  const s = String(desc || code || "").toLowerCase();
  if (s.includes("clay")) return "clay";
  if (s.includes("hard")) return "hard";
  if (s.includes("grass")) return "grass";
  if (s.includes("carpet")) return "carpet";
  return null;
}

// ---------------------------------------------------------------------------
// Abruf über browserartigen Client (Playwright/Chromium) — Incapsula-tauglich.
// Warmup-Seitenaufruf setzt das Incapsula-Cookie; danach fetch IM Browserkontext.
// ---------------------------------------------------------------------------
async function fetchAll() {
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ extraHTTPHeaders: { From: CONTACT } });
  const page = await ctx.newPage();
  let callCount = 0;
  try {
    await page.goto(WARMUP, { waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(PAUSE_MS); // Incapsula-Challenge setzen lassen
    const byCircuit = {};
    for (const c of CIRCUITS) {
      const items = [];
      let skip = 0, total = Infinity;
      while (skip < total) {
        const url = `${API}?circuitCode=${c.code}&skip=${skip}&take=${TAKE}&isOrderAscending=true&sortKey=StartDate&dateFrom=${DATE_FROM}&dateTo=${DATE_TO}`;
        callCount++;
        const json = await page.evaluate(async (u) => {
          const r = await fetch(u, { headers: { Accept: "application/json" } });
          const text = await r.text();
          try { return { ok: r.ok, status: r.status, data: JSON.parse(text) }; }
          catch { return { ok: false, status: r.status, snippet: text.slice(0, 120) }; }
        }, url);
        if (!json.ok || !json.data) throw new Error(`Abruf ${c.code} skip=${skip} fehlgeschlagen (status ${json.status}${json.snippet ? ", " + json.snippet : ""}) — evtl. Incapsula-Drosselung`);
        total = json.data.totalItems ?? items.length;
        for (const it of json.data.items ?? []) items.push(it);
        skip += TAKE;
        process.stdout.write(`  ${c.code}: ${Math.min(skip, total)}/${total}\r`);
        if (skip < total) await sleep(PAUSE_MS);
      }
      byCircuit[c.code] = items;
      console.log(`  ${c.code} (${c.label}): ${items.length} Turniere`);
      await sleep(PAUSE_MS);
    }
    return { byCircuit, callCount };
  } finally {
    await browser.close();
  }
}

// item → { record, claims, drop? }
function mapItem(it, circuit, url) {
  const key = it.tournamentKey ? String(it.tournamentKey).toLowerCase() : null;
  const sourceRef = key ? "itf:" + key : null;
  const monday = it.startDate ? mondayOf(it.startDate) : null;
  const iso = it.hostNation ? COUNTRY_ISO[it.hostNation.trim()] : undefined;
  const surface = mapSurface(it.surfaceDesc, it.surfaceCode);
  const prize = parsePrize(it.prizeMoney);
  const name = it.promotionalName || it.name || it.tournamentName || null;
  const city = it.location || it.venue || null;
  const category = it.category || it.tennisCategoryCode || null;
  const indoor = it.indoorOrOutDoor ? /indoor/i.test(String(it.indoorOrOutDoor)) : null;

  if (!sourceRef) return { drop: "kein_tournamentKey" };
  if (!monday) return { drop: "kein_startDate" };
  if (!it.hostNation) return { drop: "kein_hostNation" };
  if (!iso) return { drop: "land_unbekannt:" + it.hostNation };

  const record = { source_ref: sourceRef, tournament_monday: monday, series: circuit.series };
  const claims = [];
  const claim = (field, value, source, confidence) =>
    claims.push({ field_name: field, field_value: String(value), source, source_url: url, confidence });
  claim("tournament_monday", monday, "itf_endpoint", CONF_OBSERVED);
  claim("series", circuit.series, "itf_endpoint", CONF_OBSERVED);
  if (name) claim("name", name, "itf_endpoint", CONF_OBSERVED);
  if (city) claim("city", city, "itf_endpoint", CONF_OBSERVED);
  claim("country", iso, "itf_endpoint", CONF_OBSERVED);
  if (category) claim("category", category, "itf_endpoint", CONF_OBSERVED);
  if (surface) claim("surface", surface, "itf_endpoint", CONF_OBSERVED);
  if (indoor != null) claim("indoor", indoor, "itf_endpoint", CONF_OBSERVED);
  // ECHTES Preisgeld vom Endpunkt (nicht Kategorie×1000) — höhere Confidence.
  if (prize != null) {
    claim("prize_money", prize, "itf_endpoint", CONF_OBSERVED);
    claim("prize_currency", "USD", "itf_endpoint", CONF_OBSERVED);
  }
  return { record, claims, raw: { name, city, iso, category, surface, prize, monday, startDate: it.startDate, endDate: it.endDate, sourceRef, tournamentLink: it.tournamentLink, prizeRaw: it.prizeMoney } };
}

// ---------------------------------------------------------------------------
// Service-Client — im Trockenlauf NUR SELECT (Dubletten-Report), Upsert nur --write.
// ---------------------------------------------------------------------------
function loadEnv() {
  const env = {};
  try {
    for (const line of readFileSync(join(process.cwd(), ".env.local"), "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z_0-9]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch { /* fehlt → unten Fehler */ }
  return env;
}
async function makeClient() {
  const env = loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || `https://${PROJECT_REF}.supabase.co`;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY nicht in .env.local gefunden.");
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(url, key, { db: { schema: "web" }, auth: { persistSession: false, autoRefreshToken: false } });
}

// ---------------------------------------------------------------------------
// Lauf
// ---------------------------------------------------------------------------
console.log(`ITF-Import · ${WRITE ? "SCHARF (--write)" : "TROCKENLAUF"} · ${DATE_FROM} … ${DATE_TO}`);
const { byCircuit, callCount } = await fetchAll();
console.log(`Abrufe gesamt: ${callCount}`);

// Bestand lesen (source_ref + Identität) — für Dubletten-Report.
const svc = await makeClient();
const existing = new Map();               // source_ref → row
const existingByIdent = new Map();        // country|monday|category → source_ref
{
  const { data, error } = await svc.from("tour_tournaments").select("source_ref, country, tournament_monday, category");
  if (error) throw new Error("Bestand lesen fehlgeschlagen: " + error.message);
  for (const r of data ?? []) {
    existing.set(r.source_ref, r);
    existingByIdent.set(`${r.country}|${r.tournament_monday}|${r.category}`, r.source_ref);
  }
}

// Mapping + Klassifikation je Kategorie.
const perCircuit = {};
for (const c of CIRCUITS) {
  const items = byCircuit[c.code] ?? [];
  const kept = [], dropped = new Map(), unknownCountries = new Map();
  let neu = 0, dup = 0, softDup = 0;
  const byCountry = new Map();
  const prizesByCat = new Map();
  const url = `${API}?circuitCode=${c.code}`;
  for (const it of items) {
    const m = mapItem(it, c, it.tournamentLink ? "https://www.itftennis.com" + it.tournamentLink : url);
    if (m.drop) {
      dropped.set(m.drop.split(":")[0], (dropped.get(m.drop.split(":")[0]) || 0) + 1);
      if (m.drop.startsWith("land_unbekannt:")) { const nm = m.drop.slice("land_unbekannt:".length); unknownCountries.set(nm, (unknownCountries.get(nm) || 0) + 1); }
      continue;
    }
    kept.push(m);
    if (existing.has(m.record.source_ref)) dup++; else {
      neu++;
      const identKey = `${m.raw.iso}|${m.record.tournament_monday}|${m.raw.category}`;
      if (existingByIdent.has(identKey)) softDup++;
    }
    byCountry.set(m.raw.iso, (byCountry.get(m.raw.iso) || 0) + 1);
    if (m.raw.prize != null) {
      if (!prizesByCat.has(m.raw.category)) prizesByCat.set(m.raw.category, new Set());
      prizesByCat.get(m.raw.category).add(m.raw.prize);
    }
  }
  const future = kept.filter((m) => m.record.tournament_monday >= DATE_FROM).length;
  perCircuit[c.code] = { c, total: items.length, kept, dropped, unknownCountries, neu, dup, softDup, future, byCountry, prizesByCat };
}

// Optional scharf schreiben (nur writable Circuits = Herren + Damen).
let writeSummary = null;
if (WRITE) {
  let okT = 0, okC = 0, errN = 0, skippedJuniors = 0;
  for (const c of CIRCUITS) {
    if (!c.writable) { skippedJuniors += perCircuit[c.code].kept.length; continue; }
    for (const { record, claims } of perCircuit[c.code].kept) {
      const { data, error } = await svc.from("tour_tournaments").upsert(record, { onConflict: "source_ref" }).select("id").single();
      if (error || !data) { errN++; continue; }
      okT++;
      const rows = claims.map((cl) => ({ ...cl, tournament_id: data.id }));
      const { error: ce } = await svc.from("tour_tournament_claims").upsert(rows, { onConflict: "tournament_id,field_name,source,field_value", ignoreDuplicates: true });
      if (ce) errN++; else okC += rows.length;
    }
  }
  writeSummary = { okT, okC, errN, skippedJuniors };
}

// ---------------------------------------------------------------------------
// Bericht
// ---------------------------------------------------------------------------
const md = [];
const now = new Date().toISOString();
md.push(`# ITF-Import — ${WRITE ? "SCHARFER LAUF" : "TROCKENLAUF (nichts geschrieben)"}`);
md.push("");
md.push(`> \`scripts/itf-import.mjs\` · ${now} · Zeitraum ${DATE_FROM} … ${DATE_TO} · Abrufe: ${callCount}`);
md.push(`> Quelle: ITF TournamentApi/GetCalendar (browserartiger Client, Pausen ${PAUSE_MS} ms).`);
md.push("");
md.push(`## 1. Je Kategorie: Menge, Zukunft, neu/Dublette`);
md.push("");
md.push(`| Circuit | Serie | gesamt | verwertbar | in Zukunft | NEU | Dublette (source_ref) | Soft-Dublette (gleiches Land+Woche+Kat, anderer Key) |`);
md.push(`|---|---|---:|---:|---:|---:|---:|---:|`);
for (const c of CIRCUITS) {
  const p = perCircuit[c.code];
  md.push(`| ${c.code} — ${c.label} | ${c.series}${c.writable ? "" : " ⚠️"} | ${p.total} | ${p.kept.length} | ${p.future} | ${p.neu} | ${p.dup} | ${p.softDup} |`);
}
md.push("");
md.push(`⚠️ **Junioren (JT) sind mit dem heutigen Schema NICHT schreibbar:** \`tour_tournaments_series_check\` erlaubt nur \`itf_wtt\`/\`challenger\`. Zum Import bräuchte es (a) eine CHECK-Erweiterung um \`itf_juniors\` und (b) eigene Fristenregeln in \`deadlines.ts\` (Junioren ≠ WTT). Der scharfe Lauf **überspringt JT**.`);
md.push("");

md.push(`## 2. Verworfene Zeilen nach Grund`);
md.push("");
for (const c of CIRCUITS) {
  const p = perCircuit[c.code];
  if (p.dropped.size === 0) { md.push(`- ${c.code}: keine`); continue; }
  for (const [reason, n] of [...p.dropped.entries()].sort((a, b) => b[1] - a[1])) md.push(`- ${c.code}: **${reason}** — ${n}×`);
}
md.push("");

md.push(`## 2b. Unbekannte Ländernamen (in COUNTRY_ISO ergänzen, sonst verworfen)`);
md.push("");
const unknownSum = new Map();
for (const c of CIRCUITS) for (const [nm, n] of perCircuit[c.code].unknownCountries) unknownSum.set(nm, (unknownSum.get(nm) || 0) + n);
if (unknownSum.size === 0) md.push(`Keine — alle Ländernamen sind zugeordnet.`);
for (const [nm, n] of [...unknownSum.entries()].sort((a, b) => b[1] - a[1])) md.push(`- \`${nm}\` — ${n}×`);
md.push("");

md.push(`## 3. Länderverteilung (Top 20, verwertbare Turniere aller Kategorien)`);
md.push("");
const countrySum = new Map();
for (const c of CIRCUITS) for (const [iso, n] of perCircuit[c.code].byCountry) countrySum.set(iso, (countrySum.get(iso) || 0) + n);
md.push([...countrySum.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([iso, n]) => `${iso} ${n}`).join(" · "));
md.push("");

md.push(`## 4. Preisgeld — echte Werte oder Kategorie-Konstante?`);
md.push("");
md.push(`Je Kategorie die DISTINKTEN Preisgeld-Werte aus dem Endpunkt. Mehr als ein Wert ⇒ echt (nicht Kategorie×1000).`);
md.push("");
for (const c of CIRCUITS) {
  const p = perCircuit[c.code];
  if (p.prizesByCat.size === 0) continue;
  md.push(`**${c.code}:**`);
  for (const [cat, set] of [...p.prizesByCat.entries()].sort()) {
    const vals = [...set].sort((a, b) => a - b);
    md.push(`- ${cat}: ${vals.length} distinkt → ${vals.slice(0, 8).map((v) => "$" + v.toLocaleString("en-US")).join(", ")}${vals.length > 8 ? " …" : ""}`);
  }
}
md.push("");

md.push(`## 5. Stichprobe: 3 Turniere vollständig`);
md.push("");
const sample = [perCircuit.MT.kept[0], perCircuit.WT.kept[0], perCircuit.JT.kept[0]].filter(Boolean);
for (const m of sample) {
  md.push(`### ${m.record.source_ref}`);
  md.push("```json");
  md.push("// tour_tournaments (Identität)");
  md.push(JSON.stringify(m.record, null, 2));
  md.push("// tour_tournament_claims (Herkunft)");
  md.push(JSON.stringify(m.claims, null, 2));
  md.push("// Rohfelder aus dem Endpunkt (zur Kontrolle)");
  md.push(JSON.stringify(m.raw, null, 2));
  md.push("```");
  md.push("");
}

md.push(`## 6. Hinweise`);
md.push("");
md.push(`- **Trockenlauf ist Voreinstellung.** Ohne \`--write\` wird NICHT geschrieben (nur der Bestand wird für den Dubletten-Report gelesen).`);
md.push(`- **Dedup:** \`upsert onConflict source_ref\`. \`source_ref = "itf:" + tournamentKey\` (lowercase) deckt sich 1:1 mit dem Wikipedia-Bestand (\`itf:m-itf-…\`) → Herren-Dubletten fallen sauber zusammen; Damen/Junioren sind neu.`);
md.push(`- **Preisgeld:** echter Endpunkt-Wert, Claim-Quelle \`itf_endpoint\`, confidence ${CONF_OBSERVED} — schlägt den abgeleiteten Wikipedia-Wert (0.5) in \`resolve-tournaments.mjs\` (MU-028).`);
md.push(`- **Nicht aus dem Endpunkt:** Meldefrist (rechnet \`deadlines.ts\` aus dem Montag), Punkte (\`points.ts\`). Nichts erfunden.`);
md.push(`- **Junioren:** nur Bericht — Schreiben blockiert der series-CHECK (s. §1).`);
if (writeSummary) md.push(`\n**Geschrieben:** ${writeSummary.okT} Turniere, ${writeSummary.okC} Claims, ${writeSummary.errN} Fehler; JT übersprungen: ${writeSummary.skippedJuniors}.`);
md.push("");

const out = md.join("\n");
const __dirname = dirname(fileURLToPath(import.meta.url));
writeFileSync(join(__dirname, "itf-import-report.md"), out, "utf8");
const totalKept = CIRCUITS.reduce((a, c) => a + perCircuit[c.code].kept.length, 0);
const totalNew = CIRCUITS.reduce((a, c) => a + perCircuit[c.code].neu, 0);
const totalDup = CIRCUITS.reduce((a, c) => a + perCircuit[c.code].dup, 0);
console.log(`\n${WRITE ? "SCHARF" : "TROCKENLAUF"} · verwertbar=${totalKept} neu=${totalNew} dublette=${totalDup}`);
console.log(`Bericht: scripts/itf-import-report.md`);
