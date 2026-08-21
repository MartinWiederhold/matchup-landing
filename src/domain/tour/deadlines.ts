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
 * ── World Tennis Tour JUNIORS (`itf_juniors`) — eigenständig belegt, NICHT von der WTT
 * übernommen. Quelle wörtlich: ITF World Tennis Tour Juniors 2026 Regulations, §39:
 *   - Entry (§39 i):      14:00 GMT, Dienstag, 20 Tage vor dem Turniermontag
 *   - Withdrawal (§39 i): 14:00 GMT, Dienstag, 13 Tage vor dem Turniermontag
 *   - Freeze (§39 vi):    14:00 GMT, Mittwoch vor der Turnierwoche (= 5 Tage vorher) — EINDEUTIG,
 *                          anders als bei der WTT keine zwei Lesarten (nur freezeVarianteA gesetzt).
 *
 *   ACHTUNG: Withdrawal (Di −13) und Freeze-Wochentag stimmen NUR ZUFÄLLIG mit der WTT
 *   überein. Sie sind oben eigenständig aus §39 des Junioren-Regelwerks belegt und dürfen
 *   NICHT als Kopie der WTT-Werte gelesen oder mit ihnen „vereinheitlicht" werden. Der
 *   Meldeschluss weicht ab (Di −20 statt Do −18).
 *
 *   Meldeschluss ist GRAD-ABHÄNGIG (§39 i): Di −20 gilt für J30/J60/J100/J200/J300.
 *   Grand Slam und J500 (samt Warm-ups) haben stattdessen EINEN von vier Abständen
 *   (41/34/27/20 Tage), turnierspezifisch — also NICHT als Formel berechenbar. Wie bei den
 *   Challengern wird der Entry dann NICHT geraten, sondern null zurückgegeben
 *   (Code `entry_unbekannt_j500_gs`). Ohne bekannten Grad: `entry_grad_unbekannt`.
 *
 *   Minderjährige: Unter 13 Jahren ist niemand meldeberechtigt (§4 b / Age Eligibility
 *   Chart, Note 3). Ohne Geburtsdatum kann die App das nicht PRÜFEN — sie soll es aber
 *   auch nicht verschweigen: jedes Junioren-Ergebnis trägt den Code
 *   `unter_13_nicht_meldeberechtigt`, den die UI später sichtbar machen kann.
 *
 * Hinweise werden nur als Codes zurückgegeben (`notes`), nie als Sätze — die
 * Übersetzung passiert später in der UI über i18n.
 */

// v2: Junioren-Regeln (itf_juniors) ergänzt; WTT/Challenger-Logik unverändert.
export const TOUR_RULES_VERSION = "v2";

export type TourSeries = "itf_wtt" | "challenger" | "itf_juniors" | "wta";

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
const WEDNESDAY = 3;
const THURSDAY = 4;

// Junioren-Grade mit dem festen 20-Tage-Meldeschluss (§39 i). Grand Slam / J500 (samt
// Warm-ups) fallen NICHT hierunter — ihr Meldeschluss ist turnierspezifisch (s. Datei-Doku).
const JUNIOR_STANDARD_GRADES = new Set(["J30", "J60", "J100", "J200", "J300"]);

/**
 * Baut aus dem Turniermontag (00:00 UTC) den Fristzeitpunkt: `minusDays` Tage davor,
 * 14:00 UTC. `new Date(ms)` erhält hier einen VOLLSTÄNDIG berechneten Zeitstempel —
 * das ist deterministisch und NICHT die verbotene Laufzeituhr (`new Date()`/`Date.now()`).
 * ms-Arithmetik behandelt Monats-, Jahres- und Schaltjahresgrenzen automatisch korrekt.
 */
function deadlineAt(mondayMs: number, minusDays: number): Date {
  return new Date(mondayMs - minusDays * DAY + GMT_1400);
}

// Wie deadlineAt, aber OHNE Uhrzeit (00:00 UTC). Für die WTA-Haupttour: das Regelwerk nennt
// nur ein DATUM (4 Wochen vor dem Montag), KEINE Uhrzeit — anders als die ITF (14:00 GMT).
// Deshalb hier bewusst keine Uhrzeit erfinden (nicht die ITF-Zeit annehmen, weil sie sonst
// überall steht). Reine Datumsableitung, deterministisch.
function deadlineDateOnly(mondayMs: number, minusDays: number): Date {
  return new Date(mondayMs - minusDays * DAY);
}

/**
 * Berechnet die Meldefristen eines Turniers aus dem Montag der Turnierwoche.
 *
 * @param tournamentMonday  Montag der Turnierwoche (wird auf 00:00 UTC des Kalendertags reduziert)
 * @param series            "itf_wtt" (Regeln bekannt) | "challenger" (unbekannt → null) | "itf_juniors"
 * @param grade             Turniergrad, NUR für "itf_juniors" ausgewertet (J30…J500). Bestimmt, ob der
 *                          Meldeschluss berechenbar ist (J30–J300) oder turnierspezifisch/unbekannt
 *                          (J500/Grand Slam). Für WTT/Challenger ohne Bedeutung.
 */
export function tourDeadlines(tournamentMonday: Date, series: TourSeries, grade?: string | null): TourDeadlines {
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

  if (series === "wta") {
    // WTA-HAUPTTOUR (WTA 125–1000). Meldeschluss belegt, wörtlich (WTA Rulebook, Section
    // III.A.2.a.i „Main Draw Entry Deadlines"):
    //   „Main Draw Entry Deadlines for WTA 1000 Mandatory, WTA 500, WTA 250, and WTA 125
    //    Tournaments are FOUR (4) WEEKS PRIOR TO THE MONDAY of the week in which each
    //    Tournament's Main Draw starts unless otherwise determined by the WTA. This deadline
    //    shall not apply to the WTA Finals."
    // → Entry = Turniermontag − 28 Tage. ZWEI bewusste Abweichungen von der ITF:
    //   (a) KEINE Uhrzeit im Regelwerk (ITF: 14:00 GMT) → nur Datum (deadlineDateOnly), keine
    //       ITF-Zeit annehmen.
    //   (b) Vorbehalt „unless otherwise determined by the WTA" → Frist ist BERECHNET, kann
    //       aber turnierspezifisch abweichen → Code `entry_kann_abweichen_wta` (die UI kann
    //       „berechnet, kann abweichen" zeigen; der Fact-Sheet-Hinweis deckt den Rest).
    // Withdrawal/Freeze: KEINE saubere Universalregel in Section III/V. Der Rückzug läuft über
    // „Late Withdrawal"-Strafen (Rang/Zeitpunkt), kein Offset wie ITF (Di −13). Ein Freeze
    // Deadline existiert nur BEDINGT: „If there is no Qualifying draw, the Freeze Deadline will
    // be 2:00 p.m. Eastern Time on the Thursday before the Tournament week" (V.A.1.b.iii) — zu
    // bedingt zum Rechnen. Daher beide null, als unbelegt gekennzeichnet.
    const wtaEntry = deadlineDateOnly(mondayMs, 28); // 4 Wochen vor dem Montag
    if (wtaEntry.getUTCDay() !== MONDAY) notes.push("entry_wochentag_inkonsistent");
    return {
      series,
      rulesVersion: TOUR_RULES_VERSION,
      tournamentMonday: monday,
      known: true,
      entry: wtaEntry,
      withdrawal: null,
      freezeVarianteA: null,
      freezeVarianteB: null,
      notes: [...notes, "entry_ohne_uhrzeit_wta", "entry_kann_abweichen_wta", "rueckzug_freeze_unbelegt_wta"],
    };
  }

  if (series === "itf_juniors") {
    // World Tennis Tour Juniors — Fristen eigenständig aus §39 belegt (s. Datei-Doku).
    // Withdrawal und Freeze sind grad-UNABHÄNGIG und immer bekannt:
    const jWithdrawal = deadlineAt(mondayMs, 13); // §39 i — Dienstag, 13 T vor dem Turniermontag
    const jFreeze = deadlineAt(mondayMs, 5); // §39 vi — Mittwoch vor der Turnierwoche (eindeutig)

    // Meldeschluss ist grad-abhängig (§39 i):
    const g = (grade ?? "").trim().toUpperCase();
    let jEntry: Date | null;
    if (JUNIOR_STANDARD_GRADES.has(g)) {
      jEntry = deadlineAt(mondayMs, 20); // Dienstag, 20 T vor dem Turniermontag
    } else if (g === "J500" || g === "JGS" || /grand\s*slam/i.test(g)) {
      // J500 und Junior Grand Slam (ITF-Kürzel „JGS"): 41/34/27/20 T — turnierspezifisch, NICHT geraten.
      jEntry = null;
      notes.push("entry_unbekannt_j500_gs");
    } else {
      jEntry = null; // Grad fehlt/unbekannt → Entry nicht bestimmbar, nicht geraten
      notes.push("entry_grad_unbekannt");
    }

    // Konsistenzprüfung Wochentage (bei Montags-Eingabe mathematisch erfüllt).
    if (jEntry && jEntry.getUTCDay() !== TUESDAY) notes.push("entry_wochentag_inkonsistent");
    if (jWithdrawal.getUTCDay() !== TUESDAY) notes.push("withdrawal_wochentag_inkonsistent");
    if (jFreeze.getUTCDay() !== WEDNESDAY) notes.push("freeze_wochentag_inkonsistent");

    // Minderjährige unter 13 nie meldeberechtigt — ohne Geburtsdatum nicht prüfbar, aber
    // benannt (nicht verschwiegen). Die UI kann diesen Code sichtbar machen.
    notes.push("unter_13_nicht_meldeberechtigt");

    return {
      series,
      rulesVersion: TOUR_RULES_VERSION,
      tournamentMonday: monday,
      known: true, // Serie ist bekannt; ein null-Entry (J500/GS) heißt NICHT „Serie unbekannt"
      entry: jEntry,
      withdrawal: jWithdrawal,
      freezeVarianteA: jFreeze, // eindeutige Freeze-Frist (keine zweite Lesart wie bei der WTT)
      freezeVarianteB: null,
      notes,
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
