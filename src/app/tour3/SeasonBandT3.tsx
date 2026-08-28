"use client";

import { useEffect, useMemo, useRef } from "react";
import type { SeasonStopT3, StopState } from "./types";

/**
 * Saison-Band — grafische Zeitachse als reines SVG. Die Punkte sitzen an
 * ihrer echten zeitlichen Position (nicht in gleichen Abständen), die Größe
 * spiegelt die Turnier-Kategorie. Hover verbindet sich mit der Karte über
 * onHover(id | null); umgekehrt kommt der Hover-Zustand als highlightId.
 *
 * Auf dem Handy horizontal scrollbar; beim Mount wird der nächste Stop mittig
 * in den sichtbaren Bereich gescrollt.
 */

export type SeasonBandT3Props = {
  stops: SeasonStopT3[];
  todayISO: string;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
  highlightId?: string | null;
  locale?: string;
};

const DAY_MS = 86_400_000;
const PX_PER_DAY = 4.5;
const AXIS_H = 84;
const PAD_L = 32;
const PAD_R = 32;

function toMs(iso: string): number { return Date.parse(iso + "T00:00:00Z"); }
function monthStart(ms: number): number { const d = new Date(ms); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1); }
function monthAdd(ms: number, n: number): number { const d = new Date(ms); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1); }
function monthLabel(ms: number, loc: string): string {
  return new Intl.DateTimeFormat(loc, { month: "short", timeZone: "UTC" }).format(new Date(ms)).toUpperCase();
}
function shortDate(ms: number, loc: string): string {
  return new Intl.DateTimeFormat(loc, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(ms));
}
function categoryLevel(c: string | null): number {
  if (!c) return 0;
  const m = c.match(/(\d{2,4})/);
  return m ? parseInt(m[1], 10) : 0;
}
function dotRadius(level: number): number {
  if (level >= 1000) return 10;
  if (level >= 500)  return 9;
  if (level >= 125)  return 8;
  if (level >= 50)   return 7;
  if (level > 0)     return 6;
  return 5;
}
function stopColor(state: StopState): { fill: string; text: string; opacity: number } {
  if (state === "missed")  return { fill: "var(--t3-danger)", text: "var(--t3-danger)", opacity: 1 };
  if (state === "current") return { fill: "var(--t3-accent)", text: "var(--t3-accent)", opacity: 1 };
  if (state === "past")    return { fill: "var(--t3-text-4)", text: "var(--t3-text-4)", opacity: 0.55 };
  return { fill: "var(--t3-text)", text: "var(--t3-text)", opacity: 1 };
}

export default function SeasonBandT3({ stops, todayISO, onSelect, onHover, highlightId, locale = "de-CH" }: SeasonBandT3Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const geo = useMemo(() => {
    if (stops.length === 0) return null;
    const times = stops.map((s) => toMs(s.monday));
    const minMs = Math.min(...times);
    const maxMs = Math.max(...times) + 6 * DAY_MS;
    const startMs = monthStart(minMs);
    const endMs = monthAdd(monthStart(maxMs), 1);
    const totalDays = Math.max(1, Math.round((endMs - startMs) / DAY_MS));
    const width = PAD_L + PAD_R + totalDays * PX_PER_DAY;
    const xFor = (ms: number) => PAD_L + ((ms - startMs) / DAY_MS) * PX_PER_DAY;
    const months: { ms: number; label: string; x: number }[] = [];
    for (let m = startMs; m < endMs; m = monthAdd(m, 1)) {
      months.push({ ms: m, label: monthLabel(m, locale), x: xFor(m) });
    }
    return { width, xFor, months, todayX: xFor(toMs(todayISO)) };
  }, [stops, todayISO, locale]);

  // Nächsten Stop beim Mount in den sichtbaren Bereich scrollen.
  useEffect(() => {
    if (!geo) return;
    const next = stops.find((s) => toMs(s.monday) >= toMs(todayISO));
    const box = scrollRef.current;
    if (!box || !next) return;
    box.scrollLeft = Math.max(0, geo.xFor(toMs(next.monday)) - box.clientWidth / 2);
  }, [geo, stops, todayISO]);

  if (!geo || stops.length === 0) return null;

  const svgH = AXIS_H + 46;

  return (
    <div
      ref={scrollRef}
      className="overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]"
      onMouseLeave={() => onHover?.(null)}
    >
      <svg
        role="img"
        aria-label="Saison-Zeitachse"
        width={geo.width}
        height={svgH}
        style={{ display: "block", minWidth: "100%" }}
      >
        {/* Achsenlinie */}
        <line
          x1={PAD_L} x2={geo.width - PAD_R}
          y1={AXIS_H / 2} y2={AXIS_H / 2}
          stroke="var(--t3-line-strong)" strokeWidth={1}
        />
        {/* Monatsmarken */}
        {geo.months.map((m) => (
          <g key={m.ms}>
            <line x1={m.x} x2={m.x} y1={AXIS_H / 2 - 6} y2={AXIS_H / 2 + 6} stroke="var(--t3-line-strong)" strokeWidth={1} />
            <text
              x={m.x} y={AXIS_H / 2 - 14}
              textAnchor="middle"
              fontSize="10"
              fontFamily="var(--font-geist-mono, monospace)"
              fontWeight="600"
              letterSpacing="0.14em"
              fill="var(--t3-text-4)"
            >
              {m.label}
            </text>
          </g>
        ))}
        {/* Heute-Linie */}
        {geo.todayX >= PAD_L && geo.todayX <= geo.width - PAD_R && (
          <line
            x1={geo.todayX} x2={geo.todayX}
            y1={AXIS_H / 2 - 14} y2={AXIS_H / 2 + 14}
            stroke="var(--t3-accent)" strokeWidth={2} strokeOpacity={0.4}
          />
        )}
        {/* Stops */}
        {stops.map((s) => {
          const x = geo.xFor(toMs(s.monday));
          const r = dotRadius(categoryLevel(s.category));
          const c = stopColor(s.state);
          const on = s.id === highlightId;
          return (
            <g
              key={s.id}
              transform={`translate(${x}, ${AXIS_H / 2})`}
              style={{ cursor: onSelect ? "pointer" : "default" }}
              onMouseEnter={() => onHover?.(s.id)}
              onClick={() => onSelect?.(s.id)}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect?.(s.id); } }}
            >
              <circle r={Math.max(14, r + 6)} fill="transparent" />
              {on && <circle r={r + 4} fill="none" stroke={c.fill} strokeWidth={2} strokeOpacity={0.35} />}
              <circle r={r} fill={c.fill} fillOpacity={c.opacity} stroke="var(--t3-bg)" strokeWidth={2} />
              <text
                y={r + 18}
                textAnchor="middle"
                fontSize="11"
                fontWeight="500"
                fill="var(--t3-text)"
                fillOpacity={c.opacity}
              >
                {s.city.length > 14 ? s.city.slice(0, 13) + "…" : s.city}
              </text>
              <text
                y={r + 32}
                textAnchor="middle"
                fontSize="10"
                fontFamily="var(--font-geist-mono, monospace)"
                fill="var(--t3-text-3)"
                fillOpacity={c.opacity}
              >
                {shortDate(toMs(s.monday), locale)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
