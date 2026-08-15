/**
 * Trend der Alternate-Position aus dem Beobachtungs-Verlauf (web.tour_entry_events).
 *
 * Reine Funktion, deterministisch, KEINE Systemuhr — der Stichtag `asOf` kommt als
 * Parameter herein. Zwei bewusste Regeln (sonst suggeriert das Zeichen etwas Falsches):
 *   1) Bei nur EINER (aktuellen) Beobachtung KEIN Trend — kein Pfeil, kein neutraler
 *      Punkt: es gibt keine Vergleichsgröße.
 *   2) Ist die LETZTE Beobachtung älter als ~1 Woche, wird das DATUM gezeigt statt eines
 *      Trends („Alt #7, Stand 10.08." ist ehrlich, ein Pfeil wäre es nicht).
 *
 * Die aktuelle Position selbst steht an der Planzeile (tour_season_plan.alternate_position)
 * und wird immer angezeigt; DIESE Funktion liefert nur den Zusatz-Marker daneben.
 */
const DAY = 86_400_000;
const STALE_DAYS = 7; // letzte Beobachtung älter → Datum statt Trend

export type EntryTrend =
  | { kind: "none" }                          // < 2 aktuelle Beobachtungen → kein Marker
  | { kind: "stale"; observedAt: string }     // letzte Beobachtung zu alt → Datum zeigen
  | { kind: "up" | "down" | "flat"; delta: number }; // delta = alt − neu (>0 = hochgerückt)

type Obs = { observedAt: string; alternatePosition: number | null };

/** UTC-Mitternacht eines ISO-Datums (YYYY-MM-DD); NaN bei ungültig. */
function parseDay(iso: string): number {
  return Date.parse(iso + "T00:00:00Z");
}

export function alternateTrend(observations: Obs[], asOf: string): EntryTrend {
  // Nur Beobachtungen MIT Position (= Alternate-Stände), chronologisch.
  const pos = observations
    .filter((o) => o.alternatePosition != null)
    .slice()
    .sort((a, b) => a.observedAt.localeCompare(b.observedAt));
  if (pos.length === 0) return { kind: "none" };

  const last = pos[pos.length - 1];
  // Regel 2 zuerst: eine zu alte letzte Beobachtung macht jeden Trend unehrlich.
  const days = Math.floor((parseDay(asOf) - parseDay(last.observedAt)) / DAY);
  if (days > STALE_DAYS) return { kind: "stale", observedAt: last.observedAt };

  // Regel 1: mit nur einer (aktuellen) Beobachtung fehlt die Vergleichsgröße.
  if (pos.length < 2) return { kind: "none" };

  const prev = pos[pos.length - 2];
  const delta = (prev.alternatePosition as number) - (last.alternatePosition as number);
  return { kind: delta > 0 ? "up" : delta < 0 ? "down" : "flat", delta };
}

/**
 * Beobachtungen für die Verlaufsansicht: chronologisch, NEUESTE ZUERST, jede mit dem
 * Abstand (`gapDays`) zur vorigen (älteren) Beobachtung. So wird das TEMPO sichtbar —
 * #12 → #7 in 3 Tagen (gapDays 3) ist etwas anderes als in 3 Wochen (gapDays 21), obwohl
 * der Pfeil beides gleich zeigt. Reine Funktion. Der älteste Eintrag hat gapDays = null.
 */
type HistObs = { id: string; observedAt: string; status: string; alternatePosition: number | null; note: string | null };
export type HistoryRow = HistObs & { gapDays: number | null };

export function entryHistory(observations: HistObs[]): HistoryRow[] {
  const sorted = observations
    .slice()
    .sort((a, b) => a.observedAt.localeCompare(b.observedAt)); // alt → neu
  const rows: HistoryRow[] = sorted.map((o, i) => ({
    ...o,
    gapDays: i === 0 ? null : Math.floor((parseDay(o.observedAt) - parseDay(sorted[i - 1].observedAt)) / DAY),
  }));
  return rows.reverse(); // neueste zuerst
}
