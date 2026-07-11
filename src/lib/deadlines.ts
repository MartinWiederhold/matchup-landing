/**
 * Deadline-Engine für den Tour-Modus. Rechnet aus Turnierstart + Tier die
 * relevanten Fristen (Meldung/Rückzug/Freeze/Sign-in) inkl. offizieller Uhrzeit
 * und Zeitzone. Regeln (ATP/GS 28 T bzw. 42 T · Challenger 21 T · ITF 18 T Do,
 * Withdrawal Di 13 T, Freeze Do — je 14:00 GMT · ATP/CH Withdrawal Fr) stammen aus
 * den ATP/ITF-Regelwerken 2025/26. Sie ändern sich je Saison und können verschoben
 * werden — darum überall „ohne Gewähr, offiziell prüfen".
 *
 * Countdown bleibt kalendertäglich; die Uhrzeit + Zone werden angezeigt, damit ein
 * Spieler die Frist nicht um Stunden verpasst (12:00 ET ≠ 12:00 Ortszeit in Asien).
 */
const MS_DAY = 86_400_000;

/** Minimaler Input: Startdatum (ISO) + Tier-String (z. B. "ATP250", "CH100", "ITF25", "WTA250", "GS"). */
export type DeadlineInput = { start: string; tier: string };

export type DeadlineKind = "entry" | "withdrawal" | "freeze" | "signin" | "alt_signin";

/** Anzeige-Zeitzone der Frist. "ET" = US Eastern (ATP), "GMT" = ITF. Sign-in ist Ortszeit → ohne Zone. */
export type Tz = "ET" | "GMT";

export type Deadline = {
  kind: DeadlineKind;
  date: string; // ISO yyyy-mm-dd (lokales Datum in der jeweiligen Zone)
  time?: string; // "HH:MM" offizielle Uhrzeit
  tz?: Tz;
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

/** Von `ms` rückwärts auf den nächstgelegenen Wochentag `dow` (0=So … 6=Sa) snappen. */
function snapBackTo(ms: number, dow: number): number {
  const cur = new Date(ms).getUTCDay();
  const back = (cur - dow + 7) % 7;
  return ms - back * MS_DAY;
}

/** Alle relevanten Fristen eines Turniers, chronologisch. */
export function tournamentDeadlines(t: DeadlineInput): Deadline[] {
  const monday = mondayOfWeek(t.start);
  const isITF = t.tier.startsWith("ITF");
  const isCH = t.tier.startsWith("CH");
  const isGS = t.tier.startsWith("GS");

  const out: Deadline[] = [];
  if (isITF) {
    // ITF World Tennis Tour, Singles — alle 14:00 GMT.
    out.push({ kind: "entry", date: isoDay(snapBackTo(monday - 18 * MS_DAY, 4)), time: "14:00", tz: "GMT" }); // Do, 18 T
    out.push({ kind: "withdrawal", date: isoDay(snapBackTo(monday - 13 * MS_DAY, 2)), time: "14:00", tz: "GMT" }); // Di, 13 T
    out.push({ kind: "freeze", date: isoDay(snapBackTo(monday - 4 * MS_DAY, 4)), time: "14:00", tz: "GMT" }); // Do vor Woche
  } else {
    // ATP/Challenger/WTA/Grand Slam — Meldung 12:00 ET.
    const days = isGS ? 42 : isCH ? 21 : 28; // GS 42 T, Challenger 21 T, ATP/WTA 28 T
    out.push({ kind: "entry", date: isoDay(monday - days * MS_DAY), time: "12:00", tz: "ET" });
    // Rückzug: Freitag vor der Turnierwoche, 12:00 ET.
    out.push({ kind: "withdrawal", date: isoDay(snapBackTo(monday - 3 * MS_DAY, 5)), time: "12:00", tz: "ET" });
  }
  // Sign-in: Tag vor Turnierstart, vor Ort (Ortszeit → keine Zone).
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
  time?: string;
  tz?: Tz;
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
      alerts.push({ tournament: t, kind: d.kind, date: d.date, time: d.time, tz: d.tz, daysLeft, urgency: urgencyFor(daysLeft) });
    }
  }
  return alerts.sort((a, b) => a.daysLeft - b.daysLeft);
}

export function kindShort(kind: DeadlineKind, locale: string): string {
  const de: Record<DeadlineKind, string> = { entry: "Meldung", withdrawal: "Rückzug", freeze: "Freeze", signin: "Sign-in", alt_signin: "Nachrück-Sign-in" };
  const en: Record<DeadlineKind, string> = { entry: "Entry", withdrawal: "Withdrawal", freeze: "Freeze", signin: "Sign-in", alt_signin: "Alternate sign-in" };
  return (locale.startsWith("de") ? de : en)[kind];
}

/** Kurzform „12:00 ET" für die Anzeige; leer bei Sign-in ohne Zone. */
export function deadlineClock(d: { time?: string; tz?: Tz }): string {
  return d.time && d.tz ? `${d.time} ${d.tz}` : "";
}

/**
 * Protected Ranking / Entry Protection (ATP). Wer ≥6 und <12 Monate verletzt ausfällt,
 * darf seine Protection für die ersten 9 Singles-/9 Doubles-Turniere oder max. 9 Monate
 * nutzen; ab 12 Monaten sind es 12/12 bzw. max. 12 Monate. Die Protection verfällt, wenn
 * sie nicht innerhalb von 3 Jahren ab dem letzten Event vor der Pause aktiviert wird.
 * Regeln je Saison änderbar → „ohne Gewähr". Gibt null zurück, wenn (noch) nicht anspruchsberechtigt.
 */
export type ProtectedRanking = {
  events: number; // Turniere je Disziplin (Singles/Doubles)
  usageMonths: number; // alternatives Zeitfenster in Monaten
  expiresBy: string; // ISO — Aktivierung muss bis dahin erfolgen
  expiresDaysLeft: number;
};

export function protectedRanking(
  lastEventDate: string | null | undefined,
  injuryMonths: number | null | undefined,
  today = new Date(),
): ProtectedRanking | null {
  if (!lastEventDate || injuryMonths == null || injuryMonths < 6) return null;
  const events = injuryMonths >= 12 ? 12 : 9;
  const expiry = new Date(lastEventDate + "T00:00:00Z");
  expiry.setUTCFullYear(expiry.getUTCFullYear() + 3);
  const t0 = Date.parse(today.toISOString().slice(0, 10) + "T00:00:00Z");
  const expiresDaysLeft = Math.round((expiry.getTime() - t0) / MS_DAY);
  return { events, usageMonths: events, expiresBy: expiry.toISOString().slice(0, 10), expiresDaysLeft };
}
