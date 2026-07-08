import { NextResponse } from "next/server";

export const maxDuration = 30;

/**
 * POIs rund um einen Turnierort aus OpenStreetMap (Overpass API, öffentlich, kein Key).
 *   /api/pois?lat=48.85&lng=2.35
 * Antwort: { categories: { food, physio, fitness, pharmacy, supermarket } } je [{ name, lat, lng, dist }].
 * Upstream-Fetch ist 7 Tage gecacht (Orte ändern sich kaum) → schnell + schont Overpass.
 */
const UA = { "User-Agent": "MatchupMap/1.0 (wiederhold.martin@web.de)" };
const RADIUS = 3000; // Meter

type Cat = "food" | "physio" | "fitness" | "pharmacy" | "supermarket";
type Tags = Record<string, string>;
type El = { type: string; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Tags };

function haversineM(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function categorize(t: Tags): Cat | null {
  if (t.amenity === "restaurant" || t.amenity === "cafe") return "food";
  if (t.healthcare === "physiotherapist" || t.amenity === "physiotherapist") return "physio";
  if (t.leisure === "fitness_centre" || t.leisure === "sports_centre") return "fitness";
  if (t.amenity === "pharmacy") return "pharmacy";
  if (t.shop === "supermarket") return "supermarket";
  return null;
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const lat = parseFloat(u.searchParams.get("lat") ?? "");
  const lng = parseFloat(u.searchParams.get("lng") ?? "");
  if (!isFinite(lat) || !isFinite(lng)) return NextResponse.json({ categories: null });

  const q = `[out:json][timeout:25];(nwr(around:${RADIUS},${lat},${lng})[amenity~"^(restaurant|cafe)$"];nwr(around:${RADIUS},${lat},${lng})[healthcare=physiotherapist];nwr(around:${RADIUS},${lat},${lng})[leisure~"^(fitness_centre|sports_centre)$"];nwr(around:${RADIUS},${lat},${lng})[amenity=pharmacy];nwr(around:${RADIUS},${lat},${lng})[shop=supermarket];);out center tags 150;`;
  const MIRRORS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
  ];

  try {
    let data: { elements?: El[] } | null = null;
    for (const base of MIRRORS) {
      try {
        const r = await fetch(`${base}?data=${encodeURIComponent(q)}`, {
          headers: { ...UA, Accept: "application/json" },
          next: { revalidate: 604800 }, // 7 Tage
        });
        if (!r.ok) continue;
        data = (await r.json()) as { elements?: El[] };
        break;
      } catch {
        // nächster Mirror
      }
    }
    if (!data) return NextResponse.json({ categories: null });
    const cats: Record<Cat, { name: string; lat: number; lng: number; dist: number }[]> = {
      food: [], physio: [], fitness: [], pharmacy: [], supermarket: [],
    };
    for (const el of data.elements ?? []) {
      const tags = el.tags;
      if (!tags?.name) continue;
      const c = categorize(tags);
      if (!c) continue;
      const eLat = el.lat ?? el.center?.lat;
      const eLng = el.lon ?? el.center?.lon;
      if (eLat == null || eLng == null) continue;
      cats[c].push({ name: tags.name, lat: eLat, lng: eLng, dist: Math.round(haversineM(lat, lng, eLat, eLng)) });
    }
    // je Kategorie: nach Entfernung, Top 6, Duplikatnamen raus
    for (const c of Object.keys(cats) as Cat[]) {
      const seen = new Set<string>();
      cats[c] = cats[c]
        .sort((a, b) => a.dist - b.dist)
        .filter((p) => (seen.has(p.name) ? false : (seen.add(p.name), true)))
        .slice(0, 6);
    }
    return NextResponse.json({ categories: cats });
  } catch {
    return NextResponse.json({ categories: null });
  }
}
