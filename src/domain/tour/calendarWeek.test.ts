import { describe, it, expect } from "vitest";
import { tournamentsForWeek, isWeekEmpty, nextTournamentAfter, type CalendarWeekItem } from "./calendarWeek";

// 2026-10-05 und 2026-10-12 sind Montage; 2026-08-03 ebenfalls (Bezugswochen).
const items: CalendarWeekItem[] = [
  { monday: "2026-10-05", inactive: false },
  { monday: "2026-10-12", inactive: false },
  { monday: "2026-10-05", inactive: true }, // soft-gelöscht → nie anzeigen
];

describe("tournamentsForWeek", () => {
  it("wählt nur Turniere der passenden Woche", () => {
    expect(tournamentsForWeek(items, "2026-10-05")).toHaveLength(1);
    expect(tournamentsForWeek(items, "2026-10-12")).toHaveLength(1);
  });
  it("lässt soft-gelöschte Turniere aus", () => {
    expect(tournamentsForWeek(items, "2026-10-05").every((x) => !x.inactive)).toBe(true);
  });
  it("leere Auswahl für eine Woche ohne Turnier", () => {
    expect(tournamentsForWeek(items, "2026-08-03")).toEqual([]);
  });
});

describe("isWeekEmpty", () => {
  it("leer, wenn weder Termine noch Turniere", () => {
    expect(isWeekEmpty(0, 0)).toBe(true);
  });
  // Der eigentliche Regressionsschutz (Martins Punkt): ein geplantes Turnier ohne
  // manuelle Termine ist der Normalfall und darf NICHT „keine Termine" heißen.
  it("NICHT leer bei einem Turnier ohne manuelle Termine", () => {
    expect(isWeekEmpty(0, 1)).toBe(false);
  });
  it("NICHT leer bei manuellen Terminen ohne Turnier", () => {
    expect(isWeekEmpty(2, 0)).toBe(false);
  });
});

describe("nextTournamentAfter", () => {
  it("findet das früheste Turnier nach der sichtbaren Woche", () => {
    // Sichtbare Woche endet 2026-08-09 → nächstes ist 2026-10-05.
    expect(nextTournamentAfter(items, "2026-08-09")?.monday).toBe("2026-10-05");
  });
  it("überspringt soft-gelöschte und Turniere in/ vor der Woche", () => {
    // Nach dem 2026-10-05-Turnier bleibt nur 2026-10-12.
    expect(nextTournamentAfter(items, "2026-10-11")?.monday).toBe("2026-10-12");
  });
  it("null, wenn nichts mehr folgt", () => {
    expect(nextTournamentAfter(items, "2026-10-18")).toBeNull();
  });
});
