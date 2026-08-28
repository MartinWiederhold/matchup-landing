"use client";

import { useState } from "react";

/**
 * Kleines „i" neben einer Überschrift, das eine kurze Erklärung auf-/zuklappt.
 * Kein Modal, keine Seite — nur ein einklappbarer Absatz. Für selten Gebrauchtes
 * (Kostensätze, Wochenkosten-Erklärung, Datenherkunft, Schengen-Details im Rahmen).
 */
export default function InfoHint({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="inline-block align-middle">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={label}
        aria-expanded={open}
        className={`ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full t2-fs-meta font-bold leading-none ring-1 transition-colors ${open ? "bg-[var(--t2-accent)] text-[var(--t2-on-accent)] ring-matchup" : "bg-[var(--t2-surface)] text-[var(--t2-muted)] ring-[var(--t2-line)] hover:bg-[var(--t2-line)]"}`}
      >
        i
      </button>
      {open && (
        <div className="mt-1.5 rounded-xl bg-[var(--t2-surface)] px-3 py-2 t2-fs-meta leading-relaxed font-normal normal-case tracking-normal text-[var(--t2-muted)]">
          {children}
        </div>
      )}
    </span>
  );
}
