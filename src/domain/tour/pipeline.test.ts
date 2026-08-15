import { describe, it, expect } from "vitest";
import { buildPipeline, isoWeek, mondayOf } from "./pipeline";

// Bezug: Montag 2026-03-02 (KW 10). Alle Test-Montage sind echte Montage.
const NOW = new Date("2026-03-02T09:00:00Z");
const t = (id: string, monday: string) => ({ id, monday });

describe("isoWeek / mondayOf", () => {
  it("Montag der Woche (UTC), auch mitten in der Woche", () => {
    expect(new Date(mondayOf(Date.parse("2026-03-04T20:00:00Z"))).toISOString().slice(0, 10)).toBe("2026-03-02");
  });
  it("ISO-KW: 2026-01-01 (Do) = KW 1; 2026-03-02 (Mo) = KW 10", () => {
    expect(isoWeek(Date.parse("2026-01-01T00:00:00Z"))).toEqual({ year: 2026, week: 1 });
    expect(isoWeek(Date.parse("2026-03-02T00:00:00Z"))).toEqual({ year: 2026, week: 10 });
  });
});

describe("buildPipeline – Wochen-Raster", () => {
  it("leere Saison ⇒ leer", () => {
    expect(buildPipeline([], NOW)).toEqual([]);
  });

  it("nur vergangene Turniere ⇒ leer (ab laufender Woche)", () => {
    expect(buildPipeline([t("a", "2026-02-16")], NOW)).toEqual([]);
  });

  it("Lücke bleibt sichtbar: Turnier in KW10 und KW12 ⇒ drei Zeilen, KW11 ist Lücke", () => {
    const rows = buildPipeline([t("a", "2026-03-02"), t("b", "2026-03-16")], NOW);
    expect(rows.map((r) => r.monday)).toEqual(["2026-03-02", "2026-03-09", "2026-03-16"]);
    expect(rows.map((r) => r.isGap)).toEqual([false, true, false]);
    expect(rows[0].isoWeek).toBe(10);
    expect(rows[1].items).toEqual([]); // Erholungswoche
  });

  it("mehrere Turniere je Woche (Primär + Ausweich) landen in EINER Zeile", () => {
    const rows = buildPipeline([t("a", "2026-03-02"), t("b", "2026-03-02")], NOW);
    expect(rows.length).toBe(1);
    expect(rows[0].items.map((x) => x.id).sort()).toEqual(["a", "b"]);
  });

  it("startet mit der laufenden Woche, auch wenn dort kein Turnier ist", () => {
    // Turnier erst in KW12 → KW10 (jetzt) und KW11 sind sichtbare Lücken davor.
    const rows = buildPipeline([t("b", "2026-03-16")], NOW);
    expect(rows[0].monday).toBe("2026-03-02");
    expect(rows.map((r) => r.isGap)).toEqual([true, true, false]);
  });

  it("deterministisch/reihenfolgeunabhängig", () => {
    const a = buildPipeline([t("b", "2026-03-16"), t("a", "2026-03-02")], NOW);
    const b = buildPipeline([t("a", "2026-03-02"), t("b", "2026-03-16")], NOW);
    expect(a).toEqual(b);
  });
});
