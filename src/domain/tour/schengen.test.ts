import { describe, it, expect } from "vitest";
import { schengenUsage, SCHENGEN_RULES_VERSION, type Stay } from "./schengen";

// Stichtag weit in der Zukunft, damit er die geschlossenen Aufenthalte nie kappt.
const ASOF = "2026-12-31";
const stay = (country: string, entry: string, exit: string | null): Stay => ({ country, entry, exit });

describe("schengenUsage – einfacher Aufenthalt, Ein- und Ausreisetag zählen", () => {
  // 02.–06.03. = 5 Kalendertage (nur 4 Nächte), beide Ränder zählen voll.
  const r = schengenUsage([stay("FR", "2026-03-02", "2026-03-06")], ASOF);
  it("zählt Ein- und Ausreisetag als volle Tage", () => {
    expect(r.used).toBe(5);
    expect(r.left).toBe(85);
    expect(r.totalDays).toBe(5);
    expect(r.exceeds).toBe(false);
    expect(r.rulesVersion).toBe(SCHENGEN_RULES_VERSION);
  });
});

describe("schengenUsage – überlappende Aufenthalte werden dedupliziert", () => {
  // FR 01.–10.06. und DE 05.–15.06. → Vereinigung 01.–15.06. = 15 Tage (Überlappung einmal).
  const r = schengenUsage([stay("FR", "2026-06-01", "2026-06-10"), stay("DE", "2026-06-05", "2026-06-15")], ASOF);
  it("ein Tag zählt einmal, auch bei zwei Ländern am selben Tag", () => {
    expect(r.used).toBe(15);
    expect(r.totalDays).toBe(15);
  });
});

describe("schengenUsage – Aufenthalt über eine Fenstergrenze hinweg", () => {
  // FR 01.–30.01. (30) + FR 01.–30.06. (30). Fenster endet 30.06. → beginnt 02.01.,
  // der 01.01. fällt heraus → 29 + 30 = 59 (belegt die Fensterbreite von exakt 180).
  const r = schengenUsage([stay("FR", "2026-01-01", "2026-01-30"), stay("FR", "2026-06-01", "2026-06-30")], ASOF);
  it("zählt nur die Tage im ungünstigsten 180-Tage-Fenster", () => {
    expect(r.used).toBe(59);
    // Erster Tag, der die Spitze 59 erreicht: 30 Jan-Tage + 29 Jun-Tage bis zum 29.06.
    // (der 30.06. erreicht 59 ebenfalls, aber später).
    expect(r.peakWindowEnd).toBe("2026-06-29");
  });
});

describe("schengenUsage – Überschreitung mit exceedOn", () => {
  // Durchgehend 01.01.–30.04. = 120 Tage. Tag 90 = 31.03., Tag 91 = 01.04. → erste Überschreitung.
  const r = schengenUsage([stay("FR", "2026-01-01", "2026-04-30")], ASOF);
  it("meldet Überschreitung und den ersten Tag darüber", () => {
    expect(r.used).toBe(120);
    expect(r.exceeds).toBe(true);
    expect(r.exceedOn).toBe("2026-04-01");
    expect(r.left).toBe(0);
    expect(r.notes).toContain("ueberschreitung");
  });
});

describe("schengenUsage – offener Aufenthalt zählt bis zum Stichtag", () => {
  // Einreise 01.06., exit null, Stichtag 10.06. → 01.–10.06. = 10 Tage.
  const r = schengenUsage([stay("FR", "2026-06-01", null)], "2026-06-10");
  it("rechnet einen laufenden Aufenthalt bis zum Stichtag", () => {
    expect(r.used).toBe(10);
    expect(r.totalDays).toBe(10);
  });
});

describe("schengenUsage – Nicht-Schengen-Land wird ignoriert (kein Fehler)", () => {
  const r = schengenUsage([stay("US", "2026-06-01", "2026-06-30"), stay("GB", "2026-07-01", "2026-07-10")], ASOF);
  it("zählt keine Tage und meldet keinen Fehler", () => {
    expect(r.used).toBe(0);
    expect(r.totalDays).toBe(0);
    expect(r.notes).toContain("keine_schengen_tage");
    expect(r.notes).not.toContain("ungueltiges_datum");
  });
});

describe("schengenUsage – Grenzfall exakt 90 Tage", () => {
  // Durchgehend 01.01.–31.03. = 90 Tage (Tag 90 = 31.03.). Genau am Limit, KEINE Überschreitung.
  const r = schengenUsage([stay("FR", "2026-01-01", "2026-03-31")], ASOF);
  it("90 gilt noch als erlaubt (kein exceeds), left = 0", () => {
    expect(r.used).toBe(90);
    expect(r.exceeds).toBe(false);
    expect(r.exceedOn).toBeNull();
    expect(r.left).toBe(0);
  });
});

describe("schengenUsage – Determinismus", () => {
  it("gleiche Eingabe → exakt gleiches Ergebnis", () => {
    const stays = [stay("HR", "2026-05-01", "2026-05-20"), stay("IT", "2026-05-18", null)];
    const a = schengenUsage(stays, "2026-06-01");
    const b = schengenUsage(stays, "2026-06-01");
    expect(a).toEqual(b);
    expect(a.rulesVersion).toBe(SCHENGEN_RULES_VERSION);
  });
});

describe("schengenUsage – durchgehender Aufenthalt zählt mehr als zwei mit Lücke (MU-018)", () => {
  // Gleiche Gesamtspanne 01.–20.06., aber der durchgehende Aufenthalt zählt die
  // Zwischentage mit — der Turnierfenster-Ansatz (Lücke) unterschätzt.
  const durchgehend = schengenUsage([stay("FR", "2026-06-01", "2026-06-20")], ASOF);
  const mitLuecke = schengenUsage([stay("FR", "2026-06-01", "2026-06-05"), stay("FR", "2026-06-16", "2026-06-20")], ASOF);
  it("durchgehend (20) > mit Lücke (10)", () => {
    expect(durchgehend.used).toBe(20);
    expect(mitLuecke.used).toBe(10);
    expect(durchgehend.used).toBeGreaterThan(mitLuecke.used);
  });
});
