import { formatDistanceKm } from "@/domain/tour/formatDistance";

/**
 * Distanz — Kilometer-Anzeige mit einheitlicher Rundung (unter 10 km eine
 * Nachkommastelle, sonst ganze Kilometer). Die Rundung liegt in
 * src/domain/tour/formatDistance und ist Vitest-getestet.
 *
 * NICHT für Zeit- oder Preis-Angaben; ausschließlich Distanzen.
 */
export type DistanceProps = {
  km: number;
  locale?: string;
  className?: string;
};

export function Distance({ km, locale, className = "" }: DistanceProps) {
  return <span className={`tabular-nums ${className}`}>{formatDistanceKm(km, locale)}</span>;
}
