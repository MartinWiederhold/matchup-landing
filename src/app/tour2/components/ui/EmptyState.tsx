import type { ReactNode } from "react";

/**
 * Leerzustand — ein ruhiger Hinweis, wenn eine Liste noch nichts enthält.
 * Symbol/Emoji, eine erklärende Zeile, optional eine Handlung. Keine großen
 * Illustrationen, keine emotionalen Botschaften.
 *
 * NICHT für Ladezustände nehmen — dafür ist Skeleton da. Nicht für Fehler —
 * dafür ist Callout mit tone="danger" richtig.
 */
export type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  hint?: ReactNode;
  action?: ReactNode;
};

export function EmptyState({ icon, title, hint, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-start gap-2 py-6 text-[var(--t2-text-soft)]">
      {icon && <div aria-hidden className="text-[var(--t2-text-faint)]">{icon}</div>}
      <p className="t2-fs-body font-medium text-[var(--t2-text)]">{title}</p>
      {hint && <p className="t2-fs-body-sm leading-relaxed">{hint}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
