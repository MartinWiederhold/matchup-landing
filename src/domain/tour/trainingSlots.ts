/**
 * Trainingsslot-Bausteine (Domain-Schicht, v1) — reine, deterministische Helfer, keine DB,
 * keine Systemuhr (Stichtage/Wochenmontag kommen als Parameter herein).
 *
 * Fünf Zeitblöcke (2–3 h): fein genug, dass „nachmittags = 14–17" ein realistisches
 * Trefffenster ist, grob genug, dass sich zwei Leute überhaupt treffen. Feste Auswahl,
 * kein Freitext. Die exakte Uhrzeit wird beim Zusagen im Kontakt gefixt.
 */

export const TIME_BLOCKS = [
  { code: "early", from: "07:00", to: "09:00" },
  { code: "morning", from: "09:00", to: "12:00" },
  { code: "noon", from: "12:00", to: "14:00" },
  { code: "afternoon", from: "14:00", to: "17:00" },
  { code: "evening", from: "17:00", to: "20:00" },
] as const;

export type TimeBlock = (typeof TIME_BLOCKS)[number]["code"];

const BLOCK_CODES = new Set(TIME_BLOCKS.map((b) => b.code));
export function isTimeBlock(x: string | null | undefined): x is TimeBlock {
  return x != null && BLOCK_CODES.has(x as TimeBlock);
}

const DAY = 86_400_000;

/** Die sieben Kalendertage der Turnierwoche (Mo→So) als ISO-Datum. Ungültig → []. */
export function weekDates(mondayISO: string): string[] {
  const ms = Date.parse(mondayISO + "T00:00:00Z");
  if (Number.isNaN(ms)) return [];
  return Array.from({ length: 7 }, (_, i) => new Date(ms + i * DAY).toISOString().slice(0, 10));
}

/** Vergangen = das Datum liegt VOR heute (ISO-Datumsstrings vergleichen sich lexikografisch). */
export function isPastSlot(slotDateISO: string, todayISO: string): boolean {
  return slotDateISO < todayISO;
}
