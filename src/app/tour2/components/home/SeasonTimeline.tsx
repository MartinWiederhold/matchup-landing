"use client";

import { useEffect, useMemo, useRef } from "react";
import type { SeasonStop } from "./SeasonMapView";

/**
 * Zeitachse für /tour2 — eine horizontale SVG-Linie mit Monatsmarken. Jeder
 * Stop sitzt an seiner ZEITLICHEN Position (nicht in gleichmäßigen Abständen),
 * die Punktgröße spiegelt die Turnier-Kategorie (höhere Kategorie = größerer
 * Punkt). Klick oder Hover auf einen Punkt hebt gleichzeitig den passenden
 * Marker auf der SeasonMap hervor (`onHover(id | null)`); umgekehrt bekommt
 * die Zeitachse den Hover-Zustand über `highlightId`.
 *
 * Reines SVG + CSS — keine Diagramm-Bibliothek. Auf dem Handy horizontal
 * scrollbar; beim Laden wird der nächste Stop in den sichtbaren Bereich
 * gescrollt, damit er ohne Wischen sichtbar ist.
 */

export type SeasonTimelineProps = {
  stops: SeasonStop[];
  todayISO: string;                       // Mitternacht-UTC-Anker (formatiert von HomeView)
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
  highlightId?: string | null;
  locale?: string;
};

const DAY_MS = 86_400_000;
const PX_PER_DAY = 4.5;   // Balance Lesbarkeit vs. Bildschirmbreite
const AXIS_H = 90;
const PAD_LEFT = 32;
const PAD_RIGHT = 32;

function toMs(iso: string): number {
  return Date.parse(iso + "T00:00:00Z");
}

// Erste Millisekunde des Monats, in dem ms liegt (UTC).
function monthStart(ms: number): number {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
}
function monthAdd(ms: number, n: number): number {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1);
}
function monthLabel(ms: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }).format(new Date(ms)).toUpperCase();
}
function shortDate(ms: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(ms));
}

// Kategorie-Kennwert extrahieren („Challenger 75" → 75, „ITF M25" → 25).
function categoryLevel(c: string | null): number {
  if (!c) return 0;
  const m = c.match(/(\d{2,4})/);
  return m ? parseInt(m[1], 10) : 0;
}
// Punkt-Radius nach Level. Kleiner Wertebereich, damit die Achse ruhig bleibt.
function dotRadius(level: number): number {
  if (level >= 1000) return 10;
  if (level >= 500) return 9;
  if (level >= 125) return 8;
  if (level >= 50) return 7;
  if (level > 0) return 6;
  return 5;
}

function colorFor(state: SeasonStop["state"]): { fill: string; ring: string; text: string; opacity: number } {
  if (state === "missed") return { fill: "var(--t2-danger)", ring: "var(--t2-danger)", text: "var(--t2-danger)", opacity: 1 };
  if (state === "current") return { fill: "var(--t2-accent)", ring: "var(--t2-accent)", text: "var(--t2-accent)", opacity: 1 };
  if (state === "past") return { fill: "var(--t2-text-faint)", ring: "var(--t2-text-faint)", text: "var(--t2-text-faint)", opacity: 0.5 };
  return { fill: "var(--t2-text)", ring: "var(--t2-text)", text: "var(--t2-text)", opacity: 1 };
}

export default function SeasonTimeline({ stops, todayISO, onSelect, onHover, highlightId, locale = "de-CH" }: SeasonTimelineProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const nextStopIdRef = useRef<string | null>(null);

  const geometry = useMemo(() => {
    if (stops.length === 0) return null;
    const times = stops.map((s) => toMs(s.monday));
    const minMs = Math.min(...times);
    const maxMs = Math.max(...times) + 6 * DAY_MS; // volle Turnierwoche einbeziehen
    const startMs = monthStart(minMs);
    const endMs = monthAdd(monthStart(maxMs), 1);
    const totalDays = Math.max(1, Math.round((endMs - startMs) / DAY_MS));
    const width = PAD_LEFT + PAD_RIGHT + totalDays * PX_PER_DAY;
    const xForMs = (ms: number) => PAD_LEFT + ((ms - startMs) / DAY_MS) * PX_PER_DAY;

    // Monatsmarken zwischen startMs und endMs (inklusive Start).
    const months: { ms: number; label: string; x: number }[] = [];
    for (let m = startMs; m < endMs; m = monthAdd(m, 1)) {
      months.push({ ms: m, label: monthLabel(m, locale), x: xForMs(m) });
    }

    return { startMs, endMs, width, xForMs, months, todayX: xForMs(toMs(todayISO)) };
  }, [stops, todayISO, locale]);

  // Erster Stop mit monday >= todayISO ist der „nächste" — beim ersten Laden
  // in den sichtbaren Bereich scrollen.
  useEffect(() => {
    if (!geometry) return;
    const next = stops.find((s) => toMs(s.monday) >= toMs(todayISO));
    nextStopIdRef.current = next?.id ?? null;
    const box = scrollRef.current;
    if (!box || !next) return;
    const x = geometry.xForMs(toMs(next.monday));
    box.scrollLeft = Math.max(0, x - box.clientWidth / 2);
  }, [geometry, stops, todayISO]);

  if (!geometry || stops.length === 0) return null;

  const svgH = AXIS_H + 44; // Achse + Beschriftung darunter

  return (
    <div
      ref={scrollRef}
      className="overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]"
      onMouseLeave={() => onHover?.(null)}
    >
      <svg
        role="img"
        aria-label="Saison-Zeitachse"
        width={geometry.width}
        height={svgH}
        style={{ display: "block", minWidth: "100%" }}
      >
        {/* Achsen-Linie */}
        <line
          x1={PAD_LEFT}
          x2={geometry.width - PAD_RIGHT}
          y1={AXIS_H / 2}
          y2={AXIS_H / 2}
          stroke="var(--t2-line-strong)"
          strokeWidth={1}
        />

        {/* Monatsmarken */}
        {geometry.months.map((m) => (
          <g key={m.ms}>
            <line x1={m.x} x2={m.x} y1={AXIS_H / 2 - 6} y2={AXIS_H / 2 + 6} stroke="var(--t2-line-strong)" strokeWidth={1} />
            <text
              x={m.x}
              y={AXIS_H / 2 - 12}
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              letterSpacing="0.14em"
              fill="var(--t2-text-faint)"
            >
              {m.label}
            </text>
          </g>
        ))}

        {/* Heute-Marker */}
        {geometry.todayX >= PAD_LEFT && geometry.todayX <= geometry.width - PAD_RIGHT && (
          <line
            x1={geometry.todayX}
            x2={geometry.todayX}
            y1={AXIS_H / 2 - 14}
            y2={AXIS_H / 2 + 14}
            stroke="var(--t2-accent)"
            strokeWidth={2}
            strokeOpacity={0.5}
          />
        )}

        {/* Stops als Punkte + Beschriftung darunter */}
        {stops.map((s) => {
          const x = geometry.xForMs(toMs(s.monday));
          const r = dotRadius(categoryLevel(s.category));
          const col = colorFor(s.state);
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
              {/* Trefferzone breiter als der Punkt, damit die Bedienung nicht kniffelig wird. */}
              <circle r={Math.max(14, r + 6)} fill="transparent" />
              {on && <circle r={r + 4} fill="none" stroke={col.ring} strokeWidth={2} strokeOpacity={0.35} />}
              <circle r={r} fill={col.fill} fillOpacity={col.opacity} stroke="var(--t2-surface)" strokeWidth={2} />
              <text
                y={r + 16}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="var(--t2-text)"
                fillOpacity={col.opacity}
              >
                {s.city.length > 14 ? s.city.slice(0, 13) + "…" : s.city}
              </text>
              <text
                y={r + 30}
                textAnchor="middle"
                fontSize="10"
                fill="var(--t2-text-soft)"
                fillOpacity={col.opacity}
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
