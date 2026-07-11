/**
 * Deadline-Engine für den Tour-Modus. Rechnet aus Turnierstart + Tier die
 * relevanten Fristen (Meldung/Rückzug/Sign-in). Die konkreten Regeln (ATP 28 T,
 * Challenger 21 T, ITF 18 T Do 14:00 GMT, Withdrawal Fr vor Turnierwoche) stammen
 * aus den ATP/ITF-Regelwerken 2025/26 — sie ändern sich je Saison und ATP kann
 * Fristen verschieben. Darum: überall „ohne Gewähr, offiziell prüfen".
 */
const MS_DAY = 86_400_000;

/** Minimaler Input: Startdatum (ISO) + Tier-String (z. B. "ATP250", "CH100", "ITF25"). */
export type DeadlineInput = { start: string; tier: string };

export type DeadlineKind = "entry" | "withdrawal" | "signin";

export type Deadline = {
  kind: DeadlineKind;
  date: string; // ISO yyyy-mm-dd
};

/** UTC-Montag der Woche, in der das Turnier startet. */
function mondayOfWeek(iso: string): number {
  const d = new Date(iso + "T00:00:00Z");
  const back = (d.getUTCDay() + 6) % 7; // 0=So →6, 1=Mo →0 …
  return d.getTime() - back * MS_DAY;
}

function isoDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Alle relevanten Fristen eines Turniers, chronologisch. */
export function tournamentDeadlines(t: DeadlineInput): Deadline[] {
  const monday = mondayOfWeek(t.start);
  const isITF = t.tier.startsWith("ITF");
  const isCH = t.tier.startsWith("CH");

  const out: Deadline[] = [];
  if (isITF) {
    // ITF World Tennis Tour: Entry Donnerstag 18 Tage vor der Turnierwoche.
    const d = new Date(monday - 18 * MS_DAY);
    const back = (d.getUTCDay() - 4 + 7) % 7; // auf den vorangehenden Donnerstag
    out.push({ kind: "entry", date: isoDay(d.getTime() - back * MS_DAY) });
  } else {
    const days = isCH ? 21 : 28; // Challenger 21 T, ATP/GS 28 T vor Turnierwoche
    out.push({ kind: "entry", date: isoDay(monday - days * MS_DAY) });
    // Rückzug: Freitag vor der Turnierwoche (Monday − 3 Tage).
    out.push({ kind: "withdrawal", date: isoDay(monday - 3 * MS_DAY) });
  }
  // Sign-in: Tag vor Turnierstart.
  out.push({ kind: "signin", date: isoDay(Date.parse(t.start) - MS_DAY) });
  return out.sort((a, b) => (a.date < b.date ? -1 : 1));
}

export type Urgency = "red" | "amber" | "none";

export function urgencyFor(daysLeft: number): Urgency {
  if (daysLeft <= 2) return "red";
  if (daysLeft <= 7) return "amber";
  return "none";
}

export type Alert<T> = {
  tournament: T;
  kind: DeadlineKind;
  date: string;
  daysLeft: number;
  urgency: Urgency;
};

/**
 * Nächste fällige Fristen aus dem Saisonplan — nur zukünftige, innerhalb `windowDays`,
 * chronologisch. `today` optional (Default: jetzt) für Tests/Deterministik.
 */
export function planAlerts<T extends DeadlineInput>(plan: T[], windowDays = 45, today = new Date()): Alert<T>[] {
  const t0 = Date.parse(today.toISOString().slice(0, 10) + "T00:00:00Z");
  const alerts: Alert<T>[] = [];
  for (const t of plan) {
    for (const d of tournamentDeadlines(t)) {
      const daysLeft = Math.round((Date.parse(d.date + "T00:00:00Z") - t0) / MS_DAY);
      if (daysLeft < 0 || daysLeft > windowDays) continue;
      alerts.push({ tournament: t, kind: d.kind, date: d.date, daysLeft, urgency: urgencyFor(daysLeft) });
    }
  }
  return alerts.sort((a, b) => a.daysLeft - b.daysLeft);
}

export function kindShort(kind: DeadlineKind, locale: string): string {
  const de: Record<DeadlineKind, string> = { entry: "Meldung", withdrawal: "Rückzug", signin: "Sign-in" };
  const en: Record<DeadlineKind, string> = { entry: "Entry", withdrawal: "Withdrawal", signin: "Sign-in" };
  return (locale.startsWith("de") ? de : en)[kind];
}
