import { describe, it, expect } from "vitest";
import { drawChance } from "./drawChance";

describe("drawChance – Richtwert Hauptfeld/Quali", () => {
  it("Rank innerhalb main → Hauptfeld", () => {
    expect(drawChance("Challenger 100", 180).status).toBe("main"); // ≤ 200
    expect(drawChance("M25", 400).status).toBe("main"); // ≤ 450
  });

  it("Rank zwischen main und quali → Quali", () => {
    expect(drawChance("Challenger 100", 260).status).toBe("quali"); // 200 < 260 ≤ 300
    expect(drawChance("M15", 900).status).toBe("quali"); // 700 < 900 ≤ 1200
  });

  it("Rank über quali → eher nicht", () => {
    expect(drawChance("Challenger 100", 500).status).toBe("unlikely");
    expect(drawChance("Challenger 175", 400).status).toBe("unlikely"); // quali 220
  });

  it("fehlende Kategorie/Ranking oder unbekannte Kategorie → unknown (keine Aussage)", () => {
    expect(drawChance(null, 300).status).toBe("unknown");
    expect(drawChance("Challenger 100", null).status).toBe("unknown");
    expect(drawChance("Challenger 100", 0).status).toBe("unknown");
    expect(drawChance("J300", 300).status).toBe("unknown"); // Junioren: keine Baender
    expect(drawChance("GC", 50).status).toBe("unknown");
  });

  it("Grenzen sind inklusiv (≤ main = Hauptfeld, ≤ quali = Quali)", () => {
    expect(drawChance("Challenger 100", 200).status).toBe("main"); // == main
    expect(drawChance("Challenger 100", 300).status).toBe("quali"); // == quali
    expect(drawChance("Challenger 100", 301).status).toBe("unlikely");
  });
});
