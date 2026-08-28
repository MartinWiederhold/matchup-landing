import { describe, it, expect } from "vitest";
import { formatDistanceKm } from "./formatDistance";

describe("formatDistanceKm", () => {
  it("rundet kurze Strecken auf eine Nachkommastelle", () => {
    expect(formatDistanceKm(4.24, "de-CH")).toBe("4.2 km");
    expect(formatDistanceKm(0.5, "de-CH")).toBe("0.5 km");
  });

  it("rundet lange Strecken auf ganze Kilometer", () => {
    expect(formatDistanceKm(123.7, "de-CH")).toBe("124 km");
    expect(formatDistanceKm(10, "de-CH")).toBe("10 km");
    // Große Zahl mit Tausender-Trenner in de-CH ("’" bzw. "'").
    expect(formatDistanceKm(1234.4, "de-CH")).toMatch(/^1[.'’ \s]?234 km$/u);
  });

  it("gibt einen Bindestrich zurück bei NaN oder negativer Distanz", () => {
    expect(formatDistanceKm(Number.NaN)).toBe("—");
    expect(formatDistanceKm(-5)).toBe("—");
  });
});
