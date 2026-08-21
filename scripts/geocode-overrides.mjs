// geocode-overrides.mjs
//
// Manuell kuratierte Koordinaten für 30 mehrdeutige Turnierorte der ZIELREGION
// (Europa + TR/TN/EG/MA), die der Nominatim-Lauf (MU-029, geocode-tournaments.mjs)
// als „mehrdeutig" gelistet hat. Ergänzt latitude/longitude als Claims mit Quelle
// "manual" und confidence 0.7 (bewusst höher als der Nominatim-Auto-Wert 0.6, weil
// menschlich unter den Kandidaten ausgewählt — aber unter einer Beobachtung 0.9;
// klar unterscheidbar von den `nominatim`-Claims). Die Auflösung in den Stamm macht
// scripts/resolve-tournaments.mjs (latitude/longitude sind dort RESOLVABLE).
//
// TROCKENLAUF ist Voreinstellung: OHNE --write wird KEIN Claim geschrieben (nur Ausgabe).
// Eine LESE-Verbindung (Service-Client) wird auch im Trockenlauf geöffnet (RLS).
//
// Reines Node (ESM). Keine neuen Dependencies. Nichts unter src/. web.tournaments bleibt.
//
// Herkunft (source_url) + volle Koordinaten-Präzision werden aus dem Nominatim-Rohcache
// (scripts/.geocode-cache.json) gezogen: je Override wird der Kandidat gewählt, dessen
// Lage zur unten genannten Auswahl passt (Rundung auf 3 Nachkommastellen). So sind die
// Koordinaten identisch zu den vom Geocoder gelieferten und der OSM-Link stimmt sicher.
//
// Zwei offene Orte der Zielregion bleiben BEWUSST ohne Koordinate (der richtige Ort war
// nicht unter den Nominatim-Kandidaten — kein Raten): Vale do Lobo (Algarve-Resort fehlte)
// und Bolzano (Stadt Bozen fehlte). Die ~88 offenen Orte außerhalb der Zielregion ebenfalls.
//
// Trockenlauf:  node scripts/geocode-overrides.mjs
// Scharf:       node scripts/geocode-overrides.mjs --write
// Danach:       node scripts/resolve-tournaments.mjs --write

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const WRITE = process.argv.includes("--write");
const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_PATH = join(__dirname, ".geocode-cache.json");
const PROJECT_REF = "dqeroewcdclgxujhubht";
const CONF_MANUAL = 0.7; // manuell geprüfte Auswahl < Beobachtung (0.9), > Nominatim-Auto (0.6)

// ── Die kuratierte Auswahl ───────────────────────────────────────────────────
// `pick` = ungefähre Lage des gewählten Kandidaten (dient NUR dem Abgleich mit dem
// Rohcache; die tatsächlich geschriebene Koordinate + der OSM-Link kommen aus dem Cache).
//
// GRUPPE A — echt mehrdeutig (zwei verschiedene reale Orte), je mit Begründung.
// GRUPPE B — ein klar dominanter Ort bzw. mehrfach geknotet. Gewählt nach der HEURISTIK
//   „höchster Nominatim-Relevanz-Treffer" (Position 1 der Antwort). ACHTUNG: Das ist eine
//   ANNAHME über die Sortierung der Nominatim-Antwort, KEINE Prüfung der Lage vor Ort.
const OVERRIDES = [
  // ── Gruppe A (mit Begründung) ──────────────────────────────────────────────
  // Frankfurt: WAHRSCHEINLICH Frankfurt am Main (dort mehr Turnierbetrieb) — NICHT belegt.
  // Bei M15/M25 finden Turniere auch in kleineren Städten statt; fände sich später ein
  // Turnier in Frankfurt (Oder), muss diese Wahl korrigiert werden.
  { city: "Frankfurt", country: "DE", pick: [50.1106, 8.6821], note: "A: wahrscheinlich Frankfurt am Main (mehr Turnierbetrieb), nicht belegt — bei Bedarf korrigieren" },
  { city: "Sofia", country: "BG", pick: [42.6977, 23.3217], note: "A: Landeshauptstadt; zweiter Treffer unbedeutend" },
  { city: "Tunis", country: "TN", pick: [36.8002, 10.1858], note: "A: Landeshauptstadt; zweiter Treffer ist Landes-Zentroid" },
  { city: "Messina", country: "IT", pick: [38.1938, 15.5542], note: "A: Stadt Messina (Nordostspitze Siziliens)" },
  { city: "Maia", country: "PT", pick: [41.2373, -8.6300], note: "A: Maia im Großraum Porto (Festland), nicht Azoren" },
  { city: "Kiseljak", country: "BA", pick: [43.9432, 18.0775], note: "A: Kiseljak Zentralbosnien (nahe Sarajevo), nicht Zvornik/RS" },
  { city: "Poreč", country: "HR", pick: [45.2272, 13.5957], note: "A: Poreč an der Istrien-Küste, nicht Slawonien" },
  { city: "Opatija", country: "HR", pick: [45.3349, 14.3068], note: "A: Adria-Kurort Opatija (Istrien), nicht bei Zagreb" },
  { city: "Cervia", country: "IT", pick: [44.2610, 12.3495], note: "A: Adria-Badeort Cervia (Ravenna), nicht Fraktion bei Verona" },
  { city: "Quinta do Lago", country: "PT", pick: [37.0462, -8.0190], note: "A: Algarve-Resort bei Almancil/Loulé (dritter Kandidat, NICHT der erste)" },
  { city: "Haren", country: "NL", pick: [53.1710, 6.6061], note: "A: Haren bei Groningen (größer), nicht Nordbrabant" },
  { city: "Rosbach", country: "DE", pick: [50.2991, 8.6967], note: "A: Rosbach vor der Höhe (Wetterau, nahe Frankfurt), nicht Sieg" },
  { city: "Trnava", country: "SK", pick: [48.3768, 17.5858], note: "A: Regionshauptstadt Trnava, nicht Trnava pri Laborci" },

  // ── Gruppe B (Heuristik „höchste Relevanz", keine Einzelprüfung) ────────────
  { city: "Carnac", country: "FR", pick: [47.5837, -3.0794], note: "B" },
  { city: "Tarragona", country: "ES", pick: [41.1172, 1.2546], note: "B" },
  { city: "Murcia", country: "ES", pick: [37.9348, -1.1131], note: "B" },
  { city: "Ollersbach", country: "AT", pick: [48.1874, 15.8441], note: "B" },
  { city: "Mistelbach", country: "AT", pick: [48.5695, 16.5720], note: "B" },
  { city: "Allershausen", country: "DE", pick: [48.4334, 11.6001], note: "B" },
  { city: "Metzingen", country: "DE", pick: [48.5397, 9.2831], note: "B" },
  { city: "Bistrița", country: "RO", pick: [47.1327, 24.4964], note: "B" },
  { city: "Slobozia", country: "RO", pick: [44.5636, 27.3618], note: "B" },
  { city: "Satu Mare", country: "RO", pick: [47.7892, 22.8726], note: "B" },
  { city: "Szczecin", country: "PL", pick: [53.4298, 14.5929], note: "B" },
  { city: "Łódź", country: "PL", pick: [51.7687, 19.4570], note: "B" },
  { city: "Sunderland", country: "GB", pick: [54.9059, -1.3829], note: "B" },
  { city: "Montauban", country: "FR", pick: [44.0176, 1.3550], note: "B" },
  { city: "Doboj", country: "BA", pick: [44.7325, 18.0850], note: "B" },
  { city: "Hagen", country: "DE", pick: [51.3583, 7.4733], note: "B" },
  { city: "Castelo Branco", country: "PT", pick: [39.9768, -7.4461], note: "B" },
  // ── Nachtrag nach ITF-Import (neue mehrdeutige Zielregion-Orte) ─────────────
  // EINDEUTIG: nur EIN realer Ort dieses Namens im Land (zweiter Cache-Treffer trägt
  // einen ANDEREN Namen bzw. ist ein Weiler) → direkt aufgelöst.
  { city: "Yecla", country: "ES", pick: [38.6136, -1.1158], note: "A: Yecla (Region Murcia); zweiter Treffer heißt 'Yecla de Yeltes' (anderer Ort)" },
  { city: "Sibenik", country: "HR", pick: [43.7340, 15.8945], note: "A: Šibenik, Adriaküste (einziger Treffer)" },
  { city: "Redbridge", country: "GB", pick: [51.5763, 0.0454], note: "A: London Borough of Redbridge (einziger Treffer)" },
  // Sharm El Sheikh: der WICHTIGSTE Fund dieser Runde — 24 Turniere an einem der größten
  // ITF-Cluster für die Zielgruppe, komplett aus dem Optimierer gefallen, nur weil die
  // ITF-Schreibweise 'ElSheikh' (ohne Leerzeichen) den Geocoder-Cache verfehlt. EINDEUTIG
  // (Rotmeer-Resort Südsinai) → verifizierte Koordinate aus dem Geocoder-Treffer für die
  // korrekte Schreibweise 'Sharm El Sheikh' direkt gesetzt (coord statt Cache-Abgleich).
  // Lehre: bei fehlenden Koordinaten immer zuerst die Schreibweise gegen den Cache prüfen.
  { city: "Sharm ElSheikh", country: "EG", coord: [27.8644, 34.2954], note: "A: Sharm El Sheikh (Südsinai), 24 Turniere; Schreibweise ohne Leerzeichen verfehlte den Geocoder" },
  // ── Vom Nutzer entschiedene Mehrdeutigkeiten (2026-08-20) ──────────────────
  { city: "Offenbach", country: "DE", pick: [50.1055, 8.7611], note: "Nutzer: Offenbach am Main (TC Offenbach richtet ITF aus); Offenbach a. d. Queich hat 5.000 Ew." },
  { city: "Essen", country: "DE", pick: [51.4580, 7.0160], note: "Nutzer: Essen an der Ruhr (ETUF Ausrichter); Essen (Oldenburg) ist ein Dorf" },
  { city: "Radom", country: "PL", pick: [51.4170, 21.1570], note: "Nutzer: Stadt Radom, Masowien (200.000 Ew.); zweiter Treffer ist ein Dorf in Großpolen" },
  // 'Szczawno' (ITF-Schreibweise) hat im Cache keinen Kandidaten nahe Szczawno-Zdrój
  // (nächster > 0.02° entfernt) → bestätigte Kurort-Koordinate direkt per coord.
  { city: "Szczawno", country: "PL", coord: [50.7950, 16.2350], note: "Nutzer: Szczawno-Zdrój, Kurort mit Tennistradition; die übrigen Treffer sind Dörfer" },
  // Câmpulung: über den ITF-Turnierlink verifiziert — Veranstalter CS Ceramus, Str. Fundătura
  // Gruiului, liegt in Câmpulung Muscel (Argeș), NICHT Câmpulung Moldovenesc (Suceava).
  { city: "Campulung", country: "RO", pick: [45.2700, 25.0450], note: "Link-Beleg: CS Ceramus (Câmpulung Muscel, Argeș); über tournamentLink/Veranstalter verifiziert" },
  // Vale do Lobo: Algarve-Resort — kein Geocoder-Kandidat traf die Küstenlage (nur Binnenland),
  // deshalb verifizierte Koordinate direkt gesetzt und vom Nutzer bestätigt.
  { city: "Vale do Lobo", country: "PT", coord: [37.0610, -8.0280], note: "Nutzer bestätigt: Algarve-Resort; kein Geocoder-Kandidat passte zur Küstenlage" },
  // ── Junioren, europäische eindeutige Orte (2026-08-21). Bekannte Stadt gewählt; die
  //    übrigen Nominatim-Cluster sind gleichnamige Mini-Dörfer (Rauschen), keine echte
  //    Mehrdeutigkeit. Koordinate = verifizierter OSM-Knoten der bekannten Stadt.
  { city: "Leimen", country: "DE", coord: [49.3491, 8.6910], note: "Leimen, Rhein-Neckar-Kreis (bei Heidelberg, Tennis); übrige Treffer Mini-Dörfer" },
  { city: "Frederiksberg", country: "DK", coord: [55.6780, 12.5326], note: "Frederiksberg, Kopenhagen-Enklave (KB Tennis); zweiter Treffer Dorf in Sorø" },
  { city: "Holte", country: "DK", coord: [55.8125, 12.4688], note: "Holte, Rudersdal (Kopenhagen-Vorort, Holte Tennisklub); übrige klein" },
  { city: "Silla", country: "ES", coord: [39.3632, -0.4113], note: "Silla, l'Horta Sud bei Valencia; zweiter Treffer Weiler bei Cádiz" },
  { city: "ESTEPONA", country: "ES", coord: [36.4268, -5.1468], note: "Estepona, Málaga/Costa del Sol; zweiter Treffer winziger Ort in Biscaya" },
  { city: "Vierumaki", country: "FI", coord: [61.1046, 25.9324], note: "Vierumäki, Heinola — Sportinstitut; übrige gleichnamige Weiler" },
  { city: "Saint Gregoire", country: "FR", coord: [48.1524, -1.6854], note: "Saint-Grégoire bei Rennes; übrige Treffer klein (Albi, Lot-et-Garonne)" },
  { city: "Ponts de Ce", country: "FR", coord: [47.4252, -0.5257], note: "Les Ponts-de-Cé bei Angers (ITF-Schreibweise ohne 'Les'); zweiter Treffer Straße in Boulogne" },
  { city: "Porec", country: "HR", coord: [45.2272, 13.5957], note: "Poreč, Istrien (Küstenstadt, Tennis); zweiter Treffer Dorf in Slawonien" },
  { city: "Veli Losinj", country: "HR", coord: [44.5211, 14.5017], note: "Veli Lošinj, Insel Lošinj; zweiter Treffer winzig bei Vis" },
  { city: "Livorno", country: "IT", coord: [43.5507, 10.3091], note: "Livorno, Hafenstadt Toskana; erster Cluster war ein fehlplatzierter Knoten Richtung Elba" },
  { city: "Meknes", country: "MA", coord: [33.8984, -5.5322], note: "Meknès, Stadt; zweiter Treffer war der Regions-Mittelpunkt Fès-Meknès" },
  { city: "Leszno", country: "PL", coord: [51.8436, 16.5744], note: "Leszno, Großpolen (Stadt ~64k, Tennis); übrige Treffer Dörfer (Warschau-Umland, Kartuzy)" },
];

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

const norm = (city, country) => `${country}|${String(city).trim().toLowerCase().replace(/\s+/g, " ")}`;
const osmUrl = (r) => (r && r.osm_type && r.osm_id ? `https://www.openstreetmap.org/${r.osm_type}/${r.osm_id}` : null);

// Rohcache: für jeden Override den passenden Kandidaten (nach Lage) heraussuchen.
let cache = {};
if (existsSync(CACHE_PATH)) { try { cache = JSON.parse(readFileSync(CACHE_PATH, "utf8")); } catch { cache = {}; } }
function resolveFromCache(o) {
  const entry = cache[norm(o.city, o.country)];
  const raw = entry && entry.raw ? entry.raw : [];
  const [plat, plon] = o.pick;
  // Nächstliegenden Kandidaten wählen (Grad-Distanz), akzeptiert nur bei <=0.02° (~2 km).
  // Robust gegen Rundungsgrenzen; die Kandidaten liegen sonst >0.5° auseinander.
  let best = null, bestD = Infinity;
  for (const r of raw) {
    const d = Math.hypot(r.lat - plat, r.lon - plon);
    if (d < bestD) { bestD = d; best = r; }
  }
  return best && bestD <= 0.02 ? best : null;
}

// Turniere ohne Koordinaten lesen, nach Ortsschlüssel gruppieren.
async function fetchMissing() {
  const out = [];
  let from = 0; const size = 1000;
  for (;;) {
    const { data, error } = await svc.from("tour_tournaments").select("id, city, country, latitude, longitude").order("id").range(from, from + size - 1);
    if (error) { console.error("Lesefehler:", error.message); process.exit(1); }
    if (!data || data.length === 0) break;
    for (const r of data) { if (r.latitude == null || r.longitude == null) { if (r.city && r.country) out.push(r); } }
    if (data.length < size) break;
    from += size;
  }
  return out;
}
const rows = await fetchMissing();
const byKey = new Map();
for (const r of rows) { const k = norm(r.city, r.country); if (!byKey.has(k)) byKey.set(k, []); byKey.get(k).push(r.id); }

// Claims bauen — Koordinate + OSM-Link aus dem Cache-Kandidaten; alles Nicht-Passende melden.
const claimRows = [];
let matched = 0, tournaments = 0;
for (const o of OVERRIDES) {
  const ids = byKey.get(norm(o.city, o.country));
  if (!ids || ids.length === 0) { console.log(`  ⚠ kein Turnier ohne Koordinaten fuer: ${o.city}, ${o.country} (evtl. schon gesetzt)`); continue; }
  // coord = verifizierte Koordinate direkt (für Orte, die der Geocoder wegen der
  // Schreibweise nicht fand); sonst den passenden Cache-Kandidaten wählen.
  const cand = o.coord ? { lat: o.coord[0], lon: o.coord[1] } : resolveFromCache(o);
  if (!cand) { console.log(`  ⚠ kein Cache-Kandidat passt zur Auswahl fuer: ${o.city}, ${o.country} — uebersprungen (kein Raten)`); continue; }
  matched++; tournaments += ids.length;
  const url = o.coord ? null : osmUrl(cand);
  for (const id of ids) {
    claimRows.push({ tournament_id: id, field_name: "latitude", field_value: String(cand.lat), source: "manual", source_url: url, confidence: CONF_MANUAL });
    claimRows.push({ tournament_id: id, field_name: "longitude", field_value: String(cand.lon), source: "manual", source_url: url, confidence: CONF_MANUAL });
  }
}

console.log(`Overrides: ${OVERRIDES.length} · zugeordnet: ${matched} (${tournaments} Turniere)`);
console.log(`${WRITE ? "SCHREIBE" : "WUERDE SCHREIBEN"}: ${claimRows.length} Claims (Quelle manual, confidence ${CONF_MANUAL})`);

if (WRITE) {
  let okC = 0, errN = 0;
  for (let k = 0; k < claimRows.length; k += 500) {
    const batch = claimRows.slice(k, k + 500);
    const { error } = await svc.from("tour_tournament_claims").upsert(batch, { onConflict: "tournament_id,field_name,source,field_value", ignoreDuplicates: true });
    if (error) errN += batch.length; else okC += batch.length;
  }
  console.log(`GESCHRIEBEN: ${okC} Claims ok, ${errN} Fehler.`);
} else {
  console.log("Trockenlauf — nichts geschrieben. Scharf: node scripts/geocode-overrides.mjs --write");
}
