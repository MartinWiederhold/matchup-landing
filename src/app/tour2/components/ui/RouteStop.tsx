import Link from "next/link";

/**
 * Routenstop — ein einzelner Halt in der horizontalen Saisonroute. Anders als
 * die Turnierzeile hat dieser Baustein einen expliziten Zustand: vergangen,
 * aktuell (der als Nächstes bespielte Stop), geplant oder mit verpasster
 * Meldefrist.
 *
 * Wahlweise als Link (`href`) oder als Button mit Rückruf (`onClick`) — der
 * Aufrufer entscheidet, ob ein Klick zum Detail-Screen navigiert oder z. B.
 * lokal die Detailschublade öffnet. Beschriftungen der Zustände kommen als
 * Props (`labels`) — der Baustein selbst führt keinen festen Text.
 *
 * NICHT für allgemeine Turnier-Listen — dafür ist TournamentRow da.
 */
export type RouteStopState = "past" | "current" | "planned" | "missed";

export type RouteStopLabels = Record<RouteStopState, string>;

export type RouteStopProps = {
  date: string;               // vorformatiert
  category: string | null;
  city: string;
  countryLabel: string | null;
  state: RouteStopState;
  labels: RouteStopLabels;    // i18n-Text pro Zustand
  href?: string;              // wenn gesetzt: Link
  onClick?: () => void;       // sonst / oder gemeinsam: Klick-Rückruf
  active?: boolean;           // z. B. wenn der Detail-Drawer für diesen Stop offen ist
};

const STATE_COLORS: Record<RouteStopState, string> = {
  missed:  "var(--t2-state-deadline-missed)",
  past:    "var(--t2-text-faint)",
  current: "var(--t2-accent)",
  planned: "var(--t2-text-soft)",
};

export function RouteStop({ href, onClick, date, category, city, countryLabel, state, labels, active }: RouteStopProps) {
  const ring = state === "current" || active
    ? "ring-2 ring-[var(--t2-state-stop-current)] ring-offset-2 ring-offset-[var(--t2-surface)]"
    : "";
  const dim = state === "past" ? "opacity-40" : state === "missed" ? "opacity-70" : "";
  const border = state === "missed" ? "border-[var(--t2-state-deadline-missed)]" : "border-[var(--t2-line)]";
  const label = { text: labels[state], color: STATE_COLORS[state] };

  const body = (
    <>
      <p className="t2-fs-meta tabular-nums text-[var(--t2-text-soft)]">{date}</p>
      <p className="t2-label mt-1" style={{ color: label.color }}>{label.text}</p>
      <p className="mt-1 truncate t2-fs-body-sm font-semibold text-[var(--t2-text)]">{city}</p>
      <p className="mt-0.5 truncate t2-fs-micro text-[var(--t2-text-soft)]">
        {[category, countryLabel].filter(Boolean).join(" · ")}
      </p>
    </>
  );

  const cls = `relative block w-[9.5rem] rounded-[var(--t2-radius-sm)] border ${border} ${ring}
               bg-[var(--t2-surface)] px-3 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--t2-accent)]`;

  return (
    <div className={dim}>
      {href ? (
        <Link href={href} onClick={onClick} className={cls}>{body}</Link>
      ) : (
        <button type="button" onClick={onClick} className={cls}>{body}</button>
      )}
    </div>
  );
}
