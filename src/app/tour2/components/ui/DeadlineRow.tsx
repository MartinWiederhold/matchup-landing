import Link from "next/link";
import { deadlineCountdown } from "@/domain/tour/deadlineCountdown";

/**
 * Fristzeile — was steht an, für welches Turnier, wann läuft die Frist ab.
 * Der Countdown-Text wird über die vorhandene deadlineCountdown-Funktion
 * bestimmt (Etappe 1); der Aufrufer liefert die Deadline in ms und den
 * heutigen asOfMs. Farbe der Countdown-Pille ergibt sich aus dem Zustand.
 *
 * NICHT als generische Zeile für Ergebnisse oder Turnier-Listen nehmen.
 */
export type DeadlineRowProps = {
  href: string;
  what: string;              // z. B. „Meldeschluss"
  tournamentName: string;    // z. B. „Adana"
  deadlineMs: number;
  asOfMs: number;
  labels: { past: string; today: string; future: (d: number) => string };
};

export function DeadlineRow({ href, what, tournamentName, deadlineMs, asOfMs, labels }: DeadlineRowProps) {
  const c = deadlineCountdown(deadlineMs, asOfMs);
  const text = c.kind === "past" ? labels.past : c.kind === "same-day" ? labels.today : labels.future(c.days);
  const badge =
    c.kind === "past" ? { fg: "var(--t2-state-deadline-missed)", bg: "var(--t2-danger-surface)" }
      : c.kind === "same-day" ? { fg: "var(--t2-state-deadline-soon)", bg: "var(--t2-warn-surface)" }
        : c.days <= 7 ? { fg: "var(--t2-state-deadline-soon)", bg: "var(--t2-warn-surface)" }
          : { fg: "var(--t2-text-soft)", bg: "var(--t2-surface-muted)" };
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 border-b border-[var(--t2-line)] py-3
                 outline-none focus-visible:ring-2 focus-visible:ring-[var(--t2-accent)] focus-visible:rounded-[var(--t2-radius-sm)]"
    >
      <span className="min-w-0">
        <span className="block truncate t2-fs-body font-semibold text-[var(--t2-text)]">{what} · {tournamentName}</span>
      </span>
      <span
        className="shrink-0 rounded-full px-2 py-0.5 t2-fs-meta font-semibold tabular-nums"
        style={{ color: badge.fg, background: badge.bg }}
      >
        {text}
      </span>
    </Link>
  );
}
