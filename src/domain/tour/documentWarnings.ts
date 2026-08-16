/**
 * Dokument-Ablaufwarnungen für die Tour (Domain-Schicht, v1).
 *
 *   Pass-/Versicherungsdaten + nächste anstehende Reise + Stichtag
 *   →  Warnungen: abgelaufen · läuft bald ab · Pass für ein Zielland zu kurz gültig
 *
 * Reine Funktion: keine DB, kein Netzwerk, KEINE Systemzeit. Der Stichtag ist ein
 * PFLICHTPARAMETER (kein `new Date()`/`Date.now()`-Default). Gleiche Eingabe ⇒ gleiche
 * Ausgabe (per Unit-Test abgesichert). Rückgaben tragen nur Codes, keine Sätze — Übersetzung
 * per i18n. Es wird ausschließlich in UTC gerechnet.
 *
 * SECHS-MONATS-REGEL = FAUSTREGEL (nicht belegt): Unser Visa-Bestand
 * (tour_visa_requirements) führt KEIN Passgültigkeits-Feld je Zielland. Die „Pass zu kurz"-
 * Warnung ist daher eine Faustregel (viele Länder verlangen 6 Monate Restgültigkeit) und wird
 * mit `ruleOfThumb: true` markiert, damit die UI sie als solche kennzeichnet („beim Konsulat
 * prüfen") — nie als belegte Vorschrift.
 *
 * BESTER PASS GILT: Bei zwei Pässen zählt der mit dem SPÄTESTEN Ablauf (mit dem reist man).
 * Ablauf- und 6-Monats-Prüfung nutzen diesen — nur wenn AUCH der beste Pass nicht reicht,
 * gibt es eine Warnung (dasselbe „bester Pass gewinnt" wie im Visa-Layer).
 */

export const DOC_WARNINGS_VERSION = "v1";

const DAY = 86_400_000;

export type PassportInput = { country: string | null; expiry: string | null };
export type InsuranceInput = { expiry: string | null; international: boolean | null };
export type UpcomingTrip = { destination: string | null; entryDate: string }; // ISO-Datum der Einreise

export type DocWarningKind =
  | "passport_expired"
  | "passport_expiring"
  | "passport_too_short"
  | "insurance_expired"
  | "insurance_expiring"
  | "insurance_not_international";

export type DocWarning = {
  kind: DocWarningKind;
  severity: "error" | "warn";
  ruleOfThumb: boolean; // true = Faustregel (6-Monats-Regel), von der UI zu kennzeichnen
  date?: string; // relevantes Ablaufdatum (ISO)
  days?: number; // Tage bis Ablauf (nur bei *_expiring)
  destination?: string | null; // Zielland (bei too_short / not_international)
};

function parseUtcDay(iso: string | null): number {
  return iso ? Date.parse(iso + "T00:00:00Z") : NaN;
}

/** Addiert n Monate zu einem ISO-Datum (UTC). Überlauf (31.08. + 6) rollt wie JS — für eine
 *  Faustregel genau genug. Rückgabe als ms; NaN bei ungültiger Eingabe. */
function addMonthsUtc(iso: string, n: number): number {
  const ms = parseUtcDay(iso);
  if (Number.isNaN(ms)) return NaN;
  const d = new Date(ms);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.getTime();
}

/**
 * Bildet die Dokument-Warnungen. Errors (abgelaufen) stehen vor Warnungen.
 * @param opts.soonWithinDays  Fenster „läuft bald ab" in Tagen (Default 90 = ~3 Monate)
 * @param opts.validityMonths  geforderte Restgültigkeit des Passes (Faustregel, Default 6)
 */
export function documentWarnings(input: {
  passports?: PassportInput[];
  insurance?: InsuranceInput | null;
  nextTrip?: UpcomingTrip | null;
  asOf: string;
  opts?: { soonWithinDays?: number; validityMonths?: number };
}): DocWarning[] {
  const asOfMs = parseUtcDay(input.asOf);
  if (Number.isNaN(asOfMs)) return [];
  const soon = input.opts?.soonWithinDays ?? 90;
  const months = input.opts?.validityMonths ?? 6;
  const trip = input.nextTrip ?? null;
  const out: DocWarning[] = [];

  // ── Pass: bester (spätester) Ablauf gilt ────────────────────────────────────
  const passExpiries = (input.passports ?? [])
    .map((p) => parseUtcDay(p.expiry))
    .filter((ms) => !Number.isNaN(ms));
  const bestPassMs = passExpiries.length ? Math.max(...passExpiries) : NaN;

  let passExpired = false;
  if (!Number.isNaN(bestPassMs)) {
    const dateIso = new Date(bestPassMs).toISOString().slice(0, 10);
    if (bestPassMs < asOfMs) {
      out.push({ kind: "passport_expired", severity: "error", ruleOfThumb: false, date: dateIso });
      passExpired = true;
    } else if (bestPassMs < asOfMs + soon * DAY) {
      out.push({ kind: "passport_expiring", severity: "warn", ruleOfThumb: false, date: dateIso, days: Math.round((bestPassMs - asOfMs) / DAY) });
    }
  }

  // 6-Monats-Faustregel: nur wenn nicht ohnehin abgelaufen, und eine Reise ansteht.
  if (!passExpired && !Number.isNaN(bestPassMs) && trip) {
    const threshold = addMonthsUtc(trip.entryDate, months);
    if (!Number.isNaN(threshold) && bestPassMs < threshold) {
      out.push({ kind: "passport_too_short", severity: "warn", ruleOfThumb: true, date: new Date(bestPassMs).toISOString().slice(0, 10), destination: trip.destination });
    }
  }

  // ── Versicherung ────────────────────────────────────────────────────────────
  const ins = input.insurance ?? null;
  if (ins) {
    const insMs = parseUtcDay(ins.expiry);
    if (!Number.isNaN(insMs)) {
      const dateIso = new Date(insMs).toISOString().slice(0, 10);
      if (insMs < asOfMs) out.push({ kind: "insurance_expired", severity: "error", ruleOfThumb: false, date: dateIso });
      else if (insMs < asOfMs + soon * DAY) out.push({ kind: "insurance_expiring", severity: "warn", ruleOfThumb: false, date: dateIso, days: Math.round((insMs - asOfMs) / DAY) });
    }
    // Nicht international gültig + Reise steht an → Hinweis (aus dem gespeicherten Flag, keine Faustregel).
    if (ins.international === false && trip) {
      out.push({ kind: "insurance_not_international", severity: "warn", ruleOfThumb: false, destination: trip.destination });
    }
  }

  // Errors zuerst, dann Warnungen (stabile Reihenfolge im Übrigen durch Einfüge-Order).
  return out.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "error" ? -1 : 1));
}
