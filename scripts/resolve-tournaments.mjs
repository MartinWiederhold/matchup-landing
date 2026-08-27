// resolve-tournaments.mjs
//
// AUFLÖSUNGSSCHRITT: liest alle Claims je Turnier aus web.tour_tournament_claims,
// wendet die reine Domain-Regel resolveClaimField() an und schreibt die aufgelösten
// Werte in die NICHT-Identitätsspalten von web.tour_tournaments.
//
// Identitätsfelder (source_ref, tournament_monday, series) werden NIE geschrieben —
// die setzt der Import. Alle übrigen Felder kommen ausschließlich aus der Auflösung.
//
// TROCKENLAUF ist Voreinstellung: ohne --write wird NICHTS geschrieben (nur Bericht).
// Hinweis: Auch der Trockenlauf öffnet eine LESE-Verbindung über den Service-Client,
// weil die Claims per RLS nur für service_role lesbar sind.
//
// Ausführen (Trockenlauf):  node scripts/resolve-tournaments.mjs
// Scharf (schreibt!):        node scripts/resolve-tournaments.mjs --write
// Ergebnis:                  scripts/resolve-report.md

import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
// Reine, getestete Auflösungsregel (Node 24 strippt die TS-Typen beim Import).
import { resolveClaimField, RESOLVE_RULES_VERSION } from "../src/domain/tour/resolveClaims.ts";

const WRITE = process.argv.includes("--write");

// Auflösbare (Nicht-Identitäts-)Spalten. Identität wird hier NIE angefasst.
const RESOLVABLE = [
  "category", "name", "city", "country", "latitude", "longitude",
  "surface", "indoor", "prize_money", "prize_currency", "website", "status",
];
const NUM_FIELDS = new Set(["prize_money", "latitude", "longitude"]);
const BOOL_FIELDS = new Set(["indoor"]);
// Öffentliche ITF-Turnierseite (mit Fact Sheet + „Login to Tour Zone"). Nur EXAKT dieses
// Muster wird in `website` gehoben — nie Wikipedia/OSM/WTA-API. Kein turnier-spezifischer
// Deep-Link ins Portal möglich (geprüft) → diese Seite ist der beste Landepunkt.
const ITF_PAGE_RE = /^https:\/\/www\.itftennis\.com\/en\/tournament\//;
// Textwert (aus dem Claim) in den Spaltentyp überführen.
function coerce(field, value) {
  if (value == null) return null;
  if (BOOL_FIELDS.has(field)) return value === "true";
  if (NUM_FIELDS.has(field)) return Number(value);
  return value;
}

// ---------------------------------------------------------------------------
// Service-Client (Key aus .env.local, wird NICHT ausgegeben)
// ---------------------------------------------------------------------------
function loadEnv() {
  const env = {};
  try {
    for (const line of readFileSync(join(process.cwd(), ".env.local"), "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z_0-9]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch { /* fehlt → unten Abbruch */ }
  return env;
}
const env = loadEnv();
const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SUPA_KEY) { console.error("ABBRUCH: Supabase-URL/Service-Key nicht in .env.local gefunden."); process.exit(1); }

const { createClient } = await import("@supabase/supabase-js");
const svc = createClient(SUPA_URL, SUPA_KEY, { db: { schema: "web" }, auth: { persistSession: false, autoRefreshToken: false } });

// ---------------------------------------------------------------------------
// Lesen (paginiert)
// ---------------------------------------------------------------------------
async function fetchAll(table, cols) {
  const out = [];
  let from = 0; const size = 1000;
  while (true) {
    const { data, error } = await svc.from(table).select(cols).order("id").range(from, from + size - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    out.push(...data);
    if (data.length < size) break;
    from += size;
  }
  return out;
}

console.log(`${WRITE ? "SCHARF" : "TROCKENLAUF"} · lese Turniere + Claims …`);
const tournaments = await fetchAll("tour_tournaments", "id, source_ref, series");
const claimsRaw = await fetchAll("tour_tournament_claims", "tournament_id, field_name, field_value, source, source_url, observed_at, confidence");
console.log(`  ${tournaments.length} Turniere, ${claimsRaw.length} Claims`);

// Claims gruppieren: tid → field → claim[]
const byT = new Map();
for (const c of claimsRaw) {
  if (!byT.has(c.tournament_id)) byT.set(c.tournament_id, new Map());
  const fm = byT.get(c.tournament_id);
  if (!fm.has(c.field_name)) fm.set(c.field_name, []);
  fm.get(c.field_name).push(c);
}

// ---------------------------------------------------------------------------
// Auflösen
// ---------------------------------------------------------------------------
let resolvedCount = 0, fieldWrites = 0, itfPageDerived = 0;
const perFieldSource = {}; // field → { source: anzahl_siege }
const sourceWins = {};     // source → anzahl_siege (feldübergreifend)
const conflicts = [];      // { source_ref, field, chosen, values:[{value,source}] }
const updates = [];        // { id, obj } — was in den Stamm ginge

for (const t of tournaments) {
  const fm = byT.get(t.id);
  if (!fm) continue;
  const obj = {};
  for (const field of RESOLVABLE) {
    const cl = fm.get(field);
    if (!cl || cl.length === 0) continue;
    const r = resolveClaimField(cl.map((x) => ({
      field_value: x.field_value, source: x.source, observed_at: x.observed_at, confidence: Number(x.confidence),
    })));
    if (r.value == null) continue;
    obj[field] = coerce(field, r.value);
    fieldWrites++;
    (perFieldSource[field] ||= {})[r.source] = (perFieldSource[field]?.[r.source] ?? 0) + 1;
    sourceWins[r.source] = (sourceWins[r.source] ?? 0) + 1;
    if (r.conflict) {
      const vs = [...new Set(cl.map((x) => x.field_value))].map((v) => ({ value: v, source: cl.find((x) => x.field_value === v).source }));
      conflicts.push({ source_ref: t.source_ref, field, chosen: r.value, values: vs });
    }
  }
  // ── ITF-Turnierseite in `website` heben ──────────────────────────────────────
  // Die öffentliche itftennis.com-Turnierseite ist keine eigene Behauptung (kein
  // field_name), sondern steckt als source_url in den ITF-Endpunkt-Claims. Wir heben
  // sie für ITF-Turniere in `website`, damit der Meldeweg auf die RICHTIGE Turnierseite
  // verlinkt (statt auf die blanke Portal-Startseite ohne Turnier-Kennung). Ein
  // ausdrücklicher website-Claim (falls je vorhanden) hätte Vorrang — daher nur, wenn
  // oben nichts gesetzt wurde. Aktuell tragen nur Junioren solche Claims; itf_wtt
  // bekommt sie, sobald der Endpunkt-Import (statt Wikipedia) auf main läuft → selbstheilend.
  if ((t.series === "itf_wtt" || t.series === "itf_juniors") && obj.website == null) {
    let page = null;
    for (const cl of fm.values()) {
      for (const c of cl) {
        if (c.source_url && ITF_PAGE_RE.test(c.source_url)) { page = c.source_url; break; }
      }
      if (page) break;
    }
    if (page) { obj.website = page; itfPageDerived++; }
  }
  if (Object.keys(obj).length) { updates.push({ id: t.id, obj }); resolvedCount++; }
}

// ---------------------------------------------------------------------------
// Schreiben (nur --write) — idempotent: gleiche Claims ⇒ gleiche Werte.
// ---------------------------------------------------------------------------
let written = 0, errN = 0;
if (WRITE) {
  for (const u of updates) {
    const { error } = await svc.from("tour_tournaments").update(u.obj).eq("id", u.id);
    if (error) errN++; else written++;
  }
}

// ---------------------------------------------------------------------------
// Bericht
// ---------------------------------------------------------------------------
const now = new Date().toISOString();
const md = [];
md.push(`# Turnier-Auflösung — ${WRITE ? "SCHARFER LAUF" : "TROCKENLAUF (nichts geschrieben)"}`);
md.push("");
md.push(`> Erzeugt von \`scripts/resolve-tournaments.mjs\` · Lauf: ${now} · Regel: resolveClaimField ${RESOLVE_RULES_VERSION}`);
md.push(`> Nur NICHT-Identitätsfelder werden aufgelöst; source_ref/tournament_monday/series bleiben unberührt.`);
md.push("");
md.push(`## 1. Überblick`);
md.push("");
md.push(`- Turniere gesamt: **${tournaments.length}**`);
md.push(`- Turniere mit ≥1 aufgelöstem Feld: **${resolvedCount}**`);
md.push(`- Feld-Auflösungen gesamt: **${fieldWrites}**`);
md.push(`- ITF-Turnierseite in \`website\` gehoben: **${itfPageDerived}** (nur itftennis.com/en/tournament/…)`);
md.push(`- Erkannte Konflikte: **${conflicts.length}**`);
if (WRITE) md.push(`- Geschrieben: **${written}** Stammzeilen aktualisiert, ${errN} Fehler.`);
else md.push(`- (Trockenlauf — keine Stammzeile geschrieben.)`);
md.push("");

md.push(`## 2. Feld-Siege je Quelle (welche Quelle setzt welches Feld wie oft)`);
md.push("");
md.push(`| Feld | ${Object.keys(sourceWins).length ? "Quelle → Anzahl" : "—"} |`);
md.push(`|---|---|`);
for (const field of RESOLVABLE) {
  const per = perFieldSource[field];
  if (!per) continue;
  const parts = Object.entries(per).sort((a, b) => b[1] - a[1]).map(([s, n]) => `${s}: ${n}`);
  md.push(`| ${field} | ${parts.join(" · ")} |`);
}
md.push("");
md.push(`**Feldübergreifend je Quelle:** ${Object.entries(sourceWins).sort((a, b) => b[1] - a[1]).map(([s, n]) => `${s}: ${n}`).join(" · ") || "—"}`);
md.push("");

md.push(`## 3. Konflikte (unterschiedliche Werte für dasselbe Feld)`);
md.push("");
if (conflicts.length === 0) {
  md.push(`Keine — aktuell stammen alle Claims aus einer Quelle je Feld (nur Wikipedia). Konflikte`);
  md.push(`werden auftreten, sobald eine zweite Quelle (Verbandskalender) hinzukommt.`);
} else {
  md.push(`| Turnier (source_ref) | Feld | gewählt | widersprüchliche Werte (Wert@Quelle) |`);
  md.push(`|---|---|---|---|`);
  for (const k of conflicts) {
    const vs = k.values.map((v) => `${v.value}@${v.source}`).join(" · ");
    md.push(`| ${k.source_ref} | ${k.field} | ${k.chosen} | ${vs} |`);
  }
}
md.push("");
md.push(`## 4. Hinweise`);
md.push("");
md.push(`- **Trockenlauf ist Voreinstellung.** Scharf: \`node scripts/resolve-tournaments.mjs --write\`.`);
md.push(`- **Idempotent:** gleiche Claims ⇒ deterministisch gleiche Werte; ein zweiter Lauf setzt dieselben Werte.`);
md.push(`- **Quellen-Rangfolge** (in der Domain-Regel): verband → wikipedia → abgeleitet.`);
md.push(`- \`website\` hat keine eigenen Claims; für ITF-Turniere wird die öffentliche`);
md.push(`  itftennis.com-Turnierseite aus der claim-source_url gehoben (nur itftennis.com/en/tournament/…).`);
md.push(`- status/latitude/longitude haben aktuell keine Claims → bleiben unverändert (Default/NULL).`);
md.push("");

const out = md.join("\n");
const __dirname = dirname(fileURLToPath(import.meta.url));
writeFileSync(join(__dirname, "resolve-report.md"), out, "utf8");
try { writeFileSync(join(homedir(), "Downloads", "resolve-report.md"), out, "utf8"); } catch { /* Downloads optional (CI-Runner hat kein ~/Downloads) */ }
console.log(`${WRITE ? "SCHARF" : "TROCKENLAUF"} · aufgelöst=${resolvedCount} felder=${fieldWrites} itf-seite=${itfPageDerived} konflikte=${conflicts.length}${WRITE ? ` geschrieben=${written}` : ""}`);
console.log(`Bericht: scripts/resolve-report.md`);
