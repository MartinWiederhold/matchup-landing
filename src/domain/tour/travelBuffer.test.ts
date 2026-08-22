import { describe, it, expect } from "vitest";
import { restDaysBetween, isTightLeg, tightArrivals, type SeasonLeg } from "./travelBuffer";

// Montage (UTC): 2026-02-02, -09 (konsekutiv), -16 (eine Woche Abstand).
const MON1 = Date.UTC(2026, 1, 2);
const MON2 = Date.UTC(2026, 1, 9);
const MON3 = Date.UTC(2026, 1, 16);

describe("restDaysBetween", () => {
  it("konsekutive Wochen ⇒ 1 Übergangstag", () => {
    expect(restDaysBetween(MON1, MON2)).toBe(1);
  });
  it("eine Ruhewoche dazwischen ⇒ 8 Tage", () => {
    expect(restDaysBetween(MON1, MON3)).toBe(8);
  });
});

describe("isTightLeg", () => {
  it("gleicher Ort ⇒ nie eng (Cluster), egal wie knapp", () => {
    expect(isTightLeg("TN|Monastir", MON1, "TN|Monastir", MON2, 5)).toBe(false);
  });
  it("verschiedene Orte, konsekutiv, Puffer 2 ⇒ eng (1 < 2)", () => {
    expect(isTightLeg("TN|Monastir", MON1, "TR|Antalya", MON2, 2)).toBe(true);
  });
  it("verschiedene Orte, konsekutiv, Puffer 1 ⇒ nicht eng (1 ≥ 1)", () => {
    expect(isTightLeg("TN|Monastir", MON1, "TR|Antalya", MON2, 1)).toBe(false);
  });
  it("verschiedene Orte, eine Ruhewoche, Puffer 5 ⇒ nicht eng (8 ≥ 5)", () => {
    expect(isTightLeg("TN|Monastir", MON1, "TR|Antalya", MON3, 5)).toBe(false);
  });
  it("fehlender Ortsschlüssel ⇒ nicht clustern, Puffer greift", () => {
    expect(isTightLeg(null, MON1, "TR|Antalya", MON2, 2)).toBe(true);
  });
});

describe("tightArrivals", () => {
  const season: SeasonLeg[] = [
    { id: "a", place: "TN|Monastir", mondayMs: MON1 },
    { id: "b", place: "TR|Antalya", mondayMs: MON2 }, // konsekutiv, anderer Ort → eng bei Puffer 2
    { id: "c", place: "TR|Antalya", mondayMs: MON3 }, // gleicher Ort wie b → nie eng
  ];
  it("markiert nur das ankommende Turnier des engen Paares", () => {
    const m = tightArrivals(season, 2);
    expect(m.has("b")).toBe(true);
    expect(m.get("b")).toBe(1);
    expect(m.has("c")).toBe(false); // gleicher Ort wie Vorgänger
    expect(m.has("a")).toBe(false); // erstes Turnier hat keinen Vorgänger
  });
  it("Puffer 1 ⇒ kein enger Übergang", () => {
    expect(tightArrivals(season, 1).size).toBe(0);
  });
});
