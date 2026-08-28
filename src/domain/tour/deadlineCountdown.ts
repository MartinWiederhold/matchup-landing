/**
 * Einheitliche Countdown-Auswertung für Meldefristen (Domain-Schicht).
 *
 * Vorher gab es zwei Rechenstellen: Zone C im Overview rechnete gegen die
 * Echtzeit-Uhr („2d 18h"), das Action-Board rechnete gegen Mitternacht UTC des
 * aktuellen Tages („in 3 days"). Für dasselbe Turnier standen dadurch zwei
 * unterschiedliche Werte auf demselben Bildschirm.
 *
 * Diese Funktion legt EINE Rechnung fest: Ganze Tage, gemessen ab einem
 * gemeinsamen Bezugszeitpunkt (Mitternacht UTC des aktuellen Tages). Sie ist
 * eine reine Funktion — kein `Date.now()` intern — und lässt sich damit
 * deterministisch testen. Formatierung passiert außerhalb, damit i18n-Texte
 * frei bleiben.
 */

const DAY_MS = 86_400_000;

export type DeadlineCountdown =
  | { kind: "past"; daysAgo: number }
  | { kind: "same-day" }
  | { kind: "future"; days: number };

export function deadlineCountdown(deadlineMs: number, asOfMs: number): DeadlineCountdown {
  const diff = deadlineMs - asOfMs;
  if (diff < 0) {
    // Wie lange ist die Frist schon rum — floor macht 1.5 Tage zu „vor 1 Tag".
    return { kind: "past", daysAgo: Math.floor(-diff / DAY_MS) };
  }
  const days = Math.floor(diff / DAY_MS);
  if (days === 0) return { kind: "same-day" };
  return { kind: "future", days };
}
