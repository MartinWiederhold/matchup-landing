import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Turnierzeile — eine anklickbare Zeile für Listen und Suchergebnisse.
 * Datum, Kategorie, Ort, Land und Belag stehen kompakt nebeneinander.
 * Klick geht auf den Detail-Screen (href).
 *
 * NICHT für die Saison-Route nehmen (dort ist es ein RouteStop mit anderer
 * Zustandslogik) und nicht für Fristen (DeadlineRow).
 */
export type TournamentRowProps = {
  href: string;
  date: string;               // vorformatiert (Aufrufer bestimmt Locale)
  category: string | null;
  city: string;
  countryLabel: string | null;
  surface?: string | null;
  right?: ReactNode;          // rechte Zusatzinfo (z. B. Preisgeld, Distanz)
};

export function TournamentRow({ href, date, category, city, countryLabel, surface, right }: TournamentRowProps) {
  return (
    <Link
      href={href}
      className="group grid items-baseline gap-x-4 gap-y-1 border-b border-[var(--t2-line)] py-3
                 grid-cols-[6rem_1fr_auto] outline-none focus-visible:ring-2 focus-visible:ring-[var(--t2-accent)] focus-visible:rounded-[var(--t2-radius-sm)]"
    >
      <span className="t2-fs-body-sm font-semibold tabular-nums text-[var(--t2-text-soft)]">{date}</span>
      <span className="min-w-0">
        <span className="block truncate t2-fs-body font-semibold text-[var(--t2-text)] group-hover:text-[var(--t2-accent)]">{city}</span>
        <span className="mt-0.5 block truncate t2-fs-micro text-[var(--t2-text-soft)]">
          {[category, countryLabel, surface].filter(Boolean).join(" · ")}
        </span>
      </span>
      <span className="shrink-0 justify-self-end t2-fs-body-sm text-[var(--t2-text-soft)]">{right}</span>
    </Link>
  );
}
