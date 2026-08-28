"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Detailschublade für /tour3. Fährt auf dem Desktop von rechts ein, auf dem
 * Handy von unten. Escape und Klick auf den Hintergrund schließen sie; der
 * Fokus bleibt in der offenen Schublade gefangen und kehrt beim Schließen auf
 * den vorherigen Auslöser zurück.
 *
 * Übergänge nutzen die View-Transitions-API des Browsers, wenn verfügbar
 * (200 ms), sonst nur CSS-Transitions als Rückfall — keine Bibliothek.
 */

export type DrawerT3Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

// Kleiner Wrapper: setStateAction über View Transitions, wenn der Browser sie
// unterstützt. Sonst direkt aufrufen. Rückfall ist bewusst still — kein Fehler.
type DocumentWithVT = Document & { startViewTransition?: (cb: () => void) => unknown };
function withViewTransition(action: () => void) {
  const doc = document as DocumentWithVT;
  if (typeof doc.startViewTransition === "function") {
    doc.startViewTransition(action);
  } else {
    action();
  }
}

export default function DrawerT3({ open, onClose, title, children }: DrawerT3Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    openerRef.current = (document.activeElement as HTMLElement) ?? null;

    const focusablesIn = (root: HTMLElement) => root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); withViewTransition(onClose); return; }
      if (e.key !== "Tab" || !panelRef.current) return;
      const els = focusablesIn(panelRef.current);
      if (els.length === 0) { e.preventDefault(); return; }
      const first = els[0], last = els[els.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);

    // Fokus in die Schublade legen, kurz nachdem sie eingefahren ist.
    const t = window.setTimeout(() => {
      const first = panelRef.current && focusablesIn(panelRef.current)[0];
      (first ?? panelRef.current)?.focus();
    }, 40);

    return () => {
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
      openerRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80]"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Schließen"
        className="absolute inset-0"
        onClick={() => withViewTransition(onClose)}
        style={{ background: "oklch(0.20 0.02 65 / 0.4)", border: 0, cursor: "pointer" }}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-[var(--t3-radius)] p-6
                   md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:h-full md:w-[440px] md:max-w-[92vw] md:rounded-none
                   outline-none"
        style={{
          background: "var(--t3-surface)",
          boxShadow: "var(--t3-shadow-overlay)",
          viewTransitionName: "t3-drawer",
        }}
      >
        {title && (
          <h2 className="t3-fs-h2" style={{ color: "var(--t3-text)" }}>{title}</h2>
        )}
        <div className={title ? "mt-4" : ""}>{children}</div>
      </div>
    </div>
  );
}
