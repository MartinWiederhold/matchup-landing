import { describe, it, expect } from "vitest";
import { formatMoney } from "./formatMoney";

describe("formatMoney", () => {
  it("formatiert Beträge gerundet auf ganze Einheiten (kein Nachkommateil in der Ausgabe)", () => {
    // Der Betrag ist 1234.56 EUR — Formatter rundet auf 1235.
    const out = formatMoney(123456, "EUR", "de-CH");
    expect(out).not.toMatch(/[.,]\d{2}/);   // kein „,56"/„.56" mehr
    expect(out).toMatch(/1[.'’ \s]?235/u); // Tausendertrenner Locale-abhängig
  });

  it("rundet 999.50 → 1000 (kein Halbcent-Restwert in der Ausgabe)", () => {
    expect(formatMoney(99950, "USD", "en-US")).toBe("$1,000");
  });

  it("respektiert die Locale beim Trennerformat", () => {
    // en-US nutzt Komma als Tausendertrenner.
    expect(formatMoney(1000000, "USD", "en-US")).toBe("$10,000");
  });
});
