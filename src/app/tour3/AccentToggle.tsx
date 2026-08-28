"use client";

import { useEffect, useState } from "react";

/**
 * Kleiner, dezenter Umschalter zwischen den beiden Akzent-Varianten
 * (indigo | clay). Setzt `data-accent` am nächsten `.t3-root`-Container
 * und merkt sich die Wahl in localStorage, damit ein Reload nichts vergisst.
 * Der Umschalter selbst ist bewusst zurückgenommen — die Farb-Wahl ist die
 * eigentliche Aussage.
 */

type Accent = "indigo" | "clay";
const KEY = "mu_tour3_accent";
const OPTIONS: { key: Accent; label: string }[] = [
  { key: "indigo", label: "Indigo" },
  { key: "clay",   label: "Clay" },
];

export default function AccentToggle() {
  const [accent, setAccent] = useState<Accent>("indigo");

  // Persistierte Wahl beim Mount übernehmen (SSR-safe: läuft nur im Browser).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY) as Accent | null;
      if (saved === "indigo" || saved === "clay") setAccent(saved);
    } catch { /* Speicher optional */ }
  }, []);

  // Attribut am nächsten .t3-root setzen und persistieren.
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".t3-root");
    if (root) root.setAttribute("data-accent", accent);
    try { localStorage.setItem(KEY, accent); } catch { /* egal */ }
  }, [accent]);

  return (
    <div
      role="radiogroup"
      aria-label="Akzentfarbe"
      className="inline-flex items-center gap-0 rounded-[var(--t3-radius-full)] border p-0.5"
      style={{ borderColor: "var(--t3-line-strong)", background: "var(--t3-surface)" }}
    >
      {OPTIONS.map((o) => {
        const on = accent === o.key;
        return (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => setAccent(o.key)}
            className="t3-focusable t3-mono rounded-[var(--t3-radius-full)] px-2.5 py-1 t3-fs-meta transition-colors"
            style={{
              background: on ? "var(--t3-accent)" : "transparent",
              color: on ? "var(--t3-on-accent)" : "var(--t3-text-3)",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
