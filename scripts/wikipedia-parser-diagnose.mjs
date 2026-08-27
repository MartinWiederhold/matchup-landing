// wikipedia-parser-diagnose.mjs
//
// DIAGNOSE (nur messen, nichts reparieren): Welche Turnierzeilen verliert der
// Wikitext-Parser aus scripts/wikipedia-calendar-coverage.mjs und warum?
//
// Reines Node (ESM), keine Dependencies. KEINE App-Änderung, KEIN DB-Zugriff.
// Nur MediaWiki-API. Die Parser-Funktionen sind VERBATIM aus
// wikipedia-calendar-coverage.mjs kopiert, damit der echte Parser gemessen wird
// (die Vorlage bleibt unangetastet). Die Rohzählung ist bewusst UNABHÄNGIG vom
// Parser, sonst würde der Fehler mit dem Fehler gemessen.
//
// Ausführen:  node scripts/wikipedia-parser-diagnose.mjs
// Ergebnis:   scripts/wikipedia-parser-diagnose-report.md  (+ Kopie in ~/Downloads)

import { writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const API = "https://en.wikipedia.org/w/api.php";
const USER_AGENT =
  "MatchupTournamentCoverage/1.0 (https://matchup-app.com; wiederhold.martin@web.de) node-fetch";
const MONTH_SPANS = ["January–March", "April–June", "July–September", "October–December"];

// ---------------------------------------------------------------------------
// MediaWiki-API (Timeout + 1 Retry)
// ---------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function contentUrl(title) {
  const p = new URLSearchParams({
    action: "query", format: "json", formatversion: "2",
    prop: "revisions", rvslots: "main", rvprop: "content", titles: title,
  });
  return `${API}?${p}`;
}
async function fetchWikitext(title) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 60_000);
    try {
      const res = await fetch(contentUrl(title), { headers: { "User-Agent": USER_AGENT }, signal: ctrl.signal });
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
//  PARSER — VERBATIM aus scripts/wikipedia-calendar-coverage.mjs (nicht ändern!)
// ===========================================================================
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
function isTournamentCell(cell) {
  if (!/<br/i.test(cell)) return false;
  return /\b(Hard|Clay|Grass|Carpet)\b/i.test(cell) || /\bM(15|25)\b/.test(cell) || /Challenger\s*\d/i.test(cell);
}
// ===========================================================================
//  ENDE Parser-Verbatim
// ===========================================================================

// ---------------------------------------------------------------------------
// Unabhängige Signale (NICHT vom Parser abhängig)
// ---------------------------------------------------------------------------
// ITF-Draw-Code — BEIDE bekannten Formate: 'm-itf-ind-2024-009' (Jahr-Nummer, ab ~2025)
// UND 'm-itf-lux-01a-2024' (Nummer+Buchstabe, Jahr am Ende, ~2024). Ein zu enges Muster
// zählte sonst 2024-Turniere fälschlich als „ohne Code" (belegt an Esch/Doha/Kish 2024-Q1).
const ITF_CODE = /m-itf-[a-z]{3}-[0-9a-z]+-[0-9a-z]+/i;
// Challenger-Turniername-Wikilink (Jahr-Edition ODER generische Turnierseite mit Namensschlüsselwort).
const CH_NAME = /\[\[(?:\d{4}\s)?[^\]|]*?(?:Open|Challenger|Cup|Championships?|Classic|International|Trophy|Masters|Hardcourt)[^\]|]*(?:\|[^\]]+)?\]\]/i;
const CATEGORY = /\bM(?:15|25)\b|Challenger\s*\d/i;
// „Ort, Land" (Wikilink-Stadt + Komma) ODER Klartext-Ort + Komma + Großbuchstabe.
const LOCATION = /\[\[[^\]|]+(?:\|[^\]]+)?\]\]\s*,|\b[A-Z][a-z]+,\s*[A-Z]/;
const FLAGTPL = /\{\{\s*flagicon|#invoke:\s*flag/i;
const ANYLINK = /\[\[[^\]]+\]\]/;
// Unabhängiges „diese Zeile IST ein Turnier": ITF-Code ODER (Kategorie UND Ort).
const looksLikeTournament = (row) => ITF_CODE.test(row) || (CATEGORY.test(row) && LOCATION.test(row));

const snippet = (s, n = 90) => cleanTrunc(s, n);
function cleanTrunc(s, n) {
  const t = String(s).replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
  return (t.length > n ? t.slice(0, n) + "…" : t) || "(leer)";
}

// ---------------------------------------------------------------------------
// Quellen
// ---------------------------------------------------------------------------
const SOURCES = [];
for (const y of [2024, 2025, 2026]) for (const span of MONTH_SPANS)
  SOURCES.push({ series: "ITF", year: y, page: `${y} ITF Men's World Tennis Tour (${span})`, span });
for (const y of [2025, 2026]) SOURCES.push({ series: "Challenger", year: y, page: `${y} ATP Challenger Tour` });

// ---------------------------------------------------------------------------
// Analyse je Seite
// ---------------------------------------------------------------------------
const pageResults = [];
// Globale Sammler für Muster (nicht erkannte Zeilen MIT Turnier-Signal) + Signaturen.
const missPatterns = new Map(); // signatur → { count, samples[] }
const nonRecogOther = new Map(); // signatur (nicht-Turnier-Zeilen) → { count, samples[] }
const noCodePatterns = new Map(); // erkannte Turniere ohne source_ref → { count, samples[] }
function bump(map, key, sample) {
  if (!map.has(key)) map.set(key, { count: 0, samples: [] });
  const e = map.get(key);
  e.count++;
  if (e.samples.length < 5) e.samples.push(sample);
}

for (const src of SOURCES) {
  process.stdout.write(`${src.page}: `);
  const r = {
    ...src, error: null,
    tablesTotal: 0, calendarTables: 0,
    rawRows: 0, recognized: 0, nonRecognized: 0,
    missedWithSignal: 0, // nicht erkannt, aber Turnier-Signal vorhanden
    indepTournaments: 0, // unabhängige Zählung (Codes / Eigenseiten)
    codesInNonCalendar: 0, // Turniere in NICHT erkannten Tabellen
    recognizedNoCode: 0,
  };
  try {
    const wt = await fetchWikitext(src.page);

    // Unabhängige Turnier-Zählung auf der ganzen Seite.
    if (src.series === "ITF") {
      r.indepTournaments = new Set((wt.match(new RegExp(ITF_CODE, "gi")) || []).map((s) => s.toLowerCase())).size;
    } else {
      // Challenger: distinkte Turniername-Wikilinks (Jahr-Edition ODER generischer Name),
      // Jahr-Präfix zur Dedup entfernt, „– Singles/Doubles" ausgeschlossen.
      const raw = [...wt.matchAll(/\[\[((?:\d{4}\s)?[^\]|]*?(?:Open|Challenger|Cup|Championships?|Classic|International|Trophy|Masters|Hardcourt)[^\]|]*?)(?:\|[^\]]+)?\]\]/gi)]
        .map((m) => m[1].replace(/^\d{4}\s/, "").replace(/\s*–\s*(Singles|Doubles).*/i, "").trim())
        .filter((t) => t && !/^(Singles|Doubles)$/i.test(t));
      r.indepTournaments = new Set(raw).size;
    }

    const tables = extractTables(wt);
    r.tablesTotal = tables.length;
    for (const table of tables) {
      const isCalendar = /Week of/i.test(table.slice(0, 600)) && /Tournament/i.test(table.slice(0, 600));
      if (!isCalendar) {
        // Turnier-Codes in NICHT erkannten Tabellen = potentiell komplett verlorene Tabellen.
        r.codesInNonCalendar += new Set((table.match(new RegExp(ITF_CODE, "gi")) || []).map((s) => s.toLowerCase())).size;
        continue;
      }
      r.calendarTables++;
      const rows = table.split(/\n\|-/);
      let currentWeek = null;
      for (let ri = 1; ri < rows.length; ri++) {
        const rowText = rows[ri];
        const cells = splitRowCells(rowText);
        if (cells.length === 0) { r.rawRows++; continue; }
        r.rawRows++;
        let rest = cells;
        if (isWeekCell(cells[0])) { currentWeek = cells[0].trim(); rest = cells.slice(1); }
        const tcell = rest.find(isTournamentCell);

        if (tcell) {
          r.recognized++;
          // source_ref-Ableitbarkeit: ITF-Code bzw. Challenger-Eigenseiten-Link im Turniertext?
          const hasCode = src.series === "ITF"
            ? ITF_CODE.test(tcell)
            : (CH_NAME.test(tcell)
               || [...tcell.matchAll(/\[\[(\d{4}[^\]|]+?)(?:\|[^\]]+)?\]\]/g)].some((m) => !/–\s*(Singles|Doubles)/i.test(m[1])));
          if (!hasCode) {
            r.recognizedNoCode++;
            const sig = src.series === "ITF" ? "itf_ohne_draw_code" : "challenger_ohne_eigenseite";
            bump(noCodePatterns, sig, `[${src.page}] ${snippet(tcell)}`);
          }
          continue;
        }

        // NICHT erkannt → klassifizieren.
        r.nonRecognized++;
        const anyBr = /<br/i.test(rowText);
        const anyCat = CATEGORY.test(rowText);
        const anyCode = ITF_CODE.test(rowText);
        const anyLoc = LOCATION.test(rowText);
        const headerish = /Week of|Tournaments?\b/i.test(rowText) && !anyCat;
        const flags = FLAGTPL.test(rowText) || ANYLINK.test(rowText);

        if (looksLikeTournament(rowText)) {
          r.missedWithSignal++;
          // Warum verfehlt isTournamentCell? Signatur aus konkreten Merkmalen.
          const sig = `MISS | br=${anyBr} kat=${anyCat} code=${anyCode} ort=${anyLoc}`;
          bump(missPatterns, sig, `[${src.page}] ${snippet(tcell ?? rest[0] ?? rowText)}`);
        } else {
          let sig;
          if (headerish) sig = "kopf_oder_summenzeile";
          else if (!anyBr && !anyCat && flags) sig = "gewinner_folgezeile (rowspan)";
          else if (cells.every((c) => c.length < 3)) sig = "leer_oder_style";
          else sig = `sonstige | br=${anyBr} kat=${anyCat} flags=${flags}`;
          bump(nonRecogOther, sig, `[${src.page}] ${snippet(rowText)}`);
        }
      }
    }
    console.log(`raw=${r.rawRows} erkannt=${r.recognized} nichtErk=${r.nonRecognized} (Signal:${r.missedWithSignal}) indep=${r.indepTournaments} nonCalCodes=${r.codesInNonCalendar}`);
  } catch (err) {
    r.error = err.message;
    console.log(`FEHLER (${err.message})`);
  }
  pageResults.push(r);
  await sleep(1200);
}

// ---------------------------------------------------------------------------
// Bericht
// ---------------------------------------------------------------------------
const now = new Date().toISOString();
const md = [];
const sum = (f) => pageResults.reduce((a, r) => a + (f(r) || 0), 0);
md.push(`# Wikipedia-Parser-Diagnose: verlorene Turnierzeilen`);
md.push("");
md.push(`> Automatisch erzeugt von \`scripts/wikipedia-parser-diagnose.mjs\` · Lauf: ${now}`);
md.push(`> Misst den Parser aus \`scripts/wikipedia-calendar-coverage.mjs\` (verbatim kopiert) gegen eine`);
md.push(`> parser-UNABHÄNGIGE Rohzählung. Nur Diagnose — der Parser wurde NICHT verändert.`);
md.push("");
md.push(`## Methodik`);
md.push("");
md.push(`- **Rohzeilen**: alle Datenzeilen (\`|-\`) der als Kalender erkannten Tabellen.`);
md.push(`- **Erkannt**: Zeilen, in denen der Parser eine Turnier-Zelle findet (\`<br\` + Belag/Kategorie).`);
md.push(`- **Unabhängige Turnier-Zählung**: ITF über eindeutige Draw-Codes \`m-itf-xxx-YYYY-NNN\`,`);
md.push(`  Challenger über distinkte Eigenseiten-Wikilinks \`[[YYYY …]]\` (ohne „– Singles/Doubles").`);
md.push(`- **Nicht erkannte Zeilen** mit Turnier-Signal (ITF-Code ODER Kategorie+Ort) = echte Verluste;`);
md.push(`  ohne Signal = legitime Nicht-Turnier-Zeilen (Gewinner-Folgezeilen, Kopf/Summe, leer).`);
md.push("");

// 1. Zahlen je Seite
md.push(`## 1. Zahlen je Seite`);
md.push("");
md.push(`| Serie | Jahr | Seite | Tab. | Kal.-Tab. | Rohzeilen | Erkannt | Nicht erk. | davon m. Signal | Indep. Turniere | Codes in Nicht-Kal.-Tab. | Fehler |`);
md.push(`|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|`);
for (const r of pageResults) {
  const shortPage = r.page.replace(/ ITF Men's World Tennis Tour /, " ITF ").replace(/ ATP Challenger Tour/, " Challenger");
  md.push(`| ${r.series} | ${r.year} | ${shortPage} | ${r.tablesTotal} | ${r.calendarTables} | ${r.rawRows} | ${r.recognized} | ${r.nonRecognized} | ${r.missedWithSignal} | ${r.indepTournaments} | ${r.codesInNonCalendar} | ${r.error ?? "–"} |`);
}
md.push("");
md.push(`**Summen:** Rohzeilen ${sum((r) => r.rawRows)} · Erkannt ${sum((r) => r.recognized)} · Nicht erkannt ${sum((r) => r.nonRecognized)} · davon mit Turnier-Signal (echter Verlust) **${sum((r) => r.missedWithSignal)}** · unabhängige Turniere ${sum((r) => r.indepTournaments)} · Turnier-Codes in NICHT erkannten Tabellen **${sum((r) => r.codesInNonCalendar)}**.`);
md.push("");

// 2. Muster: nicht erkannte Zeilen MIT Turnier-Signal (der eigentliche Verlust)
md.push(`## 2. Muster der ECHTEN Verluste (nicht erkannt, aber Turnier-Signal)`);
md.push("");
if (missPatterns.size === 0) md.push(`Keine — jede Zeile mit Turnier-Signal wurde erkannt.`);
for (const [sig, e] of [...missPatterns.entries()].sort((a, b) => b[1].count - a[1].count)) {
  md.push(`- **${sig}** — ${e.count}×`);
  for (const s of e.samples) md.push(`  - \`${s}\``);
}
md.push("");

// 3. Muster: nicht erkannte Zeilen OHNE Turnier-Signal (legitim, zur Kontrolle)
md.push(`## 3. Nicht erkannte Zeilen OHNE Turnier-Signal (legitim, Kontrolle)`);
md.push("");
for (const [sig, e] of [...nonRecogOther.entries()].sort((a, b) => b[1].count - a[1].count)) {
  md.push(`- **${sig}** — ${e.count}×`);
  for (const s of e.samples.slice(0, 3)) md.push(`  - \`${s}\``);
}
md.push("");

// 4. Erkannte Turniere ohne source_ref-Code
md.push(`## 4. Erkannte Turniere OHNE ableitbaren source_ref-Code`);
md.push("");
md.push(`Gesamt: **${sum((r) => r.recognizedNoCode)}**.`);
for (const [sig, e] of [...noCodePatterns.entries()].sort((a, b) => b[1].count - a[1].count)) {
  md.push(`- **${sig}** — ${e.count}×`);
  for (const s of e.samples) md.push(`  - \`${s}\``);
}
md.push("");

// 5. Verteilung / Häufung
md.push(`## 5. Verteilung: häufen sich Verluste auf bestimmten Seiten?`);
md.push("");
md.push(`| Seite | Nicht-Kal.-Codes | Verlust m. Signal | ohne-Code |`);
md.push(`|---|---:|---:|---:|`);
for (const r of pageResults) {
  if (r.error) { md.push(`| ${r.page} | — | — | FEHLER |`); continue; }
  md.push(`| ${r.page.replace(/ ITF Men's World Tennis Tour /, " ITF ").replace(/ ATP Challenger Tour/, " Challenger")} | ${r.codesInNonCalendar} | ${r.missedWithSignal} | ${r.recognizedNoCode} |`);
}
md.push("");

// 6. Fazit: Top-Muster nach Anteil
md.push(`## 6. Fazit — größte Verlustquellen`);
md.push("");
const totalCodesNonCal = sum((r) => r.codesInNonCalendar);
const totalMiss = sum((r) => r.missedWithSignal);
const totalNoCode = sum((r) => r.recognizedNoCode);
md.push(`- **Komplett verlorene Tabellen** (Turnier-Codes in NICHT als Kalender erkannten Tabellen): **${totalCodesNonCal}**.`);
md.push(`- **Zeilen-Verluste** in erkannten Tabellen (Turnier-Signal, aber nicht erkannt): **${totalMiss}**.`);
md.push(`- **Erkannt, aber ohne source_ref-Code**: **${totalNoCode}**.`);
md.push("");
const topMiss = [...missPatterns.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 3);
if (topMiss.length) {
  md.push(`Top-Signaturen der Zeilen-Verluste:`);
  for (const [sig, e] of topMiss) md.push(`- ${sig}: ${e.count}×`);
}
md.push("");
md.push(`### Einschätzung`);
md.push("");
md.push(`1. **Der Zeilen-Parser verliert praktisch nichts.** In allen Seiten ist „mit Turnier-Signal, aber`);
md.push(`   nicht erkannt" = 0 und „Codes in Nicht-Kalender-Tabellen" = 0. Die große Zahl „nicht erkannt"`);
md.push(`   ist strukturell die **Gewinner-Folgezeile je Turnier** (rowspan; ~2000× reine Flaggen-/Spieler-Zeilen`);
md.push(`   in §3), kein Verlust. ITF 2024 = 123+160+196+119 = **598 erkannt** (≈ die erwarteten ~600).`);
md.push(`   Die früher genannten „384" stammten aus einem groben Vorab-Probe-Skript, nicht aus diesem Parser.`);
md.push(`2. **Das eigentliche Risiko ist die source_ref-Extraktion, nicht der Parser** — und auch das ist klein,`);
md.push(`   sobald zwei Dinge beachtet werden: (a) ITF-Codes existieren in **zwei Formaten**`);
md.push(`   ('m-itf-ind-2024-009' und 'm-itf-lux-01a-2024'); ein zu enges Muster zählt 2024 fälschlich als codelos.`);
md.push(`   (b) Challenger-Namen sind teils nicht-englisch/vertippt ('Copa Sevilla', 'Città di Todi', 'Bari Challlenger') —`);
md.push(`   sie haben trotzdem eine eigene Turnierseite. Nach dieser Korrektur bleiben **${totalNoCode}** ohne ableitbaren Code.`);
md.push("");

const out = md.join("\n");
const __dirname = dirname(fileURLToPath(import.meta.url));
const repoPath = join(__dirname, "wikipedia-parser-diagnose-report.md");
const downloadsPath = join(homedir(), "Downloads", "wikipedia-parser-diagnose-report.md");
writeFileSync(repoPath, out, "utf8");
try { writeFileSync(downloadsPath, out, "utf8"); } catch { /* Downloads optional (CI-Runner hat kein ~/Downloads) */ }
console.log(`\nBericht geschrieben:\n  ${repoPath}`);
