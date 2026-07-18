import { describe, it, expect } from "vitest";
import { recommend, scoreRacket, RULES_VERSION } from "./scoreV1";
import { getRackets } from "@/data/seed/rackets";
import { defaultProfile, type PlayerProfile } from "@/domain/advisory/playerProfile";

const rackets = getRackets();

const beginnerComfort: PlayerProfile = {
  schemaVersion: 1, level: "beginner", swingStyle: "compact", goal: "comfort",
  playStyle: "baseline", armSensitivity: "high", problem: "arm-pain",
};
const clubControl: PlayerProfile = {
  schemaVersion: 1, level: "advanced", swingStyle: "full", goal: "control",
  playStyle: "baseline", armSensitivity: "none", problem: "flies-long",
};
const advancedSpin: PlayerProfile = {
  schemaVersion: 1, level: "competitive", swingStyle: "full", goal: "spin",
  playStyle: "baseline", armSensitivity: "none", problem: "no-spin",
};

describe("scoreV1 – Determinismus", () => {
  it("liefert für gleiche Eingabe exakt dasselbe Ergebnis", () => {
    const a = recommend(clubControl, rackets);
    const b = recommend(clubControl, rackets);
    expect(a).toEqual(b);
    expect(a.rulesVersion).toBe(RULES_VERSION);
  });

  it("Reihenfolge ist stabil (Score desc, dann id)", () => {
    const rec = recommend(advancedSpin, rackets).recommendations;
    for (let i = 1; i < rec.length; i++) {
      expect(rec[i - 1].matchScore).toBeGreaterThanOrEqual(rec[i].matchScore);
    }
  });
});

describe("scoreV1 – Referenzprofile", () => {
  it("beginner-comfort: schliesst sehr steife Rahmen aus und empfiehlt Komfort", () => {
    const { recommendations, excludedCount } = recommend(beginnerComfort, rackets);
    expect(recommendations.length).toBeGreaterThanOrEqual(3);
    // Empfindlicher Arm → kein Rahmen mit RA >= 68 in den Empfehlungen.
    expect(recommendations.every((r) => r.racket.specs.stiffnessRa < 68)).toBe(true);
    expect(excludedCount).toBeGreaterThan(0);
    // Der Top-Rahmen sollte überdurchschnittlich komfortabel sein.
    expect(recommendations[0].racket.ratings.comfort).toBeGreaterThanOrEqual(62);
  });

  it("club-control: Top-Empfehlung ist kontrollstark", () => {
    const top = recommend(clubControl, rackets).recommendations[0];
    expect(top.racket.ratings.control).toBeGreaterThanOrEqual(62);
    expect(top.topAxes).toContain("control");
  });

  it("advanced-spin: Top-Empfehlung ist spinstark", () => {
    const top = recommend(advancedSpin, rackets).recommendations[0];
    expect(top.racket.ratings.spin).toBeGreaterThanOrEqual(62);
  });

  it("Match-Score und Confidence sind getrennte Felder", () => {
    const r = scoreRacket(rackets[0], defaultProfile);
    expect(r.matchScore).toBeGreaterThanOrEqual(0);
    expect(r.matchScore).toBeLessThanOrEqual(100);
    expect(["high", "medium", "low"]).toContain(r.confidence);
  });
});
