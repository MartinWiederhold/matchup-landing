import { describe, it, expect } from "vitest";
import { winRates, seasonBalances, tournamentBalances, pointsBySurface, type PerfMatch } from "./performance";

// Kurzform für ein Match. Synthetische Daten — heute steht nichts in tour_events (0 Zeilen),
// die Rechnung wird hier bewiesen.
const m = (won: boolean | null, surface: string | null, category: string | null, season: number | null, tid = "T", name = "Turnier"): PerfMatch => ({
  won, surface, category, season, tournamentId: tid, tournamentName: name,
});

describe("winRates – Siegquoten mit Grundlage", () => {
  it("Gesamtquote nutzt die Basis (decided), offene Matches zählen nur in total", () => {
    const r = winRates([
      m(true, "clay", "M25", 2026),
      m(true, "clay", "M25", 2026),
      m(true, "hard", "M25", 2026),
      m(false, "hard", "M25", 2026),
      m(false, "hard", "M25", 2026),
      m(null, "hard", "M25", 2026), // offen: kein Ausgang erfasst
    ]);
    expect(r.overall.wins).toBe(3);
    expect(r.overall.losses).toBe(2);
    expect(r.overall.open).toBe(1);
    expect(r.overall.decided).toBe(5); // Basis der Quote — NICHT 6
    expect(r.overall.total).toBe(6);
    expect(r.overall.rate).toBeCloseTo(0.6, 10); // 3/5, nicht 3/6
  });

  it("nach Belag: Sand 2,3× häufiger als Hart (der Bericht-Fall)", () => {
    // Sand 100 % (2/2), Hart ~43 % (3/7) → Faktor ≈ 2,33.
    const matches: PerfMatch[] = [
      ...Array.from({ length: 2 }, () => m(true, "clay", "M25", 2026)),
      ...Array.from({ length: 3 }, () => m(true, "hard", "M25", 2026)),
      ...Array.from({ length: 4 }, () => m(false, "hard", "M25", 2026)),
    ];
    const r = winRates(matches);
    const clay = r.bySurface.find((b) => b.key === "clay")!;
    const hard = r.bySurface.find((b) => b.key === "hard")!;
    expect(clay.tally.rate).toBe(1); // 2/2
    expect(clay.tally.decided).toBe(2); // Grundlage sichtbar: nur 2 Matches
    expect(hard.tally.rate).toBeCloseTo(3 / 7, 10);
    expect(clay.tally.rate! / hard.tally.rate!).toBeCloseTo(2.333, 2);
  });

  it("Belag-Reihenfolge fest (hard, clay, grass, carpet), 'unknown' zuletzt", () => {
    const r = winRates([
      m(true, null, "M25", 2026), // Slug-Match ohne Belag → unknown
      m(true, "grass", "M25", 2026),
      m(true, "hard", "M25", 2026),
      m(true, "clay", "M25", 2026),
    ]);
    expect(r.bySurface.map((b) => b.key)).toEqual(["hard", "clay", "grass", "unknown"]);
  });

  it("Slug-Match ohne Belag: zählt in overall, landet aber im 'unknown'-Eimer", () => {
    const r = winRates([m(true, "clay", "M25", 2026), m(false, null, null, 2026)]);
    expect(r.overall.total).toBe(2); // beide zählen gesamt
    expect(r.bySurface.find((b) => b.key === "unknown")!.tally.losses).toBe(1);
    expect(r.byCategory.find((b) => b.key === "unknown")!.tally.losses).toBe(1); // Kategorie ebenfalls unbekannt
  });

  it("keine Basis → rate null (keine erfundene 0)", () => {
    const r = winRates([m(null, "clay", "M25", 2026)]);
    const clay = r.bySurface.find((b) => b.key === "clay")!;
    expect(clay.tally.decided).toBe(0);
    expect(clay.tally.rate).toBeNull();
    expect(clay.tally.open).toBe(1);
  });
});

describe("seasonBalances – Bilanz je Saison", () => {
  it("trennt nach Jahr, neuestes zuerst, unbekannte Saison zuletzt", () => {
    const b = seasonBalances([
      m(true, "clay", "M25", 2025),
      m(false, "clay", "M25", 2025),
      m(true, "hard", "M25", 2026),
      m(true, "hard", "M25", null),
    ]);
    expect(b.map((x) => x.season)).toEqual([2026, 2025, null]);
    expect(b[1]).toEqual({ season: 2025, wins: 1, losses: 1, open: 0 });
  });
});

describe("tournamentBalances – Bilanz je Turnier", () => {
  it("nach entschiedenen Matches absteigend, dann Name", () => {
    const b = tournamentBalances([
      m(true, "clay", "M25", 2026, "A", "Alpha"),
      m(true, "hard", "M25", 2026, "B", "Beta"),
      m(false, "hard", "M25", 2026, "B", "Beta"),
    ]);
    expect(b.map((x) => x.tournamentId)).toEqual(["B", "A"]); // B hat 2 entschiedene, A nur 1
    expect(b[0]).toMatchObject({ tournamentName: "Beta", wins: 1, losses: 1 });
  });
});

describe("pointsBySurface – zählende Punkte je Belag", () => {
  it("summiert nur zählende Ergebnisse mit Punkten>0 und führt n als Grundlage", () => {
    const p = pointsBySurface([
      { surface: "clay", points: 25, counts: true },
      { surface: "clay", points: 16, counts: true },
      { surface: "hard", points: 8, counts: true },
      { surface: "hard", points: 0, counts: true }, // 0 Punkte → ignoriert
      { surface: "hard", points: 50, counts: false }, // zählt nicht → ignoriert
      { surface: null, points: 15, counts: true }, // Slug → unknown
    ]);
    const clay = p.find((x) => x.surface === "clay")!;
    expect(clay).toEqual({ surface: "clay", points: 41, n: 2 });
    expect(p.find((x) => x.surface === "hard")).toEqual({ surface: "hard", points: 8, n: 1 });
    expect(p.find((x) => x.surface === "unknown")).toEqual({ surface: "unknown", points: 15, n: 1 });
  });
});
