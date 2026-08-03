/**
 * Schengen-90/180-Rechner auf TATSÄCHLICHEN Aufenthalten (Domain-Schicht, v1).
 *
 *   Liste tatsächlicher Aufenthalte (ISO-Land, Ein-/Ausreise) + Stichtag
 *   →  verbrauchte Tage im ungünstigsten rollierenden 180-Tage-Fenster
 *
 * Reine Funktion: keine DB, kein Netzwerk, KEINE Systemzeit. Der Stichtag ist ein
 * PFLICHTPARAMETER — bewusst KEIN `new Date()`-Default: ein Default zur Systemuhr
 * macht die Tests von der Laufzeit abhängig, und genau das ist im bestehenden
 * src/lib/schengen.ts der Fall (dort `today = new Date()`). Gleiche Eingabe ⇒
 * gleiches Ergebnis. Rückgaben tragen nur Codes, keine Sätze.
 *
 * Bewusst ANDERS als src/lib/schengen.ts (das NICHT verändert und NICHT importiert
 * wird):
 *  - Länder über ISO-3166-1-alpha-2-Codes ("HR"), nicht über Namen — /tour speichert
 *    Codes, das Namensmodul würde dort nichts finden.
 *  - Gerechnet wird auf TATSÄCHLICHEN Aufenthalten, NICHT auf Turnierfenstern. Wer
 *    zwischen zwei Turnieren im Schengen-Raum bleibt, trägt EINEN durchgehenden
 *    Aufenthalt ein — die Zwischentage zählen dann mit. Das behebt die systematische
 *    Untererfassung des Turnierfenster-Ansatzes (siehe BACKLOG MU-018).
 *
 * Die Regel (offizielle Formulierung): In JEDEM 180-Tage-Zeitraum höchstens 90
 * Aufenthaltstage. Ein- UND Ausreisetag zählen jeweils als voller Tag.
 */

export const SCHENGEN_RULES_VERSION = "v1";

const DAY = 86_400_000; // ms/Tag
const WINDOW_DAYS = 180; // Fensterbreite (inklusive beider Ränder)
const MAX_STAY = 90; // erlaubte Tage je Fenster

/**
 * Schengen-Raum als ISO-3166-1-alpha-2 (Stand 2025). Die 29 Vollmitglieder inkl.
 * Kroatien (HR, 2023) sowie Bulgarien (BG) und Rumänien (RO, 2025) — inhaltlich
 * gegen src/lib/schengen.ts abgeglichen. ZUSÄTZLICH die de-facto-Schengen-Mikro-
 * staaten San Marino (SM — dort findet ein Challenger statt), Vatikan (VA) und
 * Andorra (AD), die in src/lib/schengen.ts fehlen. Nicht enthalten: IE, CY (kein
 * Schengen). Ein Land außerhalb dieser Menge zählt NICHT mit (kein Fehler).
 */
export const SCHENGEN_AREA: ReadonlySet<string> = new Set([
  // 29 Vollmitglieder
  "AT", "BE", "BG", "HR", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IS",
  "IT", "LV", "LI", "LT", "LU", "MT", "NL", "NO", "PL", "PT", "RO", "SK", "SI",
  "ES", "SE", "CH",
  // de-facto-Schengen (offene Grenzen, kein Grenzübertritt)
  "SM", "VA", "AD",
]);

/** Liegt ein Land (ISO-3166-1-alpha-2) im Schengen-Raum? */
export function isSchengenCode(code: string | null | undefined): boolean {
  return code != null && SCHENGEN_AREA.has(code.toUpperCase());
}

/** Ein tatsächlicher Aufenthalt. `exit === null` = Aufenthalt läuft noch → bis Stichtag. */
export type Stay = {
  country: string; // ISO-3166-1-alpha-2
  entry: string; // ISO-Datum YYYY-MM-DD (Einreisetag, zählt voll)
  exit: string | null; // ISO-Datum YYYY-MM-DD (Ausreisetag, zählt voll) oder null (offen)
};

export type SchengenUsage = {
  rulesVersion: string;
  used: number; // Tage im ungünstigsten rollierenden 180-Tage-Fenster
  left: number; // max(0, 90 − used)
  peakWindowEnd: string | null; // Tag, an dem die Spitzenauslastung erreicht wird (ISO)
  exceeds: boolean; // used > 90
  exceedOn: string | null; // erster Tag, an dem das 180-Fenster > 90 erreicht (ISO)
  totalDays: number; // eindeutige Schengen-Tage insgesamt
  notes: string[]; // nur Codes
};

/** Parst ein ISO-Datum (YYYY-MM-DD) als UTC-Mitternacht; NaN bei ungültig. */
function parseUtcDay(iso: string): number {
  return Date.parse(iso + "T00:00:00Z");
}
/** UTC-Zeitstempel → ISO-Kalendertag. `new Date(ms)` ist deterministisch (kein Laufzeit-Clock). */
function isoDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Berechnet die Schengen-Auslastung aus tatsächlichen Aufenthalten zum Stichtag.
 *
 * @param stays  tatsächliche Aufenthalte (Reihenfolge egal; Überlappungen werden dedupliziert)
 * @param asOf   Stichtag als ISO-Datum (PFLICHT — keine Systemuhr). Offene Aufenthalte
 *               (exit === null) werden bis zu diesem Tag gezählt.
 */
export function schengenUsage(stays: Stay[], asOf: string): SchengenUsage {
  const notes: string[] = [];
  const empty = (extra: string[] = []): SchengenUsage => ({
    rulesVersion: SCHENGEN_RULES_VERSION,
    used: 0, left: MAX_STAY, peakWindowEnd: null, exceeds: false, exceedOn: null,
    totalDays: 0, notes: [...notes, ...extra],
  });

  const asOfMs = parseUtcDay(asOf);
  if (Number.isNaN(asOfMs)) return empty(["ungueltiger_stichtag"]);

  // Eindeutige Schengen-Tage (UTC-Mitternacht) über alle Aufenthalte sammeln.
  const days = new Set<number>();
  for (const st of stays) {
    if (!isSchengenCode(st.country)) continue; // Nicht-Schengen: ignorieren, kein Fehler

    const entryMs = parseUtcDay(st.entry);
    if (Number.isNaN(entryMs)) { if (!notes.includes("ungueltiges_datum")) notes.push("ungueltiges_datum"); continue; }

    let exitMs: number;
    if (st.exit === null) {
      exitMs = asOfMs; // offener Aufenthalt → bis zum Stichtag
    } else {
      exitMs = parseUtcDay(st.exit);
      if (Number.isNaN(exitMs)) { if (!notes.includes("ungueltiges_datum")) notes.push("ungueltiges_datum"); continue; }
      if (exitMs < entryMs) { if (!notes.includes("ausreise_vor_einreise")) notes.push("ausreise_vor_einreise"); continue; }
    }

    // Ein- und Ausreisetag inklusive (beide Ränder zählen voll).
    for (let d = entryMs; d <= exitMs; d += DAY) days.add(d);
  }

  const sorted = [...days].sort((a, b) => a - b);
  if (sorted.length === 0) return empty(["keine_schengen_tage"]);

  // Rollierendes 180-Tage-Fenster: für jeden belegten Tag als Fenster-ENDE die Tage
  // in [ende−179, ende] zählen. Das Maximum ist die Spitzenauslastung — es liegt
  // nachweislich immer an einem belegten Tag (ein Fenster mit nicht belegtem Ende
  // lässt sich nach links schieben, ohne die Zählung zu senken).
  let peak = 0;
  let peakEnd: number | null = null;
  let exceedOn: number | null = null;
  for (const end of sorted) {
    const start = end - (WINDOW_DAYS - 1) * DAY;
    let count = 0;
    for (const d of sorted) if (d >= start && d <= end) count++;
    if (count > peak) { peak = count; peakEnd = end; } // erster Tag, der die Spitze erreicht
    if (exceedOn === null && count > MAX_STAY) exceedOn = end; // erster Tag der Überschreitung
  }

  const exceeds = peak > MAX_STAY;
  if (exceeds) notes.push("ueberschreitung");

  return {
    rulesVersion: SCHENGEN_RULES_VERSION,
    used: peak,
    left: Math.max(0, MAX_STAY - peak),
    peakWindowEnd: peakEnd != null ? isoDay(peakEnd) : null,
    exceeds,
    exceedOn: exceedOn != null ? isoDay(exceedOn) : null,
    totalDays: sorted.length,
    notes,
  };
}
