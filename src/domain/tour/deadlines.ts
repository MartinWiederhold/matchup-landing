/**
 * Fristen-Rechner für die Tour (Domain-Schicht, v1).
 *
 *   Turniermontag (UTC) + Serie  →  Meldefristen als UTC-Zeitpunkte
 *
 * Reine Funktion, keine Seiteneffekte, keine Laufzeituhr: alles, was Zeit braucht,
 * kommt als Parameter herein. Damit ist das Ergebnis für gleiche Eingabe immer
 * identisch (per Unit-Test abgesichert) und nicht von `new Date()`/`Date.now()`
 * abhängig. Es wird ausschließlich in UTC gerechnet (keine Zeitzonen-Bibliothek).
 *
 * Bezugspunkt aller Fristen ist der **Montag der Turnierwoche**. Regeln wörtlich aus
 * der ITF World Tennis Tour FAQ:
 *   - Entry:      14:00 GMT, Donnerstag, 18 Tage vor dem Turniermontag
 *   - Withdrawal: 14:00 GMT, Dienstag,   13 Tage vor dem Turniermontag
 *   - Freeze:     14:00 GMT, Donnerstag,  4 Tage vor „the Monday preceding the Tournament Week"
 *
 * Die Freeze-Formulierung ist mehrdeutig ("the Monday preceding the Tournament Week"
 * kann der Turniermontag selbst ODER der Montag eine Woche davor sein). Deshalb werden
 * BEIDE Lesarten berechnet und zurückgegeben (freezeVarianteA/B); die Domain entscheidet
 * sich bewusst NICHT für eine — das wird extern gegen ein echtes Turnier geprüft.
 *
 * Hinweise werden nur als Codes zurückgegeben (`notes`), nie als Sätze — die
 * Übersetzung passiert später in der UI über i18n.
 */

export const TOUR_RULES_VERSION = "v1";

export type TourSeries = "itf_wtt" | "challenger";

export type TourDeadlines = {
  series: TourSeries;
  rulesVersion: string;
  /** Turniermontag, normalisiert auf 00:00 UTC. */
  tournamentMonday: Date;
  /** true, wenn die Fristen bekannt/berechnet sind (nur ITF), sonst false (Challenger). */
  known: boolean;
  entry: Date | null;
  withdrawal: Date | null;
  /** Lesart A: „the Monday preceding the Tournament Week" = der Turniermontag selbst → 4 T davor. */
  freezeVarianteA: Date | null;
  /** Lesart B: „the Monday preceding the Tournament Week" = der Montag EINE Woche vor dem Turniermontag → 4 T davor (= 11 T vor dem Turniermontag). */
  freezeVarianteB: Date | null;
  /** Nur Codes (z. B. "regel_unbekannt", "eingabe_kein_montag"), keine Fließtexte. */
  notes: string[];
};

const DAY = 86_400_000; // ms/Tag
const HOUR = 3_600_000; // ms/Stunde
const GMT_1400 = 14 * HOUR; // 14:00 GMT = 14:00 UTC als Offset ab Tagesbeginn

// Wochentage nach getUTCDay(): 0=So … 6=Sa.
const MONDAY = 1;
const TUESDAY = 2;
const THURSDAY = 4;

/**
 * Baut aus dem Turniermontag (00:00 UTC) den Fristzeitpunkt: `minusDays` Tage davor,
 * 14:00 UTC. `new Date(ms)` erhält hier einen VOLLSTÄNDIG berechneten Zeitstempel —
 * das ist deterministisch und NICHT die verbotene Laufzeituhr (`new Date()`/`Date.now()`).
 * ms-Arithmetik behandelt Monats-, Jahres- und Schaltjahresgrenzen automatisch korrekt.
 */
function deadlineAt(mondayMs: number, minusDays: number): Date {
  return new Date(mondayMs - minusDays * DAY + GMT_1400);
}

/**
 * Berechnet die Meldefristen eines Turniers aus dem Montag der Turnierwoche.
 *
 * @param tournamentMonday  Montag der Turnierwoche (wird auf 00:00 UTC des Kalendertags reduziert)
 * @param series            "itf_wtt" (Regeln bekannt) | "challenger" (Regeln unbekannt → null)
 */
export function tourDeadlines(tournamentMonday: Date, series: TourSeries): TourDeadlines {
  // Eingabe auf den Kalendertag (00:00 UTC) reduzieren — reine Ableitung aus den
  // UTC-Feldern der Eingabe, keine Laufzeituhr.
  const mondayMs = Date.UTC(
    tournamentMonday.getUTCFullYear(),
    tournamentMonday.getUTCMonth(),
    tournamentMonday.getUTCDate(),
  );
  const monday = new Date(mondayMs);

  const notes: string[] = [];
  // Ehrlichkeits-Check: Ist die Eingabe überhaupt ein Montag?
  if (monday.getUTCDay() !== MONDAY) notes.push("eingabe_kein_montag");

  if (series === "challenger") {
    // Für Challenger kennen wir die offiziellen Fristen NICHT und raten sie bewusst nicht.
    // (Zum Vergleich: src/lib/deadlines.ts rät für Challenger 21 Tage vor dem Turniermontag
    //  als Entry und Freitag vor der Turnierwoche als Withdrawal. Diese Werte sind
    //  ungesichert; hier werden sie absichtlich NICHT übernommen, sondern null zurückgegeben.)
    return {
      series,
      rulesVersion: TOUR_RULES_VERSION,
      tournamentMonday: monday,
      known: false,
      entry: null,
      withdrawal: null,
      freezeVarianteA: null,
      freezeVarianteB: null,
      notes: [...notes, "regel_unbekannt"],
    };
  }

  // ITF World Tennis Tour (Singles) — alle Fristen 14:00 GMT (= UTC).
  const entry = deadlineAt(mondayMs, 18); // Donnerstag, 18 T vor dem Turniermontag
  const withdrawal = deadlineAt(mondayMs, 13); // Dienstag, 13 T vor dem Turniermontag
  // Freeze — beide Lesarten (siehe Datei-Doku), jeweils 4 T vor „dem Montag":
  const freezeVarianteA = deadlineAt(mondayMs, 4); // Lesart A: Turniermontag selbst → −4 T
  const freezeVarianteB = deadlineAt(mondayMs, 11); // Lesart B: Montag davor → −4 T (= −11 T)

  // Konsistenzprüfung: fällt die genannte Tagesdifferenz auf den genannten Wochentag?
  // (Mathematisch immer erfüllt, wenn die Eingabe ein Montag ist: 18 mod 7 → Do, 13 mod 7 → Di.
  //  Bei Abweichung wird der Widerspruch als Code gemeldet, nicht stillschweigend aufgelöst.)
  if (entry.getUTCDay() !== THURSDAY) notes.push("entry_wochentag_inkonsistent");
  if (withdrawal.getUTCDay() !== TUESDAY) notes.push("withdrawal_wochentag_inkonsistent");

  return {
    series,
    rulesVersion: TOUR_RULES_VERSION,
    tournamentMonday: monday,
    known: true,
    entry,
    withdrawal,
    freezeVarianteA,
    freezeVarianteB,
    notes,
  };
}
