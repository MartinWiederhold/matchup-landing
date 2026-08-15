import { describe, it, expect } from "vitest";
import { dueReminders, REMINDER_GRACE_MS, type ReminderKind } from "./reminders";
import type { TourEntryStatus } from "@/lib/types";

const HOUR = 3_600_000;
const NOW = new Date("2026-03-01T12:00:00Z");
// Frist so legen, dass der jeweilige Zeitpunkt GENAU jetzt fällig wird: base = now + offset.
const baseFor = (offsetH: number) => new Date(NOW.getTime() + offsetH * HOUR);

function run(o: { entry?: Date | null; withdrawal?: Date | null; status: TourEntryStatus; known?: boolean; sent?: ReminderKind[]; now?: Date }): ReminderKind[] {
  return dueReminders({
    known: o.known ?? true,
    entry: o.entry ?? null,
    withdrawal: o.withdrawal ?? null,
    status: o.status,
    now: o.now ?? NOW,
    alreadySent: new Set(o.sent ?? []),
  });
}

describe("dueReminders – Fristen-Erinnerungen", () => {
  it("Challenger (known=false) ⇒ nie eine Erinnerung", () => {
    expect(run({ known: false, entry: baseFor(72), status: "planned" })).toEqual([]);
  });

  it("Meldeschluss −72h, Status planned ⇒ entry_72h", () => {
    expect(run({ entry: baseFor(72), status: "planned" })).toEqual(["entry_72h"]);
  });

  it("Meldeschluss −24h, Status planned ⇒ entry_24h", () => {
    expect(run({ entry: baseFor(24), status: "planned" })).toEqual(["entry_24h"]);
  });

  it("Melde-Erinnerung NICHT, wenn schon gemeldet (Status entered)", () => {
    expect(run({ entry: baseFor(72), status: "entered" })).toEqual([]);
  });

  it("Rückzug −48h, Status entered ⇒ withdrawal_48h", () => {
    expect(run({ withdrawal: baseFor(48), status: "entered" })).toEqual(["withdrawal_48h"]);
  });

  it("Rückzug −12h, Status alternate ⇒ withdrawal_12h", () => {
    expect(run({ withdrawal: baseFor(12), status: "alternate" })).toEqual(["withdrawal_12h"]);
  });

  it("Rückzugs-Erinnerung NICHT bei planned (noch nicht drin)", () => {
    expect(run({ withdrawal: baseFor(48), status: "planned" })).toEqual([]);
  });

  it("Zurückgezogen ⇒ KEINE Rückzugs-Erinnerung (Kernfall der Aufgabe)", () => {
    expect(run({ withdrawal: baseFor(48), status: "withdrawn" })).toEqual([]);
    expect(run({ withdrawal: baseFor(12), status: "withdrawn" })).toEqual([]);
  });

  it("Dedup: bereits verschickt ⇒ nicht erneut", () => {
    expect(run({ entry: baseFor(72), status: "planned", sent: ["entry_72h"] })).toEqual([]);
  });

  it("NIE nach der Frist: Bezugsfrist bereits vorbei ⇒ nichts", () => {
    expect(run({ withdrawal: new Date(NOW.getTime() - 1 * HOUR), status: "entered" })).toEqual([]);
  });

  it("Zeitpunkt noch in der Zukunft (Frist weiter weg als der Zeitpunkt) ⇒ noch nicht fällig", () => {
    // entry in 100h → entry_72h-Zeitpunkt ist in 28h, also NICHT fällig.
    expect(run({ entry: baseFor(100), status: "planned" })).toEqual([]);
  });

  it("Zeitpunkt zu alt (älter als grace) ⇒ nicht mehr fällig (kein stark verspäteter Versand)", () => {
    // entry so, dass der 72h-Zeitpunkt (grace + 1h) in der Vergangenheit liegt, Frist aber noch da.
    const entry = new Date(NOW.getTime() + 72 * HOUR - (REMINDER_GRACE_MS + HOUR));
    expect(run({ entry, status: "planned" })).toEqual([]);
  });

  it("mehrere Zeitpunkte gleichzeitig fällig (Nachhol-Fall) ⇒ beide", () => {
    // entry so, dass BEIDE (72h & 24h) knapp innerhalb grace liegen — konstruiert über kleines grace.
    const now = NOW;
    const entry = new Date(now.getTime() + 24 * HOUR); // 24h-Punkt = jetzt; 72h-Punkt = vor 48h (zu alt bei Standard-grace)
    // Mit großzügigem grace (49h) werden beide fällig:
    const res = dueReminders({ known: true, entry, withdrawal: null, status: "planned", now, graceMs: 49 * HOUR });
    expect(res.sort()).toEqual(["entry_24h", "entry_72h"]);
  });
});
