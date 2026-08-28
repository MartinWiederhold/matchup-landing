"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Detailschublade — fährt auf großen Bildschirmen von rechts ein, auf dem
 * Handy von unten. Schließt mit Escape und Klick auf den Hintergrund.
 * Fokus bleibt innerhalb der offenen Schublade (einfache Fokus-Falle,
 * ohne fremde Library).
 *
 * NICHT für flüchtige Meldungen (Toast) oder blockierende Entscheidungen
 * (Modaler Dialog mit „OK/Abbrechen") — dafür braucht es eigene Muster.
 */
export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

export function Drawer({ open, onClose, title, children }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    openerRef.current = (document.activeElement as HTMLElement) ?? null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (e.key !== "Tab") return;
      const p = panelRef.current;
      if (!p) return;
      const focusables = p.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) { e.preventDefault(); return; }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    // Fokus in die Schublade legen, sobald sie offen ist.
    const t = setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      (first ?? panelRef.current)?.focus();
    }, 30);
    return () => { document.removeEventListener("keydown", onKey); clearTimeout(t); openerRef.current?.focus(); };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0" style={{ background: "rgba(23,21,18,0.4)" }} onClick={onClose} />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-[var(--t2-radius-md)] bg-[var(--t2-surface)] p-5
                   md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:h-full md:w-[420px] md:max-w-[90vw] md:rounded-none
                   outline-none"
        style={{ boxShadow: "var(--t2-shadow-sheet)" }}
      >
        {title && <h2 className="t2-section-title">{title}</h2>}
        <div className={title ? "mt-3" : ""}>{children}</div>
      </div>
    </div>
  );
}
