/**
 * Eine Turnier-Welt: handgezeichnetes Gelände + benannte Knoten.
 * Keine erfundenen Gehminuten, keine Court-Zuteilung, kein Wetter.
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
  | "landmark";

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
};

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
