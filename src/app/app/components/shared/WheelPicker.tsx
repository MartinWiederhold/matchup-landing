"use client";

import { useEffect, useRef } from "react";

/**
 * iOS-artiges Scrollrad zur Wertauswahl — kein Tastatur-Input.
 * Nutzt natives Scroll-Snapping; der mittig eingerastete Wert ist gewählt.
 */
const ITEM_H = 40; // px pro Eintrag
const VISIBLE = 5; // sichtbare Einträge (ungerade → einer mittig)

export default function WheelPicker({
  values,
  value,
  onChange,
  fade = "rgb(24 24 27)", // Hintergrundfarbe für den Verlauf (zinc-900)
}: {
  values: number[];
  value: number;
  onChange: (v: number) => void;
  fade?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const idx = Math.max(0, values.indexOf(value));

  // Startposition auf den aktuellen Wert setzen (nur beim Mounten).
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = idx * ITEM_H;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Externe Wertänderung (z.B. Clamp) → Rad nachziehen.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = idx * ITEM_H;
    if (Math.abs(el.scrollTop - target) > 2) {
      el.scrollTo({ top: target, behavior: "smooth" });
    }
  }, [idx]);

  function onScroll() {
    const el = ref.current;
    if (!el) return;
    clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      const i = Math.min(
        values.length - 1,
        Math.max(0, Math.round(el.scrollTop / ITEM_H)),
      );
      if (values[i] !== value) onChange(values[i]);
    }, 90);
  }

  const pad = (ITEM_H * (VISIBLE - 1)) / 2;

  return (
    <div className="relative select-none" style={{ height: ITEM_H * VISIBLE }}>
      {/* Markierungsband in der Mitte */}
      <div
        className="pointer-events-none absolute inset-x-2 top-1/2 -translate-y-1/2 rounded-xl bg-white/5 ring-1 ring-white/10"
        style={{ height: ITEM_H }}
      />
      {/* Verlauf oben/unten (zinc-900 = Sheet-Hintergrund) */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10"
        style={{
          height: pad,
          background: `linear-gradient(to bottom, ${fade} 10%, transparent)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10"
        style={{
          height: pad,
          background: `linear-gradient(to top, ${fade} 10%, transparent)`,
        }}
      />
      <div
        ref={ref}
        onScroll={onScroll}
        className="no-scrollbar h-full overflow-y-scroll"
        style={{ scrollSnapType: "y mandatory" }}
      >
        <div style={{ height: pad }} />
        {values.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() =>
              ref.current?.scrollTo({
                top: values.indexOf(v) * ITEM_H,
                behavior: "smooth",
              })
            }
            className={`flex w-full items-center justify-center text-lg tabular-nums transition-colors ${
              v === value ? "font-bold text-white" : "text-zinc-500"
            }`}
            style={{ height: ITEM_H, scrollSnapAlign: "center" }}
          >
            {v}
          </button>
        ))}
        <div style={{ height: pad }} />
      </div>
    </div>
  );
}
