import type { ReactNode } from "react";

/**
 * Statusmarke — kleine Pille, die einen Zustand ausdrückt. Kein Text-Label
 * fest verdrahtet; der Aufrufer gibt beides mit (Zustand + i18n-Text). Nutzt
 * ausschließlich die Zustands-Tokens aus Etappe 1.
 *
 * NICHT für Handlungen (Buttons) oder Rangzahlen verwenden — Buttons sind
 * eigenständig, Rangzahlen gehören in eine Kennzahl.
 */
export type StatusKind = "open" | "soon" | "missed" | "done" | "info";

const TONES: Record<StatusKind, { fg: string; bg: string }> = {
  open:   { fg: "var(--t2-text-soft)",              bg: "var(--t2-surface-muted)" },
  soon:   { fg: "var(--t2-state-deadline-soon)",    bg: "var(--t2-warn-surface)" },
  missed: { fg: "var(--t2-state-deadline-missed)",  bg: "var(--t2-danger-surface)" },
  done:   { fg: "var(--t2-state-done)",             bg: "var(--t2-success-surface)" },
  info:   { fg: "var(--t2-info)",                   bg: "var(--t2-info-surface)" },
};

export type StatusBadgeProps = {
  kind: StatusKind;
  children: ReactNode;
};

export function StatusBadge({ kind, children }: StatusBadgeProps) {
  const t = TONES[kind];
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 t2-fs-meta font-semibold"
      style={{ color: t.fg, background: t.bg }}
    >
      {children}
    </span>
  );
}
