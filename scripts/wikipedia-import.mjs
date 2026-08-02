// wikipedia-import.mjs
//
// Importiert die Wikipedia-Kalenderdaten (ITF World Tennis Tour, Herren + ATP
// Challenger Tour) nach web.tour_tournaments + web.tour_tournament_claims.
//
// TROCKENLAUF ist Voreinstellung: OHNE --write wird KEINE Datenbankverbindung
// geöffnet und NICHTS geschrieben — es entsteht nur ein Bericht darüber, was
// geschrieben würde. Scharfes Schreiben nur mit --write (Service-Client, RLS-Bypass).
//
// Reines Node (ESM). Keine neuen Dependencies (@supabase/supabase-js ist bereits im
// Projekt). Nichts unter src/ wird verändert. web.tournaments bleibt unangetastet.
//
// Ausführen (Trockenlauf):  node scripts/wikipedia-import.mjs
// Scharf (schreibt!):        node scripts/wikipedia-import.mjs --write
// Ergebnis:                  scripts/wikipedia-import-report.md

import { writeFileSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const WRITE = process.argv.includes("--write");
// Optionaler Teilmengen-Filter, um den scharfen Lauf in kürzere Vordergrund-Läufe
// zu teilen: --only=itf2025 | itf2026 | ch2025 | ch2026
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) || "").split("=")[1] || null;
const sourceKey = (s) => (s.series === "ITF" ? "itf" : "ch") + s.year;

const API = "https://en.wikipedia.org/w/api.php";
const USER_AGENT =
  "MatchupTournamentCoverage/1.0 (https://matchup-app.com; wiederhold.martin@web.de) node-fetch";
const PROJECT_REF = "dqeroewcdclgxujhubht"; // nur für Supabase-URL-Fallback, kein Secret

// Confidence: beobachtet (aus dem Kalender) vs. abgeleitet (aus der Kategorie).
const CONF_OBSERVED = 0.9;
const CONF_DERIVED = 0.5;

// ---------------------------------------------------------------------------
// Länderzuordnung — EXPLIZIT. Kein Raten, kein algorithmisches Ableiten.
// Schlüssel = Klartext exakt wie in Wikipedia; Wert = ISO 3166-1 alpha-2.
// Unbekannte Namen → Turnier wird NICHT importiert und im Bericht gelistet.
// ---------------------------------------------------------------------------
const COUNTRY_ISO = {
  // Europa
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
  // Türkei + Nordafrika (Schreibvarianten)
  "Turkey": "TR", "Turkiye": "TR", "Türkiye": "TR", "Tunisia": "TN", "Egypt": "EG",
  "Morocco": "MA", "Algeria": "DZ",
  // Amerika
  "United States": "US", "USA": "US", "Canada": "CA", "Mexico": "MX", "Brazil": "BR",
  "Argentina": "AR", "Chile": "CL", "Colombia": "CO", "Peru": "PE", "Ecuador": "EC",
  "Bolivia": "BO", "Uruguay": "UY", "Paraguay": "PY", "Venezuela": "VE",
  "Dominican Republic": "DO", "Guatemala": "GT", "Bermuda": "BM",
  // Asien / Naher Osten
  "China": "CN", "Chinese Taipei": "TW", "Taiwan": "TW", "Japan": "JP",
  "South Korea": "KR", "Korea": "KR", "India": "IN", "Thailand": "TH", "Vietnam": "VN",
  "Indonesia": "ID", "Malaysia": "MY", "Singapore": "SG", "Hong Kong": "HK",
  "Kazakhstan": "KZ", "Uzbekistan": "UZ", "Qatar": "QA", "Bahrain": "BH",
  "United Arab Emirates": "AE", "Saudi Arabia": "SA", "Kuwait": "KW", "Oman": "OM",
  "Israel": "IL", "Iran": "IR", "Lebanon": "LB", "Jordan": "JO", "Pakistan": "PK",
  "Sri Lanka": "LK",
  // Ozeanien / Afrika
  "Australia": "AU", "New Zealand": "NZ", "New Caledonia": "NC", "South Africa": "ZA",
  "Nigeria": "NG", "Kenya": "KE",
  // Nachtrag nach Trockenlauf (unbekannte Namen aus dem Bericht):
  "Rwanda": "RW", "Jamaica": "JM", "Ivory Coast": "CI", "Angola": "AO",
  "Botswana": "BW", "Guam": "GU", "El Salvador": "SV", "Costa Rica": "CR",
  // Congo-Sonderfall: im Wikitext sind ALLE Vorkommen von "Congo" UND
  // "Republic of the Congo" die Stadt Brazzaville → Republik Kongo = CG
  // (kein Kinshasa/DR Kongo = CD in den Quelldaten, per Ort geprüft).
  // Sollte künftig ein CD-/Kinshasa-Turnier als "Congo" auftauchen, hier trennen.
  "Republic of the Congo": "CG", "Congo": "CG",
};

// Belag → DB-Wert (lowercase, CHECK ('clay','hard','grass','carpet')).
const SURFACE_MAP = { hard: "hard", clay: "clay", grass: "grass", carpet: "carpet" };

// Preisgeld je Kategorie (USD). Explizite Tabelle, KEINE Formel.
// Hinweis: Challenger-Beträge = Tier×1000, Währung USD ist eine ANNAHME (siehe Bericht).
const PRIZE_USD = {
  "M15": 15000, "M25": 25000,
  "Challenger 50": 50000, "Challenger 75": 75000, "Challenger 80": 80000,
  "Challenger 90": 90000, "Challenger 100": 100000, "Challenger 110": 110000,
  "Challenger 125": 125000, "Challenger 175": 175000,
};

// ---------------------------------------------------------------------------
// MediaWiki-API (Timeout + Retry)
// ---------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function fetchWikitext(title) {
  const p = new URLSearchParams({
    action: "query", format: "json", formatversion: "2",
    prop: "revisions", rvslots: "main", rvprop: "content", titles: title,
  });
  for (let attempt = 1; attempt <= 2; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 60_000);
    try {
      const res = await fetch(`${API}?${p}`, { headers: { "User-Agent": USER_AGENT }, signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const json = await res.json();
      const page = json?.query?.pages?.[0];
      if (!page || page.missing) throw new Error("Seite fehlt (missing)");
      const content = page?.revisions?.[0]?.slots?.main?.content;
      if (!content) throw new Error("kein Wikitext");
      return content;
    } catch (err) {
      clearTimeout(timer);
      if (attempt === 2) throw err;
      await sleep(3000);
    }
  }
}

// ===========================================================================
//  ZEILEN-PARSER — VERBATIM aus scripts/wikipedia-calendar-coverage.mjs.
//  (Nachweislich 0 verlorene Zeilen; NICHT neu gebaut.)
// ===========================================================================
function extractTables(wt) {
  const tables = [];
  let depth = 0, buf = [];
  for (const line of wt.split("\n")) {
    const t = line.trimStart();
    if (t.startsWith("{|")) { if (depth === 0) buf = []; depth++; buf.push(line); continue; }
    if (depth > 0) { buf.push(line); if (t.startsWith("|}")) { depth--; if (depth === 0) tables.push(buf.join("\n")); } }
  }
  return tables;
}
function cleanText(s) {
  return String(s)
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g, "$1").replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "").replace(/<ref[^>]*\/>/gi, "")
    .replace(/'''?/g, "").replace(/<[^>]+>/g, "").replace(/\[[^\]]*\]/g, "")
    .replace(/\s+/g, " ").trim();
}
function stripAttrs(cell) {
  let depth = 0;
  for (let k = 0; k < cell.length; k++) {
    const two = cell.substr(k, 2);
    if (two === "[[" || two === "{{") { depth++; k++; continue; }
    if (two === "]]" || two === "}}") { if (depth > 0) depth--; k++; continue; }
    if (depth === 0 && cell[k] === "|") {
      const left = cell.slice(0, k);
      if (/=/.test(left) || /\b(rowspan|colspan|style|width|align|scope|bgcolor|valign|class)\b/i.test(left)) return cell.slice(k + 1);
      return cell;
    }
  }
  return cell;
}
function splitRowCells(rowText) {
  const cells = [];
  let cur = "", depth = 0, inCell = false;
  for (let line of rowText.split("\n")) {
    if (depth === 0 && /^\s*[|!]/.test(line) && !/^\s*\|\}/.test(line)) {
      if (inCell) { cells.push(cur); cur = ""; }
      inCell = true; line = line.replace(/^\s*(?:\|\||!!|\||!)/, "");
    } else if (inCell) { cur += "\n"; } else { continue; }
    for (let k = 0; k < line.length; k++) {
      const two = line.substr(k, 2);
      if (two === "[[" || two === "{{") { depth++; cur += two; k++; continue; }
      if (two === "]]" || two === "}}") { if (depth > 0) depth--; cur += two; k++; continue; }
      if (depth === 0 && two === "||") { cells.push(cur); cur = ""; k++; continue; }
      cur += line[k];
    }
  }
  if (inCell) cells.push(cur);
  return cells.map((c) => stripAttrs(c.trim()).trim());
}
const MONTHS = "January|February|March|April|May|June|July|August|September|October|November|December";
const MONTH_NAMES = MONTHS.split("|");
const isWeekCell = (s) => new RegExp(`^(?:\\d{1,2}\\s+)?(?:${MONTHS})(?:\\s+\\d{1,2})?$`).test(s.trim());
function isTournamentCell(cell) {
  if (!/<br/i.test(cell)) return false;
  return /\b(Hard|Clay|Grass|Carpet)\b/i.test(cell) || /\bM(15|25)\b/.test(cell) || /Challenger\s*\d/i.test(cell);
}
// ===========================================================================
//  ENDE Verbatim-Zeilenparser
// ===========================================================================

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
const slug = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// „Week of" + Seitenkontext → tournament_monday (ISO). Jahreswechsel: Dezember
// auf einer Q1-/Challenger-Jahresseite gehört ins Vorjahr.
function weekToMonday(week, src) {
  const m = week.match(new RegExp(`(?:(\\d{1,2})\\s+)?(${MONTHS})(?:\\s+(\\d{1,2}))?`, "i"));
  if (!m) return null;
  const day = parseInt(m[1] || m[3], 10);
  if (!day) return null;
  const monthIdx = MONTH_NAMES.indexOf(cap(m[2]));
  let year = src.year;
  if (monthIdx === 11 && (src.series === "Challenger" || src.span === "January–March")) year = src.year - 1;
  return new Date(Date.UTC(year, monthIdx, day)).toISOString().slice(0, 10);
}

// Turnier-Zelle → strukturierte Felder + source_ref. Feld-Extraktion nach dem
// Muster des Coverage-Parsers, erweitert um source_ref.
function mapCell(rawCell, week, src) {
  const segs = rawCell.split(/<br\s*\/?>/i).map((s) => s.trim());
  const monday = week ? weekToMonday(week, src) : null; // für tournament_monday UND Challenger-source_ref

  // Ort + Land (erstes <br>-Segment mit Komma, keine Draw-/Singles-Zeile).
  // WICHTIG: Wikilinks ZUERST auf den Anzeigetext reduzieren, DANN am LETZTEN Komma
  // trennen — sonst zerlegt ein Komma innerhalb eines Stadt-Wikilinks
  // (z. B. [[Palm Coast, Florida|Palm Coast]]) die Land-Extraktion.
  const locSeg = segs.find((s) => /,/.test(cleanText(s)) && !/Singles|Doubles|draws|itftennis|atptour/i.test(s));
  let city = null, countryRaw = null;
  if (locSeg) {
    const cl = cleanText(locSeg);
    const ci = cl.lastIndexOf(",");
    city = (ci >= 0 ? cl.slice(0, ci) : cl).trim() || null;
    countryRaw = ci >= 0 ? cl.slice(ci + 1).trim() : null;
    if (countryRaw) countryRaw = countryRaw.replace(/\s*[–-].*$/, "").trim() || null;
  }

  // Belag + Halle.
  const surfM = rawCell.match(/\b(Hard|Clay|Grass|Carpet)\b/i);
  const surface = surfM ? SURFACE_MAP[surfM[1].toLowerCase()] : null;
  // Halle nur bestimmbar, wenn ein Belag bekannt ist ((i) = Halle, sonst Freiluft).
  const indoorVal = surface ? /\(i\)/.test(rawCell) : null;

  // Kategorie.
  let category = null;
  if (/\bM15\b/.test(rawCell)) category = "M15";
  else if (/\bM25\b/.test(rawCell)) category = "M25";
  else { const c = rawCell.match(/Challenger\s*(\d+)/i); if (c) category = "Challenger " + c[1]; }

  // source_ref + name.
  let sourceRef = null, name = null, refReason = null;
  if (src.series === "ITF") {
    // ITF-Turnier-URL suchen; Code = Pfadsegment vor '/draws-and-results/' ODER letztes
    // Segment (Format variiert: '.../m-itf-tun-2025-032/draws-and-results/' vs.
    // '.../m-itf-fra-2025-001/'). Format-agnostisch über die Pfadsegmente.
    const um = rawCell.match(/https?:\/\/www\.itftennis\.com\/[^\s\]]+/i);
    if (um) {
      const parts = um[0].split("/").filter(Boolean);
      const di = parts.indexOf("draws-and-results");
      const codeSeg = di > 0 ? parts[di - 1] : parts[parts.length - 1];
      if (codeSeg && /^m-itf-/i.test(codeSeg)) sourceRef = "itf:" + codeSeg;
    }
    if (!sourceRef) refReason = "kein_itftennis_turniercode";
  } else {
    // Challenger: erster Wikilink im Namens-Segment (segs[0]) = Turnierseite.
    const lm = segs[0].match(/\[\[([^\]|]+?)(?:\|([^\]]+))?\]\]/);
    if (lm) {
      name = cleanText(lm[2] || lm[1]) || null;
      const target = lm[1].trim();
      // source_ref per TURNIERMONTAG (nicht per Namens-Suffix): atp:<seitenkennung>-<YYYY-MM-DD>.
      // Das roemische Suffix (II/III/IV) ist Wikipedia-Konvention und unzuverlaessig (kann
      // fehlen/sich aendern/vertippt sein, vgl. "Bari Challlenger"); der Montag ist eindeutig
      // und stabil — zwei Ausgaben desselben Challengers laufen nie in derselben Woche.
      if (monday) sourceRef = "atp:" + slug(target.replace(/^\d{4}\s/, "")) + "-" + monday;
      else refReason = "kein_datum_fuer_sourceref";
    } else refReason = "kein_challenger_wikilink";
  }

  return { city, countryRaw, surface, indoor: indoorVal, category, sourceRef, name, refReason, monday };
}

// ---------------------------------------------------------------------------
// Quellen
// ---------------------------------------------------------------------------
const Q = { "January–March": 1, "April–June": 2, "July–September": 3, "October–December": 4 };
const SOURCES = [];
for (const year of [2025, 2026]) {
  for (const span of Object.keys(Q))
    SOURCES.push({ series: "ITF", year, span, page: `${year} ITF Men's World Tennis Tour (${span})`,
      source: `wikipedia_itf_${year}_q${Q[span]}` });
  SOURCES.push({ series: "Challenger", year, page: `${year} ATP Challenger Tour`,
    source: `wikipedia_challenger_${year}` });
}
const pageUrl = (title) => "https://en.wikipedia.org/wiki/" + encodeURIComponent(title.replace(/ /g, "_"));

// ---------------------------------------------------------------------------
// Verarbeitung (Trockenlauf: nur bauen, nichts schreiben)
// ---------------------------------------------------------------------------
const kept = [];          // { record, claims }
const dropped = [];       // { page, week, city, reason }
const dropReasons = new Map();
const unknownCountries = new Map();
const pageStats = [];

function dropReasonBump(reason) { dropReasons.set(reason, (dropReasons.get(reason) || 0) + 1); }

const RUN_SOURCES = ONLY ? SOURCES.filter((s) => sourceKey(s) === ONLY) : SOURCES;
for (const src of RUN_SOURCES) {
  process.stdout.write(`${src.page}: `);
  const st = { ...src, rows: 0, keep: 0, drop: 0, error: null };
  try {
    const wt = await fetchWikitext(src.page);
    const url = pageUrl(src.page);
    for (const table of extractTables(wt)) {
      const head = table.slice(0, 600);
      if (!/Week of/i.test(head) || !/Tournament/i.test(head)) continue;
      const rows = table.split(/\n\|-/);
      let currentWeek = null;
      for (let ri = 1; ri < rows.length; ri++) {
        const cells = splitRowCells(rows[ri]);
        if (cells.length === 0) continue;
        let rest = cells;
        if (isWeekCell(cells[0])) { currentWeek = cells[0].trim(); rest = cells.slice(1); }
        const tcell = rest.find(isTournamentCell);
        if (!tcell) continue;
        st.rows++;

        const f = mapCell(tcell, currentWeek, src);

        // Nicht zugeordnete Ländernamen IMMER katalogisieren (zum Ergänzen der Tabelle).
        const iso = f.countryRaw ? COUNTRY_ISO[f.countryRaw] : undefined;
        if (f.countryRaw && !iso) unknownCountries.set(f.countryRaw, (unknownCountries.get(f.countryRaw) || 0) + 1);

        // Verwerfen (mit Grund) — nichts still verwerfen.
        if (!f.sourceRef) {
          st.drop++; dropReasonBump("keine_source_ref (" + (f.refReason || "unbekannt") + ")");
          dropped.push({ page: src.page, week: currentWeek, city: f.city, country: f.countryRaw, reason: "keine_source_ref: " + (f.refReason || "unbekannt") });
          continue;
        }
        if (!f.countryRaw) { st.drop++; dropReasonBump("land_fehlt"); dropped.push({ page: src.page, week: currentWeek, city: f.city, country: null, reason: "land_fehlt (kein Land im Kalender)" }); continue; }
        if (!iso) { st.drop++; dropReasonBump("land_unbekannt"); dropped.push({ page: src.page, week: currentWeek, city: f.city, country: f.countryRaw, reason: "land_unbekannt: " + f.countryRaw }); continue; }
        if (!f.monday) { st.drop++; dropReasonBump("kein_datum"); dropped.push({ page: src.page, week: currentWeek, city: f.city, country: f.countryRaw, reason: "kein_datum (Week of nicht parsebar)" }); continue; }

        // IDENTITÄTSZEILE — nur diese drei Felder gehen DIREKT in den Stamm
        // (definieren, welches Turnier gemeint ist; erfüllen die NOT-NULL-Constraints).
        // status/valid_from/Timestamps kommen aus DB-Defaults. Alle ÜBRIGEN Felder
        // werden ausschließlich als Claims geschrieben und später durch
        // scripts/resolve-tournaments.mjs (Domain-Regel) in den Stamm aufgelöst.
        const record = {
          source_ref: f.sourceRef,
          tournament_monday: f.monday,
          series: src.series === "ITF" ? "itf_wtt" : "challenger",
        };

        // Claims je Feld (Herkunft). Identitätsfelder werden zusätzlich als Claim
        // geführt (vollständige Provenance), obwohl der Stamm sie direkt gesetzt bekommt.
        const claims = [];
        const claim = (field, value, source, confidence) =>
          claims.push({ field_name: field, field_value: String(value), source, source_url: url, confidence });
        claim("tournament_monday", record.tournament_monday, src.source, CONF_OBSERVED);
        claim("series", record.series, src.source, CONF_OBSERVED);
        if (f.category != null) claim("category", f.category, src.source, CONF_OBSERVED);
        if (f.name != null) claim("name", f.name, src.source, CONF_OBSERVED);
        if (f.city != null) claim("city", f.city, src.source, CONF_OBSERVED);
        if (iso != null) claim("country", iso, src.source, CONF_OBSERVED);
        if (f.surface != null) claim("surface", f.surface, src.source, CONF_OBSERVED);
        if (f.indoor != null) claim("indoor", f.indoor, src.source, CONF_OBSERVED);

        // Preisgeld: ABGELEITET aus der Kategorie (nicht beobachtet) → eigene Quelle, geringere confidence.
        if (f.category && PRIZE_USD[f.category] != null) {
          claim("prize_money", PRIZE_USD[f.category], "abgeleitet_aus_kategorie", CONF_DERIVED);
          claim("prize_currency", "USD", "abgeleitet_aus_kategorie", CONF_DERIVED);
        }

        kept.push({ record, claims });
        st.keep++;
      }
    }
    console.log(`rows=${st.rows} keep=${st.keep} drop=${st.drop}`);
  } catch (err) {
    st.error = err.message;
    console.log(`FEHLER (${err.message})`);
  }
  pageStats.push(st);
  await sleep(1200);
}

// ---------------------------------------------------------------------------
// Optionaler SCHARFER Lauf (nur mit --write) — Service-Client, RLS-Bypass.
// ---------------------------------------------------------------------------
let writeSummary = null;
if (WRITE) {
  // Env NUR hier laden; Key wird NICHT ausgegeben/geloggt.
  const env = {};
  try {
    for (const line of readFileSync(join(process.cwd(), ".env.local"), "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z_0-9]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch { /* .env.local fehlt → unten Fehler */ }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || `https://${PROJECT_REF}.supabase.co`;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) { console.error("ABBRUCH: SUPABASE_SERVICE_ROLE_KEY nicht in .env.local gefunden."); process.exit(1); }

  const { createClient } = await import("@supabase/supabase-js");
  const svc = createClient(url, key, { db: { schema: "web" }, auth: { persistSession: false, autoRefreshToken: false } });

  let okT = 0, okC = 0, errN = 0;
  for (const { record, claims } of kept) {
    const { data, error } = await svc.from("tour_tournaments")
      .upsert(record, { onConflict: "source_ref" }).select("id").single();
    if (error || !data) { errN++; continue; }
    okT++;
    const rows = claims.map((c) => ({ ...c, tournament_id: data.id }));
    const { error: ce } = await svc.from("tour_tournament_claims")
      .upsert(rows, { onConflict: "tournament_id,field_name,source,field_value", ignoreDuplicates: true });
    if (ce) errN++; else okC += rows.length;
  }
  writeSummary = { okT, okC, errN };
}

// ---------------------------------------------------------------------------
// Bericht
// ---------------------------------------------------------------------------
const now = new Date().toISOString();
const md = [];
md.push(`# Wikipedia-Import — ${WRITE ? "SCHARFER LAUF" : "TROCKENLAUF (nichts geschrieben)"}`);
md.push("");
md.push(`> Erzeugt von \`scripts/wikipedia-import.mjs\` · Lauf: ${now}`);
md.push(`> Ziel: web.tour_tournaments + web.tour_tournament_claims. ${WRITE ? "" : "**Kein DB-Zugriff** in diesem Lauf."}`);
md.push("");
md.push(`## 1. Je Seite`);
md.push("");
md.push(`| Serie | Jahr | Seite | Zeilen | importierbar | verworfen | Fehler |`);
md.push(`|---|---|---|---:|---:|---:|---|`);
for (const s of pageStats) {
  const short = s.page.replace(/ ITF Men's World Tennis Tour /, " ITF ").replace(/ ATP Challenger Tour/, " Challenger");
  md.push(`| ${s.series} | ${s.year} | ${short} | ${s.rows} | ${s.keep} | ${s.drop} | ${s.error ?? "–"} |`);
}
md.push("");
md.push(`**Summe:** ${kept.length} importierbar, ${dropped.length} verworfen. Claims gesamt: ${kept.reduce((a, k) => a + k.claims.length, 0)}.`);
if (writeSummary) md.push(`\n**Geschrieben:** ${writeSummary.okT} Turniere, ${writeSummary.okC} Claims, ${writeSummary.errN} Fehler.`);
md.push("");

md.push(`## 2. Verworfene Zeilen nach Grund`);
md.push("");
for (const [reason, n] of [...dropReasons.entries()].sort((a, b) => b[1] - a[1])) md.push(`- **${reason}** — ${n}×`);
md.push("");
md.push(`### Alle verworfenen Zeilen (Seite · Woche · Ort · Land · Grund)`);
md.push("");
const t80 = (s) => (s == null ? "—" : (String(s).length > 80 ? String(s).slice(0, 80) + "…" : String(s)));
if (dropped.length === 0) md.push(`Keine.`);
for (const d of dropped) {
  const short = d.page.replace(/ ITF Men's World Tennis Tour /, " ITF ").replace(/ ATP Challenger Tour/, " Challenger");
  md.push(`- ${short} · ${d.week ?? "—"} · ${t80(d.city)} · ${t80(d.country)} · ${t80(d.reason)}`);
}
md.push("");

md.push(`## 3. Unbekannte Ländernamen (Tabelle ergänzen)`);
md.push("");
if (unknownCountries.size === 0) md.push(`Keine — alle vorkommenden Ländernamen sind zugeordnet.`);
for (const [name, n] of [...unknownCountries.entries()].sort((a, b) => b[1] - a[1])) md.push(`- \`${name}\` — ${n}×`);
md.push("");

md.push(`## 4. Stichprobe: 10 Datensätze — Identitätszeile (Stamm) + Claims (Herkunft)`);
md.push("");
md.push(`Der Import schreibt in \`tour_tournaments\` NUR die Identitätsfelder; alle übrigen Felder`);
md.push(`stehen als Claims und werden später von \`scripts/resolve-tournaments.mjs\` in den Stamm aufgelöst.`);
md.push("");
// Mischung aus ITF + Challenger.
const sample = [
  ...kept.filter((k) => k.record.series === "itf_wtt").slice(0, 5),
  ...kept.filter((k) => k.record.series === "challenger").slice(0, 5),
];
for (const { record, claims } of sample) {
  md.push(`### ${record.source_ref}`);
  md.push("```json");
  md.push("// tour_tournaments");
  md.push(JSON.stringify(record, null, 2));
  md.push("// tour_tournament_claims");
  md.push(JSON.stringify(claims, null, 2));
  md.push("```");
  md.push("");
}

// Jahreswechsel-Kontrolle: alle importierbaren Datensätze mit Montag im Dez/Jan.
md.push(`## 4b. Jahreswechsel-Kontrolle (tournament_monday im Dezember oder Januar)`);
md.push("");
md.push(`| source_ref | tournament_monday | Serie | Quelle (Seite) |`);
md.push(`|---|---|---|---|`);
const decJan = kept
  .filter((k) => /-(12|01)-/.test(k.record.tournament_monday))
  .sort((a, b) => a.record.tournament_monday < b.record.tournament_monday ? -1 : 1);
for (const k of decJan) {
  md.push(`| ${k.record.source_ref} | ${k.record.tournament_monday} | ${k.record.series} | ${k.claims[0]?.source ?? "—"} |`);
}
md.push("");
md.push(`_${decJan.length} Datensätze im Dez/Jan. Prüfpunkt: Dezember-Wochen auf einer Q1-/Challenger-Jahresseite müssen ins VORJAHR fallen._`);
md.push("");

md.push(`## 5. Hinweise`);
md.push("");
md.push(`- **Trockenlauf ist Voreinstellung.** Ohne \`--write\` wird keine DB-Verbindung geöffnet. Scharf: \`node scripts/wikipedia-import.mjs --write\`.`);
md.push(`- **Idempotenz** (scharf): Stamm \`upsert onConflict source_ref\`; Claims \`upsert onConflict (tournament_id,field_name,source,field_value) ignoreDuplicates\`.`);
md.push(`- **Preisgeld** ist ABGELEITET (Claim-Quelle \`abgeleitet_aus_kategorie\`, confidence ${CONF_DERIVED}). Die Challenger-Währung **USD** ist eine Annahme — bei Bedarf die Tabelle \`PRIZE_USD\`/\`prize_currency\` korrigieren.`);
md.push(`- **Länder** kommen ausschließlich aus der expliziten Tabelle \`COUNTRY_ISO\`; unbekannte Namen führen zum Verwerfen (§2/§3), kein Raten.`);
md.push("");

const out = md.join("\n");
const __dirname = dirname(fileURLToPath(import.meta.url));
writeFileSync(join(__dirname, "wikipedia-import-report.md"), out, "utf8");
writeFileSync(join(homedir(), "Downloads", "wikipedia-import-report.md"), out, "utf8");
const distinctRefs = new Set(kept.map((k) => k.record.source_ref)).size;
console.log(`\n${WRITE ? "SCHARF" : "TROCKENLAUF"} · importierbar=${kept.length} (distinkt=${distinctRefs}) verworfen=${dropped.length}`);
console.log(`Bericht: scripts/wikipedia-import-report.md (+ ~/Downloads)`);
