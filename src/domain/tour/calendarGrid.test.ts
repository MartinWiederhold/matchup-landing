import { describe, it, expect } from "vitest";
import { hhmmToMin, minToHHMM, blockGeom, layoutOverlaps, DAY_MIN, type DayItem } from "./calendarGrid";

describe("hhmmToMin / minToHHMM", () => {
  it("parst HH:MM(:SS)", () => {
    expect(hhmmToMin("09:30")).toBe(570);
    expect(hhmmToMin("09:30:00")).toBe(570);
    expect(hhmmToMin(null)).toBeNull();
    expect(hhmmToMin("bad")).toBeNull();
    expect(hhmmToMin("25:00")).toBeNull();
  });
  it("formatiert Minuten zurück", () => {
    expect(minToHHMM(570)).toBe("09:30");
    expect(minToHHMM(0)).toBe("00:00");
  });
});

describe("blockGeom", () => {
  it("Ende gesetzt → exakte Höhe", () => {
    expect(blockGeom(540, 660, 1, 60)).toEqual({ top: 540, height: 120 }); // 9–11 Uhr
  });
  it("Ende null → Standarddauer", () => {
    expect(blockGeom(540, null, 1, 60)).toEqual({ top: 540, height: 60 });
  });
  it("Ende ≤ Start → Standarddauer statt negativ", () => {
    expect(blockGeom(600, 600, 1, 45)).toEqual({ top: 600, height: 45 });
  });
  it("Mindesthöhe 15 min", () => {
    expect(blockGeom(600, 605, 1, 60).height).toBe(15);
  });
  it("kappt am Tagesende", () => {
    expect(blockGeom(DAY_MIN - 30, DAY_MIN + 120, 1, 60)).toEqual({ top: DAY_MIN - 30, height: 30 });
  });
});

describe("layoutOverlaps", () => {
  it("keine Überlappung → alle 1 Spalte", () => {
    const items: DayItem[] = [
      { id: "a", startMin: 540, endMin: 600 },
      { id: "b", startMin: 600, endMin: 660 },
    ];
    const m = layoutOverlaps(items, 60);
    expect(m.get("a")).toEqual({ col: 0, cols: 1 });
    expect(m.get("b")).toEqual({ col: 0, cols: 1 });
  });
  it("zwei Überlappende → nebeneinander (2 Spalten)", () => {
    const items: DayItem[] = [
      { id: "a", startMin: 540, endMin: 660 },
      { id: "b", startMin: 600, endMin: 720 },
    ];
    const m = layoutOverlaps(items, 60);
    expect(m.get("a")).toEqual({ col: 0, cols: 2 });
    expect(m.get("b")).toEqual({ col: 1, cols: 2 });
  });
  it("Ende null nutzt Standarddauer für die Überlappung", () => {
    const items: DayItem[] = [
      { id: "a", startMin: 540, endMin: null }, // 9:00–10:00 (Default 60)
      { id: "b", startMin: 570, endMin: null }, // 9:30–10:30 → überlappt a
    ];
    const m = layoutOverlaps(items, 60);
    expect(m.get("a")!.cols).toBe(2);
    expect(m.get("b")!.cols).toBe(2);
  });
});
