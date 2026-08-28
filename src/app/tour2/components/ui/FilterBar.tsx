"use client";

import type { ReactNode } from "react";

/**
 * Filterleiste — nur die Hülle mit korrektem Überlauf-Verhalten, KEINE
 * fertigen Filter-Widgets. Auf schmalen Bildschirmen scrollt sie horizontal;
 * das Scroll-Verhalten selbst signalisiert dem Nutzer den Überlauf.
 * (Etappe 2a: keine Farbverläufe als Fade-Indikator — Regel aus Schritt 2.)
 *
 * NICHT für vertikale Filter-Kolonnen (Sidebar-Filter) — dafür lieber eine
 * Card mit Sektions-Titel und normalen Kontrollen darin.
 */
export type FilterBarProps = {
  children: ReactNode;
  ariaLabel?: string;
};

export function FilterBar({ children, ariaLabel }: FilterBarProps) {
  return (
    <div
      role="toolbar"
      aria-label={ariaLabel}
      className="flex items-center gap-2 overflow-x-auto py-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {children}
    </div>
  );
}
