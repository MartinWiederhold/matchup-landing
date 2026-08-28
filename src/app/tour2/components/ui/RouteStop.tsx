import Link from "next/link";

/**
 * Routenstop — ein einzelner Halt in der horizontalen Saisonroute. Anders als
 * die Turnierzeile hat dieser Baustein einen expliziten Zustand: vergangen,
 * aktuell (der als Nächstes bespielte Stop), geplant oder mit verpasster
 * Meldefrist. Klick geht auf den Turnier-Detail-Screen.
 *
 * NICHT für allgemeine Turnier-Listen — dafür ist TournamentRow da.
 */
export type RouteStopState = "past" | "current" | "planned" | "missed";

export type RouteStopProps = {
  href: string;
  date: string;          // vorformatiert
  category: string | null;
  city: string;
  countryLabel: string | null;
  state: RouteStopState;
};

export function RouteStop({ href, date, category, city, countryLabel, state }: RouteStopProps) {
  const ring =
    state === "current" ? "ring-2 ring-[var(--t2-state-stop-current)] ring-offset-2 ring-offset-[var(--t2-surface)]"
      : "";
  const dim = state === "past" ? "opacity-40" : state === "missed" ? "opacity-70" : "";
  const border = state === "missed" ? "border-[var(--t2-state-deadline-missed)]" : "border-[var(--t2-line)]";
  const label =
    state === "missed" ? { text: "Frist verpasst", color: "var(--t2-state-deadline-missed)" }
      : state === "past" ? { text: "vergangen", color: "var(--t2-text-faint)" }
        : state === "current" ? { text: "als Nächstes", color: "var(--t2-accent)" }
          : { text: "geplant", color: "var(--t2-text-soft)" };
  return (
    <div className={dim}>
      <Link
        href={href}
        className={`relative block w-[9.5rem] rounded-[var(--t2-radius-sm)] border ${border} ${ring}
                    bg-[var(--t2-surface)] px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--t2-accent)]`}
      >
        <p className="t2-fs-meta tabular-nums text-[var(--t2-text-soft)]">{date}</p>
        <p className="t2-label mt-1" style={{ color: label.color }}>{label.text}</p>
        <p className="mt-1 truncate t2-fs-body-sm font-semibold text-[var(--t2-text)]">{city}</p>
        <p className="mt-0.5 truncate t2-fs-micro text-[var(--t2-text-soft)]">
          {[category, countryLabel].filter(Boolean).join(" · ")}
        </p>
      </Link>
    </div>
  );
}
