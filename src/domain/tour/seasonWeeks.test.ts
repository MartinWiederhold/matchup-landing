import { describe, it, expect } from "vitest";
import { buildSeasonWeeks, groupTapeWeeks, isoWeekNumber } from "./seasonWeeks";

const MON_A = "2026-08-17"; // Montag
const MON_B = "2026-08-24";
const MON_C = "2026-08-31";
const nowThu = Date.parse("2026-08-20T12:00:00Z");

const tour = (id: string, monday: string, city = "Como", country = "IT") => ({
  id, monday, city, country, category: "C75", series: "challenger", status: "planned",
  deadlineKnown: true, deadlineMs: Date.parse(monday + "T00:00:00Z") - 7 * 86_400_000,
});

describe("buildSeasonWeeks", () => {
  it("ohne Daten: genau die Woche um nowMs", () => {
    const w = buildSeasonWeeks({ nowMs: nowThu, tournaments: [], events: [], bufferDays: 2 });
    expect(w).toHaveLength(1);
    expect(w[0].monday).toBe(MON_A);
    expect(w[0].isCurrent).toBe(true);
    expect(w[0].tournaments).toEqual([]);
  });

  it("Turnier belegt seine Mo–So-Woche", () => {
    const w = buildSeasonWeeks({ nowMs: nowThu, tournaments: [tour("t1", MON_A)], events: [], bufferDays: 2 });
    expect(w.some((x) => x.tournaments.some((t) => t.id === "t1"))).toBe(true);
    const week = w.find((x) => x.monday === MON_A)!;
    expect(week.tournaments[0].deadlineKind).toBe("passed");
  });

  it("Termin fällt in die Woche seines Datums", () => {
    const w = buildSeasonWeeks({
      nowMs: nowThu,
      tournaments: [],
      events: [{ id: "e1", kind: "training", title: "Hitting", date: "2026-08-19", time: "10:00" }],
      bufferDays: 2,
    });
    expect(w[0].events).toHaveLength(1);
    expect(w[0].events[0].id).toBe("e1");
  });

  it("Lücke zwischen zwei Turnierwochen bleibt als offene Woche stehen", () => {
    const w = buildSeasonWeeks({
      nowMs: nowThu,
      tournaments: [tour("t1", MON_A), tour("t2", MON_C, "Istanbul", "TR")],
      events: [],
      bufferDays: 2,
    });
    const mondays = w.map((x) => x.monday);
    expect(mondays).toContain(MON_B);
    const gap = w.find((x) => x.monday === MON_B)!;
    expect(gap.tournaments).toHaveLength(0);
  });

  it("Rücken-an-Rücken an anderem Ort: inbound tight bei Puffer 2", () => {
    const w = buildSeasonWeeks({
      nowMs: nowThu,
      tournaments: [tour("t1", MON_A), tour("t2", MON_B, "London", "GB")],
      events: [],
      bufferDays: 2,
    });
    const arr = w.find((x) => x.monday === MON_B)!;
    expect(arr.inbound?.tight).toBe(true);
    expect(arr.inbound?.cluster).toBe(false);
    expect(arr.inbound?.restDays).toBe(1);
  });

  it("gleicher Ort: Cluster, nicht tight", () => {
    const w = buildSeasonWeeks({
      nowMs: nowThu,
      tournaments: [tour("t1", MON_A), tour("t2", MON_B, "Como", "IT")],
      events: [],
      bufferDays: 2,
    });
    const arr = w.find((x) => x.monday === MON_B)!;
    expect(arr.inbound?.cluster).toBe(true);
    expect(arr.inbound?.tight).toBe(false);
  });
});

describe("groupTapeWeeks", () => {
  it("leere Lücke zwischen Turnieren wird ein Rest-Block", () => {
    const w = buildSeasonWeeks({
      nowMs: Date.parse("2026-08-10T12:00:00Z"),
      tournaments: [tour("t1", MON_A), tour("t2", MON_C, "Istanbul", "TR")],
      events: [],
      bufferDays: 2,
    });
    const blocks = groupTapeWeeks(w);
    expect(blocks.some((b) => b.kind === "rest" && b.weeks.some((x) => x.monday === MON_B))).toBe(true);
    expect(blocks.filter((b) => b.kind === "week").length).toBeGreaterThanOrEqual(2);
  });

  it("aktuelle leere Woche bleibt eine Karte", () => {
    const w = buildSeasonWeeks({ nowMs: nowThu, tournaments: [], events: [], bufferDays: 2 });
    const blocks = groupTapeWeeks(w);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].kind).toBe("week");
    expect(blocks[0].kind === "week" && blocks[0].week.isCurrent).toBe(true);
  });
});

describe("isoWeekNumber", () => {
  it("17.08.2026 ist KW 34", () => {
    expect(isoWeekNumber("2026-08-17")).toBe(34);
  });
});
