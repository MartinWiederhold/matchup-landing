/**
 * Reines Zeitraster für den Wochenkalender (/tour/calendar). KEINE UI/DB. Getestet.
 * Wanduhrzeit ohne Zeitzone (wie event_time/end_time in web.tour_events).
 */

export const DAY_MIN = 24 * 60;

/** "HH:MM[:SS]" → Minuten seit Mitternacht, oder null bei fehlend/ungültig. */
export function hhmmToMin(s: string | null): number | null {
  if (!s) return null;
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = Number(m[1]), mi = Number(m[2]);
  if (h > 23 || mi > 59) return null;
  return h * 60 + mi;
}

/** Minuten → "HH:MM" (Wanduhr, 24h). */
export function minToHHMM(min: number): string {
  const m = ((min % DAY_MIN) + DAY_MIN) % DAY_MIN;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** Blockgeometrie top/height (px) aus Start/Ende; Ende null → Standarddauer; Mindesthöhe 15 min. */
export function blockGeom(startMin: number, endMin: number | null, pxPerMin: number, defaultDurMin: number): { top: number; height: number } {
  const s = Math.max(0, Math.min(DAY_MIN, startMin));
  let e = endMin != null && endMin > s ? endMin : s + defaultDurMin;
  e = Math.min(DAY_MIN, e);
  return { top: s * pxPerMin, height: Math.max(15 * pxPerMin, (e - s) * pxPerMin) };
}

export interface DayItem { id: string; startMin: number; endMin: number | null; }

/**
 * Überlappende Termine nebeneinander legen: je Termin { col, cols } (Spalte + Spaltenzahl
 * seines Überlappungs-Clusters) → Breite = 1/cols, links = col/cols. Greedy, deterministisch.
 */
export function layoutOverlaps(items: DayItem[], defaultDurMin: number): Map<string, { col: number; cols: number }> {
  const out = new Map<string, { col: number; cols: number }>();
  const norm = items
    .map((it) => ({ id: it.id, s: it.startMin, e: it.endMin != null && it.endMin > it.startMin ? it.endMin : it.startMin + defaultDurMin }))
    .sort((a, b) => a.s - b.s || a.e - b.e || (a.id < b.id ? -1 : 1));

  let cluster: { id: string; s: number; e: number }[] = [];
  let clusterEnd = -1;
  const flush = () => {
    if (!cluster.length) return;
    const colEnds: number[] = [];
    const colOf = new Map<string, number>();
    for (const ev of cluster) {
      let c = colEnds.findIndex((end) => end <= ev.s);
      if (c === -1) { c = colEnds.length; colEnds.push(ev.e); } else colEnds[c] = ev.e;
      colOf.set(ev.id, c);
    }
    for (const ev of cluster) out.set(ev.id, { col: colOf.get(ev.id)!, cols: colEnds.length });
    cluster = [];
    clusterEnd = -1;
  };
  for (const ev of norm) {
    if (cluster.length && ev.s >= clusterEnd) flush();
    cluster.push(ev);
    clusterEnd = Math.max(clusterEnd, ev.e);
  }
  flush();
  return out;
}
