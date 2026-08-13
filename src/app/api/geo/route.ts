import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

/**
 * Geocoder-Proxy für die Wohnort-/Startpunkt-Suche in /tour. Wir gehen NICHT direkt
 * aus dem Client an Nominatim (wie /app es tut) — das verstößt gegen die Richtlinie
 * (max. 1 Req/s, KEIN Autocomplete pro Tastendruck, gültiger User-Agent). Stattdessen:
 *   - EINE Server-Route mit aussagekräftigem User-Agent (Kontakt),
 *   - kurzer In-Memory-Cache je warmer Instanz + HTTP-revalidate (weniger Anfragen),
 *   - der Client ruft entprellt auf (~400 ms nach Tippende, in geocodeCity/SeasonWorkspace).
 *
 * Antwort: { hits: [{ name, country, lat, lng }] } — normalisierte Städte, nie hart aus.
 */
const UA = "MatchupTour/1.0 (+https://matchup-app.com; wiederhold.martin@web.de)";
type GeoHit = { name: string; country: string | null; lat: number; lng: number };

const TTL = 10 * 60 * 1000; // 10 Min
const cache = new Map<string, { at: number; hits: GeoHit[] }>();

/** Stadtname aus Nominatim-Adresse (Stadt > Ort > Dorf > Gemeinde > Kreis), sonst display_name-Kopf. */
function cityName(a: Record<string, string> | undefined, fallback: string): string {
  if (a) {
    const c = a.city || a.town || a.village || a.municipality || a.county;
    if (c) return c;
  }
  return (fallback || "").split(",")[0].trim();
}

async function nominatim(url: string): Promise<unknown[]> {
  try {
    // next.revalidate: HTTP-Cache auf der Serverseite (zusätzlich zum In-Memory-Cache).
    const r = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "en" }, next: { revalidate: 600 } });
    if (!r.ok) return [];
    return (await r.json()) as unknown[];
  } catch {
    return [];
  }
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const q = (u.searchParams.get("q") ?? "").trim();
  const cc = (u.searchParams.get("cc") ?? "").trim().toLowerCase();
  if (q.length < 3) return NextResponse.json({ hits: [] });

  const key = `${cc}|${q.toLowerCase()}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return NextResponse.json({ hits: hit.hits });

  // GLOBAL suchen (Nominatim rankt nach Bedeutung → "zurich" ⇒ Zürich CH). Das Wohnland
  // wird NICHT als harter Filter (countrycodes) genutzt — das lieferte für "zurich" in AE
  // den Müll-Treffer "Sharjah und verhinderte den echten Ort. Land wirkt nur als WEICHE
  // Sortier-Präferenz nach dem Abruf (eine Anfrage, kein Garbage-in-Country-zuerst).
  const base = "https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=8";
  const raw = await nominatim(`${base}&q=${encodeURIComponent(q)}`);

  const seen = new Set<string>();
  const hits: GeoHit[] = [];
  for (const x of raw as Array<Record<string, unknown>>) {
    const lat = Number(x.lat), lng = Number(x.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const addr = x.address as Record<string, string> | undefined;
    const name = cityName(addr, String(x.display_name ?? x.name ?? ""));
    const country = addr?.country_code ? addr.country_code.toUpperCase() : null;
    const k = `${country}|${name.toLowerCase()}`;
    if (!name || seen.has(k)) continue;
    seen.add(k);
    hits.push({ name, country, lat, lng });
    if (hits.length >= 6) break;
  }
  // Weiche Präferenz: Treffer im Wohnland zuerst (stabile Sortierung erhält die Bedeutungs-
  // Reihenfolge sonst). Bei "zurich"/cc=ae kein AE-Treffer → Zürich bleibt vorn.
  if (cc) hits.sort((a, b) => (a.country?.toLowerCase() === cc ? 0 : 1) - (b.country?.toLowerCase() === cc ? 0 : 1));

  cache.set(key, { at: Date.now(), hits });
  return NextResponse.json({ hits });
}
