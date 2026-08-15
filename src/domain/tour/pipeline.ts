/**
 * Wochen-Raster für die Pipeline (Kommandozentrale) — die reine Zusammenstellung.
 *
 * Kein Netz, keine DB, KEINE Laufzeituhr: `now` kommt als Parameter herein → deterministisch
 * per Vitest belegbar. Baut die Wochen AB DER LAUFENDEN WOCHE bis zur letzten Saison-Woche
 * und ordnet die Turniere ihren Wochen zu. Wochen OHNE Turnier bleiben als LÜCKE erhalten
 * (Erholungs-/Blockplanung ist Information, kein Fehler) — nicht übersprungen. Mehrere
 * Turniere je Woche sind erlaubt (Primär + Ausweichturnier stehen so nebeneinander).
 *
 * Bewusst KEINE eigene Domain-Datei geändert — deadlines/costs/entryTrend werden nur genutzt.
 */

const DAY = 86_400_000;

export type WeekRow<T> = {
  isoYear: number;
  isoWeek: number;
  monday: string;   // ISO-Datum (YYYY-MM-DD) des Wochen-Montags, 00:00 UTC
  items: T[];       // Turniere dieser Woche (0 = Lücke, meist 1, manchmal 2)
  isGap: boolean;   // items.length === 0
};

const parseDay = (iso: string) => Date.parse(iso + "T00:00:00Z");
const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Montag (00:00 UTC) der ISO-Woche eines Zeitpunkts. */
export function mondayOf(ms: number): number {
  const d = new Date(ms);
  const dow = (d.getUTCDay() + 6) % 7; // 0=Mo … 6=So
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - dow * DAY;
}

/** ISO-Wochennummer + ISO-Jahr (bestimmt über den Donnerstag der Woche). */
export function isoWeek(ms: number): { year: number; week: number } {
  const thu = mondayOf(ms) + 3 * DAY;
  const year = new Date(thu).getUTCFullYear();
  const jan1 = Date.UTC(year, 0, 1);
  const dayOfYear = Math.floor((thu - jan1) / DAY) + 1;
  return { year, week: Math.ceil(dayOfYear / 7) };
}

/**
 * @param items    Turniere der Saison; jedes trägt `monday` (ISO-Datum der Turnierwoche).
 * @param now      Bezugszeitpunkt (die laufende Woche ist der Start).
 * @param maxWeeks Reißleine gegen Ausreißer (Default 104 = 2 Jahre).
 */
export function buildPipeline<T extends { monday: string }>(items: T[], now: Date, maxWeeks = 104): WeekRow<T>[] {
  const startMonday = mondayOf(now.getTime());
  const future = items.filter((i) => parseDay(i.monday) >= startMonday);
  if (future.length === 0) return [];

  const endMonday = future.reduce((mx, i) => Math.max(mx, mondayOf(parseDay(i.monday))), startMonday);
  const byWeek = new Map<string, T[]>();
  for (const i of future) {
    const wk = isoDay(mondayOf(parseDay(i.monday)));
    const a = byWeek.get(wk);
    if (a) a.push(i); else byWeek.set(wk, [i]);
  }

  const rows: WeekRow<T>[] = [];
  let m = startMonday;
  let guard = 0;
  while (m <= endMonday && guard++ < maxWeeks) {
    const wk = isoDay(m);
    const weekItems = byWeek.get(wk) ?? [];
    const { year, week } = isoWeek(m);
    rows.push({ isoYear: year, isoWeek: week, monday: wk, items: weekItems, isGap: weekItems.length === 0 });
    m += 7 * DAY;
  }
  return rows;
}
