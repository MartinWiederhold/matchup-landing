// wta-import.mjs
//
// Importiert die WTA-HAUPTTOUR (WTA 125–1000) nach web.tour_tournaments + _claims.
// Quelle: der offene JSON-Endpunkt api.wtatennis.com/tennis/tournaments/ (robots ohne Sperre,
// keine Bot-Abwehr). ITF-Damen sind AUSGESCHLOSSEN (die haben wir über den ITF-Endpunkt).
//
// TROCKENLAUF ist Voreinstellung: ohne --write wird NICHTS geschrieben. Der Trockenlauf LIEST
// den Bestand (nur SELECT) für den Dubletten-Report; geschrieben (upsert) wird nur mit --write.
// Muster: scripts/itf-import.mjs (Cache, --write, Claims mit Herkunft, Dedup über source_ref).
//
// ⚠️ --write setzt voraus, dass der series-CHECK um 'wta' erweitert ist (s. MU-050). Ohne CHECK
//    lehnt PostgREST jeden Upsert ab. Der Trockenlauf braucht den CHECK NICHT.
//
// Ausführen (Trockenlauf):  node scripts/wta-import.mjs
// Scharf (schreibt!):        node scripts/wta-import.mjs --write

import { writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WRITE = process.argv.includes("--write");
const CONTACT = "wiederhold.martin@web.de";
const UA = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36 MatchupImport/1.0 (+${CONTACT})`;
const API = "https://api.wtatennis.com/tennis/tournaments/";
const PROJECT_REF = "dqeroewcdclgxujhubht";
const CONF_OBSERVED = 0.9; // beobachtet aus dem Endpunkt

const PAGE_SIZE = 100;
const PAUSE_MS = 1500;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Zeitraum: ab heute bis Ende des Folgejahres (wie itf-import).
const today = new Date();
const FROM = today.toISOString().slice(0, 10);
const TO = `${today.getUTCFullYear() + 1}-12-31`;

// Montag der Kalenderwoche zu einem ISO-Datum.
function mondayOf(iso) {
  const d = new Date(iso.slice(0, 10) + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

// Endpunkt-Land ist IOC/3-Buchstaben (z. B. "CAN"). → ISO 3166-1 alpha-2 für die DB.
const ISO3_TO_ISO2 = {
  USA: "US", CAN: "CA", MEX: "MX", GBR: "GB", FRA: "FR", ESP: "ES", GER: "DE", ITA: "IT",
  NED: "NL", BEL: "BE", SUI: "CH", AUT: "AT", POR: "PT", POL: "PL", CZE: "CZ", SVK: "SK",
  HUN: "HU", ROU: "RO", CRO: "HR", SRB: "RS", SLO: "SI", DEN: "DK", SWE: "SE", NOR: "NO",
  FIN: "FI", ITA2: "IT", GRE: "GR", BUL: "BG", TUR: "TR", UKR: "UA", RUS: "RU", KAZ: "KZ",
  CHN: "CN", JPN: "JP", KOR: "KR", TPE: "TW", HKG: "HK", THA: "TH", IND: "IN", INA: "ID",
  AUS: "AU", NZL: "NZ", RSA: "ZA", EGY: "EG", MAR: "MA", TUN: "TN", BRA: "BR", ARG: "AR",
  CHI: "CL", COL: "CO", PER: "PE", ECU: "EC", URU: "UY", PAR: "PY", BOL: "BO", UAE: "AE",
  QAT: "QA", BHR: "BH", KSA: "SA", ISR: "IL", CYP: "CY", LUX: "LU", IRL: "IE", ISL: "IS",
  EST: "EE", LAT: "LV", LTU: "LT", GEO: "GE", ARM: "AM", AZE: "AZ", MDA: "MD", MNE: "ME",
  MKD: "MK", ALB: "AL", BIH: "BA", KOS: "XK", SGP: "SG", SIN: "SG", MAS: "MY", VIE: "VN",
  UZB: "UZ", ANG: "AO", NGR: "NG", KEN: "KE",
};

// Nur die vier Haupttour-Stufen. „Grand Slam"/„Finals" haben ANDERE Fristenregeln
// (Grand Slam 6 Wochen, Finals gar keine — III.A.2.a.i) und andere Punkte → hier ausgeschlossen.
const WTA_MAIN_LEVELS = new Set(["WTA 1000", "WTA 500", "WTA 250", "WTA 125"]);

function mapItem(it) {
  const gid = it.tournamentGroup?.id;
  const year = it.year;
  const sourceRef = gid != null && year != null ? `wta:${gid}:${year}` : null;
  const monday = it.startDate ? mondayOf(it.startDate) : null;
  const level = it.level || it.tournamentGroup?.level || null; // "WTA 1000" …
  const iso3 = (it.country || "").toUpperCase();
  const iso = iso3.length === 2 ? iso3 : ISO3_TO_ISO2[iso3];
  const surface = (it.surface || "").toLowerCase() || null;
  const indoor = it.inOutdoor ? /indoor/i.test(String(it.inOutdoor)) : null;
  const prize = Number.isFinite(it.prizeMoney) ? it.prizeMoney : (parseInt(String(it.prizeMoney).replace(/[^0-9]/g, ""), 10) || null);
  const title = it.title || it.tournamentGroup?.name || null;
  const city = it.city || null;

  if (!sourceRef) return { drop: "kein_group_id" };
  if (!monday) return { drop: "kein_startDate" };
  if (!level) return { drop: "kein_level" };
  if (!WTA_MAIN_LEVELS.has(level)) return { drop: "level_ausser_haupttour:" + level }; // Grand Slam/Finals raus
  if (!iso) return { drop: "land_unbekannt:" + iso3 };

  const url = API + "?level=" + encodeURIComponent(level);
  const record = { source_ref: sourceRef, tournament_monday: monday, series: "wta" };
  const claims = [];
  const claim = (f, v) => claims.push({ field_name: f, field_value: String(v), source: "wta_endpoint", source_url: url, confidence: CONF_OBSERVED });
  claim("tournament_monday", monday);
  claim("series", "wta");
  if (title) claim("name", title);
  if (city) claim("city", city);
  claim("country", iso);
  claim("category", level); // „WTA 1000" … → toPointsCategory
  if (surface) claim("surface", surface);
  if (indoor != null) claim("indoor", indoor);
  if (prize != null) { claim("prize_money", prize); claim("prize_currency", it.prizeMoneyCurrency || "USD"); }
  return { record, claims, raw: { title, city, iso, level, surface, prize, monday, drawSingles: it.singlesDrawSize, startDate: it.startDate, sourceRef } };
}

// ── Abruf (paginiert, plain fetch — keine Bot-Abwehr) ────────────────────────
async function fetchAll() {
  const items = [];
  let page = 0, total = Infinity;
  while (page * PAGE_SIZE < total) {
    const url = `${API}?page=${page}&pageSize=${PAGE_SIZE}&from=${FROM}&to=${TO}&excludeLevels=${encodeURIComponent("ITF")}`;
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json", From: CONTACT } });
    if (!res.ok) throw new Error(`Abruf page=${page} fehlgeschlagen (HTTP ${res.status})`);
    const json = await res.json();
    const content = json.content || json.results || [];
    total = json.pageInfo?.numEntries ?? content.length;
    for (const c of content) items.push(c);
    process.stdout.write(`  geladen: ${items.length}/${total}\r`);
    page++;
    if (page * PAGE_SIZE < total) await sleep(PAUSE_MS);
  }
  return items;
}

// ── Service-Client (nur für Dubletten-Report / --write) ──────────────────────
function loadEnv() {
  const env = {};
  try { for (const line of readFileSync(join(process.cwd(), ".env.local"), "utf8").split("\n")) { const m = line.match(/^\s*([A-Z_0-9]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, ""); } } catch { /* fehlt → unten Fehler */ }
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

// ── Lauf ─────────────────────────────────────────────────────────────────────
console.log(`WTA-Import · ${WRITE ? "SCHARF (--write)" : "TROCKENLAUF"} · ${FROM} … ${TO}`);
const rawItems = await fetchAll();
console.log(`\nEndpunkt: ${rawItems.length} Turniere`);

const kept = [], dropped = new Map(), unknownCountries = new Map();
for (const it of rawItems) {
  const m = mapItem(it);
  if (m.drop) { const key = m.drop.split(":")[0]; dropped.set(key, (dropped.get(key) || 0) + 1); if (m.drop.startsWith("land_unbekannt:")) { const nm = m.drop.slice("land_unbekannt:".length); unknownCountries.set(nm, (unknownCountries.get(nm) || 0) + 1); } continue; }
  kept.push(m);
}

// Bestand lesen (Dedup über source_ref).
const svc = await makeClient();
const existing = new Set();
{
  const { data, error } = await svc.from("tour_tournaments").select("source_ref").like("source_ref", "wta:%");
  if (error) throw new Error("Bestand lesen fehlgeschlagen: " + error.message);
  for (const r of data ?? []) existing.add(r.source_ref);
}
let neu = 0, dub = 0;
const byCountry = new Map(), byLevel = new Map();
for (const m of kept) {
  if (existing.has(m.record.source_ref)) dub++; else neu++;
  byCountry.set(m.raw.iso, (byCountry.get(m.raw.iso) || 0) + 1);
  byLevel.set(m.raw.level, (byLevel.get(m.raw.level) || 0) + 1);
}

// Optional scharf schreiben.
let writeSummary = null;
if (WRITE) {
  let okT = 0, okC = 0, errN = 0;
  for (const { record, claims } of kept) {
    const { data, error } = await svc.from("tour_tournaments").upsert(record, { onConflict: "source_ref" }).select("id").single();
    if (error || !data) { errN++; continue; }
    okT++;
    const rows = claims.map((c) => ({ ...c, tournament_id: data.id }));
    const { error: ce } = await svc.from("tour_tournament_claims").upsert(rows, { onConflict: "tournament_id,field_name,source,field_value", ignoreDuplicates: true });
    if (ce) errN++; else okC += rows.length;
  }
  writeSummary = { okT, okC, errN };
}

// ── Bericht ──────────────────────────────────────────────────────────────────
const md = [];
md.push(`# WTA-Haupttour-Import — ${WRITE ? "SCHARFER LAUF" : "TROCKENLAUF (nichts geschrieben)"}`);
md.push("");
md.push(`> \`scripts/wta-import.mjs\` · ${new Date().toISOString()} · Zeitraum ${FROM} … ${TO}`);
md.push(`> Quelle: api.wtatennis.com/tennis/tournaments (offen, keine Bot-Abwehr). ITF ausgeschlossen.`);
md.push("");
md.push(`## Menge`);
md.push(`- Endpunkt gesamt: **${rawItems.length}** · verwertbar: **${kept.length}** · verworfen: ${rawItems.length - kept.length}`);
md.push(`- **NEU: ${neu}** · Dublette (source_ref): ${dub}`);
md.push("");
md.push(`## Verworfen nach Grund`);
if (dropped.size === 0) md.push(`- keine`);
for (const [r, n] of [...dropped.entries()].sort((a, b) => b[1] - a[1])) md.push(`- **${r}** — ${n}×`);
if (unknownCountries.size) { md.push(""); md.push(`### Unbekannte Ländercodes (ISO3→ISO2 ergänzen):`); for (const [nm, n] of [...unknownCountries.entries()].sort((a, b) => b[1] - a[1])) md.push(`- \`${nm}\` — ${n}×`); }
md.push("");
md.push(`## Level-Verteilung`);
for (const [l, n] of [...byLevel.entries()].sort((a, b) => b[1] - a[1])) md.push(`- ${l}: ${n}`);
md.push("");
md.push(`## Länderverteilung (Top 20)`);
md.push([...byCountry.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([c, n]) => `${c} ${n}`).join(" · "));
md.push("");
md.push(`## Drei vollständige Beispiele`);
for (const m of kept.slice(0, 3)) {
  md.push("```json");
  md.push("// tour_tournaments (Identität)"); md.push(JSON.stringify(m.record, null, 2));
  md.push("// tour_tournament_claims (Herkunft)"); md.push(JSON.stringify(m.claims, null, 2));
  md.push("// Rohfelder (Kontrolle, inkl. singlesDrawSize — für die feldgrößenabhängigen unteren Runden)");
  md.push(JSON.stringify(m.raw, null, 2));
  md.push("```");
}
md.push("");
md.push(`## Hinweise`);
md.push(`- **Keine Meldefrist im Endpunkt** — berechnet in \`deadlines.ts\` (Serie \`wta\`): Entry = Montag −28 T (belegt, III.A.2.a.i), OHNE Uhrzeit, Vorbehalt „unless otherwise determined by the WTA". Withdrawal/Freeze null.`);
md.push(`- **Punkte** in \`points.ts\` (v6, Serie-Kategorien wta_1000/500/250/125, VIII.A.5). \`singlesDrawSize\` liegt als Rohfeld vor (feldgrößenabhängige untere Runden).`);
md.push(`- **series-CHECK** muss vor \`--write\` um \`wta\` erweitert sein (MU-050).`);
if (writeSummary) md.push(`\n**Geschrieben:** ${writeSummary.okT} Turniere, ${writeSummary.okC} Claims, ${writeSummary.errN} Fehler.`);

writeFileSync(join(__dirname, "wta-import-report.md"), md.join("\n"), "utf8");
console.log(`${WRITE ? "SCHARF" : "TROCKENLAUF"} · verwertbar=${kept.length} neu=${neu} dublette=${dub}`);
console.log(`Bericht: scripts/wta-import-report.md`);
