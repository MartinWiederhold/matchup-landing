import type { ReactNode } from "react";

/**
 * Karte — Fläche mit Rahmen, ohne Schatten. Der Standard-Container für alle
 * Dashboard-Inhalte. Optional mit Titel und einer Aktion in der Kopfzeile
 * (z. B. „Mehr", „Bearbeiten"). Für überlagernde Elemente (Menüs, Dialoge)
 * NICHT diesen Baustein nehmen — dort gehören Schatten hin.
 */
export type CardProps = {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Card({ title, action, children, className = "" }: CardProps) {
  return (
    <section className={`t2-dash-card ${className}`}>
      {(title || action) && (
        <header className="flex items-baseline justify-between gap-3">
          {title && <h2 className="t2-section-title">{title}</h2>}
          {action}
        </header>
      )}
      <div className={title || action ? "mt-3" : ""}>{children}</div>
    </section>
  );
}
