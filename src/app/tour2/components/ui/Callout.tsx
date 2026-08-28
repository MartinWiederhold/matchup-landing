import type { ReactNode } from "react";

/**
 * Hinweis — abgesetzter Kasten für eine kurze Warnung, einen Fehler oder eine
 * neutrale Information. Rahmen und getönte Fläche in der Zustands-Farbe.
 *
 * NICHT für lange Erklärtexte oder mehrere Absätze — dafür einen normalen
 * Absatz nutzen. Nicht für Erfolgsmeldungen (Toasts): das ist ein anderes
 * Muster, das noch nicht existiert.
 */
export type CalloutTone = "info" | "warn" | "danger" | "success";

const TONES: Record<CalloutTone, { fg: string; bg: string; border: string }> = {
  info:    { fg: "var(--t2-info)",    bg: "var(--t2-info-surface)",    border: "var(--t2-info)" },
  warn:    { fg: "var(--t2-warn)",    bg: "var(--t2-warn-surface)",    border: "var(--t2-warn)" },
  danger:  { fg: "var(--t2-danger)",  bg: "var(--t2-danger-surface)",  border: "var(--t2-danger)" },
  success: { fg: "var(--t2-success)", bg: "var(--t2-success-surface)", border: "var(--t2-success)" },
};

export type CalloutProps = {
  tone?: CalloutTone;
  title?: string;
  children: ReactNode;
};

export function Callout({ tone = "info", title, children }: CalloutProps) {
  const t = TONES[tone];
  return (
    <div
      className="rounded-[var(--t2-radius-md)] px-4 py-3 border-l-[3px]"
      style={{ background: t.bg, borderColor: t.border, color: "var(--t2-text)" }}
      role="note"
    >
      {title && <p className="t2-fs-body-sm font-semibold" style={{ color: t.fg }}>{title}</p>}
      <div className={`t2-fs-body-sm leading-relaxed ${title ? "mt-1" : ""}`}>{children}</div>
    </div>
  );
}
