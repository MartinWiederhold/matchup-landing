// geocode-tournaments.mjs
//
// Ergänzt die fehlenden Koordinaten in web.tour_tournaments (MU-029) per Geocodierung
// über Nominatim (OpenStreetMap). latitude/longitude als CLAIMS (Quelle "nominatim",
// geringere Confidence als eine Beobachtung) nach web.tour_tournament_claims; die
// Auflösung in den Stamm macht scripts/resolve-tournaments.mjs (lat/lng dort RESOLVABLE).
//
// TROCKENLAUF ist Voreinstellung: OHNE --write wird KEIN Claim geschrieben (nur Bericht).
// Eine LESE-Verbindung (Service-Client) wird auch im Trockenlauf geöffnet (RLS).
//
// Reines Node (ESM). Keine neuen Dependencies. Nichts unter src/. web.tournaments bleibt.
//
// Nominatim-Nutzungsrichtlinie (verbindlich, vorher gelesen):
//   https://operations.osmfoundation.org/policies/nominatim/
//   - max. 1 Anfrage/Sekunde, EIN Thread (hier >=1100 ms, strikt sequenziell)
//   - aussagekräftiger User-Agent mit Kontakt; ROHtreffer gecacht (nicht das Urteil,
//     damit eine spätere Schwellwert-Anpassung NICHT neu abfragt)
//   - Attribution "© OpenStreetMap contributors" beim Anzeigen (Karte) führen
//   - einmaliger Klein-Bulk (590 Orte < 1 Tag); Verantwortung beim Betreiber
//
// Trockenlauf:                 node scripts/geocode-tournaments.mjs
// Trockenlauf (Teilmenge):     node scripts/geocode-tournaments.mjs --limit=150
// Scharf:                      node scripts/geocode-tournaments.mjs --write
// Bericht:                     scripts/geocoding-report.md

import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const WRITE = process.argv.includes("--write");
// --limit=N: höchstens N NEUE Netz-Abfragen in diesem Lauf (Cache-Treffer zählen nicht).
// So lässt sich der Lauf in kurze Vordergrund-Durchgänge teilen; der Cache setzt fort.
const LIMIT = Number((process.argv.find((a) => a.startsWith("--limit=")) || "").split("=")[1]) || Infinity;

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_PATH = join(__dirname, ".geocode-cache.json");

const PROJECT_REF = "dqeroewcdclgxujhubht";
const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "MatchupGeocoder/1.0 (https://matchup-app.com; wiederhold.martin@web.de)";
const CONF_GEOCODED = 0.6; // Ableitung aus Stadt+Land < Beobachtung (0.9)
const REQUEST_GAP_MS = 1100;
// Cluster-Radius (echte Distanz): >50 km auseinander = VERSCHIEDENE Orte (echte
// Mehrdeutigkeit). 50 km führt mehrere OSM-Knoten DERSELBEN Stadt (Stadtkern/Bezirk/
// Grenze) zusammen, hält aber gleichnamige, weit entfernte Städte getrennt.
const AMBIGUOUS_KM = 50;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Grobe Entfernung zweier Punkte in km (equirektangulär — für 50-km-Schwelle genau genug).
function distKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat = (((a.lat + b.lat) / 2) * Math.PI) / 180;
  const x = dLon * Math.cos(lat);
  return R * Math.sqrt(dLat * dLat + x * x);
}

// ── Service-Client (Key aus .env.local, wird NIE ausgegeben) ────────────────
function loadEnv() {
  const env = {};
  try {
    for (const line of readFileSync(join(process.cwd(), ".env.local"), "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z_0-9]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch { /* fehlt → Abbruch */ }
  return env;
}
const env = loadEnv();
const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || `https://${PROJECT_REF}.supabase.co`;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_KEY) { console.error("ABBRUCH: SUPABASE_SERVICE_ROLE_KEY nicht in .env.local gefunden."); process.exit(1); }
const { createClient } = await import("@supabase/supabase-js");
const svc = createClient(SUPA_URL, SUPA_KEY, { db: { schema: "web" }, auth: { persistSession: false, autoRefreshToken: false } });

// ── Lesen (paginiert): Turniere ohne Koordinaten ────────────────────────────
async function fetchTournamentsMissingCoords() {
  const out = [];
  let from = 0; const size = 1000;
  for (;;) {
    const { data, error } = await svc.from("tour_tournaments").select("id, city, country, latitude, longitude").order("id").range(from, from + size - 1);
    if (error) { console.error("Lesefehler:", error.message); process.exit(1); }
    if (!data || data.length === 0) break;
    for (const r of data) {
      if (r.latitude != null && r.longitude != null) continue;
      if (!r.city || !String(r.city).trim() || !r.country) continue;
      out.push(r);
    }
    if (data.length < size) break;
    from += size;
  }
  return out;
}

const placeKey = (city, country) => `${country}|${String(city).trim().toLowerCase().replace(/\s+/g, " ")}`;

// ── Nominatim-Abfrage (Timeout + einmaliger Retry) → ROHTREFFER ─────────────
async function queryNominatim(city, iso) {
  const p = new URLSearchParams({ q: city, countrycodes: iso.toLowerCase(), format: "jsonv2", addressdetails: "1", limit: "5" });
  const url = `${NOMINATIM}?${p}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 20000);
    try {
      const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, "Accept-Language": "en" }, signal: ctrl.signal });
      clearTimeout(to);
      if (!res.ok) { if (attempt === 0) { await sleep(REQUEST_GAP_MS); continue; } return { error: `http_${res.status}` }; }
      const json = await res.json();
      const raw = (Array.isArray(json) ? json : []).map((r) => ({
        lat: Number(r.lat), lon: Number(r.lon), cc: (r.address?.country_code || "").toLowerCase(),
        name: r.display_name || "", osm_type: r.osm_type || null, osm_id: r.osm_id || null,
      }));
      return { raw };
    } catch (e) {
      clearTimeout(to);
      if (attempt === 0) { await sleep(REQUEST_GAP_MS); continue; }
      return { error: e.name === "AbortError" ? "timeout" : e.message };
    }
  }
  return { error: "unbekannt" };
}
const osmUrl = (r) => (r.osm_type && r.osm_id ? `https://www.openstreetmap.org/${r.osm_type}/${r.osm_id}` : "https://www.openstreetmap.org/");

/**
 * Bewertet die (gecachten) Rohtreffer eines Ortes. Kein Raten:
 *  - Nur Treffer im erwarteten Land (cc == ISO).
 *  - Nichts übrig → "not_found" (bzw. "country_mismatch", wenn Treffer im falschen Land).
 *  - Cluster nach echter Distanz: >1 Cluster → "ambiguous" (nicht den ersten nehmen).
 *  - Sonst der wichtigste Treffer (Nominatim liefert nach importance sortiert).
 *  - "pending": noch nicht abgefragt (bei geteiltem Lauf mit --limit).
 */
function evaluate(iso, entry) {
  if (!entry) return { status: "pending" };
  if (entry.error) return { status: "error", reason: entry.error };
  const all = entry.raw || [];
  if (all.length === 0) return { status: "not_found" };
  const inCountry = all.filter((r) => r.cc === iso.toLowerCase() && Number.isFinite(r.lat) && Number.isFinite(r.lon));
  if (inCountry.length === 0) return { status: "country_mismatch", got: [...new Set(all.map((r) => (r.cc || "?").toUpperCase()))].join(",") };
  const clusters = [];
  for (const r of inCountry) {
    const c = clusters.find((cl) => distKm(cl, r) <= AMBIGUOUS_KM);
    if (c) c.members.push(r); else clusters.push({ lat: r.lat, lon: r.lon, members: [r] });
  }
  if (clusters.length > 1) return { status: "ambiguous", candidates: clusters.map((cl) => ({ lat: cl.lat, lon: cl.lon, name: cl.members[0].name })) };
  const best = inCountry[0];
  return { status: "resolved", lat: best.lat, lon: best.lon, display_name: best.name, osm: osmUrl(best) };
}

// ── Hauptlauf ───────────────────────────────────────────────────────────────
const rows = await fetchTournamentsMissingCoords();
const places = new Map();
for (const r of rows) {
  const key = placeKey(r.city, r.country);
  if (!places.has(key)) places.set(key, { city: String(r.city).trim(), iso: r.country, ids: [] });
  places.get(key).ids.push(r.id);
}
console.log(`Turniere ohne Koordinaten: ${rows.length} · distinkte Orte: ${places.size}`);

let cache = {};
if (existsSync(CACHE_PATH)) { try { cache = JSON.parse(readFileSync(CACHE_PATH, "utf8")); } catch { cache = {}; } }

const resolved = [], ambiguous = [], notFound = [], mismatch = [], errored = [], pending = [];
let queries = 0, cached = 0, i = 0;
for (const [key, place] of places) {
  i++;
  let entry = cache[key];
  if (entry) {
    cached++;
  } else if (queries < LIMIT) {
    entry = await queryNominatim(place.city, place.iso);
    cache[key] = entry;
    writeFileSync(CACHE_PATH, JSON.stringify(cache), "utf8"); // Fortschritt sofort sichern
    queries++;
    await sleep(REQUEST_GAP_MS); // Richtlinie: >= 1 Anfrage/Sekunde
  }
  const v = evaluate(place.iso, entry);
  const rec = { key, city: place.city, iso: place.iso, ids: place.ids, ...v };
  if (v.status === "resolved") resolved.push(rec);
  else if (v.status === "ambiguous") ambiguous.push(rec);
  else if (v.status === "country_mismatch") mismatch.push(rec);
  else if (v.status === "error") errored.push(rec);
  else if (v.status === "pending") pending.push(rec);
  else notFound.push(rec);
  if (i % 25 === 0 || i === places.size) console.log(`  ${i}/${places.size} (Abfragen: ${queries}, Cache: ${cached}, offen: ${pending.length})`);
}
const done = places.size - pending.length;

// ── Optionaler SCHARFER Lauf (nur mit --write): Claims schreiben ────────────
let writeSummary = null;
if (WRITE) {
  let okC = 0, errN = 0;
  const claimRows = [];
  for (const p of resolved) for (const id of p.ids) {
    claimRows.push({ tournament_id: id, field_name: "latitude", field_value: String(p.lat), source: "nominatim", source_url: p.osm, confidence: CONF_GEOCODED });
    claimRows.push({ tournament_id: id, field_name: "longitude", field_value: String(p.lon), source: "nominatim", source_url: p.osm, confidence: CONF_GEOCODED });
  }
  for (let k = 0; k < claimRows.length; k += 500) {
    const batch = claimRows.slice(k, k + 500);
    const { error } = await svc.from("tour_tournament_claims").upsert(batch, { onConflict: "tournament_id,field_name,source,field_value", ignoreDuplicates: true });
    if (error) errN += batch.length; else okC += batch.length;
  }
  writeSummary = { okC, errN, claims: claimRows.length };
}

// ── Bericht ─────────────────────────────────────────────────────────────────
const claimsWouldWrite = resolved.reduce((a, p) => a + p.ids.length * 2, 0);
const md = [];
md.push(`# Geocodierung Turniere — ${WRITE ? "SCHARFER LAUF" : "TROCKENLAUF (nichts geschrieben)"}`);
md.push("");
md.push(`> Erzeugt von \`scripts/geocode-tournaments.mjs\`. Quelle: **Nominatim / OpenStreetMap**`);
md.push(`> Richtlinie: https://operations.osmfoundation.org/policies/nominatim/ · Attribution "© OpenStreetMap contributors".`);
md.push(`> Koordinaten sind eine **Ableitung** aus Stadt+Land → Claim-Quelle \`nominatim\`, confidence ${CONF_GEOCODED} (< Beobachtung 0.9).`);
md.push("");
md.push(`## Zusammenfassung`);
md.push("");
md.push(`| | Anzahl |`);
md.push(`|---|---:|`);
md.push(`| Turniere ohne Koordinaten | ${rows.length} |`);
md.push(`| Distinkte Orte (Stadt+Land) | ${places.size} |`);
md.push(`| **abgefragt (fertig)** | ${done} |`);
md.push(`| noch offen (--limit) | ${pending.length} |`);
md.push(`| aufgeloest | ${resolved.length} |`);
md.push(`| mehrdeutig | ${ambiguous.length} |`);
md.push(`| nicht gefunden | ${notFound.length} |`);
md.push(`| falsches Land | ${mismatch.length} |`);
md.push(`| Fehler/keine Antwort | ${errored.length} |`);
md.push(`| Netz-Abfragen in diesem Lauf | ${queries} (Cache: ${cached}) |`);
md.push("");
md.push(`**Wuerde geschrieben:** ${claimsWouldWrite} Claims (je aufgeloestem Ort x Turnieranzahl x 2 Felder) fuer ${resolved.length} Orte / ${resolved.reduce((a, p) => a + p.ids.length, 0)} Turniere.`);
if (writeSummary) md.push(`\n**Geschrieben:** ${writeSummary.okC} Claims ok, ${writeSummary.errN} Fehler (von ${writeSummary.claims}).`);
if (pending.length) md.push(`\n> ⚠ ${pending.length} Orte noch offen — weiteren Durchgang starten: \`node scripts/geocode-tournaments.mjs --limit=150\` (Cache setzt fort).`);
md.push("");
md.push(`## Stichprobe: 10 aufgeloeste Orte (zur Pruefung)`);
md.push("");
md.push(`| Ort | Land | lat | lon | Turniere | OSM |`);
md.push(`|---|---|---:|---:|---:|---|`);
for (const p of resolved.slice(0, 10)) md.push(`| ${p.city} | ${p.iso} | ${p.lat.toFixed(5)} | ${p.lon.toFixed(5)} | ${p.ids.length} | ${p.osm} |`);
md.push("");
md.push(`## Mehrdeutige Orte (NICHT uebernommen — bitte pruefen)`);
md.push("");
if (!ambiguous.length) md.push("Keine.");
for (const p of ambiguous) {
  md.push(`- **${p.city}, ${p.iso}** (${p.ids.length} Turniere) — ${p.candidates.length} verschiedene Orte:`);
  for (const c of p.candidates.slice(0, 6)) md.push(`  - ${c.lat.toFixed(4)}, ${c.lon.toFixed(4)} · ${c.name}`);
}
md.push("");
md.push(`## Nicht gefunden`);
md.push("");
if (!notFound.length) md.push("Keine.");
for (const p of notFound) md.push(`- ${p.city}, ${p.iso} (${p.ids.length} Turniere)`);
md.push("");
md.push(`## Falsches Land (Treffer lag ausserhalb des angegebenen Landes)`);
md.push("");
if (!mismatch.length) md.push("Keine.");
for (const p of mismatch) md.push(`- ${p.city}, ${p.iso} — Nominatim lieferte: ${p.got}`);
md.push("");
md.push(`## Fehler / keine Antwort`);
md.push("");
if (!errored.length) md.push("Keine.");
for (const p of errored) md.push(`- ${p.city}, ${p.iso} — ${p.reason}`);
md.push("");
if (pending.length) {
  md.push(`## Noch offen (in diesem Teil-Lauf nicht abgefragt)`);
  md.push("");
  for (const p of pending) md.push(`- ${p.city}, ${p.iso} (${p.ids.length} Turniere)`);
  md.push("");
}
md.push(`## Alle aufgeloesten Orte`);
md.push("");
md.push(`| Ort | Land | lat | lon | Turniere |`);
md.push(`|---|---|---:|---:|---:|`);
for (const p of resolved) md.push(`| ${p.city} | ${p.iso} | ${p.lat.toFixed(5)} | ${p.lon.toFixed(5)} | ${p.ids.length} |`);
md.push("");
md.push(`## Hinweise`);
md.push("");
md.push(`- Trockenlauf ist Voreinstellung. Scharf: \`--write\`. Danach \`resolve-tournaments.mjs --write\` schreibt aus den Claims in den Stamm.`);
md.push(`- Idempotenz: Claims upsert onConflict (tournament_id,field_name,source,field_value) ignoreDuplicates; ROHtreffer in scripts/.geocode-cache.json gecacht.`);
md.push(`- Rate-Limit: >= ${REQUEST_GAP_MS} ms je Netz-Anfrage, Einzel-Thread. Mehrdeutige/fehlende Orte werden gelistet, nicht geraten.`);
md.push(`- Mehrdeutigkeit: Treffer >${AMBIGUOUS_KM} km auseinander gelten als verschiedene Orte; nähere OSM-Knoten derselben Stadt werden zusammengeführt.`);
md.push("");
writeFileSync(join(__dirname, "geocoding-report.md"), md.join("\n"), "utf8");
console.log(`\n${WRITE ? "SCHARF" : "TROCKENLAUF"} · fertig=${done}/${places.size} offen=${pending.length} · aufgeloest=${resolved.length} mehrdeutig=${ambiguous.length} nicht_gefunden=${notFound.length} falsches_land=${mismatch.length} fehler=${errored.length}`);
console.log(`Bericht: scripts/geocoding-report.md`);
