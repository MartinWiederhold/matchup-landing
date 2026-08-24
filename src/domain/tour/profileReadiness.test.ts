import { describe, it, expect } from "vitest";
import { daysUntil, profileGaps } from "./profileReadiness";

const now = "2026-08-24";

describe("daysUntil", () => {
  it("zählt ganze Tage bis Ablauf", () => {
    expect(daysUntil("2026-08-31", now)).toBe(7);
  });
  it("negativ wenn vorbei", () => {
    expect(daysUntil("2026-08-01", now)).toBeLessThan(0);
  });
});

describe("profileGaps", () => {
  it("leeres Profil: Wohnort, Nationalität, Sätze", () => {
    const g = profileGaps({
      nowISO: now, hasHome: false, hasNationality: false, hasRates: false,
      passportCountry: null, passportExpiry: null, insuranceExpiry: null,
    });
    expect(g.map((x) => x.kind)).toEqual(["home", "nationality", "rates"]);
  });

  it("Pass-Land ohne Datum ist eine Lücke, ohne erfundene Visa-Pflicht", () => {
    const g = profileGaps({
      nowISO: now, hasHome: true, hasNationality: true, hasRates: true,
      passportCountry: "DE", passportExpiry: null, insuranceExpiry: null,
    });
    expect(g).toEqual([{ kind: "passport_date" }]);
  });

  it("Pass läuft in 60 Tagen oder weniger ab", () => {
    const g = profileGaps({
      nowISO: now, hasHome: true, hasNationality: true, hasRates: true,
      passportCountry: "DE", passportExpiry: "2026-09-20", insuranceExpiry: null,
    });
    expect(g[0]).toEqual({ kind: "passport_expiring", days: 27 });
  });

  it("abgelaufene Versicherung", () => {
    const g = profileGaps({
      nowISO: now, hasHome: true, hasNationality: true, hasRates: true,
      passportCountry: null, passportExpiry: null, insuranceExpiry: "2026-01-01",
    });
    expect(g[0].kind).toBe("insurance_expired");
  });
});
