/**
 * Eine Turnier-Welt: handgezeichnetes Gelände + benannte Knoten.
 * Keine erfundenen Gehminuten, keine Court-Zuteilung.
 * Wetter liegt in siteWeather: aktuelles Open-Meteo am Ursprung, keine 2027-Vorhersage.
 * Eine Welt greift nur, wenn der Matcher am Turnier anschlägt oder die
 * Welt ausdrücklich gewählt wird.
 */

export type SiteNodeKind =
  | "center"
  | "court"
  | "practice"
  | "stringer"
  | "player"
  | "gate"
  | "transit"
  | "landmark"
  | "restroom"
  | "firstaid"
  | "water"
  | "info"
  | "access"
  | "baggage"
  | "lostfound"
  | "atm"
  | "charger"
  | "boxoffice";

export const AMENITY_KINDS: ReadonlySet<SiteNodeKind> = new Set([
  "restroom",
  "firstaid",
  "water",
  "info",
  "access",
  "baggage",
  "lostfound",
  "atm",
  "charger",
  "boxoffice",
]);

export const SERVICE_KINDS: ReadonlySet<SiteNodeKind> = new Set([
  "info",
  "baggage",
  "lostfound",
  "atm",
  "charger",
  "boxoffice",
]);

export function isAmenityKind(kind: SiteNodeKind): boolean {
  return AMENITY_KINDS.has(kind);
}

export type SiteNodeFlag = "accessible" | "nursing" | "wheelchairSeating";

export type SiteNode = {
  id: string;
  kind: SiteNodeKind;
  name: string;
  /** Szene: x nach Osten, z nach Süden, y nach oben (Meter). */
  x: number;
  y: number;
  z: number;
  lat?: number;
  lng?: number;
  source: string;
  sourceUrl?: string;
  flags?: SiteNodeFlag[];
};

export function nodeHasFlag(node: SiteNode, flag: SiteNodeFlag): boolean {
  return node.flags?.includes(flag) === true;
}

export type SitePath = { from: string; to: string };

export type SiteWorld = {
  id: string;
  title: string;
  year: number;
  origin: { lat: number; lng: number };
  nodes: SiteNode[];
  paths: SitePath[];
  match: { nameIncludes: string[]; sourceRefIncludes: string[] };
};

export type SiteTournamentHint = {
  name: string | null;
  source_ref: string;
  city: string | null;
};

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function worldMatchesTournament(world: SiteWorld, t: SiteTournamentHint): boolean {
  const name = norm(t.name ?? "");
  const ref = norm(t.source_ref);
  if (world.match.nameIncludes.some((n) => name.includes(norm(n)))) return true;
  if (world.match.sourceRefIncludes.some((n) => ref.includes(norm(n)))) return true;
  return false;
}

export function nodeById(world: SiteWorld, id: string): SiteNode | null {
  return world.nodes.find((n) => n.id === id) ?? null;
}

/** Kürzester Weg über die angegebenen Kanten (Knoten-IDs). Leer, wenn unverbunden. */
export function pathBetween(world: SiteWorld, from: string, to: string): string[] {
  if (from === to) return nodeById(world, from) ? [from] : [];
  const adj = new Map<string, string[]>();
  for (const n of world.nodes) adj.set(n.id, []);
  for (const p of world.paths) {
    adj.get(p.from)?.push(p.to);
    adj.get(p.to)?.push(p.from);
  }
  const q: string[] = [from];
  const prev = new Map<string, string | null>([[from, null]]);
  while (q.length) {
    const cur = q.shift() as string;
    if (cur === to) break;
    for (const nxt of adj.get(cur) ?? []) {
      if (prev.has(nxt)) continue;
      prev.set(nxt, cur);
      q.push(nxt);
    }
  }
  if (!prev.has(to)) return [];
  const out: string[] = [];
  let walk: string | null = to;
  while (walk) {
    out.push(walk);
    walk = prev.get(walk) ?? null;
  }
  return out.reverse();
}

/** OSM/Anbieter-Punkt auf die Szene: Osten = +x, Norden = −z. */
export function projectAround(
  world: SiteWorld,
  lat: number,
  lng: number,
): { x: number; z: number; meters: number } {
  const dLat = (lat - world.origin.lat) * 110_540;
  const dLng = (lng - world.origin.lng) * 111_320 * Math.cos((world.origin.lat * Math.PI) / 180);
  const x = dLng;
  const z = -dLat;
  return { x, z, meters: Math.round(Math.hypot(dLat, dLng)) };
}

const CAMPUS_M = 420;

export function isOnCampus(world: SiteWorld, lat: number, lng: number): boolean {
  return projectAround(world, lat, lng).meters <= CAMPUS_M;
}

/** Gebäude-Radius in der Szene — Besucher laufen außen rum, nicht durchs Stadion. */
const FOOTPRINT: Record<string, number> = {
  ashe: 48,
  armstrong: 34,
  grandstand: 28,
  court17: 26,
  "citi-field": 46,
  "nys-pavilion": 18,
  practice: 40,
};

export function footprintRadius(node: SiteNode): number {
  if (FOOTPRINT[node.id] != null) return FOOTPRINT[node.id];
  if (node.kind === "court" && /^court\d+$/.test(node.id)) return 16;
  return 0;
}

export function pushOffFootprints(world: SiteWorld, x: number, z: number): { x: number; z: number } {
  let px = x;
  let pz = z;
  for (let pass = 0; pass < 3; pass++) {
    for (const n of world.nodes) {
      const r = footprintRadius(n);
      if (r <= 0) continue;
      const dx = px - n.x;
      const dz = pz - n.z;
      const d = Math.hypot(dx, dz);
      if (d >= r) continue;
      if (d < 0.05) {
        pz = n.z + r + 0.9;
        continue;
      }
      const k = (r + 0.9) / d;
      px = n.x + dx * k;
      pz = n.z + dz * k;
    }
  }
  return { x: px, z: pz };
}
