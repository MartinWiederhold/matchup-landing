import { describe, it, expect } from "vitest";
import { displayCity } from "./displayCity";

describe("displayCity", () => {
  it("wandelt reine Uppercase-Namen in Title Case", () => {
    expect(displayCity("PORTO")).toBe("Porto");
    expect(displayCity("ADANA")).toBe("Adana");
    expect(displayCity("SAMSUN")).toBe("Samsun");
    expect(displayCity("MALLORCA")).toBe("Mallorca");
  });

  it("lässt bereits gemischt geschriebene Namen unverändert", () => {
    expect(displayCity("Como")).toBe("Como");
    expect(displayCity("Le Neubourg")).toBe("Le Neubourg");
    expect(displayCity("L'Aquila")).toBe("L'Aquila");
  });

  it("behandelt Bindestriche und Apostrophe bei Uppercase korrekt", () => {
    expect(displayCity("SAINT-MARTIN")).toBe("Saint-Martin");
    expect(displayCity("L'AQUILA")).toBe("L'Aquila");
  });

  it("gibt leeren String bei null oder undefined zurück", () => {
    expect(displayCity(null)).toBe("");
    expect(displayCity(undefined)).toBe("");
    expect(displayCity("")).toBe("");
  });
});
