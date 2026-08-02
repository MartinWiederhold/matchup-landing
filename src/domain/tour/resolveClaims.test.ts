import { describe, it, expect } from "vitest";
import { resolveClaimField, RESOLVE_RULES_VERSION, type FieldClaim } from "./resolveClaims";

const c = (field_value: string, source: string, observed_at: string, confidence: number): FieldClaim =>
  ({ field_value, source, observed_at, confidence });

describe("resolveClaimField – eindeutige Fälle", () => {
  it("keine Claims → null, kein Konflikt", () => {
    const r = resolveClaimField([]);
    expect(r.value).toBeNull();
    expect(r.source).toBeNull();
    expect(r.conflict).toBe(false);
    expect(r.notes).toContain("no_claims");
    expect(r.rulesVersion).toBe(RESOLVE_RULES_VERSION);
  });

  it("ein einzelner Claim wird übernommen", () => {
    const r = resolveClaimField([c("hard", "wikipedia_itf_2025_q1", "2025-01-06T00:00:00Z", 0.9)]);
    expect(r.value).toBe("hard");
    expect(r.source).toBe("wikipedia_itf_2025_q1");
    expect(r.conflict).toBe(false);
    expect(r.notes).toContain("single");
  });

  it("mehrere einige Claims → kein Konflikt", () => {
    const r = resolveClaimField([
      c("clay", "wikipedia_itf_2025_q1", "2025-01-06T00:00:00Z", 0.9),
      c("clay", "wikipedia_itf_2025_q2", "2025-04-01T00:00:00Z", 0.9),
    ]);
    expect(r.value).toBe("clay");
    expect(r.conflict).toBe(false);
    expect(r.notes).toContain("unanimous");
  });
});

describe("resolveClaimField – Rangkonflikt (a)", () => {
  it("Verbandsquelle schlägt Wikipedia, Konflikt wird markiert", () => {
    const r = resolveClaimField([
      c("hard", "wikipedia_itf_2025_q1", "2025-06-01T00:00:00Z", 0.9), // jünger, aber niedriger Rang
      c("clay", "verband_itf_2025", "2025-01-01T00:00:00Z", 0.8),
    ]);
    expect(r.value).toBe("clay");
    expect(r.source).toBe("verband_itf_2025");
    expect(r.conflict).toBe(true);
    expect(r.notes).toContain("by_rank");
    expect(r.notes).toContain("conflict");
    // Widerspruch senkt den Vertrauenswert.
    expect(r.confidence).toBeLessThan(0.8);
  });
});

describe("resolveClaimField – Gleichstand mit Zeitentscheidung (b)", () => {
  it("bei gleichem Rang gewinnt das jüngere observed_at", () => {
    const r = resolveClaimField([
      c("M15", "wikipedia_itf_2025_q1", "2025-01-06T00:00:00Z", 0.9),
      c("M25", "wikipedia_itf_2025_q1", "2025-03-30T00:00:00Z", 0.9), // jünger
    ]);
    expect(r.value).toBe("M25");
    expect(r.conflict).toBe(true);
    expect(r.notes).toContain("by_time");
  });
});

describe("resolveClaimField – Mehrheit (c) und Confidence (d)", () => {
  it("gleicher Rang & Zeit: der Wert mit mehr Claims gewinnt", () => {
    const ts = "2025-05-01T00:00:00Z";
    const r = resolveClaimField([
      c("M15", "wikipedia_itf_2025_q2", ts, 0.9),
      c("M15", "wikipedia_itf_2025_q2b", ts, 0.9),
      c("M25", "wikipedia_itf_2025_q2c", ts, 0.95),
    ]);
    expect(r.value).toBe("M15"); // 2× vs 1×, trotz höherer Confidence von M25
    expect(r.conflict).toBe(true);
    expect(r.notes).toContain("by_support");
  });

  it("gleicher Rang, Zeit und Anzahl: höhere Confidence entscheidet (als Konflikt)", () => {
    const ts = "2025-05-01T00:00:00Z";
    const r = resolveClaimField([
      c("A", "wikipedia_a", ts, 0.7),
      c("B", "wikipedia_b", ts, 0.9),
    ]);
    expect(r.value).toBe("B");
    expect(r.conflict).toBe(true);
    expect(r.notes).toContain("by_confidence");
  });
});

describe("resolveClaimField – Determinismus", () => {
  it("gleiche Eingabe → exakt gleiches Ergebnis", () => {
    const claims = [
      c("hard", "wikipedia_itf_2025_q1", "2025-06-01T00:00:00Z", 0.9),
      c("clay", "verband_itf_2025", "2025-01-01T00:00:00Z", 0.8),
      c("hard", "abgeleitet_aus_kategorie", "2025-02-01T00:00:00Z", 0.5),
    ];
    const a = resolveClaimField(claims);
    const b = resolveClaimField(claims);
    expect(a).toEqual(b);
    expect(a.rulesVersion).toBe(RESOLVE_RULES_VERSION);
  });
});
