import { describe, it, expect } from "vitest";
import { TIME_BLOCKS, isTimeBlock, weekDates, isPastSlot } from "./trainingSlots";

describe("trainingSlots – Zeitblöcke", () => {
  it("fünf Blöcke, lückenlos aufsteigend", () => {
    expect(TIME_BLOCKS).toHaveLength(5);
    for (let i = 1; i < TIME_BLOCKS.length; i++) expect(TIME_BLOCKS[i].from).toBe(TIME_BLOCKS[i - 1].to);
    expect(TIME_BLOCKS[0].from).toBe("07:00");
    expect(TIME_BLOCKS[TIME_BLOCKS.length - 1].to).toBe("20:00");
  });
  it("isTimeBlock erkennt gültige/ungültige Codes", () => {
    expect(isTimeBlock("afternoon")).toBe(true);
    expect(isTimeBlock("night")).toBe(false);
    expect(isTimeBlock(null)).toBe(false);
  });
});

describe("trainingSlots – Wochendaten", () => {
  it("sieben aufeinanderfolgende Tage ab Montag", () => {
    const d = weekDates("2026-09-07"); // Mo
    expect(d).toHaveLength(7);
    expect(d[0]).toBe("2026-09-07");
    expect(d[6]).toBe("2026-09-13"); // So
  });
  it("ungültiges Datum → leer", () => {
    expect(weekDates("kaputt")).toEqual([]);
  });
});

describe("trainingSlots – vergangen", () => {
  it("Datum vor heute = vergangen; heute/zukünftig = nicht", () => {
    expect(isPastSlot("2026-08-31", "2026-09-07")).toBe(true);
    expect(isPastSlot("2026-09-07", "2026-09-07")).toBe(false);
    expect(isPastSlot("2026-09-10", "2026-09-07")).toBe(false);
  });
});
