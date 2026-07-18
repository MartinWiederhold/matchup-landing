import { describe, it, expect } from "vitest";
import { recommendStrings, recommendTension, STRING_RULES_VERSION } from "./stringScoreV1";
import { getStrings } from "@/data/seed/strings";
import type { PlayerProfile } from "@/domain/advisory/playerProfile";

const strings = getStrings();
const base: PlayerProfile = {
  schemaVersion: 1, level: "intermediate", swingStyle: "moderate", goal: "allround",
  playStyle: "baseline", armSensitivity: "none", problem: "none",
};

describe("stringScoreV1 – Determinismus", () => {
  it("gleiche Eingabe → gleiches Ergebnis", () => {
    expect(recommendStrings(base, strings)).toEqual(recommendStrings(base, strings));
    expect(recommendStrings(base, strings).rulesVersion).toBe(STRING_RULES_VERSION);
  });
});

describe("stringScoreV1 – Regeln", () => {
  it("empfindlicher Arm: schliesst harte Saiten aus, empfiehlt komfortable", () => {
    const p: PlayerProfile = { ...base, armSensitivity: "high", goal: "comfort", problem: "arm-pain" };
    const { recommendations, excludedCount } = recommendStrings(p, strings);
    expect(excludedCount).toBeGreaterThan(0);
    expect(recommendations.every((r) => r.product.ratings.comfort >= 60)).toBe(true);
    expect(recommendations[0].product.ratings.comfort).toBeGreaterThanOrEqual(80);
  });

  it("Spin-Ziel: Top-Saite ist spinstark", () => {
    const p: PlayerProfile = { ...base, goal: "spin", problem: "no-spin" };
    expect(recommendStrings(p, strings).recommendations[0].product.ratings.spin).toBeGreaterThanOrEqual(70);
  });

  it("Spannung ist ein BEREICH (min < max) und reagiert auf das Profil", () => {
    const arm = recommendTension({ ...base, armSensitivity: "high" });
    const control = recommendTension({ ...base, goal: "control" });
    expect(arm.min).toBeLessThan(arm.max);
    // Empfindlicher Arm → niedrigere Spannung als kontrollorientiert.
    expect(arm.max).toBeLessThan(control.max);
  });
});
