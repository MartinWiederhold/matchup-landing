import { describe, it, expect } from "vitest";
import { deadlineCountdown } from "./deadlineCountdown";

const day = (iso: string) => Date.parse(iso + "T00:00:00Z");
const ts = (iso: string) => Date.parse(iso);

describe("deadlineCountdown", () => {
  const asOf = day("2026-08-28");

  it("liefert die volle Tages-Distanz für eine Frist um Mitternacht in 3 Tagen", () => {
    expect(deadlineCountdown(day("2026-08-31"), asOf)).toEqual({ kind: "future", days: 3 });
  });

  it("floort Bruchtage — 2 Tage 18 Std. sind 2 Tage, nicht 3", () => {
    // asOf: 2026-08-28 00:00 UTC, Frist: 2026-08-30 18:00 UTC → 66 h → 2 volle Tage.
    expect(deadlineCountdown(ts("2026-08-30T18:00:00Z"), asOf)).toEqual({ kind: "future", days: 2 });
  });

  it("meldet same-day für Fristen mit weniger als 24 Std. Vorlauf", () => {
    expect(deadlineCountdown(ts("2026-08-28T14:00:00Z"), asOf)).toEqual({ kind: "same-day" });
  });

  it("erkennt verpasste Fristen und rundet Tage rückwärts", () => {
    // Frist 2 Tage vor asOf → Kind past, 2 Tage her.
    expect(deadlineCountdown(day("2026-08-26"), asOf)).toEqual({ kind: "past", daysAgo: 2 });
  });

  it("liefert für dieselbe Frist immer denselben Wert (deterministisch, kein Date.now)", () => {
    const a = deadlineCountdown(day("2026-09-04"), asOf);
    const b = deadlineCountdown(day("2026-09-04"), asOf);
    expect(a).toEqual(b);
  });
});
