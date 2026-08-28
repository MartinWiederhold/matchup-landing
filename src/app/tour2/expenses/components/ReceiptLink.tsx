"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n";
import { signedReceiptUrl } from "@/lib/tourExpenses";

/**
 * „Beleg ansehen": erzeugt den signierten Link ERST auf Klick (nicht für alle
 * Zeilen im Voraus). Der Tab wird synchron geöffnet (sonst blockt der Popup-
 * Schutz das window.open nach dem await) und danach befüllt.
 */
export default function ReceiptLink({ path }: { path: string }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function open() {
    if (busy) return;
    setError(false);
    setBusy(true);
    const w = window.open("", "_blank"); // synchron öffnen (Popup-Schutz)
    try {
      const url = await signedReceiptUrl(path);
      if (w) w.location.href = url;
      else window.location.href = url; // Fallback, falls der Tab blockiert wurde
    } catch {
      w?.close();
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" onClick={open} disabled={busy} className="t2-fs-micro font-semibold text-[var(--t2-accent)] hover:underline disabled:opacity-50">
        {t("tour.expReceiptView")}
      </button>
      {error && <span className="t2-fs-meta text-[var(--t2-text-soft)]">{t("tour.expReceiptLinkError")}</span>}
    </span>
  );
}
