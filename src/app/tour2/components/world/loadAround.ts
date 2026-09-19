/**
 * Umgebung einer Welt: OSM-POIs + Matchup-Anbieter. Nur echte Koordinaten.
 */

import { loadProvidersNearCoords } from "@/lib/services";
import type { SiteWorld } from "@/domain/tour/siteWorld";

export type AroundKind = "fitness" | "physio" | "stringer" | "food" | "shop";
export type AroundHit = { name: string; kind: AroundKind; lat: number; lng: number; dist: number };

type PoiBag = Partial<Record<string, { name: string; lat: number; lng: number; dist: number }[]>>;

export async function loadAround(world: SiteWorld): Promise<AroundHit[]> {
  const { lat, lng } = world.origin;
  const [pois, providers] = await Promise.all([
    fetch(`/api/pois?lat=${lat}&lng=${lng}`).then((r) => r.json() as Promise<{ categories: PoiBag | null }>).catch(() => ({ categories: null })),
    loadProvidersNearCoords(lat, lng, 8).catch(() => []),
  ]);
  const out: AroundHit[] = [];
  const cats = pois.categories;
  if (cats) {
    const take = (key: string, kind: AroundKind) => {
      for (const row of (cats[key] ?? []).slice(0, 3)) {
        out.push({ name: row.name, kind, lat: row.lat, lng: row.lng, dist: row.dist });
      }
    };
    take("fitness", "fitness");
    take("physio", "physio");
    take("stringer", "shop");
    take("food", "food");
  }
  for (const p of providers.filter((x) => x.category === "stringer" || x.category === "physio").slice(0, 4)) {
    if (p.latitude == null || p.longitude == null) continue;
    out.push({
      name: p.name,
      kind: p.category === "stringer" ? "stringer" : "physio",
      lat: p.latitude,
      lng: p.longitude,
      dist: Math.round(p.distance_km * 1000),
    });
  }
  out.sort((a, b) => a.dist - b.dist);
  const seen = new Set<string>();
  return out.filter((h) => {
    if (h.dist > 2500) return false;
    const k = `${h.name}|${h.kind}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
