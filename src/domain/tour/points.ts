/**
 * ATP-Ranglistenpunkte-Rechner für die Tour (Domain-Schicht, v1).
 *
 *   Liste erzielter Ergebnisse (Kategorie, Runde, Turnierwoche) + Stichtag
 *   →  Punkte je Ergebnis, Summe der ZÄHLENDEN Ergebnisse, bald ablaufende Ergebnisse
 *
 * Reine Funktion: keine DB, kein Netzwerk, KEINE Systemzeit. Der Stichtag ist ein
 * PFLICHTPARAMETER — bewusst KEIN `new Date()`-/`Date.now()`-Default: ein Default zur
 * Systemuhr macht das Ergebnis von der Laufzeit abhängig (genau der Fehler, den /app
 * heute mit `totalProjected = curPoints + projPoints` ohne jeden Verfall macht, MU-016).
 * Gleiche Eingabe ⇒ gleiches Ergebnis (per Unit-Test abgesichert). Es wird ausschließlich
 * in UTC gerechnet. Rückgaben tragen nur Codes, keine Sätze — Übersetzung später per i18n.
 *
 * Alle Zahlen stammen aus `scripts/punkte-tabellen-report.md` §3 (ATP-Regelwerk Kapitel 9
 * „PIF ATP Rankings", Fassungen 2024/2025/2026, per Spaltengeometrie verifiziert). Nichts
 * geschätzt, nichts aus dem Gedächtnis ergänzt.
 *
 * Belegte Regeln, die hier abgebildet sind:
 *  - Punkte gelten 52 Wochen (= 364 Tage) ab Wirksamwerden, dann fallen sie weg.
 *  - ITF-Turniere kommen erst am ZWEITEN Montag nach der Turnierwoche ins System
 *    (Regel 9.01 E, 2024 S.249 / 2026 S.267) → ITF-Verfall beginnt +14 Tage später als
 *    bei Challenger. Challenger wird ab dem Montag der Turnierwoche wirksam (kein
 *    zusätzlicher belegter Verzug im Bericht → kein erfundener Offset).
 *  - Keine Punkte für eine Erstrundenniederlage bei Challenger und ITF (9.03 G.2).
 *  - Challenger geben nur bis R16 Punkte; R32/R64/R128 sind in den Tabellen leer (geprüft).
 *  - Qualifikationspunkte gibt es bei Challenger (Q/Q2), bei ITF NICHT (9.03 G.3-Ausnahme).
 *  - Die Punktetabellen sind JAHRESABHÄNGIG: M25 F/SF wurden 2026 von 16/8 auf 14/7 gesenkt.
 *    Maßgeblich ist das Jahr des ERGEBNISSES (der Turnierwoche), nicht das aktuelle Jahr.
 *  - Zählende Ergebnisse: 2024/2025 die besten sieben, ab 2026 die besten sechs neben den
 *    Pflichtturnieren (9.03 A/B). Für die Zielgruppe (ohne Pflichtturniere) schlicht: best n.
 */

/**
 * ── DAMEN (WTA-Punkte, Frauen-WTT W15–W100) ─────────────────────────────────
 * Quelle: 2026 ITF Men's & Women's World Tennis Tour Regulations, Appendix K „WTA /
 * ITF World Tennis Ranking Point Tables", Abschnitt 1 „WTA Ranking Points" (S. 180).
 * Das sind WTA-Punkte — NICHT aus den ATP-Werten abgeleitet, sie unterscheiden sich je Runde.
 *
 * ‼️ WICHTIG — anders als bei der ATP hängen die WTA-Punkte von der FELDGRÖSSE ab (48er- vs.
 * 32er-Hauptfeld). Wer das später „vereinheitlicht" (eine Tabelle je Kategorie wie bei den
 * Herren, ohne Feldgröße), macht es falsch. Beispiel W35: R16 = 5 (48S) ODER 4 (32S).
 *
 * Der ITF-Endpunkt liefert KEINE Feldgröße (27 Felder geprüft: category, prizeMoney, …, aber
 * kein drawSize/mainDrawSize). Deshalb ist hier die **32er-Zeile** je Kategorie hinterlegt —
 * eine ANNAHME, nicht belegt fürs Einzelturnier. Formatabhängig weicht davon ab: W35 R16 4
 * statt 5 (und die unteren Runden R32/R48). Für W15/W50/W75/W100 sind W…R16 formatgleich.
 *
 * W25 gibt es 2026 offiziell nicht (Altname, vor 2024 → W35). Bewusst NICHT gemappt → null.
 */

// v2: WTA-Punktemodell (Damen W15–W100) ergänzt; ATP/Challenger-Logik unverändert.
// v3: WTA-Aggregatregel — Damen-Zählgrenze best 18 (WTA VIII.4.a.i), Herren unverändert.
export const POINTS_RULES_VERSION = "v3";

const DAY = 86_400_000; // ms/Tag
const VALID_DAYS = 364; // 52 Wochen Gültigkeit ab Wirksamwerden
const ITF_ENTRY_DELAY_DAYS = 14; // zweiter Montag nach der Turnierwoche (9.01 E)

// ── Kategorien ──────────────────────────────────────────────────────────────
export type PointsCategory =
  | "challenger_175" | "challenger_125" | "challenger_100" | "challenger_75" | "challenger_50"
  | "m25" | "m25_h" | "m15" | "m15_h"
  // Damen (WTA): W15–W100. Getrennte Tabelle, andere Werte als die Herren.
  | "w15" | "w35" | "w50" | "w75" | "w100";

// Runden inkl. Qualifikationsstufen. R32 = Erstrundenverlust im 32er-Feld (gültige Runde,
// aber 0 Punkte — kein Rate-Fall). R64/R128/Q3 kommen für diese Kategorien nicht vor.
export type PointsRound = "W" | "F" | "SF" | "QF" | "R16" | "R32" | "Q" | "Q2";

const CHALLENGER_CATS: ReadonlySet<string> = new Set([
  "challenger_175", "challenger_125", "challenger_100", "challenger_75", "challenger_50",
]);
const ITF_CATS: ReadonlySet<string> = new Set(["m25", "m25_h", "m15", "m15_h"]);
const WOMEN_CATS: ReadonlySet<string> = new Set(["w15", "w35", "w50", "w75", "w100"]);
const VALID_ROUNDS: ReadonlySet<string> = new Set(["W", "F", "SF", "QF", "R16", "R32", "Q", "Q2"]);

// ── Punktetabellen (Quelle: ATP-Regelwerk Kap. 9, „5) Singles Point table") ──
//
// Challenger-Einzel — über 2024 (gedruckt S.254), 2025 (S.265) und 2026 (S.272–273) ZAHL
// FÜR ZAHL identisch (Bericht §3a). R32/R64/R128 sind leer → hier schlicht nicht gelistet
// (Erstrundenverlust = 0). Q/Q2 = Qualifikationspunkte (nur Challenger).
const CHALLENGER_POINTS: Record<string, Partial<Record<PointsRound, number>>> = {
  challenger_175: { W: 175, F: 90, SF: 50, QF: 25, R16: 13, Q: 6, Q2: 3 },
  challenger_125: { W: 125, F: 64, SF: 35, QF: 16, R16: 8, Q: 5, Q2: 3 },
  challenger_100: { W: 100, F: 50, SF: 25, QF: 14, R16: 7, Q: 4, Q2: 2 },
  challenger_75: { W: 75, F: 44, SF: 22, QF: 12, R16: 6, Q: 4, Q2: 2 },
  challenger_50: { W: 50, F: 25, SF: 14, QF: 8, R16: 4, Q: 3, Q2: 1 },
};

// ITF Men's WTT im ATP-Ranking (Hauptfeld, Bericht §3b). +H (Hospitality) ändert die
// ATP-Punkte NICHT — das Regelwerk führt M25 und M25+H in EINER Zeile. Qualifikanten
// erhalten bei ITF KEINEN Bonus (9.03 G.3-Ausnahme) → keine Q/Q2.
//
// 2024 (gedruckt S.254) und 2025 (S.265): M25 F=16, SF=8.
const ITF_POINTS_2024_2025: Record<string, Partial<Record<PointsRound, number>>> = {
  m25: { W: 25, F: 16, SF: 8, QF: 3, R16: 1 },
  m25_h: { W: 25, F: 16, SF: 8, QF: 3, R16: 1 },
  m15: { W: 15, F: 8, SF: 4, QF: 2, R16: 1 },
  m15_h: { W: 15, F: 8, SF: 4, QF: 2, R16: 1 },
};
// 2026 (gedruckt S.273): M25 Finale 16→14, Halbfinale 8→7 gesenkt. M15 unverändert.
const ITF_POINTS_2026: Record<string, Partial<Record<PointsRound, number>>> = {
  m25: { W: 25, F: 14, SF: 7, QF: 3, R16: 1 },
  m25_h: { W: 25, F: 14, SF: 7, QF: 3, R16: 1 },
  m15: { W: 15, F: 8, SF: 4, QF: 2, R16: 1 },
  m15_h: { W: 15, F: 8, SF: 4, QF: 2, R16: 1 },
};

// Zusammengesetzte Jahrgangstabellen (Challenger identisch, nur ITF-M25 unterscheidet sich).
const ATP_SINGLES_POINTS_2024_2025: Record<string, Partial<Record<PointsRound, number>>> = {
  ...CHALLENGER_POINTS, ...ITF_POINTS_2024_2025,
};
const ATP_SINGLES_POINTS_2026: Record<string, Partial<Record<PointsRound, number>>> = {
  ...CHALLENGER_POINTS, ...ITF_POINTS_2026,
};

// ── WTA-Einzel (Damen-WTT) — Appendix K §1, „WTA Ranking Points", S. 180 (2026). ──
// Hinterlegt ist je Kategorie die **32er-Hauptfeld-Zeile** (32S) — der Endpunkt liefert
// keine Feldgröße (s. Datei-Doku), 32S ist die dokumentierte ANNAHME. Q/Q2 = QFR/FQR
// (Qualifier / Qualifying-Finalist) aus derselben Tabelle.
// FORMAT-ABWEICHUNG (48S): W35 R16 5 statt 4 (und untere Runden). W15/W50/W75/W100 sind
// bis R16 formatgleich. NICHT „vereinheitlichen" — WTA ist feldgrößenabhängig, ATP nicht.
const WTA_SINGLES_POINTS: Record<string, Partial<Record<PointsRound, number>>> = {
  w100: { W: 100, F: 65, SF: 39, QF: 21, R16: 12, R32: 1, Q: 5, Q2: 3 },
  w75: { W: 75, F: 49, SF: 29, QF: 16, R16: 9, R32: 1, Q: 3, Q2: 2 },
  w50: { W: 50, F: 33, SF: 20, QF: 11, R16: 6, R32: 1, Q: 2, Q2: 1 },
  w35: { W: 35, F: 23, SF: 14, QF: 8, R16: 4, Q: 1 }, // 32S: R32-Erstrundenverlust = 0 (kein Eintrag); FQR entfällt
  w15: { W: 15, F: 10, SF: 6, QF: 3, R16: 1 }, // 32S: keine Quali-Punkte, R32 = 0
};

// ── Ein-/Ausgabetypen ───────────────────────────────────────────────────────
/** Ein erzieltes Ergebnis. `category`/`round` bewusst als string, damit unbekannte Werte erkennbar bleiben. */
export type MatchResult = {
  category: string;
  round: string;
  /** Montag der Turnierwoche als ISO-Datum (YYYY-MM-DD). Anker für Jahrgang UND Wirksamwerden. */
  tournamentMonday: string;
};

export type ScoredResult = {
  category: string;
  round: string;
  points: number; // 0 bei Erstrunde, ITF-Quali, unbekannter Kategorie/Runde
  tableYear: 2025 | 2026; // angewandte Jahrgangs-Ära (2025 = Werte 2024/2025)
  effectiveDate: string; // ab wann im System (52-Wochen-Start); "" bei ungültigem Datum
  expiresOn: string; // effectiveDate + 364 Tage; "" bei ungültigem Datum
  counts: boolean; // wirksam zum Stichtag UND (bei Punkten>0) unter den besten n
  notes: string[]; // nur Codes
};

export type PointsSummary = {
  rulesVersion: string;
  results: ScoredResult[]; // in Eingabereihenfolge
  countingLimit: 6 | 7 | 18; // Herren best 6/7 (ATP 9.03 A/B) · Damen best 18 (WTA VIII.4.a.i)
  countingTotal: number; // Summe der zählenden Ergebnisse
  expiringSoon: { index: number; expiresOn: string }[]; // wirksame Ergebnisse, die bald verfallen
  notes: string[]; // nur Codes (globale Hinweise)
};

// ── Datums-Helfer (UTC, deterministisch — kein Laufzeit-Clock) ───────────────
/** Parst ein ISO-Datum (YYYY-MM-DD) als UTC-Mitternacht; NaN bei ungültig. */
function parseUtcDay(iso: string): number {
  return Date.parse(iso + "T00:00:00Z");
}
/** UTC-Zeitstempel → ISO-Kalendertag. `new Date(ms)` ist deterministisch (kein Clock). */
function isoDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Wählt die Jahrgangs-Ära der Punktetabelle nach dem Jahr der Turnierwoche.
 * Beleg: 2024 = 2025 (M25 F16/SF8), 2026 (M25 F14/SF7). Außerhalb 2024–2026 nicht belegt
 * → Hinweiscode, und die nächstliegende belegte Ära wird verwendet (≥2026 → 2026, sonst 2025).
 */
function eraForYear(year: number, notes: string[]): 2025 | 2026 {
  if (year < 2024 || year > 2026) notes.push("tabellenjahr_ausserhalb_beleg");
  return year >= 2026 ? 2026 : 2025;
}

/** Schlägt die Punkte für Kategorie+Runde in der Jahrgangstabelle nach; liefert ggf. einen Hinweiscode. */
function lookupPoints(category: string, round: string, era: 2025 | 2026): { points: number; note?: string } {
  const isWoman = WOMEN_CATS.has(category);
  if (!isWoman && !CHALLENGER_CATS.has(category) && !ITF_CATS.has(category)) return { points: 0, note: "unbekannte_kategorie" };
  if (!VALID_ROUNDS.has(round)) return { points: 0, note: "unbekannte_runde" };

  // Damen (WTA): eigene Tabelle, KEINE Jahrgangs-Ära (nur 2026 belegt), keine ATP-Sonderregeln.
  if (isWoman) {
    const wval = WTA_SINGLES_POINTS[category]?.[round as PointsRound];
    if (typeof wval === "number") return { points: wval };
    // Gültige Runde ohne Wert in dieser Kategorie (z. B. W35/W15 R32 im 32er-Feld) = 0.
    return { points: 0, note: "keine_punkte" };
  }

  // Herren (ATP/Challenger + ITF-M).
  const table = era === 2026 ? ATP_SINGLES_POINTS_2026 : ATP_SINGLES_POINTS_2024_2025;
  const val = table[category]?.[round as PointsRound];
  if (typeof val === "number") return { points: val };

  // Gültige Runde, aber kein Punktwert in dieser Kategorie → belegte Null, kein Rate-Fall:
  if (round === "R32") return { points: 0, note: "kein_punkt_erstrunde" }; // 9.03 G.2
  if ((round === "Q" || round === "Q2") && ITF_CATS.has(category)) return { points: 0, note: "kein_quali_itf" }; // 9.03 G.3
  return { points: 0, note: "keine_punkte" };
}

// ── v3-Optimierer: ERWARTUNGSPUNKTE (vor der Saison) ──────────────────────────
// Anders als scorePoints (bewertet ERZIELTE Ergebnisse) schätzt dies die Punkte unter
// EINER sichtbaren Annahme: „der Spieler erreicht Runde `round`". Rein/deterministisch,
// dieselbe Jahrgangs-Ära + Tabelle wie scorePoints. Die DB-Kategorie ist der Anzeigetext
// („M25", „Challenger 125") — bei Challengern IST die Zahl die Punktestufe (MU-028 hier
// korrekt: kein Preisgeld, sondern die belegte Punkte-Kategorie).
const CAT_DISPLAY_TO_POINTS: Record<string, PointsCategory> = {
  m15: "m15",
  m25: "m25",
  "challenger 50": "challenger_50",
  "challenger 75": "challenger_75",
  "challenger 100": "challenger_100",
  "challenger 125": "challenger_125",
  "challenger 175": "challenger_175",
  // Damen (WTA). W25 fehlt BEWUSST — 2026 keine gültige Kategorie (Altname) → toPointsCategory=null.
  w15: "w15",
  w35: "w35",
  w50: "w50",
  w75: "w75",
  w100: "w100",
};

/** DB-Kategorie („M25", „Challenger 125") → PointsCategory. Unbekannt/null → null. */
export function toPointsCategory(category: string | null): PointsCategory | null {
  if (!category) return null;
  return CAT_DISPLAY_TO_POINTS[category.trim().toLowerCase()] ?? null;
}

/**
 * Erwartete Punkte eines Turniers unter der Annahme „mindestens Runde `round` erreicht".
 * `note` (Code) begründet eine 0: `erwartungspunkte_null` (Kategorie unbekannt),
 * `kein_punkt_erstrunde` (R32 zählt nicht, 9.03 G.2), `kein_quali_itf`, `ungueltiges_datum`.
 * @param tournamentMonday Montag der Turnierwoche als ISO-Datum (YYYY-MM-DD) — Jahrgangs-Anker.
 */
export function expectedPoints(category: string | null, round: PointsRound, tournamentMonday: string): { points: number; note?: string } {
  const cat = toPointsCategory(category);
  if (!cat) return { points: 0, note: "erwartungspunkte_null" };
  const ms = parseUtcDay(tournamentMonday);
  if (Number.isNaN(ms)) return { points: 0, note: "ungueltiges_datum" };
  const era = eraForYear(new Date(ms).getUTCFullYear(), []);
  return lookupPoints(cat, round, era);
}

/**
 * Berechnet Punkte, Zählstand und Verfall aus einer Ergebnisliste zum Stichtag.
 *
 * @param results  erzielte Ergebnisse (Reihenfolge egal; Ausgabe bleibt in Eingabereihenfolge)
 * @param asOf     Stichtag als ISO-Datum (PFLICHT — keine Systemuhr)
 * @param opts     expiringWithinDays: Fenster „bald ablaufend" in Tagen (Default 28 = 4 Wochen)
 */
export function scorePoints(
  results: MatchResult[],
  asOf: string,
  opts?: { expiringWithinDays?: number },
): PointsSummary {
  const horizon = opts?.expiringWithinDays ?? 28;
  const topNotes: string[] = [];

  const asOfMs = parseUtcDay(asOf);
  if (Number.isNaN(asOfMs)) {
    return {
      rulesVersion: POINTS_RULES_VERSION,
      results: [], countingLimit: 7, countingTotal: 0, expiringSoon: [],
      notes: ["ungueltiger_stichtag"],
    };
  }
  const asOfYear = new Date(asOfMs).getUTCFullYear();

  // WTA vs. ATP: Damen-Ranking zählt ANDERS als das der Herren. Belegt aus dem WTA-Regelwerk
  // (2026 WTA Rulebook, Section VIII.4.a.i, S.141): beste ACHTZEHN (18) Ergebnisse über 52
  // Wochen (für die Zielgruppe ohne Pflichtturniere: best 7 + 11 nicht gezählte Pflichtplätze
  // = 18). Die Herren-Zählgrenze (best 6/7, ATP 9.03 A/B) gilt NICHT für Damen.
  // Erkennung: alle wertbaren Kategorien sind Damen-Kategorien (und keine Herren-Kategorie).
  const cats = results.map((r) => toPointsCategory(r.category));
  const anyWomen = cats.some((c) => c != null && WOMEN_CATS.has(c));
  const anyMen = cats.some((c) => c != null && (CHALLENGER_CATS.has(c) || ITF_CATS.has(c)));
  const wtaRanking = anyWomen && !anyMen;

  // Zählgrenze: Damen 18 (WTA), sonst nach Jahr des Stichtags (ATP 9.03 A/B): ≤2025 → 7, ≥2026 → 6.
  const countingLimit: 6 | 7 | 18 = wtaRanking ? 18 : asOfYear >= 2026 ? 6 : 7;
  if (!wtaRanking && (asOfYear < 2024 || asOfYear > 2026)) topNotes.push("zaehlgrenze_ausserhalb_beleg");
  // LÜCKE (belegt-teilweise): Die WTA-EINRECHNUNGS-VERZÖGERUNG ist nur für W15/W35 belegt
  // („mind. 1 Woche nach Turnierende", VIII.3.d) und dort unscharf; für W50/W75/W100 NICHT
  // genannt. Bis zur Klärung nutzt das Wirksamwerden unten für Damen KEINEN Verzug (wie
  // Challenger). Das kann den Verfallszeitpunkt um ~1–2 Wochen zu früh legen. Siehe MU-046.
  if (wtaRanking) topNotes.push("wta_einrechnung_verzoegerung_unbelegt");

  // 1) Jedes Ergebnis bewerten: Punkte, Wirksamwerden, Verfall.
  const scored: ScoredResult[] = results.map((r): ScoredResult => {
    const notes: string[] = [];
    const mondayMs = parseUtcDay(r.tournamentMonday);
    if (Number.isNaN(mondayMs)) {
      return {
        category: r.category, round: r.round, points: 0, tableYear: 2025,
        effectiveDate: "", expiresOn: "", counts: false, notes: ["ungueltiges_datum"],
      };
    }
    if (new Date(mondayMs).getUTCDay() !== 1) notes.push("eingabe_kein_montag");

    const era = eraForYear(new Date(mondayMs).getUTCFullYear(), notes);
    const { points, note } = lookupPoints(r.category, r.round, era);
    if (note) notes.push(note);

    // Wirksamwerden: ITF (Herren) erst am zweiten Montag danach (+14 T), Challenger ab Montag.
    // Damen (WTA): Zählgrenze ist belegt (best 18, oben), aber die EINRECHNUNGS-VERZÖGERUNG
    // ist es nur für W15/W35 („mind. 1 Woche", VIII.3.d) und dort unscharf, für W50+ gar nicht.
    // Deshalb hier bewusst KEIN Verzug für Damen (Kategorie nicht in ITF_CATS) — als Lücke
    // gekennzeichnet (topNotes: wta_einrechnung_verzoegerung_unbelegt), Ausbau in MU-046.
    const effMs = mondayMs + (ITF_CATS.has(r.category) ? ITF_ENTRY_DELAY_DAYS * DAY : 0);
    const expMs = effMs + VALID_DAYS * DAY;

    if (asOfMs < effMs) notes.push("noch_nicht_im_system"); // ITF-Verzögerung noch nicht abgelaufen
    else if (asOfMs >= expMs) notes.push("verfallen"); // 52 Wochen vorbei

    return {
      category: r.category, round: r.round, points, tableYear: era,
      effectiveDate: isoDay(effMs), expiresOn: isoDay(expMs),
      counts: false, // vorläufig; in Schritt 2 gesetzt
      notes,
    };
  });

  // 2) Zählende Ergebnisse: unter den zum Stichtag wirksamen mit Punkten>0 die besten n.
  //    Deterministischer Tie-Break: Punkte desc → effectiveDate asc → Eingabe-Index asc.
  const eligible = scored
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.points > 0 && !s.notes.includes("noch_nicht_im_system") && !s.notes.includes("verfallen"));
  eligible.sort(
    (a, b) =>
      b.s.points - a.s.points ||
      (a.s.effectiveDate < b.s.effectiveDate ? -1 : a.s.effectiveDate > b.s.effectiveDate ? 1 : 0) ||
      a.i - b.i,
  );
  let countingTotal = 0;
  eligible.forEach((e, rank) => {
    if (rank < countingLimit) {
      e.s.counts = true;
      countingTotal += e.s.points;
    } else {
      e.s.notes.push("nicht_unter_besten_n");
    }
  });

  // 3) Bald ablaufend: wirksame Ergebnisse mit Punkten>0, deren Verfall in [asOf, asOf+horizon) liegt.
  const horizonEnd = asOfMs + horizon * DAY;
  const expiringSoon = scored
    .map((s, i) => ({ s, i }))
    .filter(
      ({ s }) =>
        s.points > 0 &&
        !s.notes.includes("noch_nicht_im_system") &&
        !s.notes.includes("verfallen") &&
        (() => {
          const exp = parseUtcDay(s.expiresOn);
          return exp >= asOfMs && exp < horizonEnd;
        })(),
    )
    .map(({ s, i }) => ({ index: i, expiresOn: s.expiresOn }));

  return {
    rulesVersion: POINTS_RULES_VERSION,
    results: scored,
    countingLimit,
    countingTotal,
    expiringSoon,
    notes: topNotes,
  };
}
