// wikipedia-lead-time.mjs
//
// Misst anhand der Wikipedia-Versionsgeschichte, wie weit im Voraus die
// ITF-Quartals- und ATP-Challenger-Kalenderseiten angelegt und mit Turnieren
// gefüllt werden. Grundlage für die Frage: Taugt Wikipedia als vorausschauende
// Quelle für einen Turnierplaner (Spieler brauchen Turniere >= 8 Wochen vorher)?
//
// Reines Node (ESM), keine Dependencies. KEINE App-Änderung, KEIN DB-Zugriff.
// Nur MediaWiki-API (kein HTML-Scraping). Parser + Struktur aus
// scripts/wikipedia-calendar-coverage.mjs übernommen (Tabellen-Tokens nur am Zeilenanfang).
//
// Ausführen:  node scripts/wikipedia-lead-time.mjs
// Ergebnis:   scripts/wikipedia-lead-time-report.md  (+ Kopie in ~/Downloads)

import { writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const API = "https://en.wikipedia.org/w/api.php";
const USER_AGENT =
  "MatchupTournamentCoverage/1.0 (https://matchup-app.com; wiederhold.martin@web.de) node-fetch";

const YEARS = [2023, 2024, 2025, 2026];
const MONTH_SPANS = ["January–March", "April–June", "July–September", "October–December"];
const MAX_SAMPLES = 10; // max. Stichprobenversionen je Seite (Sparsamkeit)
const NOW = new Date(); // Referenz „jetzt" (Plain-Node → new Date() erlaubt)

// ---------------------------------------------------------------------------
// MediaWiki-API (Timeout + 1 Retry, alle URLs werden protokolliert)
// ---------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const apiLog = []; // alle tatsächlich aufgerufenen URLs (für den Bericht)

async function apiGet(url) {
  apiLog.push(url);
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

// URL: älteste Version einer Seite (Anlagedatum).
function oldestUrl(title) {
  const p = new URLSearchParams({
    action: "query", format: "json", formatversion: "2", prop: "revisions",
    titles: title, rvlimit: "1", rvdir: "newer", rvprop: "timestamp|ids",
  });
  return `${API}?${p}`;
}
// URL: Version zum Stichtag (letzte Revision <= isoTs) inkl. Inhalt.
function contentAtUrl(title, isoTs) {
  const p = new URLSearchParams({
    action: "query", format: "json", formatversion: "2", prop: "revisions",
    titles: title, rvlimit: "1", rvdir: "older", rvstart: isoTs,
    rvprop: "timestamp|content", rvslots: "main",
  });
  return `${API}?${p}`;
}

async function oldestRevision(title) {
  const j = await apiGet(oldestUrl(title));
  const page = j?.query?.pages?.[0];
  if (!page || page.missing) throw new Error("Seite fehlt (missing)");
  const rev = page?.revisions?.[0];
  if (!rev) throw new Error("keine Revisionen");
  return { timestamp: rev.timestamp };
}
async function contentAt(title, isoTs) {
  const j = await apiGet(contentAtUrl(title, isoTs));
  const rev = j?.query?.pages?.[0]?.revisions?.[0];
  if (!rev) return null; // vor Anlage: keine Version
  return { timestamp: rev.timestamp, content: rev.slots?.main?.content ?? "" };
}

// ---------------------------------------------------------------------------
// Wikitext-Parser (aus wikipedia-calendar-coverage.mjs übernommen)
// ---------------------------------------------------------------------------

// Tabellenblöcke ZEILENBASIERT extrahieren (|} nur am Zeilenanfang = Tabellenende).
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

// Turnierzeilen einer ganzen Seite zählen (nur Kalendertabellen).
function countTournaments(wt) {
  let count = 0;
  for (const table of extractTables(wt)) {
    const head = table.slice(0, 600);
    if (!/Week of/i.test(head) || !/Tournament/i.test(head)) continue;
    const rows = table.split(/\n\|-/);
    for (let ri = 1; ri < rows.length; ri++) {
      const cells = splitRowCells(rows[ri]);
      if (cells.length === 0) continue;
      const rest = isWeekCell(cells[0]) ? cells.slice(1) : cells;
      if (rest.find(isTournamentCell)) count++;
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// Quellen + Zeiträume
// ---------------------------------------------------------------------------
const QSTART = { "January–March": 0, "April–June": 3, "July–September": 6, "October–December": 9 };

function makeSources() {
  const src = [];
  for (const year of YEARS) {
    // Challenger-Jahresseite: Zeitraum = ganzes Jahr.
    src.push({
      series: "Challenger", year, page: `${year} ATP Challenger Tour`,
      periodStart: new Date(Date.UTC(year, 0, 1)), periodEnd: new Date(Date.UTC(year, 11, 31)),
    });
    // ITF-Quartale.
    for (const span of MONTH_SPANS) {
      const m = QSTART[span];
      src.push({
        series: "ITF", year, page: `${year} ITF Men's World Tennis Tour (${span})`, span,
        periodStart: new Date(Date.UTC(year, m, 1)), periodEnd: new Date(Date.UTC(year, m + 3, 0)),
      });
    }
  }
  return src;
}

const iso = (d) => d.toISOString();
const dateStr = (d) => d.toISOString().slice(0, 10);
const WEEK = 7 * 86400000;
const weeksBetween = (a, b) => (b.getTime() - a.getTime()) / WEEK; // b - a in Wochen

// Stichproben-Zeitpunkte in Monatsabständen [start..end], gedeckelt auf maxN.
function monthlySamples(start, end, maxN) {
  const out = [];
  let d = new Date(start);
  while (d <= end) {
    out.push(new Date(d));
    d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()));
  }
  if (out.length === 0 || out[out.length - 1] < end) out.push(new Date(end));
  if (out.length > maxN) {
    const picked = [out[0]];
    const step = (out.length - 1) / (maxN - 1);
    for (let i = 1; i < maxN - 1; i++) picked.push(out[Math.round(i * step)]);
    picked.push(out[out.length - 1]);
    return picked;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Hauptlauf
// ---------------------------------------------------------------------------
const results = []; // { series, year, page, span?, created, leadWeeks, series80..., timeline:[{ts,count}], maxCount, error, futureFill }

for (const src of makeSources()) {
  process.stdout.write(`${src.page}: `);
  const r = { ...src, created: null, leadWeeks: null, timeline: [], maxCount: 0, fill80Weeks: null, error: null };
  try {
    const oldest = await oldestRevision(src.page);
    r.created = new Date(oldest.timestamp);
    r.leadWeeks = weeksBetween(r.created, src.periodStart); // >0 = vor Start angelegt
    await sleep(1200);

    // Stichproben von Anlage bis min(Periodenende, jetzt).
    const end = new Date(Math.min(src.periodEnd.getTime(), NOW.getTime()));
    const samples = end >= r.created ? monthlySamples(r.created, end, MAX_SAMPLES) : [r.created];
    for (const s of samples) {
      try {
        const rev = await contentAt(src.page, iso(s));
        const count = rev ? countTournaments(rev.content) : 0;
        r.timeline.push({ ts: rev ? new Date(rev.timestamp) : s, count });
      } catch {
        r.timeline.push({ ts: s, count: null }); // Einzel-Stichprobe fehlgeschlagen
      }
      await sleep(1200);
    }
    const counts = r.timeline.map((t) => t.count).filter((c) => c != null);
    r.maxCount = counts.length ? Math.max(...counts) : 0;
    // Ab wann >= 80 % des Maximalstands (Wochen relativ zum Periodenstart; <0 = vor Start).
    if (r.maxCount > 0) {
      const thr = 0.8 * r.maxCount;
      const hit = r.timeline.find((t) => t.count != null && t.count >= thr);
      if (hit) r.fill80Weeks = weeksBetween(src.periodStart, hit.ts);
    }
    console.log(`angelegt ${dateStr(r.created)}, Vorlauf ${r.leadWeeks.toFixed(1)} Wo, max ${r.maxCount}`);
  } catch (err) {
    r.error = err.message;
    console.log(`FEHLER (${err.message})`);
  }
  results.push(r);
  await sleep(1200);
}

// 2026-Zukunftsquartale: aktueller Füllstand für Perioden, deren Start in der Zukunft liegt.
const future2026 = makeSources().filter((s) => s.year === 2026 && s.periodStart > NOW);

// ---------------------------------------------------------------------------
// Auswertung (Zahlen-Fazit)
// ---------------------------------------------------------------------------
const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
const median = (arr) => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
function summarize(series) {
  const rs = results.filter((r) => r.series === series && r.error == null && r.leadWeeks != null);
  const leads = rs.map((r) => r.leadWeeks);
  const fills = rs.filter((r) => r.fill80Weeks != null).map((r) => r.fill80Weeks);
  return {
    n: rs.length,
    avgLead: avg(leads), medLead: median(leads),
    avgFill: avg(fills), medFill: median(fills),
  };
}
const sumITF = summarize("ITF");
const sumCh = summarize("Challenger");

// ---------------------------------------------------------------------------
// Bericht
// ---------------------------------------------------------------------------
const md = [];
const now = NOW.toISOString();
const wk = (x) => (x == null ? "—" : `${x >= 0 ? "+" : ""}${x.toFixed(1)}`);
md.push(`# Wikipedia-Vorlauf: Anlage & Füllstand der ITF-/Challenger-Kalenderseiten`);
md.push("");
md.push(`> Automatisch erzeugt von \`scripts/wikipedia-lead-time.mjs\` · Lauf: ${now}`);
md.push(`> Quelle: MediaWiki-API (${API}). Kein HTML-Scraping. Nur Zahlen/Zeitstempel.`);
md.push("");
md.push(`## Methodik`);
md.push("");
md.push(`Je Seite: älteste Version (\`rvdir=newer&rvlimit=1\`) → **Anlagedatum**. **Vorlauf** = Wochen`);
md.push(`zwischen Anlage und **Beginn** des abgedeckten Zeitraums (positiv = vorausschauend, negativ = rückwirkend).`);
md.push(`**Füllstand**: Stichprobenversionen in Monatsabständen (max. ${MAX_SAMPLES}/Seite, \`rvstart=…&rvdir=older\`),`);
md.push(`je Version die Turnierzeilen der Kalendertabellen gezählt (gleicher Parser wie die Abdeckungsmessung).`);
md.push(`**„80 % gefüllt"** = Wochen relativ zum Periodenstart, ab denen der Stand ≥ 80 % des beobachteten Maximums ist.`);
md.push(`Jede Abfrage ist isoliert (Timeout 60s, 1 Retry); Fehlschläge beenden den Lauf nicht.`);
md.push("");

// 1. Anlage + Vorlauf
md.push(`## 1. Anlagedatum & Vorlauf je Seite`);
md.push("");
md.push(`| Serie | Jahr | Seite | Periodenstart | Angelegt | Vorlauf (Wochen) | Max. Turniere | Fehler |`);
md.push(`|---|---|---|---|---|---:|---:|---|`);
for (const r of results) {
  md.push(
    `| ${r.series} | ${r.year} | ${r.page.replace(/ ITF Men's World Tennis Tour /, " ITF … ")} | ${dateStr(r.periodStart)} | ${r.created ? dateStr(r.created) : "—"} | ${r.leadWeeks == null ? "—" : wk(r.leadWeeks)} | ${r.maxCount} | ${r.error ?? "–"} |`,
  );
}
md.push("");

// 2. Füllstands-Zeitreihen
md.push(`## 2. Füllstand je Stichprobenversion (Zeitreihe: Datum → Turnierzahl)`);
md.push("");
for (const r of results) {
  if (r.error) { md.push(`- **${r.series} ${r.year}** ${r.span ?? ""} — FEHLER: ${r.error}`); continue; }
  const series = r.timeline.map((t) => `${dateStr(t.ts)}:${t.count == null ? "?" : t.count}`).join(" · ");
  md.push(`- **${r.series} ${r.year}${r.span ? " " + r.span : ""}** (Start ${dateStr(r.periodStart)}, 80 % ab ${wk(r.fill80Weeks)} Wo): ${series}`);
}
md.push("");

// 3. 2026-Zukunftsquartale
md.push(`## 3. 2026 — Füllstand künftiger Quartale (Periodenstart nach ${dateStr(NOW)})`);
md.push("");
if (future2026.length === 0) {
  md.push(`Kein 2026-Quartal mit Periodenstart in der Zukunft (Q4 Oct–Dec existiert als Seite noch nicht).`);
} else {
  md.push(`| Quartal | Periodenstart | Seite existiert? | Aktuelle Turnierzahl |`);
  md.push(`|---|---|---|---:|`);
  for (const s of future2026) {
    const r = results.find((x) => x.page === s.page);
    const exists = r && !r.error;
    md.push(`| ${s.span} | ${dateStr(s.periodStart)} | ${exists ? "ja" : "nein/Fehler"} | ${exists ? r.maxCount : "—"} |`);
  }
}
md.push("");
// Zusätzlich: Füllstand ALLER 2026-Quartale (auch laufende) als Kontext.
md.push(`Kontext — alle 2026-Quartale (aktueller Höchststand):`);
for (const r of results.filter((x) => x.year === 2026 && x.series === "ITF")) {
  md.push(`- ${r.span}: ${r.error ? `FEHLER (${r.error})` : `${r.maxCount} Turniere, angelegt ${r.created ? dateStr(r.created) : "—"}, Vorlauf ${wk(r.leadWeeks)} Wo`}`);
}
md.push("");

// 4. Zahlen-Fazit
md.push(`## 4. Fazit in Zahlen`);
md.push("");
md.push(`| Serie | n Seiten | Ø Vorlauf (Wo) | Median Vorlauf | Ø 80%-Zeitpunkt (Wo z. Start) | Median 80% |`);
md.push(`|---|---:|---:|---:|---:|---:|`);
for (const [name, s] of [["ITF (Quartale)", sumITF], ["Challenger (Jahr)", sumCh]]) {
  md.push(`| ${name} | ${s.n} | ${wk(s.avgLead)} | ${wk(s.medLead)} | ${wk(s.avgFill)} | ${wk(s.medFill)} |`);
}
md.push("");
md.push(`Lesart: Vorlauf **positiv** = Seite vor Periodenstart angelegt. „80%-Zeitpunkt" **negativ** = 80 %`);
md.push(`des Endstands schon *vor* Periodenstart erreicht (vorausschauend); **positiv** = erst *nach* Start (nachwachsend).`);
md.push(`Planungsschwelle des Produkts: Turniere ≥ 8 Wochen vor Beginn.`);
md.push("");

// 5. API-Aufrufe
md.push(`## 5. Verwendete API-Aufrufe (Volltext, ${apiLog.length} Stück)`);
md.push("");
md.push("```");
for (const u of apiLog) md.push(u);
md.push("```");

const out = md.join("\n");
const __dirname = dirname(fileURLToPath(import.meta.url));
const repoPath = join(__dirname, "wikipedia-lead-time-report.md");
const downloadsPath = join(homedir(), "Downloads", "wikipedia-lead-time-report.md");
writeFileSync(repoPath, out, "utf8");
writeFileSync(downloadsPath, out, "utf8");
console.log(`\nBericht geschrieben:\n  ${repoPath}\n  ${downloadsPath}`);
