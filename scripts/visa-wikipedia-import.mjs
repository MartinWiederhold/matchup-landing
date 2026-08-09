// visa-wikipedia-import.mjs
//
// Importiert den nationalitätsabhängigen Visa-Bestand aus Wikipedia
// ("Visa requirements for X citizens") in web.tour_visa_requirements.
//
// Zwei Modi:
//   node scripts/visa-wikipedia-import.mjs           → TROCKENLAUF (nur Bericht, schreibt NICHTS)
//   node scripts/visa-wikipedia-import.mjs --write    → schreibt per Upsert (idempotent)
//
// Datengrundlage & Parser wie scripts/visa-wikipedia-erkundung.mjs (die reine
// Messung bleibt unberührt; die kleinen Parser-Helfer sind hier bewusst kopiert,
// damit dieser Import eigenständig läuft). Zugriff nur über die MediaWiki-API,
// ≥1 s zwischen Abrufen, aussagekräftiger User-Agent.
//
// IMPORT-REGELN (bewusst eng, siehe Auftrag):
//  - Nur die VIER Kernangaben + Datierung: Zielland, Klasse, Aufenthaltsdauer, Quelllink,
//    plus source_revised_at (Seiten-Revision) und imported_at (jetzt).
//  - Freitext-„Notes", Gebühren, Wartezeiten werden NICHT übernommen.
//  - 'admission_refused' ist eine EIGENE Klasse (Einreisesperre, kein Visum).
//  - FEHLERRICHTUNG (entscheidend): Eine FALSCHE Sperre kostet einen Spieler ein
//    Turnier, das er hätte spielen können — er sieht es nie und erfährt den Grund
//    nicht. Eine FEHLENDE Sperre führt nur zu einer Warnung, die er ohnehin beim
//    Konsulat prüfen muss. Deshalb: bedingte Sperren ("admission refused except …",
//    "(conditional)") werden NICHT als harte Sperre importiert, sondern ÜBERSPRUNGEN
//    und im Bericht ausgewiesen (Anzahl + Kombination) — falls es viele sind, ist das
//    eine eigene Entscheidung wert.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const API = "https://en.wikipedia.org/w/api.php";
const USER_AGENT =
  "MatchupVisaImport/1.0 (https://matchup-app.com; wiederhold.martin@web.de) node-fetch";
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const WRITE = process.argv.includes("--write");

// ---------------------------------------------------------------------------
// Nationalitäten — die festgezurrten 31 (inkl. visabefreiter Kontrollgruppe).
// ---------------------------------------------------------------------------
const NATIONALITIES = [
  { iso: "TN", demonym: "Tunisian", group: "host" },
  { iso: "EG", demonym: "Egyptian", group: "host" },
  { iso: "MA", demonym: "Moroccan", group: "host" },
  { iso: "DZ", demonym: "Algerian", group: "host" },
  { iso: "TR", demonym: "Turkish", group: "host" },
  { iso: "IR", demonym: "Iranian", group: "host" },
  { iso: "JO", demonym: "Jordanian", group: "meast" },
  { iso: "LB", demonym: "Lebanese", group: "meast" },
  { iso: "IQ", demonym: "Iraqi", group: "meast" },
  { iso: "IL", demonym: "Israeli", group: "meast" },
  { iso: "SA", demonym: "Saudi Arabian", group: "meast" },
  { iso: "AE", demonym: "Emirati", group: "meast" },
  { iso: "IN", demonym: "Indian", group: "tour" },
  { iso: "CN", demonym: "Chinese", group: "tour" },
  { iso: "RU", demonym: "Russian", group: "tour" },
  { iso: "ZA", demonym: "South African", group: "tour" },
  { iso: "KZ", demonym: "Kazakhstani", group: "tour" },
  { iso: "UZ", demonym: "Uzbekistani", group: "tour" },
  { iso: "PK", demonym: "Pakistani", group: "tour" },
  { iso: "NG", demonym: "Nigerian", group: "tour" },
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
// ISO-3166-1 alpha-2 → Namensvarianten, wie sie in {{flag|Name}} der Wikipedia-
// Visa-Tabellen vorkommen. Deckt die Zielländer aus web.tour_tournaments ab.
// Fehlt ein Ziel-ISO hier, meldet der Trockenlauf „kein Namensmapping".
// ---------------------------------------------------------------------------
const ISO_NAMES = {
  AE: ["United Arab Emirates"], AM: ["Armenia"], AO: ["Angola"], AR: ["Argentina"],
  AT: ["Austria"], AU: ["Australia"], BA: ["Bosnia and Herzegovina"], BE: ["Belgium"],
  BG: ["Bulgaria"], BH: ["Bahrain"], BM: ["Bermuda"], BO: ["Bolivia"], BR: ["Brazil"],
  BW: ["Botswana"], CA: ["Canada"], CG: ["Republic of the Congo", "Congo"], CH: ["Switzerland"],
  CI: ["Ivory Coast", "Côte d'Ivoire", "Cote d'Ivoire"], CL: ["Chile"],
  CN: ["China", "People's Republic of China", "Mainland China"],
  CO: ["Colombia"], CR: ["Costa Rica"], CY: ["Cyprus"], CZ: ["Czech Republic", "Czechia"],
  DE: ["Germany"], DK: ["Denmark"], DO: ["Dominican Republic"], EC: ["Ecuador"], EG: ["Egypt"],
  ES: ["Spain"], FI: ["Finland"], FR: ["France"], GB: ["United Kingdom"], GE: ["Georgia (country)", "Georgia"],
  GR: ["Greece"], GU: ["Guam"], HK: ["Hong Kong"], HR: ["Croatia"], HU: ["Hungary"],
  ID: ["Indonesia"], IE: ["Ireland", "Republic of Ireland"], IN: ["India"], IR: ["Iran"],
  IT: ["Italy"], JM: ["Jamaica"], JP: ["Japan"], KR: ["South Korea"], KW: ["Kuwait"],
  KZ: ["Kazakhstan"], LU: ["Luxembourg"], MA: ["Morocco"], MD: ["Moldova"],
  MK: ["North Macedonia"], MT: ["Malta"], MX: ["Mexico"], MY: ["Malaysia"],
  NC: ["New Caledonia"], NL: ["Netherlands"], NO: ["Norway"], NZ: ["New Zealand"],
  PE: ["Peru"], PK: ["Pakistan"], PL: ["Poland"], PT: ["Portugal"], PY: ["Paraguay"],
  QA: ["Qatar"], RO: ["Romania"], RS: ["Serbia"], RW: ["Rwanda"], SE: ["Sweden"],
  SG: ["Singapore"], SI: ["Slovenia"], SK: ["Slovakia"], SM: ["San Marino"],
  SV: ["El Salvador"], TH: ["Thailand"], TN: ["Tunisia"], TR: ["Turkey", "Türkiye"],
  TW: ["Taiwan"], US: ["United States"], UY: ["Uruguay"], UZ: ["Uzbekistan"],
  VN: ["Vietnam"], ZA: ["South Africa"],
};
// Name (lowercase) → ISO2, für schnelles Matching der Tabellenzeilen.
const NAME_TO_ISO = {};
for (const [iso, names] of Object.entries(ISO_NAMES)) for (const n of names) NAME_TO_ISO[n.toLowerCase()] = iso;

// Stichprobe für den Bericht (Auftrag): erwartete Klasse in Klammern.
const SAMPLES = [
  { nat: "IR", dest: "US", note: "erwartet admission_refused" },
  { nat: "IN", dest: "ES", note: "erwartet visa_required" },
  { nat: "TN", dest: "FR", note: "erwartet visa_required" },
  { nat: "US", dest: "FR", note: "Kontrolle — erwartet visa_free" },
  { nat: "JP", dest: "IT", note: "Kontrolle — erwartet visa_free" },
  { nat: "AU", dest: "ES", note: "Kontrolle — erwartet visa_free" },
];

// ---------------------------------------------------------------------------
// .env.local lesen (node lädt sie nicht automatisch).
// ---------------------------------------------------------------------------
function loadEnv() {
  const out = {};
  try {
    const txt = readFileSync(join(REPO_ROOT, ".env.local"), "utf8");
    for (const line of txt.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq < 0) continue;
      let v = t.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      out[t.slice(0, eq).trim()] = v;
    }
  } catch { /* .env.local fehlt → Zielset-Fallback unten */ }
  return out;
}

// ---------------------------------------------------------------------------
// MediaWiki-API (Timeout + 1 Retry).
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
async function fetchPage(title) {
  const json = await apiGet(contentUrl(title));
  const page = json?.query?.pages?.[0];
  if (!page || page.missing) return { missing: true };
  const rev = page?.revisions?.[0];
  return { missing: false, resolvedTitle: page.title, timestamp: rev?.timestamp ?? null, content: rev?.slots?.main?.content ?? "" };
}

// ---------------------------------------------------------------------------
// Wikitext-Helfer (kopiert aus der Erkundung, unverändert in der Wirkung).
// ---------------------------------------------------------------------------
function extractTables(wt) {
  const tables = []; let depth = 0, buf = [];
  for (const line of wt.split("\n")) {
    const t = line.trimStart();
    if (t.startsWith("{|")) { if (depth === 0) buf = []; depth++; buf.push(line); continue; }
    if (depth > 0) { buf.push(line); if (t.startsWith("|}")) { depth--; if (depth === 0) tables.push(buf.join("\n")); } }
  }
  return tables;
}
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
function findMainTable(tables) {
  return tables.find((t) => {
    const head = t.split("\n").slice(0, 8).join("\n").toLowerCase();
    return head.includes("allowed stay") && head.includes("visa requirement");
  }) ?? null;
}
function countryFromCell(cell) {
  const m = cell.match(/\{\{\s*flag(?:icon|country|deco|u)?\s*\|\s*([^|}]+)/i);
  if (m) return m[1].trim();
  const l = cell.match(/\[\[([^\]|]+)/);
  return l ? l[1].trim() : cleanText(cell);
}
const STATUS_TPL = /\{\{\s*(?:no|yes|partial|yes-no|yes2|maybe|unknown|optional|black|sort|okay|n\/a|nom|nay|dyk|rh|good|bad)\b[^|{}]*\|([\s\S]*?)\}\}/i;
function innerText(raw) {
  const parts = String(raw).split("|").map((s) => s.trim()).filter((p) => p && !/^[a-z-]+\s*=/i.test(p) && !/^\d+$/.test(p));
  return cleanText(parts.length ? parts[parts.length - 1] : raw);
}
function parseVisaCell(cell) {
  const sortM = cell.match(/data-sort-value\s*=\s*"?(-?\d+)/i);
  const sort = sortM ? Number(sortM[1]) : null;
  const tplM = cell.match(STATUS_TPL);
  const raw = tplM ? innerText(tplM[1]) : cleanText(cell);
  return { status: raw, sort };
}
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
function stripCellAttrs(cell) {
  const bar = cell.indexOf("|");
  if (bar > -1 && /=/.test(cell.slice(0, bar)) && !/\{\{|\[\[/.test(cell.slice(0, bar))) return cell.slice(bar + 1).trim();
  return cell;
}
function parseMainTable(table) {
  const out = new Map();
  const rows = table.split(/\n\|-/);
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

// ---------------------------------------------------------------------------
// Normierung Rohstatus → Klasse. Rückgabe:
//   { class }                    → eine der sechs Klassen
//   { skip: "conditional_ban" }  → bedingte Sperre: NICHT importieren, berichten
//   { skip: "unmapped" }         → nicht zuordenbar: NICHT importieren, berichten
// ENTSCHEIDUNG: einfache „(conditional)"-Zusätze fallen auf die Basisklasse zusammen
// (der Zusatz ist nicht-normierte Nuance). Eine BEDINGTE Sperre wird dagegen NICHT
// als harte Sperre importiert (Fehlerrichtung, s. Kopf).
function classify(rawStatus, sort) {
  const n = String(rawStatus).toLowerCase().replace(/\]\]/g, "").replace(/\s+/g, " ").trim();
  if (!n) return sortFallback(sort);

  if (/admission refused|entry (?:refused|banned)|banned entry/.test(n)) {
    if (/except|resident|conditional|unless/.test(n)) return { skip: "conditional_ban", raw: n };
    return { class: "admission_refused" };
  }
  // BEWUSST NICHT als harte Sperre: „admission restricted/restriction", „permission required".
  // Uneindeutig — nach der Fehlerrichtung (falsche Sperre = teuerster Fehler) NICHT importieren,
  // sondern ehrlich als „bewusst übersprungen" ausweisen (kein Parser-Fehler).
  if (/admission restrict|entry restrict|permission required/.test(n)) return { skip: "restriction_unclear", raw: n };
  if (/visa not required|without a visa|freedom of movement|visa[- ]free|no visa/.test(n)) return { class: "visa_free" };
  // eTA/ESTA-Familie (inkl. Tippvarianten „Electronical", „Electronic Authorization System",
  // US-Visa-Waiver-Program = ESTA).
  if (/\be-?ta\b|esta|k-?eta|nz-?eta|visa waiver|electronic(?:al)?\s+travel\s+author|electronic(?:al)?\s+authori[sz]|authori[sz]ation system/.test(n)) return { class: "eta" };
  if (/e-?visa|electronic visa|online visa/.test(n)) return { class: "evisa" };
  if (/visa on arrival|arrival visa|voa\b/.test(n)) return { class: "visa_on_arrival" };
  if (/visa required|visa is required|invitation required|visa needed/.test(n)) return { class: "visa_required" };
  return sortFallback(sort, n);
}
// Fallback über data-sort-value (Wikipedia: ≤2 Freizügigkeit/visumfrei inkl. negativer
// Sortkeys für Freizügigkeit, 3 eVisa/VoA/eTA, 4 Visum nötig).
function sortFallback(sort, raw) {
  if (sort != null && sort <= 2) return { class: "visa_free" };
  if (sort === 4) return { class: "visa_required" };
  if (sort === 3) return { class: "evisa" };
  return { skip: "unmapped", raw: raw ?? "" };
}
// Aufenthaltsdauer → Tage. Nur explizite „N days" werden übernommen; „Monate" o. Ä.
// bleiben NULL (nichts umrechnen, nichts erfinden).
function parseStayDays(stay) {
  const m = String(stay).match(/(\d+)\s*days?\b/i);
  return m ? Math.min(Number(m[1]), 32767) : null;
}

// ---------------------------------------------------------------------------
// Zielset live aus web.tour_tournaments (aktiv). Ohne Service-Key: leeres Set +
// Warnung (dann greift der Import nicht; der Trockenlauf zeigt das).
// ---------------------------------------------------------------------------
async function loadDestinations(svc) {
  if (!svc) return [];
  const { data, error } = await svc
    .from("tour_tournaments")
    .select("country")
    .is("valid_to", null)
    .not("country", "is", null);
  if (error) throw new Error(`tour_tournaments lesen: ${error.message}`);
  return [...new Set((data ?? []).map((r) => r.country))].sort();
}

// ---------------------------------------------------------------------------
// Hauptlauf
// ---------------------------------------------------------------------------
const env = loadEnv();
const svc = env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      db: { schema: "web" }, auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

if (WRITE && !svc) { console.error("FEHLER: --write braucht NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local"); process.exit(1); }

const destinations = await loadDestinations(svc);
const destNoMapping = destinations.filter((iso) => !ISO_NAMES[iso]);
console.log(`Modus: ${WRITE ? "SCHREIBEN (--write)" : "TROCKENLAUF"}`);
console.log(`Zielländer aus web.tour_tournaments (aktiv): ${destinations.length}${svc ? "" : "  — KEIN Service-Key, Zielset leer"}`);
if (destNoMapping.length) console.log(`⚠ Ohne Namensmapping (werden übersprungen): ${destNoMapping.join(", ")}`);
console.log("");

const perNat = [];              // { iso, demonym, group, rows, missing[], revised }
const classCounts = new Map();  // Klasse → Anzahl (über alle Zeilen)
const hardBans = [];            // { nat, dest, raw } — importierte harte Sperren (admission_refused)
const skippedBans = [];         // { nat, dest, raw } — bedingte Sperren (nicht importiert)
const restrictions = [];        // { nat, dest, raw } — „admission restricted"/„permission required" (bewusst nicht importiert)
const unmapped = [];            // { nat, dest, raw } — Rest, nicht zuordenbar
const sampleHits = new Map();   // "IR>US" → { class, stay, sort, raw }
const upserts = [];             // fertige DB-Zeilen (nur bei --write geschrieben)

for (const nat of NATIONALITIES) {
  const title = `Visa requirements for ${nat.demonym} citizens`;
  await sleep(1100);
  let page;
  try { page = await fetchPage(title); }
  catch (e) { console.log(`  ✗ ${nat.demonym}: ${e.message}`); perNat.push({ ...nat, rows: 0, missing: [], revised: null, error: String(e.message || e) }); continue; }
  if (page.missing) { console.log(`  ✗ ${nat.demonym}: Seite fehlt`); perNat.push({ ...nat, rows: 0, missing: [], revised: null, error: "Seite fehlt" }); continue; }

  const main = findMainTable(extractTables(page.content));
  if (!main) { console.log(`  ⚠ ${nat.demonym}: keine Haupttabelle`); perNat.push({ ...nat, rows: 0, missing: [], revised: page.timestamp, error: "keine Haupttabelle" }); continue; }
  const rows = parseMainTable(main);

  let created = 0; const missing = [];
  for (const destIso of destinations) {
    if (destIso === nat.iso) continue;         // kein Self-Paar
    const names = ISO_NAMES[destIso];
    if (!names) continue;                       // kein Mapping → oben schon gemeldet
    let r = null;
    for (const nm of names) { r = rows.get(nm.toLowerCase()); if (r) break; }
    if (!r) { missing.push(destIso); continue; }

    const verdict = classify(r.status, r.sort);
    const sampleKey = `${nat.iso}>${destIso}`;
    if (SAMPLES.some((s) => s.nat === nat.iso && s.dest === destIso)) {
      sampleKey && sampleHits.set(sampleKey, { class: verdict.class ?? `(übersprungen: ${verdict.skip})`, stay: r.stay, sort: r.sort, raw: r.status });
    }
    if (verdict.skip === "conditional_ban") { skippedBans.push({ nat: nat.iso, dest: destIso, raw: r.status }); continue; }
    if (verdict.skip === "restriction_unclear") { restrictions.push({ nat: nat.iso, dest: destIso, raw: r.status }); continue; }
    if (verdict.skip === "unmapped") { unmapped.push({ nat: nat.iso, dest: destIso, raw: r.status }); continue; }

    classCounts.set(verdict.class, (classCounts.get(verdict.class) || 0) + 1);
    if (verdict.class === "admission_refused") hardBans.push({ nat: nat.iso, dest: destIso, raw: r.status });
    created++;
    upserts.push({
      nationality: nat.iso,
      destination: destIso,
      requirement_class: verdict.class,
      allowed_stay_days: parseStayDays(r.stay),
      source_url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
      source_revised_at: page.timestamp,
    });
  }
  perNat.push({ ...nat, rows: created, missing, revised: page.timestamp });
  console.log(`  ✓ ${nat.demonym} (${nat.iso}): ${created} Zeilen, fehlend ${missing.length}, Rev ${page.timestamp?.slice(0, 10)}`);
}

// ---------------------------------------------------------------------------
// Bericht
// ---------------------------------------------------------------------------
console.log("\n========================= BERICHT =========================\n");

const totalRows = perNat.reduce((s, r) => s + r.rows, 0);
console.log(`Zeilen gesamt, die entstünden: ${totalRows}`);
console.log(`Nationalitäten: ${NATIONALITIES.length} · Zielländer: ${destinations.length}\n`);

console.log("— Zeilen je Nationalität —");
for (const r of perNat) {
  const flag = r.error ? `FEHLER: ${r.error}` : `${r.rows} Zeilen (fehlend: ${r.missing.length ? r.missing.join(",") : "—"})`;
  console.log(`  ${r.iso} ${r.demonym.padEnd(16)} [${r.group}]  ${flag}`);
}

console.log("\n— Verteilung der Klassen —");
for (const [cls, n] of [...classCounts.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${cls.padEnd(18)} ${n}`);

console.log(`\n— Harte Sperren, die importiert würden (admission_refused): ${hardBans.length} —`);
if (hardBans.length === 0) console.log("  (keine)");
else for (const b of hardBans) console.log(`  ${b.nat} → ${b.dest}:  „${b.raw}"`);

console.log(`\n— Übersprungene BEDINGTE Sperren: ${skippedBans.length} —`);
if (skippedBans.length === 0) console.log("  (keine)");
else for (const b of skippedBans) console.log(`  ${b.nat} → ${b.dest}:  „${b.raw}"`);

console.log(`\n— Bewusst NICHT importiert (Restriction/Permission, uneindeutig): ${restrictions.length} —`);
if (restrictions.length === 0) console.log("  (keine)");
else for (const r of restrictions) console.log(`  ${r.nat} → ${r.dest}:  „${r.raw}"`);

if (unmapped.length) {
  console.log(`\n— Nicht zuordenbar (übersprungen): ${unmapped.length} —`);
  for (const u of unmapped.slice(0, 40)) console.log(`  ${u.nat} → ${u.dest}:  „${u.raw}"`);
  if (unmapped.length > 40) console.log(`  … und ${unmapped.length - 40} weitere`);
}

console.log("\n— Stichprobe —");
for (const s of SAMPLES) {
  const hit = sampleHits.get(`${s.nat}>${s.dest}`);
  if (!hit) { console.log(`  ${s.nat} → ${s.dest}:  (keine Zeile gefunden)  [${s.note}]`); continue; }
  console.log(`  ${s.nat} → ${s.dest}:  ${hit.class}  (Aufenthalt: ${hit.stay || "—"}, roh: „${hit.raw}", sort: ${hit.sort ?? "—"})  [${s.note}]`);
}

// ---------------------------------------------------------------------------
// Schreiben (nur --write)
// ---------------------------------------------------------------------------
if (!WRITE) {
  console.log("\nTROCKENLAUF — nichts geschrieben. Mit  --write  ausführen, um zu importieren.");
} else {
  console.log(`\nSchreibe ${upserts.length} Zeilen (Upsert auf (nationality,destination)) …`);
  const CHUNK = 500;
  let done = 0;
  for (let i = 0; i < upserts.length; i += CHUNK) {
    const batch = upserts.slice(i, i + CHUNK);
    const { error } = await svc.from("tour_visa_requirements").upsert(batch, { onConflict: "nationality,destination" });
    if (error) { console.error(`FEHLER beim Upsert (Batch ab ${i}): ${error.message}`); process.exit(1); }
    done += batch.length;
  }
  console.log(`Fertig: ${done} Zeilen geschrieben/aktualisiert.`);
}
