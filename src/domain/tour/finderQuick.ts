/**
 * Schnellfilter für den Tournament Finder. Reine Funktionen, keine Uhr,
 * keine DB — nowMs/todayISO kommen vom Aufrufer.
 *
 * „Auf meiner Route“: näher als ON_ROUTE_KM an einem bereits geplanten Stopp.
 * 60 km ist derselbe Schwellenwert wie im Turnier-Import
 * (`src/app/api/sync/tournaments/route.ts`, gleiche Stadt beim Geocoding).
 */
import { haversineKm } from "@/lib/utils/haversine";
import { tourDeadlines } from "./deadlines";
import type { TourTournament } from "@/lib/types";

function placeKey(country: string | null, city: string | null): string | null {
  if (!city) return null;
  return `${country ?? ""}|${city}`;
}

export const ON_ROUTE_KM = 60;
const DAY = 86_400_000;

export type FinderCircuit = "itf_m" | "itf_w" | "juniors" | "challenger" | "wta";

/** Serie/Geschlecht aus belegten Feldern. Unbekannt → null, nicht geraten. */
export function finderCircuit(tt: Pick<TourTournament, "series" | "category" | "source_ref">): FinderCircuit | null {
  if (tt.series === "itf_juniors") return "juniors";
  if (tt.series === "challenger") return "challenger";
  if (tt.series === "wta") return "wta";
  const cat = (tt.category ?? "").trim();
  if (/^W/i.test(cat)) return "itf_w";
  if (/^M/i.test(cat)) return "itf_m";
  const ref = tt.source_ref.toLowerCase();
  if (ref.includes("w-itf") || ref.startsWith("itf:w-")) return "itf_w";
  if (ref.includes("m-itf") || ref.startsWith("itf:m-")) return "itf_m";
  return null;
}

export function addUtcDays(isoDay: string, days: number): string {
  return new Date(Date.parse(isoDay + "T00:00:00Z") + days * DAY).toISOString().slice(0, 10);
}

export function isNextNWeeks(monday: string, todayISO: string, weeks: number): boolean {
  if (monday < todayISO) return false;
  return monday < addUtcDays(todayISO, weeks * 7);
}

export function isOnMyRoute(
  tt: Pick<TourTournament, "latitude" | "longitude">,
  season: Pick<TourTournament, "latitude" | "longitude">[],
  maxKm = ON_ROUTE_KM,
): boolean {
  if (tt.latitude == null || tt.longitude == null) return false;
  for (const s of season) {
    if (s.latitude == null || s.longitude == null) continue;
    if (haversineKm(tt.latitude, tt.longitude, s.latitude, s.longitude) <= maxKm) return true;
  }
  return false;
}

/** Gleicher Ort wie ein geplanter Stopp → keine Extra-Anreise in der Kette. */
export function isLowTravelCost(
  tt: Pick<TourTournament, "country" | "city">,
  season: Pick<TourTournament, "country" | "city">[],
): boolean {
  const key = placeKey(tt.country, tt.city);
  if (!key) return false;
  return season.some((s) => placeKey(s.country, s.city) === key);
}

export function venueCounts(rows: Pick<TourTournament, "country" | "city">[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = placeKey(r.country, r.city);
    if (!k) continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

export function isClusterVenue(tt: Pick<TourTournament, "country" | "city">, counts: Map<string, number>): boolean {
  const k = placeKey(tt.country, tt.city);
  return k != null && (counts.get(k) ?? 0) >= 2;
}

/** Meldeschluss bekannt und noch nicht vorbei. */
export function isDeadlineOpen(tt: Pick<TourTournament, "tournament_monday" | "series" | "category">, nowMs: number): boolean {
  const dl = tourDeadlines(new Date(tt.tournament_monday + "T00:00:00Z"), tt.series, tt.category);
  return dl.entry != null && dl.entry.getTime() > nowMs;
}

export function entryDeadlineMs(tt: Pick<TourTournament, "tournament_monday" | "series" | "category">): number | null {
  const dl = tourDeadlines(new Date(tt.tournament_monday + "T00:00:00Z"), tt.series, tt.category);
  return dl.entry ? dl.entry.getTime() : null;
}
