/**
 * Saison-Zeitstrahl (reine Logik, KEINE UI/DB). Getestet in timeline.test.ts.
 *
 * Der Zeitstrahl legt alles Zeitliche auf EINE durchgehende Achse. Diese Datei liefert
 * die reine Mathematik (Zeit → Pixel), die Saison-Grenzen, den Öffnungs-Fokus (Sprung
 * zum nächsten Turnier statt „heute") und die Fristen-Klassifikation. KEINE Systemuhr:
 * `nowMs` kommt immer als Parameter (deterministisch, testbar).
 */

export const DAY = 86_400_000;

/** Montag 00:00 UTC der Woche, in der `ms` liegt (Wochenraster Mo–So). */
export function mondayOfMs(ms: number): number {
  const d = new Date(ms);
  const dow = d.getUTCDay(); // 0=So … 6=Sa
  const base = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return base - ((dow === 0 ? 6 : dow - 1) * DAY);
}

/**
 * Saison-Grenzen aus den Daten SELBST (nicht aus „heute") — so füllt der Verlauf den
 * Blick, ohne führende Leere, wenn die Saison erst in Monaten beginnt. Start = Montag der
 * frühesten Woche/­des frühesten Termins; Ende = Sonntagabend (nächster Montag) der spätesten.
 * Ohne Daten: die Woche um `nowMs` (leerer, aber gültiger Bereich).
 */
export function seasonBounds(tournamentMondays: number[], eventMs: number[], nowMs: number): { startMs: number; endMs: number } {
  const all = [...tournamentMondays, ...eventMs];
  if (all.length === 0) {
    const m = mondayOfMs(nowMs);
    return { startMs: m, endMs: m + 7 * DAY };
  }
  const minMs = Math.min(...all);
  const maxMs = Math.max(...all);
  const startMs = mondayOfMs(minMs);
  const endMs = mondayOfMs(maxMs) + 7 * DAY; // ganze letzte Woche einschließen
  return { startMs, endMs };
}

/** Pixel-Offset eines Zeitpunkts ab Bereichsanfang (px-pro-Tag-Skala der Zoomstufe). */
export function xForMs(ms: number, startMs: number, pxPerDay: number): number {
  return ((ms - startMs) / DAY) * pxPerDay;
}

/** Balken einer Turnierwoche (Mo–So) als {left, width} in Pixeln. */
export function weekBar(mondayMs: number, startMs: number, pxPerDay: number): { left: number; width: number } {
  return { left: xForMs(mondayMs, startMs, pxPerDay), width: 7 * pxPerDay };
}

/** Gesamtbreite des Bereichs in Pixeln. */
export function totalWidth(startMs: number, endMs: number, pxPerDay: number): number {
  return xForMs(endMs, startMs, pxPerDay);
}

/**
 * Öffnungs-Fokus: der relevante Bereich, NICHT „heute". Erstes Turnier, dessen Woche
 * noch nicht ganz vorbei ist (Sonntag ≥ heute) — also das laufende oder nächste. Sind alle
 * vorbei: das letzte. Ohne Turniere: heute. Die Ansicht scrollt beim Öffnen hierhin.
 */
export function initialFocusMs(nowMs: number, tournamentMondays: number[]): number {
  if (tournamentMondays.length === 0) return nowMs;
  const sorted = [...tournamentMondays].sort((a, b) => a - b);
  const upcoming = sorted.find((m) => m + 6 * DAY >= nowMs);
  return upcoming ?? sorted[sorted.length - 1];
}

export type DeadlineKind = "upcoming" | "passed" | "unknown";

/**
 * Fristen-Klassifikation für die Pins. `known=false` ODER keine Frist-Zeit ⇒ „unknown"
 * (Challenger: KEIN Pin, aber sichtbar als „unbekannt" — nicht so, als wäre keine Frist
 * nötig). Sonst bevorstehend (Zeit > jetzt) oder verstrichen.
 */
export function classifyDeadline(known: boolean, entryMs: number | null, nowMs: number): DeadlineKind {
  if (!known || entryMs == null) return "unknown";
  return entryMs > nowMs ? "upcoming" : "passed";
}
