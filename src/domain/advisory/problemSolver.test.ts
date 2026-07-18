import { describe, it, expect } from "vitest";
import { getProblemAdvice } from "./problemSolver";

describe("problemSolver", () => {
  it("liefert null für 'none'", () => {
    expect(getProblemAdvice("none")).toBeNull();
  });

  it("jedes Problem hat risikoarme Schritte VOR Ausrüstungswechsel", () => {
    for (const p of ["flies-long", "no-control", "no-spin", "arm-pain", "too-heavy"] as const) {
      const a = getProblemAdvice(p);
      expect(a).not.toBeNull();
      expect(a!.firstTry.length).toBeGreaterThanOrEqual(1);
      expect(a!.thenConsider.length).toBeGreaterThanOrEqual(1);
      // Jede Massnahme ist zweisprachig hinterlegt.
      for (const step of [...a!.firstTry, ...a!.thenConsider]) {
        expect(step.de.length).toBeGreaterThan(0);
        expect(step.en.length).toBeGreaterThan(0);
      }
    }
  });

  it("arm-pain trägt den Gesundheitshinweis-Flag", () => {
    expect(getProblemAdvice("arm-pain")!.medical).toBe(true);
    expect(getProblemAdvice("no-spin")!.medical).toBeUndefined();
  });
});
