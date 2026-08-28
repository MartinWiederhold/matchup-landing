"use client";

import { useState } from "react";
import { Drawer } from "@/app/tour2/components/ui";

/**
 * Kleine Client-Hülle, die den Drawer für die UI-Übersichtsseite öffnet und
 * schließt. Nur hier live — im echten Einsatz kommt der offen/zu-Zustand aus
 * dem Aufrufer der Detailseite.
 */
export default function DrawerDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-[var(--t2-line-strong)] bg-[var(--t2-surface)] px-4 py-2 t2-fs-body-sm font-semibold text-[var(--t2-text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--t2-accent)]"
      >
        Schublade öffnen
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Beispiel-Schublade">
        <p className="t2-fs-body text-[var(--t2-text-soft)]">
          Diese Schublade fährt auf dem Desktop von rechts ein, auf dem Handy von unten.
          Escape und Klick auf den Hintergrund schließen sie.
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-4 rounded-full bg-[var(--t2-accent)] px-4 py-2 t2-fs-body-sm font-semibold text-[var(--t2-on-accent)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--t2-accent)]"
        >
          Schließen
        </button>
      </Drawer>
    </div>
  );
}
