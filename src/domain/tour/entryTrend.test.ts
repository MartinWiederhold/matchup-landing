import { describe, it, expect } from "vitest";
import { alternateTrend } from "./entryTrend";

const ASOF = "2026-08-17"; // fester Stichtag (keine Systemuhr)
const o = (observedAt: string, alternatePosition: number | null) => ({ observedAt, alternatePosition });

describe("alternateTrend – Verlauf der Alternate-Position", () => {
  it("keine Beobachtung ⇒ none", () => {
    expect(alternateTrend([], ASOF)).toEqual({ kind: "none" });
  });

  it("Regel 1: nur EINE (aktuelle) Beobachtung ⇒ none (kein Pfeil, kein Punkt)", () => {
    expect(alternateTrend([o("2026-08-15", 7)], ASOF)).toEqual({ kind: "none" });
  });

  it("Regel 2: letzte Beobachtung > 1 Woche alt ⇒ stale mit Datum (auch bei mehreren)", () => {
    // Letzte am 08.08., Stichtag 17.08. → 9 Tage → stale.
    expect(alternateTrend([o("2026-08-01", 12), o("2026-08-08", 7)], ASOF)).toEqual({ kind: "stale", observedAt: "2026-08-08" });
    // Auch mit nur einer, aber alten Beobachtung: ehrlich das Datum statt „none".
    expect(alternateTrend([o("2026-08-05", 9)], ASOF)).toEqual({ kind: "stale", observedAt: "2026-08-05" });
  });

  it("hochgerückt: #12 → #7 in aktuellen Beobachtungen ⇒ up, delta 5", () => {
    expect(alternateTrend([o("2026-08-14", 12), o("2026-08-16", 7)], ASOF)).toEqual({ kind: "up", delta: 5 });
  });

  it("abgerutscht: #5 → #8 ⇒ down, delta −3", () => {
    expect(alternateTrend([o("2026-08-14", 5), o("2026-08-16", 8)], ASOF)).toEqual({ kind: "down", delta: -3 });
  });

  it("unverändert zwischen zwei aktuellen Beobachtungen ⇒ flat (echte Vergleichsgröße)", () => {
    expect(alternateTrend([o("2026-08-14", 6), o("2026-08-16", 6)], ASOF)).toEqual({ kind: "flat", delta: 0 });
  });

  it("Beobachtungen ohne Position (z. B. gemeldet) zählen nicht mit", () => {
    // Eine Positionslose + eine mit Position = effektiv EINE Position → none.
    expect(alternateTrend([o("2026-08-14", null), o("2026-08-16", 7)], ASOF)).toEqual({ kind: "none" });
  });

  it("deterministisch/reihenfolgeunabhängig: unsortierte Eingabe ⇒ gleiches Ergebnis", () => {
    expect(alternateTrend([o("2026-08-16", 7), o("2026-08-14", 12)], ASOF)).toEqual({ kind: "up", delta: 5 });
  });
});
