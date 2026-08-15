/**
 * Fristen-Erinnerungen — die reine ENTSCHEIDUNG, welche Erinnerung fällig ist.
 *
 * Kein Netz, keine DB, keine Laufzeituhr: `now` kommt als Parameter herein. Damit ist
 * der ganze Dienst deterministisch per Vitest belegbar — auch dann, wenn aktuell gar kein
 * Turnier eine offene Frist hat (der ehrliche Teil der Aufgabe).
 *
 * Zeitpunkte nach ITF-Regelwerk, alle abgeleitet aus den Fristen von deadlines.ts
 * (Meldeschluss = entry, Rückzugsfrist = withdrawal — beide nur für ITF bekannt):
 *   entry_72h · entry_24h · withdrawal_48h · withdrawal_12h
 *
 * Grundregeln:
 *   - Challenger (known=false): NICHTS. Fristen unbekannt (MU-014) → nie geraten.
 *   - NIE nach der Frist: eine Erinnerung, deren Bezugsfrist schon vorbei ist, entfällt.
 *   - Status-Matrix: Melde-Erinnerung nur solange 'planned' (noch nicht gemeldet),
 *     Rückzugs-Erinnerung nur wenn gemeldet/drin und NICHT zurückgezogen.
 *   - Dedup: bereits verschickte Zeitpunkte (alreadySent) fallen raus.
 *   - Fällig = der Zeitpunkt liegt zwischen (now − grace) und now. `grace` ≈ Lauf-Intervall
 *     (stündlich) + Puffer; ein längerer Ausfall lässt die Erinnerung lieber AUS, als sie
 *     stark verspätet zu senden.
 */
import type { TourEntryStatus } from "@/lib/types";

const HOUR = 3_600_000;
/** Fälligkeits-Fenster: stündlicher Lauf + Puffer. */
export const REMINDER_GRACE_MS = 90 * 60 * 1000;

export type ReminderKind = "entry_72h" | "entry_24h" | "withdrawal_48h" | "withdrawal_12h";

/** Auf welche Frist bezieht sich ein Zeitpunkt (für Betreff/Text der Mail). */
export const REMINDER_BASE: Record<ReminderKind, "entry" | "withdrawal"> = {
  entry_72h: "entry",
  entry_24h: "entry",
  withdrawal_48h: "withdrawal",
  withdrawal_12h: "withdrawal",
};

const POINTS: { kind: ReminderKind; base: "entry" | "withdrawal"; offsetH: number }[] = [
  { kind: "entry_72h", base: "entry", offsetH: 72 },
  { kind: "entry_24h", base: "entry", offsetH: 24 },
  { kind: "withdrawal_48h", base: "withdrawal", offsetH: 48 },
  { kind: "withdrawal_12h", base: "withdrawal", offsetH: 12 },
];

// Melde-Erinnerung: nur solange NICHT gemeldet (danach ist der Meldeschluss gegenstandslos).
function entryGate(status: TourEntryStatus): boolean {
  return status === "planned";
}
// Rückzugs-Erinnerung: nur wenn wirklich drin (gemeldet/Feld/Alternate). Zurückgezogen =
// nichts (Aufgabe). 'confirmed' (legacy) zählt wie „drin", 'cancelled'/'withdrawn'/'planned' nicht.
function withdrawalGate(status: TourEntryStatus): boolean {
  return status === "entered" || status === "main_draw" || status === "qualifying" || status === "alternate" || status === "confirmed";
}

export type DueInput = {
  known: boolean;
  entry: Date | null;
  withdrawal: Date | null;
  status: TourEntryStatus;
  now: Date;
  alreadySent?: Set<string>;
  graceMs?: number;
};

/** Liefert die JETZT fälligen Erinnerungs-Zeitpunkte für EIN Saison-Turnier. */
export function dueReminders(input: DueInput): ReminderKind[] {
  if (!input.known) return []; // Challenger → nie
  const nowMs = input.now.getTime();
  const grace = input.graceMs ?? REMINDER_GRACE_MS;
  const sent = input.alreadySent ?? new Set<string>();
  const out: ReminderKind[] = [];
  for (const p of POINTS) {
    const base = p.base === "entry" ? input.entry : input.withdrawal;
    if (!base) continue;                                   // Frist nicht bekannt
    if (!(p.base === "entry" ? entryGate(input.status) : withdrawalGate(input.status))) continue;
    if (sent.has(p.kind)) continue;                        // schon verschickt
    const baseMs = base.getTime();
    if (baseMs <= nowMs) continue;                         // Frist vorbei → NIE nach der Frist
    const pointMs = baseMs - p.offsetH * HOUR;
    if (pointMs <= nowMs && pointMs > nowMs - grace) out.push(p.kind); // seit dem letzten Lauf fällig
  }
  return out;
}
