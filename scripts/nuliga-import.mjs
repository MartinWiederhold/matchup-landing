// nuliga-import.mjs
//
// PROBE-Import für EINE Region (Baden), nächste drei Monate. TROCKENLAUF ist Voreinstellung:
// ohne --write wird NICHTS geschrieben — es entsteht nur ein Bericht.
//
// Quelle: baden.liga.nu (nuLiga, WebObjects, serverseitig gerendertes HTML). robots.txt der
// Instanz erlaubt den Kalender (nur `*.inc`/`*.csi` gesperrt). KEIN JSON-Endpunkt → HTML-Parsing.
//
// ZWEISTUFIG — und hier liegt der entscheidende Befund:
//   Stufe 1 (LISTE):  baden.liga.nu/.../tournamentCalendar?federation=BAD&date=…  → ERLAUBT.
//                     Spalten: Datum | Turnier | Konkurrenz | LK | Offen für. Plus #detail/<id>.
//   Stufe 2 (DETAIL): Meldeschluss/Nenngeld/Belag. Die Listenzeilen verlinken NUR auf
//                     tennis.de/…#detail/<id>; dieses Detail rendert das ZK-Widget von
//                     `widgets.tennis.de`, und dessen robots.txt ist `User-agent: * / Disallow: /`.
//                     → Das Detail ist NUR über einen robots-GESPERRTEN Host erreichbar.
//                     Dieses Skript ruft es deshalb NICHT ab (Constraint: keine gesperrten Pfade).
//
// Muster: scripts/itf-import.mjs (Cache, --write-Schalter, Claims mit Herkunft/Confidence).
// ABWEICHUNG: HTML statt JSON; 503-Backoff (der Backend ist zeitweise überlastet, keine Bot-Abwehr).
//
// Ausführen (Trockenlauf):  node scripts/nuliga-import.mjs
// Scharf (schreibt!):        node scripts/nuliga-import.mjs --write   (NUR nach series-CHECK-Erweiterung!)

import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WRITE = process.argv.includes("--write");
const CONTACT = "wiederhold.martin@web.de";
const UA = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36 MatchupImport/1.0 (+${CONTACT})`;

// ── Region + Zeitraum ────────────────────────────────────────────────────────
const FEDERATION = "BAD";
const HOST = "https://baden.liga.nu";
const CAL = (dateISO) => `${HOST}/cgi-bin/WebObjects/nuLigaTENDE.woa/wa/tournamentCalendar?federation=${FEDERATION}&date=${dateISO}`;

const PAUSE_MS = 1500;          // ≥ 1 s gefordert; großzügiger
const RETRY_503 = 3;            // Wiederholungen bei 503
const BACKOFF_MS = [6000, 12000, 20000]; // Wartezeiten je Wiederholung
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Nächste ~13 Montage (drei Monate), ab dem Montag dieser Woche.
function mondaysNext3Months() {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); // auf Montag zurück
  const end = new Date(d); end.setUTCMonth(end.getUTCMonth() + 3);
  const out = [];
  for (let x = new Date(d); x <= end; x.setUTCDate(x.getUTCDate() + 7)) out.push(x.toISOString().slice(0, 10));
  return out;
}

// ── Cache (wie itf-import: Wiederholungen refetchen nicht) ───────────────────
const CACHE_PATH = join(__dirname, ".nuliga-cache.json");
let cache = {};
if (existsSync(CACHE_PATH)) { try { cache = JSON.parse(readFileSync(CACHE_PATH, "utf8")); } catch { cache = {}; } }
const saveCache = () => { try { writeFileSync(CACHE_PATH, JSON.stringify(cache), "utf8"); } catch { /* egal */ } };

const stats = { requests: 0, from503: 0, cached: 0, ms: 0 };

/** Holt eine Kalenderwoche als HTML — mit 503-Backoff. Gibt {html|null, status}. */
async function fetchWeek(dateISO) {
  if (cache[dateISO]) { stats.cached++; return { html: cache[dateISO], status: 200 }; }
  const url = CAL(dateISO);
  for (let attempt = 0; attempt <= RETRY_503; attempt++) {
    const t0 = Date.now();
    let res;
    try {
      res = await fetch(url, { headers: { "User-Agent": UA, "Accept": "text/html", "From": CONTACT } });
    } catch (e) {
      if (attempt < RETRY_503) { await sleep(BACKOFF_MS[attempt]); continue; }
      return { html: null, status: "fetch_error:" + e.message };
    }
    stats.requests++; stats.ms += Date.now() - t0;
    if (res.status === 503) {
      stats.from503++;
      if (attempt < RETRY_503) { await sleep(BACKOFF_MS[attempt]); continue; } // warten & wiederholen, nicht hämmern
      return { html: null, status: 503 };
    }
    if (!res.ok) return { html: null, status: res.status };
    const html = await res.text();
    cache[dateISO] = html; saveCache();
    return { html, status: 200 };
  }
  return { html: null, status: 503 };
}

// ── HTML-Parsing der Ergebnistabelle (Datum | Turnier | Konkurrenz | LK | Offen für) ──
const clean = (s) => s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&uuml;/g, "ü").replace(/&auml;/g, "ä").replace(/&ouml;/g, "ö").replace(/&szlig;/g, "ß").replace(/&ndash;/g, "-").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

function parseRows(html) {
  const out = [];
  // Ergebnistabelle beginnt am TH "Datum" (nicht das Filterformular).
  const startTh = html.search(/<th[^>]*>\s*Datum/i);
  const region = startTh >= 0 ? html.slice(startTh) : html;
  for (const m of region.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const row = m[1];
    const idm = row.match(/#detail\/(\d+)/);
    if (!idm) continue; // nur echte Turnierzeilen (mit Detail-Link)
    const tds = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((x) => clean(x[1]));
    if (tds.length < 5) continue;
    out.push({
      detailId: idm[1],
      datum: tds[0],           // z. B. "13.04. bis 27.09." oder "24.08."
      name: tds[1],            // Name inkl. Verein/Ort (kein separates Ort-Feld in der Liste)
      konkurrenz: tds[2],      // z. B. "Herren Einzel", "Nebenrunde Herren Einzel", "Junioren U12"
      lk: tds[3],              // z. B. "18,0-25,0" oder leer
      offenFuer: tds[4],       // z. B. "Deutschland" | "eigener Verein"
    });
  }
  return out;
}

// ── Filter (laut Auftrag) ────────────────────────────────────────────────────
// - "Offen für" ≠ "eigener Verein" (Clubmeisterschaften raus)
// - Konkurrenz: Herren-/Damen-EINZEL. Jugend (Junioren/U..), Senioren (Herren 30/40/50…),
//   Doppel/Mixed raus. LK wird MITGENOMMEN, aber NICHT gefiltert.
const KONK_OK = /^(?:Neben|Haupt)?runde?\s*(Herren|Damen)\s+Einzel$|^(Herren|Damen)\s+Einzel$/i;
function keep(t) {
  if (/eigener\s+Verein/i.test(t.offenFuer)) return false;
  const k = t.konkurrenz.replace(/^(Nebenrunde|Hauptrunde)\s+/i, "").trim();
  return /^(Herren|Damen)\s+Einzel$/i.test(k); // exakt Einzel Erwachsene, keine Altersklasse
}

// ── Lauf ─────────────────────────────────────────────────────────────────────
console.log(`nuLiga-PROBE · Region ${FEDERATION} · ${WRITE ? "SCHARF (--write)" : "TROCKENLAUF"} · nächste 3 Monate`);
const weeks = mondaysNext3Months();
const t0 = Date.now();

const byId = new Map();     // detailId → Turnier (dedup über Wochen)
const weekStatus = [];      // je Woche: {date, status, rows}
for (let i = 0; i < weeks.length; i++) {
  const wk = weeks[i];
  const { html, status } = await fetchWeek(wk);
  let rows = 0;
  if (html) { const parsed = parseRows(html); rows = parsed.length; for (const t of parsed) if (!byId.has(t.detailId)) byId.set(t.detailId, t); }
  weekStatus.push({ date: wk, status, rows });
  process.stdout.write(`  ${wk}: ${status}${html ? ` (${rows} Zeilen)` : ""}\r`);
  if (i < weeks.length - 1) await sleep(PAUSE_MS);
}
const runtimeMs = Date.now() - t0;

const all = [...byId.values()];
const kept = all.filter(keep);
const dropped = all.length - kept.length;

// ── Detail-Stufe: bewusst NICHT abgerufen (robots-Sperre widgets.tennis.de) ──
// Meldeschluss/Nenngeld/Belag wären hier zu holen — sind aber nur über den robots-
// gesperrten Host widgets.tennis.de erreichbar. Deshalb kein Abruf.
const DETAIL_BLOCKED = true;

// ── Optional --write (nur Stufe 1; series-CHECK muss VORHER erweitert sein) ──
let writeSummary = null;
if (WRITE) {
  writeSummary = "ABBRUCH: --write ist erst nach series-CHECK-Erweiterung um den neuen Wert sinnvoll " +
    "(s. Bericht §Schema). Ohne CHECK würde PostgREST jeden Upsert ablehnen. Kein Schreibversuch unternommen.";
}

// ── Bericht ──────────────────────────────────────────────────────────────────
const md = [];
const now = new Date().toISOString();
md.push(`# nuLiga-PROBE — Region Baden (${WRITE ? "SCHARF, nicht geschrieben" : "TROCKENLAUF"})`);
md.push("");
md.push(`> \`scripts/nuliga-import.mjs\` · ${now} · nächste 3 Monate (${weeks[0]} … ${weeks[weeks.length - 1]})`);
md.push(`> Quelle Stufe 1: baden.liga.nu tournamentCalendar (robots-erlaubt). Stufe 2 (Detail) robots-GESPERRT (s. u.).`);
md.push("");
md.push(`## Kennzahlen`);
md.push(`- Wochen abgefragt: ${weeks.length} · davon aus Cache: ${stats.cached}`);
md.push(`- HTTP-Requests gesamt: ${stats.requests} · **503-Antworten: ${stats.from503}**`);
md.push(`- Laufzeit: **${(runtimeMs / 1000).toFixed(1)} s** (netto Requests ${(stats.ms / 1000).toFixed(1)} s + Pausen)`);
md.push(`- Turniere in Baden / 3 Monate (dedupliziert): **${all.length}**`);
md.push(`- Nach Filter übrig (Herren/Damen-Einzel, offen): **${kept.length}** · herausgefiltert: ${dropped}`);
md.push("");
md.push(`## Wochen-Status (503-Häufigkeit)`);
for (const w of weekStatus) md.push(`- ${w.date}: ${w.status}${w.status === 200 ? ` — ${w.rows} Zeilen` : ""}`);
md.push("");
md.push(`## KERNBEFUND — Meldefrist/Nenngeld/Belag nicht über erlaubten Pfad`);
md.push(`Die Listenzeilen verlinken das Detail ausschließlich auf \`tennis.de/…/turniersuche.html#detail/<id>\`.`);
md.push(`Dieses Detail (mit **Meldeschluss, Nenngeld, Belag**) rendert das ZK-Widget von **\`widgets.tennis.de\`**`);
md.push(`— und dessen robots.txt lautet \`User-agent: * / Disallow: /\`. \`www.tennis.de\` liefert die Frist NICHT`);
md.push(`(bestätigt: die Antworten mit „Meldeschluss"/„Nenngeld" kamen nur von widgets.tennis.de: \`.zul\` + \`zkau\`).`);
md.push(`**→ Der versprochene „gelesene Meldeschluss" ist nicht regelkonform abrufbar.** Dieses Skript ruft ihn nicht ab.`);
md.push("");
md.push(`## Was die LISTE (erlaubt) liefert`);
md.push(`Datum, Name (inkl. Verein — **kein separates Ort-Feld**; Ort nur aus dem Namen ableitbar), Konkurrenz, LK, „Offen für".`);
md.push(`Meldeschluss/Nenngeld/Belag: **nicht in der Liste** (nur im gesperrten Detail).`);
md.push("");
md.push(`## Drei vollständige Beispiele (nach Filter)`);
for (const t of kept.slice(0, 3)) {
  md.push("```json");
  md.push(JSON.stringify({
    quelle: "nuliga_baden", detailId: t.detailId,
    datum: t.datum, name: t.name, ort: "(nur aus Name ableitbar)",
    konkurrenz: t.konkurrenz, leistungsklasse: t.lk || "(leer)",
    offenFuer: t.offenFuer,
    meldeschluss: "NICHT ABRUFBAR (widgets.tennis.de Disallow:/)",
    nenngeld: "NICHT ABRUFBAR", belag: "NICHT ABRUFBAR",
  }, null, 2));
  md.push("```");
}
if (kept.length === 0) md.push(`_(keine Treffer nach Filter — s. Wochen-Status; evtl. 503 oder saisonbedingt leer)_`);
md.push("");
if (writeSummary) { md.push(`## --write`); md.push(writeSummary); md.push(""); }

const out = md.join("\n");
writeFileSync(join(__dirname, "nuliga-import-report.md"), out, "utf8");
console.log(`\n\nTROCKENLAUF · Turniere=${all.length} nachFilter=${kept.length} · 503=${stats.from503} · ${(runtimeMs / 1000).toFixed(1)}s`);
console.log(`Bericht: scripts/nuliga-import-report.md`);
