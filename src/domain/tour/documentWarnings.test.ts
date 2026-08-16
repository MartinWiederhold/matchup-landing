import { describe, it, expect } from "vitest";
import { documentWarnings, type DocWarning } from "./documentWarnings";

const kinds = (w: DocWarning[]) => w.map((x) => x.kind);

describe("documentWarnings – Pass", () => {
  it("abgelaufener Pass → error passport_expired", () => {
    const w = documentWarnings({ passports: [{ country: "DE", expiry: "2026-01-01" }], asOf: "2026-08-16" });
    expect(kinds(w)).toEqual(["passport_expired"]);
    expect(w[0].severity).toBe("error");
    expect(w[0].date).toBe("2026-01-01");
  });

  it("läuft in 90 Tagen ab → warn passport_expiring mit Tageszahl", () => {
    const w = documentWarnings({ passports: [{ country: "DE", expiry: "2026-10-01" }], asOf: "2026-08-16" });
    expect(kinds(w)).toEqual(["passport_expiring"]);
    expect(w[0].days).toBe(46); // 16.08. → 01.10.
  });

  it("bester Pass gilt: ein gültiger zweiter Pass unterdrückt die Warnung", () => {
    const w = documentWarnings({
      passports: [{ country: "DE", expiry: "2026-01-01" }, { country: "IT", expiry: "2031-01-01" }],
      asOf: "2026-08-16",
    });
    expect(w).toEqual([]); // spätester Ablauf 2031 → weit gültig
  });

  it("6-Monats-Faustregel: Pass läuft vor Einreise+6M ab → passport_too_short, ruleOfThumb", () => {
    const w = documentWarnings({
      passports: [{ country: "DE", expiry: "2027-02-01" }],
      nextTrip: { destination: "US", entryDate: "2026-10-01" }, // +6M = 2027-04-01 > 2027-02-01
      asOf: "2026-08-16",
    });
    expect(kinds(w)).toContain("passport_too_short");
    const tooShort = w.find((x) => x.kind === "passport_too_short")!;
    expect(tooShort.ruleOfThumb).toBe(true); // als Faustregel gekennzeichnet
    expect(tooShort.destination).toBe("US");
  });

  it("6-Monats-Faustregel greift NICHT, wenn der Pass lang genug gültig ist", () => {
    const w = documentWarnings({
      passports: [{ country: "DE", expiry: "2030-01-01" }],
      nextTrip: { destination: "US", entryDate: "2026-10-01" },
      asOf: "2026-08-16",
    });
    expect(kinds(w)).toEqual([]);
  });

  it("abgelaufen unterdrückt too_short (keine Doppelmeldung)", () => {
    const w = documentWarnings({
      passports: [{ country: "DE", expiry: "2026-01-01" }],
      nextTrip: { destination: "US", entryDate: "2026-10-01" },
      asOf: "2026-08-16",
    });
    expect(kinds(w)).toEqual(["passport_expired"]);
  });
});

describe("documentWarnings – Versicherung", () => {
  it("abgelaufen → error; bald ab → warn", () => {
    expect(kinds(documentWarnings({ insurance: { expiry: "2026-01-01", international: true }, asOf: "2026-08-16" }))).toEqual(["insurance_expired"]);
    expect(kinds(documentWarnings({ insurance: { expiry: "2026-09-30", international: true }, asOf: "2026-08-16" }))).toEqual(["insurance_expiring"]);
  });

  it("nicht international + Reise steht an → insurance_not_international mit Zielland", () => {
    const w = documentWarnings({
      insurance: { expiry: "2030-01-01", international: false },
      nextTrip: { destination: "AU", entryDate: "2026-10-01" },
      asOf: "2026-08-16",
    });
    expect(kinds(w)).toEqual(["insurance_not_international"]);
    expect(w[0].destination).toBe("AU");
  });

  it("nicht international ohne anstehende Reise → keine Warnung", () => {
    expect(documentWarnings({ insurance: { expiry: "2030-01-01", international: false }, asOf: "2026-08-16" })).toEqual([]);
  });
});

describe("documentWarnings – Robustheit", () => {
  it("ungültiger Stichtag → keine Warnungen (kein Werfen)", () => {
    expect(documentWarnings({ passports: [{ country: "DE", expiry: "2020-01-01" }], asOf: "kaputt" })).toEqual([]);
  });

  it("leere Eingabe → keine Warnungen", () => {
    expect(documentWarnings({ asOf: "2026-08-16" })).toEqual([]);
  });

  it("Errors stehen vor Warnungen", () => {
    const w = documentWarnings({
      passports: [{ country: "DE", expiry: "2026-01-01" }], // expired (error)
      insurance: { expiry: "2026-09-30", international: true }, // expiring (warn)
      asOf: "2026-08-16",
    });
    expect(w[0].severity).toBe("error");
    expect(w[w.length - 1].severity).toBe("warn");
  });
});
