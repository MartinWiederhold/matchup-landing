"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * Einfache Fensterung ohne neue Dependency: nur sichtbare Zeilen + Overscan
 * im DOM. Feste Zeilenhöhe — reicht für die Turnierliste (kompakte Rows).
 */
export default function WindowedList<T>({
  items,
  rowHeight,
  overscan = 8,
  className,
  getKey,
  scrollToKey,
  children,
}: {
  items: T[];
  rowHeight: number;
  overscan?: number;
  className?: string;
  getKey: (item: T) => string;
  scrollToKey?: string | null;
  children: (item: T) => ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState({ start: 0, end: Math.min(items.length, 24) });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const start = Math.max(0, Math.floor(el.scrollTop / rowHeight) - overscan);
    const visible = Math.ceil(el.clientHeight / rowHeight) + overscan * 2;
    const end = Math.min(items.length, start + Math.max(visible, 1));
    setRange((r) => (r.start === start && r.end === end ? r : { start, end }));
  }, [items.length, rowHeight, overscan]);

  useLayoutEffect(() => { update(); }, [update, items.length]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", update); ro.disconnect(); };
  }, [update]);

  useEffect(() => {
    if (!scrollToKey) return;
    const i = items.findIndex((x) => getKey(x) === scrollToKey);
    if (i < 0) return;
    const el = ref.current;
    if (!el) return;
    const top = i * rowHeight;
    const viewEnd = el.scrollTop + el.clientHeight;
    if (top < el.scrollTop || top + rowHeight > viewEnd) {
      el.scrollTo({ top: Math.max(0, top - rowHeight), behavior: "smooth" });
    }
  }, [scrollToKey, items, getKey, rowHeight]);

  const slice = items.slice(range.start, range.end);

  return (
    <div ref={ref} className={className}>
      <div style={{ height: items.length * rowHeight, position: "relative" }}>
        <ul className="absolute right-0 left-0" style={{ top: range.start * rowHeight }}>
          {slice.map((item) => (
            <li key={getKey(item)} data-stop={getKey(item)} className="overflow-hidden" style={{ height: rowHeight }}>
              {children(item)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
