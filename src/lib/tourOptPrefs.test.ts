import { describe, it, expect } from "vitest";
import { parseCap, blockedRangesFrom } from "./tourOptPrefs";

describe("parseCap", () => {
  it("leer oder ≤0 ⇒ null", () => {
    expect(parseCap("")).toBeNull();
    expect(parseCap("  ")).toBeNull();
    expect(parseCap("0")).toBeNull();
    expect(parseCap("-2")).toBeNull();
  });
  it("positive Zahl ⇒ gerundet", () => {
    expect(parseCap("3")).toBe(3);
    expect(parseCap("2,4")).toBe(2);
  });
});

describe("blockedRangesFrom", () => {
  it("gültiger inklusiver Zeitraum", () => {
    expect(blockedRangesFrom("2026-02-09", "2026-02-09")).toEqual([{ from: "2026-02-09", to: "2026-02-09" }]);
    expect(blockedRangesFrom("2026-02-01", "2026-02-28")).toEqual([{ from: "2026-02-01", to: "2026-02-28" }]);
  });
  it("unvollständig oder verkehrt herum ⇒ leer", () => {
    expect(blockedRangesFrom("", "2026-02-09")).toEqual([]);
    expect(blockedRangesFrom("2026-02-28", "2026-02-01")).toEqual([]);
  });
});
