/**
 * Reine Auswahl-/Leer-Logik für die Kalender-Wochenansicht (/tour/calendar).
 * KEINE UI, KEIN DB-Zugriff. Getestet in calendarWeek.test.ts.
 *
 * Eine Turnierwoche läuft Montag–Sonntag. `tournament_monday` ist IMMER ein Montag,
 * die angezeigte Woche beginnt ebenfalls an einem Montag (`weekStart`) → ein Turnier
 * gehört genau dann in die sichtbare Woche, wenn sein Montag == weekStart (exakte
 * String-Gleichheit, kein Überlappungs-Rechnen nötig).
 */

/** Minimaler Eingabe-Shape — nur was die Auswahl braucht (entkoppelt von SeasonEntry). */
export interface CalendarWeekItem {
  monday: string; // tournament_monday, ISO yyyy-mm-dd (immer ein Montag)
  inactive: boolean; // soft-gelöschtes Turnier (valid_to gesetzt) → nicht anzeigen
}

/** Aktive Turniere, deren Woche == weekStart. Soft-gelöschte werden ausgelassen. */
export function tournamentsForWeek<T extends CalendarWeekItem>(items: T[], weekStart: string): T[] {
  return items.filter((it) => !it.inactive && it.monday === weekStart);
}

/**
 * Eine Woche ist LEER, wenn WEDER manuelle Termine NOCH Turniere darin liegen.
 * Wichtig: eine Woche mit NUR einem Turnier (ohne handeingetragene Termine) ist der
 * Normalfall und darf NICHT als „keine Termine" gelten — sonst sieht ein Spieler, der
 * noch nie ein Training eingetragen hat, trotz geplantem Turnier „keine Termine".
 */
export function isWeekEmpty(eventCount: number, tournamentCount: number): boolean {
  return eventCount === 0 && tournamentCount === 0;
}

/**
 * Das nächste aktive Turnier NACH der aktuell sichtbaren Woche (Montag > weekEnd),
 * damit der Kalender vorwärts zeigen kann, wenn die Saison weiter hinten beginnt.
 * Rückgabe: das Element mit dem frühesten Montag, oder null.
 */
export function nextTournamentAfter<T extends CalendarWeekItem>(items: T[], weekEnd: string): T | null {
  let best: T | null = null;
  for (const it of items) {
    if (it.inactive || it.monday <= weekEnd) continue;
    if (best === null || it.monday < best.monday) best = it;
  }
  return best;
}
