// extreme-tennis-import.mjs
//
// Importiert den Schläger-Katalog von extreme-tennis.fr nach web.rackets +
// web.racket_claims (siehe supabase/web_rackets.sql).
//
// TROCKENLAUF ist Voreinstellung: OHNE --write wird KEINE Datenbankverbindung
// geöffnet und NICHTS geschrieben — es entsteht nur ein Bericht darüber, was
// geschrieben würde. Scharfes Schreiben nur mit --write (Service-Client, RLS-Bypass).
//
// Reines Node (ESM). Keine neuen Dependencies (@supabase/supabase-js ist bereits im
// Projekt). Nichts unter src/ wird verändert. src/data/seed/rackets.ts (Beratungs-
// Seed) bleibt unberührt.
//
// Rohantworten werden unter scripts/.et-cache/ zwischengespeichert: ein zweiter
// Lauf ruft nicht erneut ab, sondern setzt fort (wie beim Geocoding).
//
// Ausführen (Trockenlauf):  node scripts/extreme-tennis-import.mjs
// Nur die ersten N Produkte:  node scripts/extreme-tennis-import.mjs --limit=5
// Scharf (schreibt!):        node scripts/extreme-tennis-import.mjs --write
// Ergebnis:                  scripts/extreme-tennis-import-report.md

import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const WRITE = process.argv.includes("--write");
// Optionales Test-Limit: nur die ersten N Produkte verarbeiten (Rauchtest).
const LIMIT = parseInt((process.argv.find((a) => a.startsWith("--limit=")) || "").split("=")[1] || "0", 10) || 0;

const BASE = "https://www.extreme-tennis.fr";
const CATEGORY = "/fr/8-raquette-de-tennis"; // Kategorie „Raquette de tennis" (id 8)
const PAGES = [1, 2, 3, 4, 5, 6]; // Blätterung über ?page=N (Seite 6 ist die letzte)
const USER_AGENT =
  "MatchupRacketImport/1.0 (+https://matchup-app.com; wiederhold.martin@web.de) node-fetch";
const PROJECT_REF = "dqeroewcdclgxujhubht"; // nur für Supabase-URL-Fallback, kein Secret

// Confidence: beobachtet — direkt aus dem Shop (Eigentümer-Quelle) gelesen, nicht abgeleitet.
const CONF_OBSERVED = 0.9;

// Zwischenspeicher für Rohantworten (HTML). Reruns setzen darauf fort.
const CACHE_DIR = join(__dirname, ".et-cache");
if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// HTTP mit Cache, Timeout, Retry, ≥1,1 s Pause zwischen NETZ-Abrufen.
// Gecachte Treffer lösen KEINE Pause aus (kein Netz).
// ---------------------------------------------------------------------------
let netFetches = 0, cacheHits = 0;
async function getHtml(url, cacheName) {
  const cachePath = join(CACHE_DIR, cacheName);
  if (existsSync(cachePath)) {
    const html = readFileSync(cachePath, "utf8");
    if (html.length > 0) { cacheHits++; return html; }
  }
  for (let attempt = 1; attempt <= 2; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 60_000);
    try {
      // fetch folgt 301/302 standardmäßig (markenspezifische Produktpfade).
      const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, redirect: "follow", signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const html = await res.text();
      writeFileSync(cachePath, html, "utf8"); // Fortschritt sofort sichern
      netFetches++;
      await sleep(1100); // Rate-Begrenzung — NICHT umgehen
      return html;
    } catch (err) {
      clearTimeout(timer);
      if (attempt === 2) throw err;
      await sleep(3000);
    }
  }
}

// ---------------------------------------------------------------------------
// HTML-Entities dekodieren (benannt + numerisch). Deckt die auf der Seite
// vorkommenden Fälle ab (accents, &sup2;, &rsquo; = typografisches Apostroph …).
// ---------------------------------------------------------------------------
const NAMED = {
  amp: "&", quot: '"', apos: "'", nbsp: " ", laquo: "«", raquo: "»", deg: "°", euro: "€",
  sup2: "²", sup3: "³", times: "×", middot: "·", ndash: "–", mdash: "—",
  rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“",
  eacute: "é", egrave: "è", ecirc: "ê", euml: "ë", agrave: "à", acirc: "â", auml: "ä",
  aacute: "á", ocirc: "ô", ouml: "ö", oacute: "ó", ugrave: "ù", ucirc: "û", uuml: "ü",
  icirc: "î", iuml: "ï", iacute: "í", ccedil: "ç", ntilde: "ñ",
};
function decodeEntities(s) {
  return String(s)
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z0-9]+);/gi, (m, n) => (NAMED[n] ?? NAMED[n.toLowerCase()] ?? m));
}
// Label normalisieren: Entities dekodieren, Diakritika entfernen, klein, Leerraum straffen.
// Damit matcht „Rigidit&eacute;" robust gegen „rigidite" — ohne perfekte Entity-Abdeckung.
function normLabel(s) {
  return decodeEntities(s).normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/\s+/g, " ").trim();
}

// ---------------------------------------------------------------------------
// Zahl-Parser. Französisches Format: Komma als Dezimaltrenner.
// ---------------------------------------------------------------------------
function firstNumber(raw) {
  if (raw == null) return null;
  const m = String(decodeEntities(raw)).match(/-?\d+(?:[.,]\d+)?/);
  if (!m) return null;
  return parseFloat(m[0].replace(",", "."));
}
function toInt(raw) { const n = firstNumber(raw); return n == null ? null : Math.round(n); }
function toNum(raw) { return firstNumber(raw); } // numeric-Spalte (Dezimal erlaubt)

// Preis → ganzzahlige Minor Units (Cent), OHNE Fließkomma-Zwischenschritt
// (String-Zerlegung wie euroToMinor in src/lib/tourCosts.ts). "233.9" → 23390.
function priceToMinor(rawStr) {
  if (rawStr == null) return null;
  const s = String(rawStr).trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const [whole, frac = ""] = s.split(".");
  const cents = (frac + "00").slice(0, 2); // auf zwei Stellen auffüllen
  return Number(whole) * 100 + Number(cents);
}

// ---------------------------------------------------------------------------
// Balancierter geschweifter Block ab einem Schlüssel (JS-Objektliteral).
// ---------------------------------------------------------------------------
function braceBlock(s, key) {
  const i = s.indexOf(key);
  if (i < 0) return null;
  let j = s.indexOf("{", i);
  if (j < 0) return null;
  let d = 0, instr = false, esc = false; const st = j;
  for (; j < s.length; j++) {
    const c = s[j];
    if (esc) { esc = false; continue; }
    if (c === "\\") { esc = true; continue; }
    if (c === '"') { instr = !instr; continue; }
    if (instr) continue;
    if (c === "{") d++;
    else if (c === "}") { d--; if (d === 0) return s.slice(st, j + 1); }
  }
  return null;
}

// id_feature → DB-Spalte für die 7 Testwerte (aus currentProduct.features).
// ANDERE Taxonomie als die Finder-Achsen in src/domain/equipment/racket.ts
// (siehe web_rackets.sql) — hier nur Anzeigedaten.
const TESTWERT_COL = { 130: "puissance", 131: "controle", 132: "confort", 133: "prise_deffet", 134: "tolerance", 135: "maniabilite", 136: "stabilite" };
// id_feature → DB-Spalte für die Technik (Fallback-Quelle descriptive_feature_values).
const DESCR_COL = { 108: "weight_g", 103: "balance_cm", 20: "head_size_sqcm", 19: "string_pattern", 22: "stiffness_ra", 126: "inertia", 21: "profile", 129: "twistweight" };
// data-sheet-Label (normalisiert) → DB-Spalte. Primärquelle der Technik;
// enthält zusätzlich Longueur/Recoil Weight/Plow-through (fehlen in descriptive).
const SHEET_COL = {
  "poids non cordee": "weight_g", "equilibre": "balance_cm", "tamis": "head_size_sqcm",
  "plan de cordage": "string_pattern", "rigidite": "stiffness_ra", "inertie": "inertia",
  "profil": "profile", "twistweight": "twistweight", "longueur": "length_cm",
  "recoil weight": "recoil_weight", "plow-through": "plow_through",
};
// Welche Spalte ist Integer (Math.round) vs. numeric (Dezimal) vs. Text?
const INT_COLS = new Set(["weight_g", "head_size_sqcm", "stiffness_ra"]);
const TEXT_COLS = new Set(["string_pattern", "profile"]);
// Alle Technik-Zielspalten (für Vollständigkeits-Statistik).
const TECH_COLS = ["weight_g", "balance_cm", "head_size_sqcm", "string_pattern", "stiffness_ra", "inertia", "profile", "twistweight", "length_cm", "recoil_weight", "plow_through"];
const TEST_COLS = ["puissance", "controle", "confort", "prise_deffet", "tolerance", "maniabilite", "stabilite"];
// Felder, deren Fehlen in der Vollständigkeits-Statistik gezählt wird.
const TRACK_FIELDS = ["brand", "name", "sku", ...TEST_COLS, "score", "price_minor", ...TECH_COLS];

// Einen Technik-Rohwert in den Spaltentyp wandeln.
function coerceTech(col, rawVal) {
  if (rawVal == null) return null;
  if (TEXT_COLS.has(col)) { const t = decodeEntities(rawVal).replace(/\s+/g, " ").trim(); return t || null; }
  if (INT_COLS.has(col)) return toInt(rawVal);
  return toNum(rawVal); // numeric
}

// ---------------------------------------------------------------------------
// Produktseite auslesen → { record (Stamm), claims, missing } oder null.
// ---------------------------------------------------------------------------
function parseProduct(html, id, url) {
  // 1) currentProduct-Objekt (unquoted key). Enthält features + descriptive +
  //    score + price + Name/Hersteller. Die Testwerte gehören NUR hier zum
  //    aktuellen Produkt — die weiteren features-Blöcke auf der Seite sind
  //    Vergleichsprodukte des Komparators und werden bewusst ignoriert.
  const cp = braceBlock(html, "currentProduct:");
  const testVals = {};      // col -> int
  const descrTech = {};     // col -> rawVal
  let scoreRaw = null, priceRaw = null, cpName = null, cpBrand = null;
  if (cp) {
    // features: nur den features-Teilblock nehmen, dann id/value-Paare.
    const fBlock = braceBlockArray(cp, '"features"');
    if (fBlock) for (const m of fBlock.matchAll(/"id_feature"\s*:\s*(\d+)\s*,\s*"value"\s*:\s*"([^"]*)"/g)) {
      const col = TESTWERT_COL[+m[1]]; if (col) { const v = toInt(m[2]); if (v != null) testVals[col] = v; }
    }
    const dBlock = braceBlockArray(cp, '"descriptive_feature_values"');
    if (dBlock) for (const m of dBlock.matchAll(/"id_feature"\s*:\s*(\d+)\s*,\s*"value"\s*:\s*"([^"]*)"/g)) {
      const col = DESCR_COL[+m[1]]; if (col) descrTech[col] = m[2];
    }
    const sm = cp.match(/"score"\s*:\s*([0-9.]+)/); if (sm) scoreRaw = sm[1];
    // Preis-Capture OHNE Komma im Zeichen-Set (sonst würde das nachfolgende
    // Listen-Komma „166.85," mitgefangen → ungültig). price_tax_incl ist ein
    // JS-Number → Punkt-Dezimal; das optionale [.,] deckt trotzdem beide Fälle ab.
    const pm = cp.match(/"price_tax_incl"\s*:\s*"?([0-9]+(?:[.,][0-9]+)?)"?/); if (pm) priceRaw = pm[1];
    const nm = cp.match(/"product_name"\s*:\s*"([^"]*)"/); if (nm) cpName = decodeEntities(nm[1]);
    const mm = cp.match(/"manufacturer_name"\s*:\s*"([^"]*)"/); if (mm) cpBrand = decodeEntities(mm[1]);
  }

  // 2) data-sheet-Liste (Primärquelle Technik).
  const sheet = parseDataSheet(html); // normLabel -> rawValue
  const sheetTech = {};
  for (const [label, col] of Object.entries(SHEET_COL)) {
    if (sheet[label] != null) sheetTech[col] = sheet[label];
  }

  // 3) JSON-LD Product (Identität: name, sku/mpn, brand, priceCurrency).
  const ld = parseJsonLdProduct(html);

  // ---- Felder auflösen -----------------------------------------------------
  const brand = (ld?.brand) || (sheet["marque"] != null ? decodeEntities(sheet["marque"]) : null) || cpBrand || null;
  const name = (ld?.name) || cpName || null;
  const sku = ld?.sku || ld?.mpn || null; // kein Raten: fehlt → NULL
  const priceCurrency = ld?.priceCurrency || null;
  // Preis: currentProduct.price_tax_incl zuerst (inkl. MwSt), sonst JSON-LD offer.price.
  const priceSrc = priceRaw != null ? priceRaw : (ld?.price ?? null);
  const priceMinor = (priceCurrency && priceSrc != null) ? priceToMinor(priceSrc) : null; // ohne Währung kein Preis (Money = Betrag + Währung)
  const score = scoreRaw != null ? toNum(scoreRaw) : null;

  // Technik: data-sheet zuerst, sonst descriptive_feature_values.
  const tech = {};
  for (const col of TECH_COLS) {
    const raw = sheetTech[col] != null ? sheetTech[col] : descrTech[col];
    tech[col] = coerceTech(col, raw);
  }

  // Stamm-Datensatz (web.rackets). Fehlende Felder bleiben null = „nicht gepflegt".
  const record = {
    shop_product_id: Number(id),
    name, brand, sku,
    ...Object.fromEntries(TEST_COLS.map((c) => [c, testVals[c] ?? null])),
    score,
    price_minor: priceMinor,
    price_currency: priceCurrency,
    ...tech,
    product_url: url,
  };

  // Claims je BEFÜLLTEM Feld (Herkunft). Quelle nach Muster extreme-tennis:<id>.
  const source = `extreme-tennis:${id}`;
  const claims = [];
  const claim = (field, value) => { if (value != null) claims.push({ field_name: field, field_value: String(value), source, source_url: url, confidence: CONF_OBSERVED }); };
  for (const f of TRACK_FIELDS) claim(f, record[f]);
  if (priceMinor != null) claim("price_currency", priceCurrency); // Preis kommt mit Währung

  // Welche verfolgten Felder fehlen?
  const missing = TRACK_FIELDS.filter((f) => record[f] == null);

  return { record, claims, missing, hasCurrentProduct: !!cp };
}

// features/descriptive sind Arrays; wir wollen exakt den zugehörigen [...]-Block.
function braceBlockArray(s, key) {
  const i = s.indexOf(key);
  if (i < 0) return null;
  let j = s.indexOf("[", i);
  if (j < 0) return null;
  let d = 0, instr = false, esc = false; const st = j;
  for (; j < s.length; j++) {
    const c = s[j];
    if (esc) { esc = false; continue; }
    if (c === "\\") { esc = true; continue; }
    if (c === '"') { instr = !instr; continue; }
    if (instr) continue;
    if (c === "[") d++;
    else if (c === "]") { d--; if (d === 0) return s.slice(st, j + 1); }
  }
  return null;
}

// data-sheet <dl> → { normLabel: rawValue }.
function parseDataSheet(html) {
  const out = {};
  const i = html.indexOf("data-sheet");
  if (i < 0) return out;
  const dlStart = html.lastIndexOf("<dl", i);
  const end = html.indexOf("</dl>", i);
  if (dlStart < 0 || end < 0) return out;
  const seg = html.slice(dlStart, end);
  for (const m of seg.matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/g)) {
    const label = normLabel(m[1].replace(/<[^>]+>/g, ""));
    const value = decodeEntities(m[2].replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
    if (label) out[label] = value;
  }
  return out;
}

// JSON-LD Product (auch in @graph). Liefert { name, sku, mpn, brand, priceCurrency }.
function parseJsonLdProduct(html) {
  for (const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    let obj;
    try { obj = JSON.parse(m[1]); } catch { continue; }
    const cands = [];
    const push = (o) => { if (o && typeof o === "object") cands.push(o); };
    if (Array.isArray(obj)) obj.forEach(push);
    else { push(obj); if (Array.isArray(obj["@graph"])) obj["@graph"].forEach(push); }
    for (const c of cands) {
      if (c["@type"] === "Product" || (Array.isArray(c["@type"]) && c["@type"].includes("Product"))) {
        const brand = typeof c.brand === "object" ? c.brand?.name : c.brand;
        const offer = Array.isArray(c.offers) ? c.offers[0] : c.offers;
        return {
          name: c.name ? decodeEntities(String(c.name)) : null,
          sku: c.sku ? String(c.sku) : null,
          mpn: c.mpn ? String(c.mpn) : null,
          brand: brand ? decodeEntities(String(brand)) : null,
          priceCurrency: offer?.priceCurrency ? String(offer.priceCurrency) : null,
          // Echte Preisangabe des Angebots (schema.org) — Fallback, wenn die Seite
          // kein currentProduct hat (ältere Modelle ohne Komparator). Kein Ableiten.
          price: offer?.price != null ? String(offer.price) : null,
        };
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// 1) Kategorie durchblättern → (id, url)-Paare sammeln.
// ---------------------------------------------------------------------------
async function collectProducts() {
  const map = new Map(); // id -> url (dedupe über Seiten)
  const perPage = [];
  for (const p of PAGES) {
    const url = `${BASE}${CATEGORY}?page=${p}`;
    let html;
    try { html = await getHtml(url, `cat-${p}.html`); }
    catch (err) { perPage.push({ page: p, count: 0, error: err.message }); continue; }
    let n = 0;
    for (const m of html.matchAll(/<article[^>]*\bdata-id-product="(\d+)"[\s\S]{0,1400}?<a[^>]*class="product-thumbnail"[^>]*href="([^"]+)"/g)) {
      const id = m[1], purl = m[2];
      if (!map.has(id)) { map.set(id, purl); n++; }
    }
    perPage.push({ page: p, count: n, error: null });
    process.stdout.write(`Kategorie Seite ${p}: ${n} Produkte\n`);
  }
  return { map, perPage };
}

// ---------------------------------------------------------------------------
// Verarbeitung (Trockenlauf: nur bauen, nichts schreiben)
// ---------------------------------------------------------------------------
const { map: productMap, perPage } = await collectProducts();
let entries = [...productMap.entries()];
if (LIMIT > 0) entries = entries.slice(0, LIMIT);
console.log(`\nGefundene Produkte gesamt: ${productMap.size}${LIMIT ? ` (verarbeite nur ${entries.length})` : ""}\n`);

const parsed = [];     // { record, claims, missing, hasCurrentProduct }
const fetchErrors = []; // { id, url, error }
const missingCount = Object.fromEntries(TRACK_FIELDS.map((f) => [f, 0]));
let idx = 0;
for (const [id, url] of entries) {
  idx++;
  let html;
  try { html = await getHtml(url, `prod-${id}.html`); }
  catch (err) { fetchErrors.push({ id, url, error: err.message }); continue; }
  const r = parseProduct(html, id, url);
  parsed.push(r);
  for (const f of r.missing) missingCount[f]++;
  if (idx % 25 === 0 || idx === entries.length) console.log(`  ${idx}/${entries.length} verarbeitet (Netz: ${netFetches}, Cache: ${cacheHits})`);
}

const complete = parsed.filter((r) => r.missing.length === 0);
const incomplete = parsed.filter((r) => r.missing.length > 0);
const totalClaims = parsed.reduce((a, r) => a + r.claims.length, 0);

// ---------------------------------------------------------------------------
// Optionaler SCHARFER Lauf (nur mit --write) — Service-Client, RLS-Bypass.
// ---------------------------------------------------------------------------
let writeSummary = null;
if (WRITE) {
  const env = {};
  try {
    for (const line of readFileSync(join(process.cwd(), ".env.local"), "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z_0-9]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch { /* .env.local fehlt → unten Fehler */ }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || `https://${PROJECT_REF}.supabase.co`;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) { console.error("ABBRUCH: SUPABASE_SERVICE_ROLE_KEY nicht in .env.local gefunden."); process.exit(1); }

  const { createClient } = await import("@supabase/supabase-js");
  const svc = createClient(url, key, { db: { schema: "web" }, auth: { persistSession: false, autoRefreshToken: false } });

  let okR = 0, okC = 0, errRacket = 0, errClaim = 0;
  // Fehlergründe VOLLSTÄNDIG erfassen (nicht nur das erste Vorkommen): je Meldung
  // Häufigkeit + Beispiel-ID. Getrennt nach Stamm- und Claim-Phase. Landet in stderr
  // UND im Bericht (§6), damit keine Fehler-Lücke offen bleibt.
  const errDist = new Map(); // msg -> { n, exampleId }
  const bump = (msg, id) => { const e = errDist.get(msg) || { n: 0, exampleId: id }; e.n++; errDist.set(msg, e); };
  for (const { record, claims } of parsed) {
    const { data, error } = await svc.from("rackets")
      .upsert(record, { onConflict: "shop_product_id" }).select("id").single();
    if (error || !data) {
      errRacket++;
      bump("rackets: " + (error?.message || "kein data zurück"), record.shop_product_id);
      continue;
    }
    okR++;
    const rows = claims.map((c) => ({ ...c, racket_id: data.id }));
    const { error: ce } = await svc.from("racket_claims")
      .upsert(rows, { onConflict: "racket_id,field_name,source,field_value", ignoreDuplicates: true });
    if (ce) { errClaim++; bump("racket_claims: " + ce.message, record.shop_product_id); } else okC += rows.length;
  }
  for (const [msg, e] of errDist) console.error(`WRITE-FEHLER ×${e.n} (z. B. id ${e.exampleId}): ${msg}`);
  writeSummary = { okR, okC, errRacket, errClaim,
    errDist: [...errDist.entries()].map(([msg, e]) => ({ msg, n: e.n, exampleId: e.exampleId })) };
}

// ---------------------------------------------------------------------------
// Bericht
// ---------------------------------------------------------------------------
const now = new Date().toISOString();
const md = [];
md.push(`# extreme-tennis.fr → web.rackets — ${WRITE ? "SCHARFER LAUF" : "TROCKENLAUF (nichts geschrieben)"}`);
md.push("");
md.push(`> Erzeugt von \`scripts/extreme-tennis-import.mjs\` · Lauf: ${now}`);
md.push(`> Ziel: web.rackets + web.racket_claims. ${WRITE ? "" : "**Kein DB-Zugriff** in diesem Lauf."}`);
md.push(`> Netz-Abrufe: ${netFetches} · Cache-Treffer: ${cacheHits}${LIMIT ? ` · **--limit=${LIMIT}** (Teilmenge!)` : ""}`);
md.push("");

md.push(`## 1. Übersicht`);
md.push("");
md.push(`| Kennzahl | Wert |`);
md.push(`|---|---:|`);
md.push(`| Gefundene Produkte (Kategorie 8) | ${productMap.size} |`);
md.push(`| Verarbeitet | ${parsed.length} |`);
md.push(`| Abruf-Fehler | ${fetchErrors.length} |`);
md.push(`| Vollständig (kein verfolgtes Feld fehlt) | ${complete.length} |`);
md.push(`| Unvollständig | ${incomplete.length} |`);
md.push(`| Ohne currentProduct (keine Testwerte) | ${parsed.filter((r) => !r.hasCurrentProduct).length} |`);
md.push(`| Claims gesamt | ${totalClaims} |`);
if (writeSummary) md.push(`| **Geschrieben** | ${writeSummary.okR} Schläger, ${writeSummary.okC} Claims (Fehler: ${writeSummary.errRacket} Stamm / ${writeSummary.errClaim} Claims) |`);
md.push("");

md.push(`### Produkte je Kategorieseite`);
md.push("");
md.push(`| Seite | neue Produkte | Fehler |`);
md.push(`|---:|---:|---|`);
for (const s of perPage) md.push(`| ${s.page} | ${s.count} | ${s.error ?? "–"} |`);
md.push("");

md.push(`## 2. Fehlende Felder — wie oft (nicht geglättet)`);
md.push("");
md.push(`| Feld | fehlt bei … Produkten |`);
md.push(`|---|---:|`);
for (const f of TRACK_FIELDS) md.push(`| ${f} | ${missingCount[f]} |`);
md.push("");
md.push(`_Verfolgte Felder: ${TRACK_FIELDS.join(", ")}._`);
md.push("");

md.push(`## 3. Produkte mit unvollständigen Daten`);
md.push("");
if (incomplete.length === 0) md.push(`Keine — alle verarbeiteten Produkte sind vollständig.`);
else {
  md.push(`| shop_product_id | Marke | Name | fehlende Felder |`);
  md.push(`|---|---|---|---|`);
  for (const r of incomplete) {
    const n = (r.record.name || "—").slice(0, 48);
    md.push(`| ${r.record.shop_product_id} | ${r.record.brand ?? "—"} | ${n} | ${r.missing.join(", ")} |`);
  }
}
md.push("");

if (fetchErrors.length) {
  md.push(`## 3b. Abruf-Fehler`);
  md.push("");
  for (const e of fetchErrors) md.push(`- ${e.id} · ${e.url} · ${e.error}`);
  md.push("");
}

if (writeSummary && writeSummary.errDist.length) {
  md.push(`## 3c. Schreibfehler nach Grund (scharfer Lauf)`);
  md.push("");
  md.push(`| Häufigkeit | Beispiel-id | Meldung |`);
  md.push(`|---:|---|---|`);
  for (const e of writeSummary.errDist.sort((a, b) => b.n - a.n)) md.push(`| ${e.n} | ${e.exampleId} | ${e.msg} |`);
  md.push("");
}

md.push(`## 4. Stichprobe: 10 Schläger — Stamm (web.rackets) + Claims (Herkunft)`);
md.push("");
md.push(`Der Stamm bekommt die aufgelösten Werte direkt (Einzelquelle); die Claims spiegeln`);
md.push(`je Feld die Herkunft (Quelle \`extreme-tennis:<id>\`, Produktadresse, confidence ${CONF_OBSERVED}).`);
md.push("");
for (const r of parsed.slice(0, 10)) {
  md.push(`### ${r.record.shop_product_id} — ${r.record.brand ?? "?"} ${r.record.name ?? ""}`.trim());
  md.push("```json");
  md.push("// web.rackets");
  md.push(JSON.stringify(r.record, null, 2));
  md.push(`// web.racket_claims (${r.claims.length} Claims — erste 6)`);
  md.push(JSON.stringify(r.claims.slice(0, 6), null, 2));
  md.push("```");
  md.push("");
}

md.push(`## 5. Hinweise`);
md.push("");
md.push(`- **Trockenlauf ist Voreinstellung.** Ohne \`--write\` wird keine DB-Verbindung geöffnet. Scharf: \`node scripts/extreme-tennis-import.mjs --write\`.`);
md.push(`- **Idempotenz** (scharf): Stamm \`upsert onConflict shop_product_id\`; Claims \`upsert onConflict (racket_id,field_name,source,field_value) ignoreDuplicates\`.`);
md.push(`- **Datenquellen je Feld:** Testwerte (130–136) + Score + Preis aus \`currentProduct\`; Technik primär aus \`data-sheet\`, Fallback \`descriptive_feature_values\` (BEIDE gelesen). Marke/Name/SKU aus JSON-LD mit Fallback (data-sheet „Marque" / \`manufacturer_name\`).`);
md.push(`- **Preis** in Minor Units (Cent), ganzzahlig per String-Zerlegung (kein Fließkomma). Ohne belegte Währung (JSON-LD \`priceCurrency\`) wird **kein** Preis gesetzt.`);
md.push(`- **Kein Raten:** Fehlt ein Feld auf der Seite, bleibt es \`null\` = „nicht gepflegt" — es wird nichts abgeleitet.`);
md.push(`- **Taxonomie-Hinweis:** Die 7 Testwerte sind NICHT die Finder-Achsen aus \`src/domain/equipment/racket.ts\` — nur Anzeigedaten (siehe \`supabase/web_rackets.sql\`).`);
md.push(`- **Cache:** Rohantworten unter \`scripts/.et-cache/\`; ein zweiter Lauf ruft nicht erneut ab.`);
md.push("");

const out = md.join("\n");
writeFileSync(join(__dirname, "extreme-tennis-import-report.md"), out, "utf8");
try { writeFileSync(join(homedir(), "Downloads", "extreme-tennis-import-report.md"), out, "utf8"); } catch { /* Downloads optional */ }
console.log(`\n${WRITE ? "SCHARF" : "TROCKENLAUF"} · gefunden=${productMap.size} verarbeitet=${parsed.length} vollständig=${complete.length} unvollständig=${incomplete.length} claims=${totalClaims}`);
console.log(`Bericht: scripts/extreme-tennis-import-report.md (+ ~/Downloads)`);
