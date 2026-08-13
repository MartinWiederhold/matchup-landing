/**
 * Client-Hilfe für die Wohnort-/Startpunkt-Suche in /tour. Ruft die eigene Serverroute
 * /api/geo (Nominatim-Proxy mit User-Agent + Cache) — NICHT direkt Nominatim. Der Aufrufer
 * ruft ENTPRELLT auf (~400 ms nach Tippende), damit nicht pro Tastendruck angefragt wird.
 */
export type GeoHit = { name: string; country: string | null; lat: number; lng: number };

export async function geocodeCity(q: string, countryBias?: string | null): Promise<GeoHit[]> {
  if (q.trim().length < 3) return [];
  const p = new URLSearchParams({ q: q.trim() });
  if (countryBias) p.set("cc", countryBias);
  try {
    const r = await fetch(`/api/geo?${p.toString()}`);
    if (!r.ok) return [];
    const d = (await r.json()) as { hits?: GeoHit[] };
    return d.hits ?? [];
  } catch {
    return [];
  }
}
