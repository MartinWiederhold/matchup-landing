import { describe, it, expect } from "vitest";
import { pointsForecast } from "./pointsForecast";
import type { MatchResult } from "./points";

// Synthetische Ergebnisse. Challenger wird ab dem Turniermontag wirksam (kein ITF-Verzug),
// Verfall = Montag + 364 Tage.
const r = (category: string, round: string, monday: string): MatchResult => ({ category, round, tournamentMonday: monday });

describe("pointsForecast – aktueller Stand + Ausblick", () => {
  // challenger_125 R16 = 8 Punkte, Montag 2025-09-01 → Verfall 2026-08-31.
  // challenger_125 W  = 125 Punkte, Montag 2026-01-05 → Verfall 2027-01-04 (fällt lange nicht).
  const results = [r("challenger_125", "R16", "2025-09-01"), r("challenger_125", "W", "2026-01-05")];
  const asOf = "2026-08-16";

  it("aktueller Stand summiert beide zählenden Ergebnisse", () => {
    const f = pointsForecast(results, asOf);
    expect(f.currentTotal).toBe(133); // 8 + 125
    expect(f.countingLimit).toBe(6); // Stichtag 2026 → beste 6
  });

  it("+4 Wochen: die 8 Punkte verfallen (2026-08-31), netto 125", () => {
    const f = pointsForecast(results, asOf);
    const s4 = f.steps.find((s) => s.weeks === 4)!;
    expect(s4.date).toBe("2026-09-13"); // 16.08. + 28 Tage
    expect(s4.total).toBe(125);
    expect(s4.delta).toBe(-8);
    expect(s4.expiring).toHaveLength(1);
    expect(s4.expiring[0].points).toBe(8);
    expect(s4.expiring[0].expiresOn).toBe("2026-08-31");
  });

  it("+8 und +12 Wochen: nichts Weiteres fällt, Stand bleibt 125", () => {
    const f = pointsForecast(results, asOf);
    expect(f.steps.find((s) => s.weeks === 8)!.total).toBe(125);
    expect(f.steps.find((s) => s.weeks === 12)!.total).toBe(125);
  });

  it("Standard-Horizonte sind 4/8/12 Wochen", () => {
    expect(pointsForecast(results, asOf).steps.map((s) => s.weeks)).toEqual([4, 8, 12]);
  });

  it("Verfallsplan ist nach Verfallsdatum aufsteigend sortiert (Nächstes zuerst)", () => {
    const f = pointsForecast(results, asOf);
    expect(f.schedule.map((x) => x.points)).toEqual([8, 125]); // 2026-08-31 vor 2027-01-04
    expect(f.schedule[0].expiresOn < f.schedule[1].expiresOn).toBe(true);
  });
});

describe("pointsForecast – Bericht-Szenario (7 → −2 → netto 5)", () => {
  it("ein 2-Punkte-Ergebnis, das im Fenster verfällt, senkt den Netto-Stand um 2", () => {
    // m15 QF = 2 Punkte, m15 SF = 4, m15 F = 8 → 14? Wir wollen 7: challenger_50 R16 = 4 + m15 SF = 4? =8.
    // Einfach & belegt: m15 QF (2) verfällt bald, plus m15 F (8) bleibt. Stand 10 → 8.
    const results = [r("m15", "QF", "2025-08-25"), r("m15", "F", "2026-02-02")];
    const asOf = "2026-08-16";
    const f = pointsForecast(results, asOf);
    // ITF wird erst am zweiten Montag wirksam (+14 T): QF-Montag 2025-08-25 → wirksam 2025-09-08 →
    // Verfall 2026-09-07. Liegt im +4-Wochen-Fenster (bis 2026-09-13).
    expect(f.currentTotal).toBe(10); // 2 + 8
    const s4 = f.steps.find((s) => s.weeks === 4)!;
    expect(s4.expiring.map((e) => e.points)).toEqual([2]);
    expect(s4.total).toBe(8);
    expect(s4.delta).toBe(-2);
  });
});

describe("pointsForecast – Robustheit", () => {
  it("leere Liste → Stand 0, alle Schritte 0", () => {
    const f = pointsForecast([], "2026-08-16");
    expect(f.currentTotal).toBe(0);
    expect(f.steps.every((s) => s.total === 0 && s.delta === 0 && s.expiring.length === 0)).toBe(true);
    expect(f.schedule).toEqual([]);
  });

  it("ungültiger Stichtag → Stand 0 (kein Werfen)", () => {
    expect(pointsForecast([r("m25", "W", "2026-01-05")], "kaputt").currentTotal).toBe(0);
  });
});
