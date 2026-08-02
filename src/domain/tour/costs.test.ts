import { describe, it, expect } from "vitest";
import { computeSeasonCost, COST_RULES_VERSION, type CostParams, type Station } from "./costs";

const m = (amount: number, currency = "EUR") => ({ amount, currency });
// Standard-Kostensätze in EUR-Cent: Anreise 100€, Nacht 50€, Essen 30€/Tag.
const PARAMS: CostParams = { arrival: m(10000), perNight: m(5000), foodPerDay: m(3000) };

describe("computeSeasonCost – einzelne Station", () => {
  const r = computeSeasonCost([{ place: "TN|Monastir", nights: 2, entryFee: m(2000) }], PARAMS);
  it("verrechnet Anreise + Unterkunft + Essen + Meldegebühr", () => {
    // 10000 + 2*5000 + 2*3000 + 2000 = 28000
    expect(r.total).toEqual({ EUR: 28000 });
    expect(r.stations[0].items.map((i) => i.code)).toEqual(["arrival", "lodging", "food", "entry"]);
    expect(r.stations[0].arrivalCharged).toBe(true);
    expect(r.arrivalsCharged).toBe(1);
    expect(r.arrivalsSaved).toBe(0);
    expect(r.rulesVersion).toBe(COST_RULES_VERSION);
  });
});

describe("computeSeasonCost – Cluster-Effekt (der eigentliche Wert)", () => {
  const drei = (a: string, b: string, c: string): Station[] => [
    { place: a, nights: 3 }, { place: b, nights: 3 }, { place: c, nights: 3 },
  ];
  const cluster = computeSeasonCost(drei("TN|Monastir", "TN|Monastir", "TN|Monastir"), PARAMS);
  const verstreut = computeSeasonCost(drei("TN|Monastir", "ES|Manacor", "EG|Sharm"), PARAMS);

  it("drei Stationen am SELBEN Ort kosten weniger als an drei Orten", () => {
    expect(cluster.total.EUR).toBeLessThan(verstreut.total.EUR);
    // Konkret: nur der Anreise-Unterschied (2 gesparte Anreisen à 100€).
    expect(verstreut.total.EUR - cluster.total.EUR).toBe(2 * 10000);
  });
  it("zählt genau eine Anreise und zwei eingesparte", () => {
    expect(cluster.arrivalsCharged).toBe(1);
    expect(cluster.arrivalsIsolated).toBe(3);
    expect(cluster.arrivalsSaved).toBe(2);
    // Nur die erste Station trägt eine Anreise.
    expect(cluster.stations.map((s) => s.arrivalCharged)).toEqual([true, false, false]);
  });
});

describe("computeSeasonCost – Wechsel zwischen zwei Orten", () => {
  const r = computeSeasonCost([{ place: "A", nights: 2 }, { place: "B", nights: 2 }], PARAMS);
  it("zwei Orte = zwei Anreisen, nichts gespart", () => {
    expect(r.arrivalsCharged).toBe(2);
    expect(r.arrivalsSaved).toBe(0);
    expect(r.stations.map((s) => s.arrivalCharged)).toEqual([true, true]);
  });
});

describe("computeSeasonCost – gemischte Währungen", () => {
  // Meldegebühr in USD, alles andere EUR.
  const r = computeSeasonCost([{ place: "US|Tulsa", nights: 1, entryFee: m(2500, "USD") }], PARAMS);
  it("summiert je Währung getrennt, nicht zusammen", () => {
    expect(r.total).toEqual({ EUR: 10000 + 5000 + 3000, USD: 2500 });
    expect(r.currencies).toEqual(["EUR", "USD"]);
    expect(r.multiCurrency).toBe(true);
    expect(r.notes).toContain("mehrwaehrung");
  });
});

describe("computeSeasonCost – leere Kette", () => {
  const r = computeSeasonCost([], PARAMS);
  it("liefert kein Ergebnis, aber einen Code", () => {
    expect(r.stations).toEqual([]);
    expect(r.total).toEqual({});
    expect(r.notes).toContain("leere_kette");
    expect(r.arrivalsSaved).toBe(0);
  });
});

describe("computeSeasonCost – fehlender Pflichtsatz wird als unbekannt ausgewiesen", () => {
  const r = computeSeasonCost([{ place: "X", nights: 2 }], { arrival: m(10000), foodPerDay: m(3000) });
  it("schätzt nichts, markiert die Position unbekannt", () => {
    const lodging = r.stations[0].items.find((i) => i.code === "lodging");
    expect(lodging).toEqual({ code: "lodging", unknown: true });
    expect(r.hasUnknown).toBe(true);
    expect(r.notes).toContain("unbekannte_posten");
    // Unterkunft fließt NICHT in die Summe ein (keine Schätzung).
    expect(r.total).toEqual({ EUR: 10000 + 2 * 3000 });
  });
});

describe("computeSeasonCost – Determinismus", () => {
  it("gleiche Eingabe → exakt gleiches Ergebnis", () => {
    const stations: Station[] = [
      { place: "TN|Monastir", nights: 7, entryFee: m(4000) },
      { place: "TN|Monastir", nights: 7 },
    ];
    const params: CostParams = { ...PARAMS, coachPerWeek: m(20000) };
    const a = computeSeasonCost(stations, params);
    const b = computeSeasonCost(stations, params);
    expect(a).toEqual(b);
    expect(a.rulesVersion).toBe(COST_RULES_VERSION);
  });
});
