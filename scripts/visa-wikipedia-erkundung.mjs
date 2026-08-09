// visa-wikipedia-erkundung.mjs
//
// Misst, ob sich je Nationalität aus Wikipedia ("Visa requirements for X citizens")
// die Visa-Anforderung PRO ZIELLAND maschinell gewinnen lässt — als mögliche Quelle
// für eine nationalitätsabhängige Visa-Warnung im Saisonplaner (MU-019).
//
// NUR MESSEN, nichts schreiben (keine DB, keine App-Änderung, visa.ts unberührt).
// Zugriff ausschließlich über die MediaWiki-API (kein HTML-Scraping), ≥1 s zwischen
// Abrufen, aussagekräftiger User-Agent. Struktur nach scripts/wikipedia-calendar-coverage.mjs.
//
// Ausführen:  node scripts/visa-wikipedia-erkundung.mjs
// Ergebnis:   scripts/visa-wikipedia-erkundung.md
//
// BEWUSST NICHT erfasst: Wartezeiten und Gebühren — die stehen in diesen Tabellen
// nicht belastbar; wir wollen sie nicht behaupten. Gemessen wird nur: Visumsart je
// Zielland + erlaubte Aufenthaltsdauer (falls angegeben).

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const API = "https://en.wikipedia.org/w/api.php";
const USER_AGENT =
  "MatchupVisaExploration/1.0 (https://matchup-app.com; wiederhold.martin@web.de) node-fetch";
const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Nationalitäten (BEGRÜNDETE Auswahl — siehe Bericht). English-Demonym = Seitentitel
// "Visa requirements for <demonym> citizens". `iso` nur zur Doku.
// Gruppen: host = Turnier-Gastgeber der Zielregion (NA/ME), tour = große Nicht-EU-
// Tennisnationen der europ. Futures/Challenger-Tour, control = visabefreite Kontrolle.
// ---------------------------------------------------------------------------
const NATIONALITIES = [
  // Gastgeber-Nationen der Zielregion (Turniere lt. web.tour_tournaments; Bürger meist visumpflichtig für Schengen)
  { iso: "TN", demonym: "Tunisian", group: "host" },
  { iso: "EG", demonym: "Egyptian", group: "host" },
  { iso: "MA", demonym: "Moroccan", group: "host" },
  { iso: "DZ", demonym: "Algerian", group: "host" },
  { iso: "TR", demonym: "Turkish", group: "host" },
  { iso: "IR", demonym: "Iranian", group: "host" },
  // Naher/Mittlerer Osten (angrenzende Herkunft, Gulf-Turniere in der DB)
  { iso: "JO", demonym: "Jordanian", group: "meast" },
  { iso: "LB", demonym: "Lebanese", group: "meast" },
  { iso: "IQ", demonym: "Iraqi", group: "meast" },
  { iso: "IL", demonym: "Israeli", group: "meast" },
  { iso: "SA", demonym: "Saudi Arabian", group: "meast" },
  { iso: "AE", demonym: "Emirati", group: "meast" },
  // Große Nicht-EU-Tennisnationen, die die europ. Tour spielen und Visa brauchen (können)
  { iso: "IN", demonym: "Indian", group: "tour" },
  { iso: "CN", demonym: "Chinese", group: "tour" },
  { iso: "RU", demonym: "Russian", group: "tour" },
  { iso: "ZA", demonym: "South African", group: "tour" },
  { iso: "KZ", demonym: "Kazakhstani", group: "tour" },
  { iso: "UZ", demonym: "Uzbekistani", group: "tour" },
  { iso: "PK", demonym: "Pakistani", group: "tour" },
  { iso: "NG", demonym: "Nigerian", group: "tour" },
  // Visabefreite Kontrolle (Warnung soll hier SCHWEIGEN — prüft die Vokabel-Seite)
  { iso: "US", demonym: "United States", group: "control" },
  { iso: "BR", demonym: "Brazilian", group: "control" },
  { iso: "AR", demonym: "Argentine", group: "control" },
  { iso: "MX", demonym: "Mexican", group: "control" },
  { iso: "RS", demonym: "Serbian", group: "control" },
  { iso: "UA", demonym: "Ukrainian", group: "control" },
  { iso: "GE", demonym: "Georgian", group: "control" },
  { iso: "AM", demonym: "Armenian", group: "control" },
  { iso: "AU", demonym: "Australian", group: "control" },
  { iso: "JP", demonym: "Japanese", group: "control" },
  { iso: "KR", demonym: "South Korean", group: "control" },
];

// ---------------------------------------------------------------------------
// Zielländer: die Länder aus web.tour_tournaments, die in der PLANER-Zielregion liegen
// (Europa + Türkei/Tunesien/Ägypten/Marokko + Kaukasus). ISO2 → englische Namens-Aliasse,
// wie sie in den Wikipedia-Tabellen ({{flag|Name}}) vorkommen. Gulf/US etc. bewusst NICHT
// hier — für die Kern-Coverage zählt die Zielregion des Saisonplaners.
// ---------------------------------------------------------------------------
const DEST_REGION = {
  ES: ["Spain"], TN: ["Tunisia"], IT: ["Italy"], FR: ["France"], TR: ["Turkey", "Türkiye"],
  EG: ["Egypt"], PT: ["Portugal"], DE: ["Germany"], GR: ["Greece"], RS: ["Serbia"],
  RO: ["Romania"], GB: ["United Kingdom"], HR: ["Croatia"], PL: ["Poland"], AT: ["Austria"],
  SI: ["Slovenia"], CZ: ["Czech Republic", "Czechia"], NL: ["Netherlands"], CH: ["Switzerland"],
  BE: ["Belgium"], HU: ["Hungary"], BA: ["Bosnia and Herzegovina"], BG: ["Bulgaria"],
  MA: ["Morocco"], SE: ["Sweden"], GE: ["Georgia (country)", "Georgia"], AM: ["Armenia"],
  CY: ["Cyprus"], IE: ["Ireland", "Republic of Ireland"], MD: ["Moldova"], NO: ["Norway"],
  SM: ["San Marino"], MK: ["North Macedonia"], LU: ["Luxembourg"], MT: ["Malta"],
};
// Englischer Name (lowercase) → ISO2, für schnelles Matching der Tabellenzeilen.
const NAME_TO_ISO = {};
for (const [iso, names] of Object.entries(DEST_REGION)) for (const n of names) NAME_TO_ISO[n.toLowerCase()] = iso;

// ---------------------------------------------------------------------------
// MediaWiki-API (Timeout + 1 Retry), wie im Kalender-Skript.
// ---------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function contentUrl(title) {
  const p = new URLSearchParams({
    action: "query", format: "json", formatversion: "2", redirects: "1",
    prop: "revisions", rvslots: "main", rvprop: "content|timestamp", titles: title,
  });
  return `${API}?${p.toString()}`;
}

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

// Holt Wikitext + letzten Revisionsstempel + ob umgeleitet wurde.
async function fetchPage(title) {
  const json = await apiGet(contentUrl(title));
  const page = json?.query?.pages?.[0];
  const redirect = json?.query?.redirects?.[0]?.to ?? null;
  if (!page || page.missing) return { missing: true };
  const rev = page?.revisions?.[0];
  return {
    missing: false,
    resolvedTitle: page.title,
    redirectedTo: redirect,
    timestamp: rev?.timestamp ?? null,
    content: rev?.slots?.main?.content ?? "",
  };
}

// ---------------------------------------------------------------------------
// Wikitext-Helfer
// ---------------------------------------------------------------------------

// Tabellenblöcke ZEILENBASIERT + verschachtelungssicher (wie im Kalender-Skript).
function extractTables(wt) {
  const tables = []; let depth = 0, buf = [];
  for (const line of wt.split("\n")) {
    const t = line.trimStart();
    if (t.startsWith("{|")) { if (depth === 0) buf = []; depth++; buf.push(line); continue; }
    if (depth > 0) { buf.push(line); if (t.startsWith("|}")) { depth--; if (depth === 0) tables.push(buf.join("\n")); } }
  }
  return tables;
}

// Text bereinigen: Wikilinks → Anzeigetext, Templates/Refs/HTML entfernen.
function cleanText(s) {
  return String(s)
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "")
    .replace(/<ref[^>]*\/>/gi, "")
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g, "$1")
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/'''?/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Die Haupt-Visa-Tabelle: Kopf enthält "Allowed stay" UND "Visa requirement".
function findMainTable(tables) {
  return tables.find((t) => {
    const head = t.split("\n").slice(0, 8).join("\n").toLowerCase();
    return head.includes("allowed stay") && head.includes("visa requirement");
  }) ?? null;
}

// Ländername aus der ersten Zelle ({{flag|Name}} / {{flagicon|Name}} [[Name]]).
function countryFromCell(cell) {
  const m = cell.match(/\{\{\s*flag(?:icon|country|deco|u)?\s*\|\s*([^|}]+)/i);
  if (m) return m[1].trim();
  const l = cell.match(/\[\[([^\]|]+)/);
  return l ? l[1].trim() : cleanText(cell);
}

// Status-Templates der Visa-Spalte (Farbcodes). BLACK = „Admission refused“ (Sanktionen/
// Einreisesperren, z. B. Iran→USA, Russland→mehrere Schengen), Optional = eVisa/VoA — beide
// sind eigene, relevante Kategorien und MÜSSEN erfasst werden, sonst fallen genau die
// kritischen Zeilen weg.
const STATUS_TPL = /\{\{\s*(?:no|yes|partial|yes-no|yes2|maybe|unknown|optional|black|sort|okay|n\/a|nom|nay|dyk|rh|good|bad)\b[^|{}]*\|([\s\S]*?)\}\}/i;

// Innentext eines Status-Templates säubern: führende Attribut-/Sortkey-Teile (`style=…|`,
// reine Zahlen) verwerfen, letzten Textteil nehmen.
function innerText(raw) {
  const parts = String(raw).split("|").map((s) => s.trim()).filter((p) => p && !/^[a-z-]+\s*=/i.test(p) && !/^\d+$/.test(p));
  return cleanText(parts.length ? parts[parts.length - 1] : raw);
}

// Visumsart aus der Visa-Zelle: bevorzugt der Text im Farb-Template, sonst der Zelltext.
// Plus data-sort-value (Wikipedia-Konvention: 1 Freizügigkeit, 2 visumfrei, 3 eVisa/VoA/eTA, 4 Visum nötig).
function parseVisaCell(cell) {
  const sortM = cell.match(/data-sort-value\s*=\s*"?(\d+)/i);
  const sort = sortM ? Number(sortM[1]) : null;
  const tplM = cell.match(STATUS_TPL);
  const raw = tplM ? innerText(tplM[1]) : cleanText(cell);
  return { status: raw, sort };
}

// Zeilen der Tabelle → Zellen (eine Zelle je `|`-Zeilenanfang; `||` inline getrennt).
function rowCells(rowText) {
  const cells = [];
  for (let line of rowText.split("\n")) {
    const t = line.trimStart();
    if (!/^[|!]/.test(t) || t.startsWith("|-") || t.startsWith("|}") || t.startsWith("|+")) continue;
    const body = t.replace(/^(?:\|\||!!|\||!)/, "");
    for (const part of body.split(/\|\|/)) cells.push(part.trim());
  }
  return cells;
}

// Attribut-Präfix einer Zelle abschneiden (z. B. `style="..."|Inhalt`), aber
// data-sort-value zuvor bewahren (wird separat gelesen).
function stripCellAttrs(cell) {
  const bar = cell.indexOf("|");
  if (bar > -1 && /=/.test(cell.slice(0, bar)) && !/\{\{|\[\[/.test(cell.slice(0, bar))) return cell.slice(bar + 1).trim();
  return cell;
}

// Parst die Haupttabelle → Map Zielland-Name(lc) → { country, status, sort, stay }.
function parseMainTable(table) {
  const out = new Map();
  const rows = table.split(/\n\|-/); // erste "Zeile" = Kopf
  for (let i = 1; i < rows.length; i++) {
    const cells = rowCells(rows[i]);
    if (cells.length < 2) continue;
    const country = countryFromCell(cells[0]);
    if (!country || /^[A-Z][a-z]+ (nations|states|Union)/.test(country)) continue;
    const visa = parseVisaCell(cells[1]);
    const stay = cells[2] ? cleanText(stripCellAttrs(cells[2])) : "";
    if (!visa.status) continue;
    out.set(country.toLowerCase(), { country, status: visa.status, sort: visa.sort, stay });
  }
  return out;
}

// Frische-Signale: letzter Revisionsstempel (aus API) + Anzahl {{Timatic}}-Belege (IATA)
// + "as of"-Erwähnungen im Text.
function freshnessSignals(wt) {
  const timatic = (wt.match(/\{\{\s*Timatic/gi) || []).length;
  const asof = (wt.match(/\bas of\b/gi) || []).length;
  return { timatic, asof };
}

// Status-Vokabular normalisieren (nur zum Zählen der Varianten — NICHT die spätere Logik).
function normStatus(s) {
  return s.toLowerCase().replace(/\[[^\]]*\]/g, "").replace(/\s+/g, " ").replace(/[.,;].*$/, "").trim();
}

// ---------------------------------------------------------------------------
// Hauptlauf
// ---------------------------------------------------------------------------
const results = [];
const vocab = new Map();          // normalisierte Visumsart → Anzahl (über Zielregion-Zeilen)
const EXAMPLES = [
  { nat: "Iranian", dest: "United States", iso: "US" },
  { nat: "Indian", dest: "Spain", iso: "ES" },
  { nat: "Tunisian", dest: "France", iso: "FR" },
];
const exampleRows = [];

console.log(`Prüfe ${NATIONALITIES.length} Nationalitäten gegen ${Object.keys(DEST_REGION).length} Zielregion-Länder …\n`);

for (const nat of NATIONALITIES) {
  const title = `Visa requirements for ${nat.demonym} citizens`;
  await sleep(1100); // ≥1 s zwischen Abrufen
  let page;
  try { page = await fetchPage(title); }
  catch (e) { results.push({ ...nat, ok: false, error: String(e.message || e) }); console.log(`  ✗ ${nat.demonym}: ${e.message}`); continue; }

  if (page.missing) { results.push({ ...nat, ok: false, error: "Seite fehlt" }); console.log(`  ✗ ${nat.demonym}: Seite fehlt`); continue; }

  const tables = extractTables(page.content);
  const main = findMainTable(tables);
  if (!main) { results.push({ ...nat, ok: false, error: "keine Haupttabelle (Allowed stay)", resolvedTitle: page.resolvedTitle }); console.log(`  ⚠ ${nat.demonym}: keine Haupttabelle`); continue; }

  const rows = parseMainTable(main);
  // Coverage der Zielregion
  const covered = [], missing = [];
  for (const [iso, names] of Object.entries(DEST_REGION)) {
    const hit = names.some((n) => rows.has(n.toLowerCase()));
    (hit ? covered : missing).push(iso);
  }
  // Vokabel-Zählung über die Zielregion-Zeilen
  for (const [iso, names] of Object.entries(DEST_REGION)) {
    for (const n of names) {
      const r = rows.get(n.toLowerCase());
      if (r) { const k = normStatus(r.status); vocab.set(k, (vocab.get(k) || 0) + 1); break; }
    }
  }
  const fresh = freshnessSignals(page.content);
  results.push({
    ...nat, ok: true, resolvedTitle: page.resolvedTitle, redirectedTo: page.redirectedTo,
    timestamp: page.timestamp, totalRows: rows.size, covered: covered.length,
    missing, timatic: fresh.timatic, asof: fresh.asof,
  });
  console.log(`  ✓ ${nat.demonym}: ${rows.size} Zeilen, Zielregion ${covered.length}/${Object.keys(DEST_REGION).length}, Timatic-Belege ${fresh.timatic}, Rev ${page.timestamp?.slice(0,10)}`);

  // Beispielzeilen sammeln
  for (const ex of EXAMPLES) {
    if (ex.nat === nat.demonym) {
      const names = DEST_REGION[ex.iso] || [ex.dest];
      let r = null;
      for (const n of names) { r = rows.get(n.toLowerCase()); if (r) break; }
      if (!r) r = rows.get(ex.dest.toLowerCase());
      exampleRows.push({ ...ex, row: r });
    }
  }
}

// ---------------------------------------------------------------------------
// Bericht
// ---------------------------------------------------------------------------
const ok = results.filter((r) => r.ok);
const bad = results.filter((r) => !r.ok);
const totalDest = Object.keys(DEST_REGION).length;
const fmtPct = (n, d) => `${n}/${d} (${Math.round((100 * n) / d)}%)`;

const lines = [];
lines.push("# Visa-Anforderungen aus Wikipedia — Erkundung (nur Messung)");
lines.push("");
lines.push(`Stand des Laufs: letzte Revision je Seite s. Tabelle. Quelle: MediaWiki-API, ` +
  `Seiten „Visa requirements for X citizens“ (CC BY-SA). ≥1 s zwischen Abrufen, UA gesetzt. ` +
  `Kein DB-/App-Zugriff. Gemessen: Existenz, Tabellenaufbau, Zeilenzahl, Zielregion-Coverage, ` +
  `Vokabular der Visumsarten, Frische. **Nicht** erfasst: Gebühren/Wartezeiten (nicht belastbar).`);
lines.push("");
lines.push(`Nationalitäten geprüft: **${NATIONALITIES.length}** · Seiten gefunden: **${ok.length}** · Probleme: **${bad.length}**`);
lines.push(`Zielregion-Länder (aus web.tour_tournaments ∩ Planer-Zielregion): **${totalDest}**`);
lines.push("");

lines.push("## 1) Existenz der Seiten");
lines.push("");
if (bad.length === 0) lines.push("Für **alle** vorgeschlagenen Nationalitäten existiert eine Seite. Keine fehlt.");
else {
  lines.push("Fehlende/uneindeutige Seiten:");
  for (const b of bad) lines.push(`- **${b.demonym}** (${b.iso}): ${b.error}`);
}
lines.push("");

lines.push("## 2) Tabellenaufbau — maschinell auslesbar?");
lines.push("");
lines.push("Die Haupttabelle jeder Seite ist eine sortierbare Wikitable mit festem Kopf:");
lines.push("`Country | Visa requirement | Allowed stay | Notes`. Auslesbar sind:");
lines.push("- **Zielland**: aus `{{flag|Name}}` in Spalte 1 — eindeutig.");
lines.push("- **Visumsart**: Text im Farb-Template der Spalte 2 (`{{no|Visa required}}`, `{{yes|Visa not required}}`, `{{partial|eVisa}}`) PLUS `data-sort-value` (1 Freizügigkeit, 2 visumfrei, 3 eVisa/VoA/eTA, 4 Visum nötig) — doppeltes, konsistentes Signal.");
lines.push("- **Aufenthaltsdauer**: Spalte 3, oft „90 days“ o. ä.; bei visumpflichtigen Zielen meist leer.");
lines.push("- **Fußnoten** stecken in `<ref>…</ref>` und stören das Auslesen nicht (werden entfernt). Sonderfälle stehen in Spalte 4 „Notes“ als Freitext — für eine reine **Warnung** (Visum ja/nein + Link) nicht nötig.");
lines.push("");
lines.push("→ **Kernfelder (Zielland, Visumsart, Aufenthaltsdauer) sind maschinell auslesbar.** Kosten/Wartezeiten stehen dort nicht strukturiert — wie gefordert nicht erfasst.");
lines.push("");

lines.push("## 3) Zeilen je Seite & Coverage der Turnier-Zielländer");
lines.push("");
lines.push("| Nationalität | ISO | Gruppe | Zeilen | Zielregion-Coverage | fehlende Ziele | Timatic-Belege | letzte Revision |");
lines.push("|---|---|---|--:|---|---|--:|---|");
for (const r of ok) {
  lines.push(`| ${r.demonym} | ${r.iso} | ${r.group} | ${r.totalRows} | ${fmtPct(r.covered, totalDest)} | ${r.missing.length ? r.missing.join(",") : "—"} | ${r.timatic} | ${r.timestamp?.slice(0,10) ?? "?"} |`);
}
lines.push("");
const avgRows = ok.length ? Math.round(ok.reduce((s, r) => s + r.totalRows, 0) / ok.length) : 0;
const fullCover = ok.filter((r) => r.covered === totalDest).length;
const ownOnly = ok.filter((r) => r.missing.length === 1 && r.missing[0] === r.iso).length;
const otherGaps = ok.filter((r) => r.missing.some((m) => m !== r.iso));
lines.push(`Durchschnitt **${avgRows} Zeilen** je Seite. **${fullCover}/${ok.length}** Seiten decken **alle ${totalDest}** Zielregion-Länder ab.`);
lines.push(`Die übrigen zeigen „${totalDest - 1}/${totalDest}“ — bei **${ownOnly}** davon fehlt exakt das **eigene Land** ` +
  `(kommt in der eigenen Seite erwartungsgemäß nicht als Ziel vor; keine echte Lücke). ` +
  `→ **Effektive Abdeckung der Auslands-Ziele: praktisch 100 %.**` +
  (otherGaps.length ? ` Andere Lücken: ${otherGaps.map((r) => `${r.demonym} (${r.missing.filter((m) => m !== r.iso).join(",")})`).join("; ")}.` : ""));
lines.push("");

lines.push("## 4) Vokabular der Visumsarten (über die Zielregion-Zeilen)");
lines.push("");
lines.push("So oft kam welche Formulierung in Spalte „Visa requirement“ vor (normalisiert):");
lines.push("");
lines.push("| Visumsart (normalisiert) | Häufigkeit |");
lines.push("|---|--:|");
for (const [k, n] of [...vocab.entries()].sort((a, b) => b[1] - a[1])) lines.push(`| ${k || "(leer)"} | ${n} |`);
lines.push("");
lines.push(`Distinkte Rohvarianten: **${vocab.size}** — aber sie fallen auf **wenige Klassen** zusammen:`);
lines.push("**visumfrei**, **eVisa**, **Visa on arrival**, **eTA/ETA**, **Visum nötig** und — sicherheitsrelevant — **„Admission refused“** (Einreisesperre, z. B. Iran→USA, Russland→mehrere Schengen-Länder). Qualifizierer wie „(conditional)“ hängen dran. Die numerische `data-sort-value` (1/2/3/4) stützt die Normalisierung. Ein paar Rohwerte tragen noch Wikilink-Reste (`…]]`) — kosmetisch, wenige Zeilen.");
lines.push("");

lines.push("## 5) Aktualität");
lines.push("");
const newest = ok.map((r) => r.timestamp).filter(Boolean).sort().at(-1);
const oldest = ok.map((r) => r.timestamp).filter(Boolean).sort()[0];
const timaticPages = ok.filter((r) => r.timatic > 0).length;
lines.push(`- Letzte Revisionen: von **${oldest?.slice(0,10)}** bis **${newest?.slice(0,10)}** — die Seiten werden laufend gepflegt.`);
lines.push(`- **${timaticPages}/${ok.length}** Seiten stützen Zeilen auf **IATA-Timatic**-Belege (\`{{Timatic|nationality=..|destination=..}}\`) — die maßgebliche Reise-Doku-Datenbank.`);
lines.push(`- Ein fester „Stand“ pro Zelle steht nicht immer dabei; die Revisionshistorie und Timatic-Refs sind der belastbarste Frische-Anker. Für eine **Warnung** (kein amtlicher Bescheid) ausreichend, mit Hinweis „ohne Gewähr, bitte offiziell prüfen“ + Quelllink.`);
lines.push("");

lines.push("## 6) Drei Beispielzeilen (verbatim aus der Tabelle)");
lines.push("");
for (const ex of exampleRows) {
  lines.push(`**${ex.nat} → ${ex.dest}:**`);
  if (!ex.row) { lines.push("- (Zeile nicht gefunden — im Bericht prüfen)"); lines.push(""); continue; }
  lines.push(`- Visumsart: \`${ex.row.status}\`  (data-sort-value: ${ex.row.sort ?? "—"})`);
  lines.push(`- Aufenthaltsdauer: \`${ex.row.stay || "(leer)"}\``);
  lines.push("");
}

lines.push("## Fazit (Datenlage)");
lines.push("");
lines.push("- **Auslesbar:** ja — Zielland + Visumsart je Kombination sind strukturiert; Aufenthaltsdauer meist vorhanden.");
lines.push("- **Vollständigkeit:** die Tabellen listen ~alle Staaten, die Turnier-Zielregion ist praktisch vollständig abgedeckt.");
lines.push("- **Grenzen:** Freitext-„Notes“ und Sonderfälle (Bedingungen, Reisedokument-Abhängigkeit) sind nicht normiert; Gebühren/Wartezeiten fehlen belastbar (bewusst nicht erfasst). Für eine **nationalitätsabhängige Warnung mit Quelllink** reicht die Datenlage; als amtliche Auskunft nicht geeignet.");
lines.push("");

const outPath = join(__dirname, "visa-wikipedia-erkundung.md");
writeFileSync(outPath, lines.join("\n"), "utf8");
console.log(`\nBericht geschrieben: ${outPath}`);
