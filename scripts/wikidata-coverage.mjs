// wikidata-coverage.mjs
//
// Misst, wie gut Wikidata ITF-Futures (M15/M25) und ATP-Challenger in Europa,
// der Türkei und Nordafrika (Tunesien, Ägypten, Marokko) abdeckt.
//
// Reines Node (ESM), keine Dependencies — Node 24 hat fetch eingebaut.
// KEINE App-Änderung, KEIN DB-Zugriff. Nur der Wikidata Query Service wird abgefragt.
//
// Ausführen:  node scripts/wikidata-coverage.mjs
// Ergebnis:   scripts/wikidata-coverage-report.md  (+ Kopie in ~/Downloads)

import { writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ENDPOINT = "https://query.wikidata.org/sparql";
// Aussagekräftiger User-Agent, wie es der Dienst verlangt.
const USER_AGENT =
  "MatchupTournamentCoverage/1.0 (https://matchup-app.com; wiederhold.martin@web.de) node-fetch";

const YEARS = [2024, 2025, 2026];

// Zu prüfende Felder: Property-ID → Kurzname für den Bericht.
const FIELDS = [
  { key: "loc", label: "Ort (P276)" },
  { key: "country", label: "Land (P17)" },
  { key: "coord", label: "Koordinaten (P625)" },
  { key: "website", label: "Website (P856)" },
  { key: "date", label: "Startdatum (P580/P585)" },
  { key: "surface", label: "Belag (P765)" },
  { key: "prize", label: "Preisgeld (P2769)" },
];

// Länder-QIDs für die Nicht-Europa-Region (Türkei ist teils europäisch, wird ohnehin erfasst).
const REGION_COUNTRY_QIDS = new Set([
  "Q43", // Türkei
  "Q948", // Tunesien
  "Q79", // Ägypten
  "Q1028", // Marokko
]);
// Europäische Länder (QIDs), um „Region" ohne teuren Kontinent-Join (P30) zu bestimmen.
// Die Kontinent-Hops haben die Abfragen über das 60-s-Limit von WDQS getrieben.
const EUROPE_QIDS = new Set([
  "Q222", "Q228", "Q40", "Q184", "Q31", "Q225", "Q219", "Q224", "Q229", "Q213", // Albanien…Tschechien
  "Q35", "Q191", "Q33", "Q142", "Q183", "Q41", "Q28", "Q189", "Q27", "Q38", // Dänemark…Italien
  "Q1246", "Q211", "Q347", "Q37", "Q32", "Q233", "Q217", "Q235", "Q236", "Q55", // Kosovo…Niederlande
  "Q221", "Q20", "Q36", "Q45", "Q218", "Q159", "Q238", "Q403", "Q214", "Q215", // Nordmazedonien…Slowenien
  "Q29", "Q34", "Q39", "Q212", "Q145", "Q237", "Q230", "Q399", "Q227", // Spanien…Aserbaidschan
]);

// ---------------------------------------------------------------------------
// SPARQL-Bausteine (zweiphasig, timeout-sicher)
// ---------------------------------------------------------------------------
// Phase 1: nur die QIDs holen (leichtgewichtig, kein SERVICE-Label, keine Felder).
// Phase 2: Felder je QID-Chunk per VALUES-Bindung — dadurch immer schnell.

const TIER_REGEX = "M15|M25|Challenger|Futures|ITF";

// Jahresfilter über ein Pflicht-Datumsfeld (selektiv, aber Datum wird erzwungen).
const dateReq = (year) => `  ?item (wdt:P580|wdt:P585) ?d . FILTER(YEAR(?d) = ${year})`;
// Jahresfilter über die Jahreszahl im Label (erzwingt kein Datum → ehrliche Datums-Vollständigkeit).
const labelYear = (year) => `  FILTER(CONTAINS(?itemLabelRaw, "${year}"))`;

// Phase 1 — Variante 1: instance of (P31) „tennis tournament" (Q13219666) bzw. Unterklasse (P279*).
// (Die Klasse „tennis tournament edition" Q47345468 wurde getestet — bringt keine zusätzlichen
// Treffer, verdreifacht aber die Laufzeit → weggelassen.) Tier im Turnier-Label.
// Primär Jahr über PFLICHT-Datum zuerst (macht die Menge klein → Regex bleibt schnell, ~7s);
// Alt = Jahreszahl im Label (fängt datumslose Ausgaben, falls primär 0).
function idsP31(year, alt) {
  return `
SELECT DISTINCT ?item WHERE {
  ?item wdt:P31/wdt:P279* wd:Q13219666 .
${alt ? labelYear(year) : dateReq(year)}
  ?item rdfs:label ?itemLabelRaw . FILTER(LANG(?itemLabelRaw) = "en")
  FILTER(REGEX(?itemLabelRaw, "${TIER_REGEX}", "i"))
} LIMIT 4000`;
}

// Phase 1 — Variante 2: sport (P641 = Tennis Q847). Pflicht-Datum, sonst würde die
// Abfrage alle Tennis-Spieler scannen (Timeout). Datums-Vollständigkeit daher ~100 % (vermerkt).
function idsP641(year) {
  return `
SELECT DISTINCT ?item WHERE {
  ?item wdt:P641 wd:Q847 .
${dateReq(year)}
  ?item rdfs:label ?itemLabelRaw . FILTER(LANG(?itemLabelRaw) = "en")
  FILTER(REGEX(?itemLabelRaw, "${TIER_REGEX}", "i"))
} LIMIT 4000`;
}

// Phase 1 — Variante 3: Turnierserie (P179), Serien-Label nennt Challenger/World Tennis Tour/ITF/Futures.
function idsP179(year) {
  // Datum ZUERST: schränkt die Menge klein ein, bevor die Serien-Label-Regex greift
  // (mit Serie zuerst lief die Abfrage in Timeouts).
  return `
SELECT DISTINCT ?item WHERE {
${dateReq(year)}
  ?item wdt:P179 ?series .
  ?series rdfs:label ?seriesLabel . FILTER(LANG(?seriesLabel) = "en")
  FILTER(REGEX(?seriesLabel, "Challenger|World Tennis Tour|ITF|Futures", "i"))
} LIMIT 4000`;
}

// Phase 2 — Felder für eine Liste von QIDs (VALUES-gebunden → schnell, kein Timeout).
// Ort (P276) → dessen Land (P17), damit Turniere ohne eigenes P17 geografisch auflösbar bleiben.
function buildFields(qids) {
  const values = qids.map((q) => `wd:${q}`).join(" ");
  return `
SELECT ?item ?itemLabel ?locLabel ?country ?countryLabel ?locCountry ?locCountryLabel ?coord ?website ?start ?point ?surfaceLabel ?prize WHERE {
  VALUES ?item { ${values} }
  OPTIONAL { ?item wdt:P580 ?start. }
  OPTIONAL { ?item wdt:P585 ?point. }
  OPTIONAL { ?item wdt:P276 ?loc. OPTIONAL { ?loc wdt:P17 ?locCountry. } }
  OPTIONAL { ?item wdt:P17 ?country. }
  OPTIONAL { ?item wdt:P625 ?coord. }
  OPTIONAL { ?item wdt:P856 ?website. }
  OPTIONAL { ?item wdt:P765 ?surface. }
  OPTIONAL { ?item wdt:P2769 ?prize. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}`;
}

const VARIANTS = [
  { id: "V1", name: "P31 (instance of → tennis tournament, Q13219666)", buildIds: idsP31, canFallback: true },
  { id: "V2", name: "P641 (Sport = Tennis Q847, Datum Pflicht)", buildIds: (y) => idsP641(y), canFallback: false },
  // V3 ohne Label-Jahr-Fallback: der wäre ohne Datumszwang zu schwer (WDQS-Timeout). 0 dated
  // Treffer ist hier ein echtes Ergebnis (P179-Serien-Achse für Ausgaben praktisch ungenutzt).
  { id: "V3", name: "P179 (Turnierserie: Challenger/World Tennis Tour/ITF/Futures, Datum Pflicht)", buildIds: idsP179, canFallback: false },
];

// ---------------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Führt eine SPARQL-Abfrage aus, mit Timeout und einem Retry.
async function runQuery(sparql) {
  const url = `${ENDPOINT}?query=${encodeURIComponent(sparql)}&format=json`;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 90_000);
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/sparql-results+json", "User-Agent": USER_AGENT },
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const json = await res.json();
      return json.results.bindings;
    } catch (err) {
      clearTimeout(timer);
      if (attempt === 2) throw err;
      console.error(`  Versuch ${attempt} fehlgeschlagen (${err.message}) — warte 3s, neuer Versuch…`);
      await sleep(3000);
    }
  }
  return [];
}

// QID aus einer Entity-URI ziehen.
const qid = (uri) => (uri ? uri.split("/").pop() : null);

// Phase-1-Ergebnis (nur ?item) → Liste von QIDs.
const aggregateIds = (bindings) => bindings.map((b) => qid(b.item?.value)).filter(Boolean);

// Aggregiert die (evtl. mehrzeiligen) SPARQL-Ergebnisse pro Turnier-Item.
function aggregate(bindings) {
  const items = new Map();
  for (const b of bindings) {
    const id = qid(b.item?.value);
    if (!id) continue;
    if (!items.has(id)) {
      items.set(id, {
        qid: id,
        label: b.itemLabel?.value ?? id,
        loc: null,
        country: null, // Land-Name (aus P17 des Turniers)
        countryQid: null, // Land-QID (P17 des Turniers)
        locCountry: null, // Land-Name aus dem Ort (P276 → P17)
        locCountryQid: null, // Land-QID aus dem Ort
        coord: null,
        website: null,
        date: null,
        surface: null,
        prize: null,
      });
    }
    const it = items.get(id);
    // Feld gilt als vorhanden, sobald irgendeine Zeile es liefert.
    if (b.locLabel?.value) it.loc ??= b.locLabel.value;
    if (b.countryLabel?.value) it.country ??= b.countryLabel.value;
    if (b.country?.value) it.countryQid ??= qid(b.country.value);
    // Land ersatzweise über den Ort auflösen.
    if (b.locCountryLabel?.value) it.locCountry ??= b.locCountryLabel.value;
    if (b.locCountry?.value) it.locCountryQid ??= qid(b.locCountry.value);
    if (b.coord?.value) it.coord ??= b.coord.value;
    if (b.website?.value) it.website ??= b.website.value;
    if (b.start?.value) it.date ??= b.start.value;
    else if (b.point?.value) it.date ??= b.point.value;
    if (b.surfaceLabel?.value) it.surface ??= b.surfaceLabel.value;
    if (b.prize?.value) it.prize ??= b.prize.value;
  }
  return [...items.values()];
}

// Aufgelöste Land-QID: bevorzugt Turnier-Land (P17), sonst Land des Orts (P276→P17).
const resolvedCountryQid = (it) => it.countryQid ?? it.locCountryQid ?? null;
// Aufgelöster Land-Name (für Anzeige).
const resolvedCountryName = (it) => it.country ?? it.locCountry ?? null;
// Land gar nicht bestimmbar (weder über P17 noch über den Ort)?
const countryUnknown = (it) => resolvedCountryQid(it) === null;

// Liegt ein Turnier in der Zielregion (Europa ∪ Türkei/Tunesien/Ägypten/Marokko)?
// Über die aufgelöste Land-QID (Turnier-Land oder Ort-Land) gegen die Länder-Listen.
function inRegion(it) {
  const cq = resolvedCountryQid(it);
  if (!cq) return false;
  return EUROPE_QIDS.has(cq) || REGION_COUNTRY_QIDS.has(cq);
}

// Feldvollständigkeit einer Turnier-Liste: pro Feld absolute Zahl + Prozent.
function completeness(list) {
  const out = {};
  for (const f of FIELDS) {
    const n = list.filter((it) => it[f.key] != null).length;
    out[f.key] = { n, pct: list.length ? (n / list.length) * 100 : 0 };
  }
  return out;
}

const pct = (x) => `${x.toFixed(1)}%`;

// ---------------------------------------------------------------------------
// Hauptlauf
// ---------------------------------------------------------------------------

const results = []; // { variantId, variantName, year, fallbackUsed, total, region, list, completeness, error }
const allItems = new Map(); // qid → item (für die Stichprobe, dedupliziert)

for (const variant of VARIANTS) {
  for (const year of YEARS) {
    process.stdout.write(`${variant.id} ${year}: `);
    let fallbackUsed = false;
    let list = [];
    let error = null;
    // Jede Zelle ist isoliert: ein Fehlschlag wird protokolliert und beendet
    // NICHT den ganzen Lauf — die betroffene Zelle erscheint im Bericht als Fehler.
    try {
      // Phase 1: QIDs holen (leicht). Bei 0 Treffern ggf. Alt-Jahresfilter.
      let ids = [...new Set(aggregateIds(await runQuery(variant.buildIds(year, false))))];
      if (ids.length === 0 && variant.canFallback) {
        await sleep(1200);
        process.stdout.write("(0 → Alt-Jahresfilter) ");
        ids = [...new Set(aggregateIds(await runQuery(variant.buildIds(year, true))))];
        fallbackUsed = ids.length > 0;
      }
      // Phase 2: Felder je QID-Chunk (VALUES-gebunden → schnell).
      for (let i = 0; i < ids.length; i += 160) {
        if (i > 0) await sleep(1200);
        const chunk = ids.slice(i, i + 160);
        list.push(...aggregate(await runQuery(buildFields(chunk))));
      }
    } catch (err) {
      error = err.message;
    }

    const region = list.filter(inRegion);
    const unknown = list.filter(countryUnknown).length; // Land weder über P17 noch über Ort bestimmbar
    results.push({
      variantId: variant.id,
      variantName: variant.name,
      year,
      fallbackUsed,
      total: list.length,
      region: region.length,
      unknown,
      completeness: completeness(list),
      error,
    });
    // Region-Turniere bevorzugt in die Stichprobe aufnehmen.
    for (const it of list) if (!allItems.has(it.qid)) allItems.set(it.qid, { ...it, region: inRegion(it) });

    console.log(
      error
        ? `FEHLER (${error})`
        : `${list.length} Turniere, ${region.length} in Region, ${unknown} ohne Land`,
    );
    await sleep(1500); // Rate-Limit
  }
}

// Stichprobe: 20 Turniere, Region bevorzugt.
const sample = [...allItems.values()]
  .sort((a, b) => Number(b.region) - Number(a.region))
  .slice(0, 20);

// ---------------------------------------------------------------------------
// Bericht schreiben
// ---------------------------------------------------------------------------

const now = new Date().toISOString();
const md = [];
md.push(`# Wikidata-Abdeckung: ITF-Futures (M15/M25) & ATP-Challenger`);
md.push("");
md.push(`> Automatisch erzeugt von \`scripts/wikidata-coverage.mjs\` · Lauf: ${now}`);
md.push(`> Quelle: Wikidata Query Service (${ENDPOINT}), Lizenz der Daten: CC0.`);
md.push(`> Region = Europa (Kontinent Q46) ∪ Türkei (Q43), Tunesien (Q948), Ägypten (Q79), Marokko (Q1028).`);
md.push("");
md.push(`## Methodik`);
md.push("");
md.push(`Drei **unabhängige** Klassifikations-Varianten, je Jahr getrennt gezählt (nie zusammengefasst).`);
md.push(`Tier-Erkennung über Regex \`${TIER_REGEX}\` im Turnier- bzw. Serien-Label.`);
md.push(`**Jahresfilter:** Alle drei Varianten filtern das Jahr primär über ein **Pflicht-Datumsfeld**`);
md.push(`(\`P580\`/\`P585\`). Das ist nötig, damit die Label-/Serien-Regex nur eine kleine Menge scannt`);
md.push(`(sonst Timeouts). **Folge:** Die Datums-Vollständigkeit ist damit bauartbedingt ~100 % und`);
md.push(`**kein** Abdeckungssignal — die übrigen Felder (Ort, Koordinaten, Website, Belag, Preisgeld) sind es.`);
md.push(`Für **V1/V3** greift bei 0 Treffern ein **Alt-Filter** (Jahreszahl im Label), um datumslose Ausgaben zu fangen (markiert).`);
md.push("");
md.push(`**Regionszuordnung:** Das Land wird bevorzugt über \`P17\` des Turniers bestimmt; fehlt es,`);
md.push(`ersatzweise über den **Ort** (\`P276\` → dessen \`P17\`). Turniere, deren Land sich auf`);
md.push(`**keinem** Weg auflösen lässt, werden als **„Land unbekannt"** separat ausgewiesen`);
md.push(`(nicht stillschweigend aus der Region entfernt).`);
md.push("");
md.push(`**Robustheit:** Jede Abfrage ist isoliert (Timeout 90s, 1 Retry). Ein Fehlschlag beendet den`);
md.push(`Lauf nicht, sondern erscheint in der betroffenen Zelle als Fehler.`);
md.push("");
md.push(`Geprüfte Felder: ${FIELDS.map((f) => f.label).join(", ")}.`);
md.push("");

// Übersichtstabelle Turnierzahlen
md.push(`## 1. Turnierzahlen je Variante und Jahr`);
md.push("");
md.push(`| Variante | Jahr | Gefunden | davon in Region | Land unbekannt | Fallback? | Fehler |`);
md.push(`|---|---|---:|---:|---:|---|---|`);
for (const r of results) {
  md.push(
    `| ${r.variantId} | ${r.year} | ${r.total} | ${r.region} | ${r.unknown ?? 0} | ${r.fallbackUsed ? "ja" : "–"} | ${r.error ?? "–"} |`,
  );
}
md.push("");
md.push(`**Varianten:**`);
for (const v of VARIANTS) md.push(`- **${v.id}** — ${v.name}`);
md.push("");

// Feldvollständigkeit je Variante/Jahr
md.push(`## 2. Feldvollständigkeit (absolut / Prozent, bezogen auf „Gefunden")`);
md.push("");
md.push(`| Variante | Jahr | n | ${FIELDS.map((f) => f.label).join(" | ")} |`);
md.push(`|---|---|---:|${FIELDS.map(() => "---:").join("|")}|`);
for (const r of results) {
  const cells = FIELDS.map((f) => {
    const c = r.completeness[f.key];
    return `${c.n} / ${pct(c.pct)}`;
  });
  md.push(`| ${r.variantId} | ${r.year} | ${r.total} | ${cells.join(" | ")} |`);
}
md.push("");

// Stichprobe
md.push(`## 3. Stichprobe (${sample.length} Turniere, Region bevorzugt)`);
md.push("");
md.push(`Spalte „Land" zeigt das aufgelöste Land (P17 des Turniers, sonst über den Ort); „(Ort)" markiert die Auflösung über den Ort.`);
md.push("");
md.push(`| QID | Label | Ort | Land | Koord. | Website | Datum | Belag | Preisgeld | Region |`);
md.push(`|---|---|---|---|---|---|---|---|---|---|`);
for (const it of sample) {
  const v = (x) => (x ? String(x).replace(/\|/g, "\\|") : "—");
  const coord = it.coord ? "ja" : "—";
  const web = it.website ? "ja" : "—";
  const date = it.date ? String(it.date).slice(0, 10) : "—";
  // Land: P17 des Turniers bevorzugt, sonst über den Ort (markiert), sonst unbekannt.
  const land = it.country ? v(it.country) : it.locCountry ? `${v(it.locCountry)} (Ort)` : "—";
  md.push(
    `| ${it.qid} | ${v(it.label)} | ${v(it.loc)} | ${land} | ${coord} | ${web} | ${date} | ${v(it.surface)} | ${v(it.prize)} | ${it.region ? "ja" : "—"} |`,
  );
}
md.push("");

// SPARQL im Volltext
md.push(`## 4. Verwendete SPARQL-Abfragen (Volltext)`);
md.push("");
md.push(`Zweiphasig: **Phase 1** holt je Variante/Jahr nur die QIDs (leichtgewichtig),`);
md.push(`**Phase 2** lädt die Felder je QID-Chunk per \`VALUES\` (immer schnell, kein Timeout).`);
md.push(`Beispielhaft für **Jahr 2024**; für 2025/2026 wird nur die Jahreszahl ersetzt.`);
md.push(`Der Alt-Jahresfilter (nur V1/V3, greift bei 0 Treffern) ersetzt das Pflicht-Datum durch \`FILTER(CONTAINS(?itemLabelRaw,"JAHR"))\`.`);
md.push("");
for (const v of VARIANTS) {
  md.push(`### ${v.id} — ${v.name} · Phase 1 (QIDs)`);
  md.push("");
  md.push("```sparql");
  md.push(v.buildIds(2024, false).trim());
  md.push("```");
  md.push("");
  if (v.canFallback) {
    md.push(`**Alt-Jahresfilter (${v.id}, 2024):**`);
    md.push("");
    md.push("```sparql");
    md.push(v.buildIds(2024, true).trim());
    md.push("```");
    md.push("");
  }
}
md.push(`### Phase 2 — Felder je QID-Chunk (für alle Varianten gleich)`);
md.push("");
md.push("```sparql");
md.push(buildFields(["Q_BEISPIEL_1", "Q_BEISPIEL_2"]).trim());
md.push("```");
md.push("");

md.push(`## 5. Hinweise`);
md.push("");
md.push(`- Alle Zahlen stammen unverändert aus dem Query Service; nichts ist geschätzt oder ergänzt.`);
md.push(`- Mehrfachwerte (z. B. zwei Orte pro Turnier) werden pro Turnier zu „vorhanden" zusammengefasst.`);
md.push(`- „Region" prüft die aufgelöste Land-QID gegen eine feste Liste europäischer Länder-QIDs`);
md.push(`  plus Türkei/Tunesien/Ägypten/Marokko (kein \`P30\`-Kontinent-Join — der trieb die Abfragen in Timeouts).`);
md.push(`- Property-Annahmen: Belag = \`P765\` (surface played on), Preisgeld = \`P2769\` (prize money).`);
md.push("");

const outMd = md.join("\n");
const __dirname = dirname(fileURLToPath(import.meta.url));
const repoPath = join(__dirname, "wikidata-coverage-report.md");
const downloadsPath = join(homedir(), "Downloads", "wikidata-coverage-report.md");
writeFileSync(repoPath, outMd, "utf8");
try { writeFileSync(downloadsPath, outMd, "utf8"); } catch { /* Downloads optional (CI-Runner hat kein ~/Downloads) */ }

console.log(`\nBericht geschrieben:`);
console.log(`  ${repoPath}`);
