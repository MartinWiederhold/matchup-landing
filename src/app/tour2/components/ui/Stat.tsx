import type { ReactNode } from "react";

/**
 * Kennzahl — großer Wert mit Beschriftung. Optional ein Verlauf zum Vormonat
 * oder Vorwoche als kleiner farbiger Delta-Anhang. Ziffern sind tabellarisch,
 * damit die Zahl beim Aktualisieren nicht springt.
 *
 * NICHT für Fließtext oder mehrere gleichrangige Zahlen nebeneinander nehmen —
 * dafür lieber eine Datentabelle (DataTable).
 */
export type StatSize = "hero" | "normal";
export type StatDeltaKind = "up" | "down" | "flat";

export type StatProps = {
  label: string;
  value: ReactNode;
  size?: StatSize;
  delta?: { kind: StatDeltaKind; text: string };
  note?: ReactNode;
};

export function Stat({ label, value, size = "normal", delta, note }: StatProps) {
  const valueClass = size === "hero" ? "t2-fs-display font-semibold" : "t2-fs-h1 font-semibold";
  const deltaColor =
    delta?.kind === "up" ? "text-[var(--t2-success)]"
      : delta?.kind === "down" ? "text-[var(--t2-danger)]"
        : "text-[var(--t2-text-soft)]";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <div className={`${valueClass} tabular-nums tracking-[-0.03em] text-[var(--t2-text)]`}>{value}</div>
        {delta && (
          <span className={`t2-fs-body-sm font-semibold tabular-nums ${deltaColor}`}>{delta.text}</span>
        )}
      </div>
      <p className="mt-1 t2-label">{label}</p>
      {note && <div className="mt-2 t2-fs-body-sm leading-relaxed text-[var(--t2-text-soft)]">{note}</div>}
    </div>
  );
}
