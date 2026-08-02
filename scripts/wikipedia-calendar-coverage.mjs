// wikipedia-calendar-coverage.mjs
//
// Misst, wie vollständig die Wikipedia-Jahreskalender der ITF Men's World Tennis Tour
// und der ATP Challenger Tour die Zielregion (Europa + Türkei/Tunesien/Ägypten/Marokko)
// abdecken — als Bootstrap-Quelle für unseren eigenen Turnierstamm.
//
// Reines Node (ESM), keine Dependencies — Node 24 hat fetch eingebaut.
// KEINE App-Änderung, KEIN DB-Zugriff. Zugriff ausschließlich über die MediaWiki-API
// (kein HTML-Scraping). Struktur nach dem Muster von scripts/wikidata-coverage.mjs.
//
// Ausführen:  node scripts/wikipedia-calendar-coverage.mjs
// Ergebnis:   scripts/wikipedia-calendar-coverage-report.md  (+ Kopie in ~/Downloads)

import { writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const API = "https://en.wikipedia.org/w/api.php";
const USER_AGENT =
  "MatchupTournamentCoverage/1.0 (https://matchup-app.com; wiederhold.martin@web.de) node-fetch";

const YEARS = [2025, 2026];
const MONTH_SPANS = ["January–March", "April–June", "July–September", "October–December"];

// Zu prüfende Felder (Reihenfolge = Berichtsreihenfolge).
const FIELDS = [
  { key: "name", label: "Turniername" },
  { key: "city", label: "Ort" },
  { key: "country", label: "Land" },
  { key: "week", label: "Woche/Datum" },
  { key: "surface", label: "Belag" },
  { key: "indoorKnown", label: "Halle/Freiluft" },
  { key: "category", label: "Kategorie" },
  { key: "prizeInTable", label: "Preisgeld (in Tabelle)" },
  { key: "prizeDerivable", label: "Preisgeld (aus Kategorie ableitbar)" },
];

// ---------------------------------------------------------------------------
// Zielregion: englische Ländernamen (wie in den Kalendertabellen geschrieben)
// ---------------------------------------------------------------------------
const EUROPE_NAMES = new Set(
  [
    "Albania", "Andorra", "Austria", "Belarus", "Belgium", "Bosnia and Herzegovina",
    "Bulgaria", "Croatia", "Cyprus", "Czech Republic", "Czechia", "Denmark", "Estonia",
    "Finland", "France", "Germany", "Greece", "Hungary", "Iceland", "Ireland", "Italy",
    "Kosovo", "Latvia", "Liechtenstein", "Lithuania", "Luxembourg", "Malta", "Moldova",
    "Monaco", "Montenegro", "Netherlands", "North Macedonia", "Norway", "Poland",
    "Portugal", "Romania", "Russia", "San Marino", "Serbia", "Slovakia", "Slovenia",
    "Spain", "Sweden", "Switzerland", "Ukraine", "United Kingdom", "Great Britain",
    "England", "Scotland", "Wales", "Vatican City", "Georgia", "Armenia", "Azerbaijan",
  ].map((s) => s.toLowerCase()),
);
const REGION_EXTRA = new Set(["turkey", "türkiye", "turkiye", "tunisia", "egypt", "morocco"]);

function inRegion(country) {
  if (!country) return false;
  const c = country.trim().toLowerCase();
  return EUROPE_NAMES.has(c) || REGION_EXTRA.has(c);
}

// Preisgeld je Kategorie ableitbar? (M15=15k, M25=25k USD; Challenger 50/75/100/125/175)
function prizeDerivable(category) {
  if (!category) return false;
  return /^M(15|25)$/.test(category) || /^Challenger\s*\d+$/.test(category);
}

// ---------------------------------------------------------------------------
// MediaWiki-API
// ---------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Baut die Content-Abruf-URL (im Bericht als „API-Aufruf" dokumentiert).
function contentUrl(title) {
  const p = new URLSearchParams({
    action: "query", format: "json", formatversion: "2",
    prop: "revisions", rvslots: "main", rvprop: "content", titles: title,
  });
  return `${API}?${p.toString()}`;
}

// Ruft eine URL ab (Timeout + 1 Retry). Wirft bei endgültigem Fehler.
async function apiGet(url) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 60_000);
    try {
      const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return await res.json();
    } catch (err) {
      clearTimeout(timer);
      if (attempt === 2) throw err;
      await sleep(3000);
    }
  }
}

// Holt den Wikitext einer Seite; wirft, wenn die Seite fehlt.
async function fetchWikitext(title) {
  const json = await apiGet(contentUrl(title));
  const page = json?.query?.pages?.[0];
  if (!page || page.missing) throw new Error("Seite fehlt (missing)");
  const content = page?.revisions?.[0]?.slots?.main?.content;
  if (!content) throw new Error("kein Wikitext");
  return content;
}

// ---------------------------------------------------------------------------
// Wikitext-Parser
// ---------------------------------------------------------------------------

// Alle {| … |}-Tabellenblöcke extrahieren — ZEILENBASIERT und verschachtelungssicher.
// (Wichtig: `|}` darf nur am Zeilenanfang als Tabellenende gelten. Sonst schließt z. B.
//  `{{flagicon|}}` in einer Zelle die Tabelle vorzeitig → massive Untererfassung.)
function extractTables(wt) {
  const tables = [];
  let depth = 0, buf = [];
  for (const line of wt.split("\n")) {
    const t = line.trimStart();
    if (t.startsWith("{|")) { if (depth === 0) buf = []; depth++; buf.push(line); continue; }
    if (depth > 0) {
      buf.push(line);
      if (t.startsWith("|}")) { depth--; if (depth === 0) tables.push(buf.join("\n")); }
    }
  }
  return tables;
}

// Text bereinigen: Wikilinks → Anzeigetext, Templates/HTML/Fettung entfernen.
function cleanText(s) {
  return String(s)
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g, "$1")
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "")
    .replace(/<ref[^>]*\/>/gi, "")
    .replace(/'''?/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Attribut-Präfix einer Zelle abschneiden (z. B. `rowspan=2 style="…"|Inhalt`).
function stripAttrs(cell) {
  let depth = 0;
  for (let k = 0; k < cell.length; k++) {
    const two = cell.substr(k, 2);
    if (two === "[[" || two === "{{") { depth++; k++; continue; }
    if (two === "]]" || two === "}}") { if (depth > 0) depth--; k++; continue; }
    if (depth === 0 && cell[k] === "|") {
      const left = cell.slice(0, k);
      if (/=/.test(left) || /\b(rowspan|colspan|style|width|align|scope|bgcolor|valign|class)\b/i.test(left)) {
        return cell.slice(k + 1);
      }
      return cell;
    }
  }
  return cell;
}

// Zeile in Zellen zerlegen — tiefen-bewusst (|| inline, |/! am Zeilenanfang).
function splitRowCells(rowText) {
  const cells = [];
  let cur = "", depth = 0, inCell = false;
  for (let line of rowText.split("\n")) {
    if (depth === 0 && /^\s*[|!]/.test(line) && !/^\s*\|\}/.test(line)) {
      if (inCell) { cells.push(cur); cur = ""; }
      inCell = true;
      line = line.replace(/^\s*(?:\|\||!!|\||!)/, "");
    } else if (inCell) {
      cur += "\n";
    } else {
      continue;
    }
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
const isWeekCell = (s) => new RegExp(`^(?:\\d{1,2}\\s+)?(?:${MONTHS})(?:\\s+\\d{1,2})?$`).test(s.trim());
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

// Ist eine Zelle eine Turnier-Zelle? (mehrzeilig via <br> + Belag/Kategorie)
function isTournamentCell(cell) {
  if (!/<br/i.test(cell)) return false;
  return /\b(Hard|Clay|Grass|Carpet)\b/i.test(cell) || /\bM(15|25)\b/.test(cell) || /Challenger\s*\d/i.test(cell);
}

// Felder aus einer Turnier-Zelle ziehen.
function parseTournamentCell(cell, week, series, year, page) {
  const links = [...cell.matchAll(/\[\[([^\]|]+?)(?:\|([^\]]+))?\]\]/g)].map((m) => ({
    target: m[1].trim(), disp: (m[2] || m[1]).trim(),
  }));
  const yearLink = links.find((l) => /^\d{4}\b/.test(l.target) && !/Singles|Doubles/i.test(l.target));
  const cityLink = links.find((l) => !/^\d{4}/.test(l.target) && !/Singles|Doubles/i.test(l.target));

  const name = yearLink ? cleanText(yearLink.disp) : null; // eigener Turniername (v. a. Challenger)
  const wikilinkOwn = !!yearLink; // Wikilink auf eigene (jahresbezogene) Turnierseite

  // Ort + Land aus dem <br>-Segment mit Komma.
  const segs = cell.split(/<br\s*\/?>/i).map((s) => s.trim());
  const locSeg = segs.find((s) => /,/.test(s) && !/Singles|Doubles|draws|itftennis|atptour/i.test(s));
  let city = null, country = null;
  if (locSeg) {
    const ci = locSeg.indexOf(",");
    city = cleanText(locSeg.slice(0, ci)) || null;
    country = cleanText(locSeg.slice(ci + 1)) || null;
    if (country) country = country.replace(/\s*[–-].*$/, "").trim() || null; // evtl. Rest abschneiden
  }
  if (!city && cityLink) city = cleanText(cityLink.disp) || null;

  const surfM = cell.match(/\b(Hard|Clay|Grass|Carpet)\b/i);
  const surface = surfM ? cap(surfM[1]) : null;
  const indoor = /\(i\)/.test(cell); // Halle
  const indoorKnown = surface != null; // Halle/Freiluft bestimmbar, sobald Belag bekannt (Freiluft = Default)

  let category = null;
  if (/\bM15\b/.test(cell)) category = "M15";
  else if (/\bM25\b/.test(cell)) category = "M25";
  else {
    const c = cell.match(/Challenger\s*(\d+)/i);
    if (c) category = "Challenger " + c[1];
    else if (/Challenger/i.test(cell)) category = "Challenger";
  }

  const prizeInTable = /US\$|\$\s?\d|€\s?\d|\bUSD\b/.test(cell); // Preisgeld direkt in der Zelle?

  return {
    series, year, page,
    name, city, country,
    region: inRegion(country),
    week: week || null,
    surface, indoor, indoorKnown,
    category,
    prizeInTable,
    prizeDerivable: prizeDerivable(category),
    wikilinkOwn,
  };
}

// Eine Kalendertabelle → Turnierliste.
function parseCalendarTable(table, series, year, page) {
  const out = [];
  const rows = table.split(/\n\|-/); // erste Gruppe = Header
  let currentWeek = null;
  for (let ri = 1; ri < rows.length; ri++) {
    const cells = splitRowCells(rows[ri]);
    if (cells.length === 0) continue;
    let rest = cells;
    if (isWeekCell(cells[0])) { currentWeek = cells[0].trim(); rest = cells.slice(1); }
    const tcell = rest.find(isTournamentCell);
    if (!tcell) continue;
    out.push(parseTournamentCell(tcell, currentWeek, series, year, page));
  }
  return out;
}

// Ganze Seite → Turnierliste (nur Tabellen mit „Week of"+„Tournament"-Header).
function parsePage(wikitext, series, year, page) {
  const out = [];
  for (const table of extractTables(wikitext)) {
    const head = table.slice(0, 600);
    if (/Week of/i.test(head) && /Tournament/i.test(head)) {
      out.push(...parseCalendarTable(table, series, year, page));
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Quellen
// ---------------------------------------------------------------------------
const SOURCES = [];
for (const year of YEARS) {
  SOURCES.push({ series: "Challenger", year, page: `${year} ATP Challenger Tour` });
  SOURCES.push({ series: "ITF", year, page: `${year} ITF Men's World Tennis Tour` }); // Übersicht
  for (const span of MONTH_SPANS) {
    SOURCES.push({ series: "ITF", year, page: `${year} ITF Men's World Tennis Tour (${span})` });
  }
}

// ---------------------------------------------------------------------------
// Hauptlauf
// ---------------------------------------------------------------------------
const pageResults = []; // { series, year, page, url, ok, error, count }
const byGroup = new Map(); // "series|year" → Turnierliste

for (const src of SOURCES) {
  const key = `${src.series}|${src.year}`;
  if (!byGroup.has(key)) byGroup.set(key, []);
  const url = contentUrl(src.page);
  process.stdout.write(`${src.page}: `);
  try {
    const wt = await fetchWikitext(src.page);
    const list = parsePage(wt, src.series, src.year, src.page);
    byGroup.get(key).push(...list);
    pageResults.push({ ...src, url, ok: true, error: null, count: list.length });
    console.log(`${list.length} Turniere`);
  } catch (err) {
    pageResults.push({ ...src, url, ok: false, error: err.message, count: 0 });
    console.log(`FEHLER (${err.message})`);
  }
  await sleep(1200); // Rate-Limit
}

// Deduplizieren je Gruppe (Sicherheitsnetz: gleiche Woche+Ort+Kategorie).
function dedupe(list) {
  const seen = new Set();
  const out = [];
  for (const t of list) {
    const k = `${t.week}|${(t.name || t.city || "").toLowerCase()}|${t.category}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

const groups = []; // { series, year, list, region, completeness, wikilinkOwn }
for (const [key, rawList] of byGroup) {
  const [series, yearStr] = key.split("|");
  const list = dedupe(rawList);
  const region = list.filter((t) => t.region);
  const comp = {};
  for (const f of FIELDS) {
    const n = list.filter((t) => t[f.key]).length;
    comp[f.key] = { n, pct: list.length ? (n / list.length) * 100 : 0 };
  }
  const wl = list.filter((t) => t.wikilinkOwn).length;
  const indoorN = list.filter((t) => t.indoor).length;
  groups.push({ series, year: Number(yearStr), list, region, completeness: comp, wikilinkOwn: wl, indoorN });
}
groups.sort((a, b) => a.series.localeCompare(b.series) || a.year - b.year);

// Stichprobe: 20 Turniere der Zielregion (quer über Gruppen).
const sample = groups.flatMap((g) => g.region).slice(0, 20);

// ---------------------------------------------------------------------------
// Bericht
// ---------------------------------------------------------------------------
const now = new Date().toISOString();
const pct = (x) => `${x.toFixed(1)}%`;
const md = [];
md.push(`# Wikipedia-Kalender-Abdeckung: ITF Men's World Tennis Tour & ATP Challenger Tour`);
md.push("");
md.push(`> Automatisch erzeugt von \`scripts/wikipedia-calendar-coverage.mjs\` · Lauf: ${now}`);
md.push(`> Quelle: MediaWiki-API (${API}), en.wikipedia.org. Kein HTML-Scraping.`);
md.push(`> Region = Europa (feste Länderliste) ∪ Türkei, Tunesien, Ägypten, Marokko.`);
md.push("");
md.push(`## Methodik`);
md.push("");
md.push(`Wikitext je Seite über \`action=query&prop=revisions&rvslots=main\` geladen, Kalendertabellen`);
md.push(`(Header „Week of"+„Tournament") aus dem Wikitext geparst. Jede Seite ist isoliert`);
md.push(`(Timeout 60s, 1 Retry); ein Fehlschlag beendet den Lauf nicht und steht unten als Fehler.`);
md.push(`ITF-Turniere stammen aus den Quartalsseiten, Challenger aus der Jahresseite.`);
md.push("");
md.push(`**Preisgeld** steht nicht in den Kalendertabellen — nur als Spanne im Fließtext. Daher getrennt:`);
md.push(`„Preisgeld (in Tabelle)" (praktisch 0) vs. „Preisgeld (aus Kategorie ableitbar)" (M15=15k, M25=25k,`);
md.push(`Challenger 50/75/100/125/175). „Halle/Freiluft" gilt als bestimmbar, sobald der Belag bekannt ist`);
md.push(`(Freiluft = Default, Halle über „(i)").`);
md.push("");

// 0. Seitenstatus
md.push(`## 1. Abgerufene Seiten (Status)`);
md.push("");
md.push(`| Serie | Jahr | Seite | Status | Turniere |`);
md.push(`|---|---|---|---|---:|`);
for (const p of pageResults) {
  md.push(`| ${p.series} | ${p.year} | ${p.page} | ${p.ok ? "OK" : `FEHLT/FEHLER: ${p.error}`} | ${p.count} |`);
}
md.push("");

// 1. Turnierzahlen
md.push(`## 2. Turnierzahlen je Serie und Jahr`);
md.push("");
md.push(`| Serie | Jahr | Turniere gesamt | davon in Region | Wikilink eigene Seite | davon Halle „(i)" |`);
md.push(`|---|---|---:|---:|---:|---:|`);
for (const g of groups) {
  const wlPct = g.list.length ? ` (${pct((g.wikilinkOwn / g.list.length) * 100)})` : "";
  md.push(`| ${g.series} | ${g.year} | ${g.list.length} | ${g.region.length} | ${g.wikilinkOwn}${wlPct} | ${g.indoorN} |`);
}
md.push("");

// 2. Feldvollständigkeit
md.push(`## 3. Feldvollständigkeit (absolut / Prozent, bezogen auf „Turniere gesamt")`);
md.push("");
md.push(`| Serie | Jahr | n | ${FIELDS.map((f) => f.label).join(" | ")} |`);
md.push(`|---|---|---:|${FIELDS.map(() => "---:").join("|")}|`);
for (const g of groups) {
  const cells = FIELDS.map((f) => `${g.completeness[f.key].n} / ${pct(g.completeness[f.key].pct)}`);
  md.push(`| ${g.series} | ${g.year} | ${g.list.length} | ${cells.join(" | ")} |`);
}
md.push("");

// 3. Stichprobe
md.push(`## 4. Stichprobe (${sample.length} Turniere der Zielregion)`);
md.push("");
md.push(`| Serie | Jahr | Name | Ort | Land | Woche | Belag | Halle | Kategorie | Preis ableitbar | Wikilink |`);
md.push(`|---|---|---|---|---|---|---|---|---|---|---|`);
for (const t of sample) {
  const v = (x) => (x ? String(x).replace(/\|/g, "\\|") : "—");
  md.push(
    `| ${t.series} | ${t.year} | ${v(t.name)} | ${v(t.city)} | ${v(t.country)} | ${v(t.week)} | ${v(t.surface)} | ${t.indoor ? "ja" : "—"} | ${v(t.category)} | ${t.prizeDerivable ? "ja" : "—"} | ${t.wikilinkOwn ? "ja" : "—"} |`,
  );
}
md.push("");

// 4. API-Aufrufe im Volltext
md.push(`## 5. Verwendete API-Aufrufe (Volltext)`);
md.push("");
md.push(`Existenzprüfung der Titel (einmalig):`);
md.push("");
md.push("```");
md.push(`${API}?action=query&format=json&redirects=1&titles=<Titel1>|<Titel2>|…`);
md.push("```");
md.push("");
md.push(`Inhalt je Seite:`);
md.push("");
for (const p of pageResults) {
  md.push(`- ${p.ok ? "✓" : "✗"} \`${p.url}\``);
}
md.push("");
md.push(`## 6. Hinweise`);
md.push("");
md.push(`- Alle Zahlen stammen aus dem geparsten Wikitext; nichts ist geschätzt oder ergänzt.`);
md.push(`- „Wikilink eigene Seite" = Turnier-Zelle enthält einen Wikilink, dessen Ziel mit einer Jahreszahl`);
md.push(`  beginnt (eigene Turnier-Edition-Seite mit exakten Daten). Bei ITF sind Wikilinks meist Stadt-Links → niedrige Quote.`);
md.push(`- Land wird als Klartext hinter dem Ort geparst; uneinheitliche Zellen können einzelne Felder leer lassen (nicht geglättet).`);
md.push("");

const out = md.join("\n");
const __dirname = dirname(fileURLToPath(import.meta.url));
const repoPath = join(__dirname, "wikipedia-calendar-coverage-report.md");
const downloadsPath = join(homedir(), "Downloads", "wikipedia-calendar-coverage-report.md");
writeFileSync(repoPath, out, "utf8");
writeFileSync(downloadsPath, out, "utf8");
console.log(`\nBericht geschrieben:\n  ${repoPath}\n  ${downloadsPath}`);
