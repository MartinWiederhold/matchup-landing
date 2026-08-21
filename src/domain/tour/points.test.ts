import { describe, it, expect } from "vitest";
import { scorePoints, POINTS_RULES_VERSION, toPointsCategory, expectedPoints, type MatchResult } from "./points";

// Alle verwendeten tournamentMonday-Werte sind echte Montage (unten teils via getUTCDay geprüft):
//   2024-01-08, 2025-01-06, 2025-06-02, 2025-11-03, 2026-03-02 — je getUTCDay() === 1.

describe("scorePoints – einfache Berechnung", () => {
  it("Challenger-175-Sieg = 175 Punkte, zählt zum Stichtag", () => {
    const results: MatchResult[] = [{ category: "challenger_175", round: "W", tournamentMonday: "2025-06-02" }];
    const out = scorePoints(results, "2025-06-30");
    expect(out.rulesVersion).toBe(POINTS_RULES_VERSION);
    expect(out.results[0].points).toBe(175);
    expect(out.results[0].counts).toBe(true);
    expect(out.countingTotal).toBe(175);
  });

  it("Challenger-Qualifikation gibt Q-Punkte (nur Challenger)", () => {
    const out = scorePoints([{ category: "challenger_175", round: "Q", tournamentMonday: "2025-06-02" }], "2025-06-30");
    expect(out.results[0].points).toBe(6);
    expect(out.results[0].notes).not.toContain("kein_quali_itf");
  });
});

describe("scorePoints – Erstrundenniederlage gibt null", () => {
  it("Challenger R32 = 0 Punkte + Code, zählt nicht", () => {
    const out = scorePoints([{ category: "challenger_100", round: "R32", tournamentMonday: "2025-06-02" }], "2025-06-30");
    expect(out.results[0].points).toBe(0);
    expect(out.results[0].notes).toContain("kein_punkt_erstrunde");
    expect(out.results[0].counts).toBe(false);
    expect(out.countingTotal).toBe(0);
  });

  it("ITF-Qualifikant bekommt KEINEN Bonus (Q = 0 + Code)", () => {
    const out = scorePoints([{ category: "m25", round: "Q", tournamentMonday: "2025-06-02" }], "2025-08-01");
    expect(out.results[0].points).toBe(0);
    expect(out.results[0].notes).toContain("kein_quali_itf");
  });
});

describe("scorePoints – Jahresabhängigkeit M25 (2025 gegen 2026)", () => {
  // Belegt: M25-Finale 2024/2025 = 16, 2026 = 14; Halbfinale 8 → 7. Maßgeblich ist das
  // Jahr der Turnierwoche, NICHT der Stichtag.
  it("M25-Finale 2025 = 16 Punkte", () => {
    const out = scorePoints([{ category: "m25", round: "F", tournamentMonday: "2025-06-02" }], "2025-08-01");
    expect(out.results[0].points).toBe(16);
    expect(out.results[0].tableYear).toBe(2025);
  });

  it("M25-Finale 2026 = 14 Punkte", () => {
    const out = scorePoints([{ category: "m25", round: "F", tournamentMonday: "2026-03-02" }], "2026-05-01");
    expect(out.results[0].points).toBe(14);
    expect(out.results[0].tableYear).toBe(2026);
  });

  it("M25-Halbfinale 8 (2025) gegen 7 (2026)", () => {
    const a = scorePoints([{ category: "m25", round: "SF", tournamentMonday: "2025-06-02" }], "2025-08-01");
    const b = scorePoints([{ category: "m25", round: "SF", tournamentMonday: "2026-03-02" }], "2026-05-01");
    expect(a.results[0].points).toBe(8);
    expect(b.results[0].points).toBe(7);
  });

  it("M15 bleibt über die Jahre unverändert (8 im Finale)", () => {
    const a = scorePoints([{ category: "m15", round: "F", tournamentMonday: "2025-06-02" }], "2025-08-01");
    const b = scorePoints([{ category: "m15", round: "F", tournamentMonday: "2026-03-02" }], "2026-05-01");
    expect(a.results[0].points).toBe(8);
    expect(b.results[0].points).toBe(8);
  });
});

describe("scorePoints – ITF-Verzögerung um zwei Montage (9.01 E)", () => {
  const monday = "2025-06-02";
  it("Turnierwoche ist ein Montag", () => {
    expect(new Date(Date.parse(monday + "T00:00:00Z")).getUTCDay()).toBe(1);
  });

  it("ITF wird erst 14 Tage (zwei Montage) später wirksam als Challenger", () => {
    const itf = scorePoints([{ category: "m25", round: "W", tournamentMonday: monday }], "2025-08-01");
    const chl = scorePoints([{ category: "challenger_100", round: "W", tournamentMonday: monday }], "2025-08-01");
    expect(chl.results[0].effectiveDate).toBe("2025-06-02"); // Challenger: ab dem Montag selbst
    expect(itf.results[0].effectiveDate).toBe("2025-06-16"); // ITF: zweiter Montag danach (+14 T)
  });

  it("ITF zählt vor dem Wirksamwerden noch nicht (noch_nicht_im_system)", () => {
    const out = scorePoints([{ category: "m25", round: "W", tournamentMonday: monday }], "2025-06-10");
    expect(out.results[0].counts).toBe(false);
    expect(out.results[0].notes).toContain("noch_nicht_im_system");
    expect(out.countingTotal).toBe(0);
  });
});

describe("scorePoints – Verfall nach 52 Wochen (364 Tage)", () => {
  // Challenger, ab Montag wirksam: effective 2025-06-02, expires 2025-06-02 + 364 = 2026-06-01.
  const r: MatchResult[] = [{ category: "challenger_175", round: "W", tournamentMonday: "2025-06-02" }];

  it("expiresOn = effectiveDate + 364 Tage", () => {
    expect(scorePoints(r, "2025-07-01").results[0].expiresOn).toBe("2026-06-01");
  });

  it("Am Tag vor dem Verfall zählt es noch", () => {
    const out = scorePoints(r, "2026-05-31");
    expect(out.results[0].counts).toBe(true);
    expect(out.countingTotal).toBe(175);
  });

  it("Am Verfallstag fällt es weg", () => {
    const out = scorePoints(r, "2026-06-01");
    expect(out.results[0].counts).toBe(false);
    expect(out.results[0].notes).toContain("verfallen");
    expect(out.countingTotal).toBe(0);
  });
});

describe("scorePoints – Vorjahres-Ergebnis fällt zum richtigen Zeitpunkt heraus", () => {
  // Ergebnis aus Jan 2025; effective 2025-01-06, expires 2025-01-06 + 364 = 2026-01-05.
  const vorjahr: MatchResult[] = [{ category: "challenger_125", round: "W", tournamentMonday: "2025-01-06" }];

  it("Turnierwoche 2025-01-06 ist ein Montag", () => {
    expect(new Date(Date.parse("2025-01-06T00:00:00Z")).getUTCDay()).toBe(1);
  });

  it("Einen Tag vor Ablauf noch drin (125), am Ablauftag draußen (0)", () => {
    expect(scorePoints(vorjahr, "2026-01-04").countingTotal).toBe(125);
    const raus = scorePoints(vorjahr, "2026-01-05");
    expect(raus.countingTotal).toBe(0);
    expect(raus.results[0].notes).toContain("verfallen");
  });
});

describe("scorePoints – mehr Ergebnisse als zählen (beste sieben bzw. sechs)", () => {
  // Acht Challenger-Ergebnisse mit acht verschiedenen Punktwerten, alle in derselben
  // Turnierwoche (2025-11-03, Montag), alle zum Stichtag wirksam.
  // Sortiert absteigend: 175, 125, 100, 90, 75, 64, 50, 44.
  const acht: MatchResult[] = [
    { category: "challenger_175", round: "W", tournamentMonday: "2025-11-03" }, // 175
    { category: "challenger_125", round: "W", tournamentMonday: "2025-11-03" }, // 125
    { category: "challenger_100", round: "W", tournamentMonday: "2025-11-03" }, // 100
    { category: "challenger_175", round: "F", tournamentMonday: "2025-11-03" }, // 90
    { category: "challenger_75", round: "W", tournamentMonday: "2025-11-03" }, // 75
    { category: "challenger_125", round: "F", tournamentMonday: "2025-11-03" }, // 64
    { category: "challenger_50", round: "W", tournamentMonday: "2025-11-03" }, // 50
    { category: "challenger_75", round: "F", tournamentMonday: "2025-11-03" }, // 44
  ];

  it("Stichtag 2025 → beste sieben (679), schwächstes (44) fällt raus", () => {
    const out = scorePoints(acht, "2025-11-10");
    expect(out.countingLimit).toBe(7);
    expect(out.countingTotal).toBe(175 + 125 + 100 + 90 + 75 + 64 + 50); // 679
    const raus = out.results.find((s) => s.points === 44)!;
    expect(raus.counts).toBe(false);
    expect(raus.notes).toContain("nicht_unter_besten_n");
  });

  it("Stichtag 2026 → beste sechs (629), 50 und 44 fallen raus", () => {
    const out = scorePoints(acht, "2026-01-05");
    expect(out.countingLimit).toBe(6);
    expect(out.countingTotal).toBe(175 + 125 + 100 + 90 + 75 + 64); // 629
    expect(out.results.filter((s) => s.counts).length).toBe(6);
  });
});

describe("scorePoints – unbekannte Kategorie / Runde", () => {
  it("Unbekannte Kategorie → 0 Punkte + Code, kein geratener Wert", () => {
    const out = scorePoints([{ category: "atp_250", round: "W", tournamentMonday: "2025-06-02" }], "2025-08-01");
    expect(out.results[0].points).toBe(0);
    expect(out.results[0].notes).toContain("unbekannte_kategorie");
    expect(out.results[0].counts).toBe(false);
  });

  it("Unbekannte Runde → 0 Punkte + Code", () => {
    const out = scorePoints([{ category: "challenger_100", round: "R8", tournamentMonday: "2025-06-02" }], "2025-08-01");
    expect(out.results[0].points).toBe(0);
    expect(out.results[0].notes).toContain("unbekannte_runde");
  });
});

describe("scorePoints – bald ablaufend", () => {
  it("listet ein Ergebnis, das im Fenster verfällt, mit Datum", () => {
    // effective 2025-06-02, expires 2026-06-01. Stichtag 2026-05-20, Fenster 28 T → im Fenster.
    const out = scorePoints(
      [{ category: "challenger_175", round: "W", tournamentMonday: "2025-06-02" }],
      "2026-05-20",
    );
    expect(out.expiringSoon).toEqual([{ index: 0, expiresOn: "2026-06-01" }]);
  });
});

describe("scorePoints – Determinismus", () => {
  it("gleiche Eingabe ⇒ exakt gleiches Ergebnis", () => {
    const results: MatchResult[] = [
      { category: "challenger_175", round: "W", tournamentMonday: "2025-06-02" },
      { category: "m25", round: "F", tournamentMonday: "2026-03-02" },
      { category: "challenger_100", round: "R32", tournamentMonday: "2025-06-02" },
    ];
    const a = scorePoints(results, "2026-04-01");
    const b = scorePoints(results, "2026-04-01");
    expect(a).toEqual(b);
  });
});

describe("toPointsCategory – DB-Kategorie → PointsCategory", () => {
  it("alle sieben aktiven DB-Kategorien bilden ab (auch mit abweichender Groß-/Kleinschreibung)", () => {
    expect(toPointsCategory("M15")).toBe("m15");
    expect(toPointsCategory("M25")).toBe("m25");
    expect(toPointsCategory("Challenger 50")).toBe("challenger_50");
    expect(toPointsCategory("Challenger 75")).toBe("challenger_75");
    expect(toPointsCategory("Challenger 100")).toBe("challenger_100");
    expect(toPointsCategory("challenger 125")).toBe("challenger_125");
    expect(toPointsCategory("CHALLENGER 175")).toBe("challenger_175");
  });
  it("unbekannt / null ⇒ null", () => {
    expect(toPointsCategory(null)).toBeNull();
    expect(toPointsCategory("ATP 250")).toBeNull();
    expect(toPointsCategory("")).toBeNull();
  });
});

describe("expectedPoints – Erwartungspunkte unter Annahme-Runde", () => {
  it("Jahrgangs-Ära: M25-Finale 2025 = 16, 2026 = 14 (Regeländerung); Challenger konstant", () => {
    expect(expectedPoints("M25", "F", "2025-06-02").points).toBe(16);
    expect(expectedPoints("M25", "F", "2026-03-02").points).toBe(14);
    expect(expectedPoints("Challenger 125", "F", "2025-06-02").points).toBe(64);
    expect(expectedPoints("Challenger 125", "F", "2026-03-02").points).toBe(64);
  });
  it("1. Runde (R32) ⇒ 0 Punkte mit Code kein_punkt_erstrunde (9.03 G.2) — für ITF wie Challenger", () => {
    expect(expectedPoints("M25", "R32", "2026-03-02")).toEqual({ points: 0, note: "kein_punkt_erstrunde" });
    expect(expectedPoints("Challenger 175", "R32", "2026-03-02")).toEqual({ points: 0, note: "kein_punkt_erstrunde" });
  });
  it("unbekannte Kategorie ⇒ 0 mit Code erwartungspunkte_null", () => {
    expect(expectedPoints("ATP 500", "W", "2026-03-02")).toEqual({ points: 0, note: "erwartungspunkte_null" });
    expect(expectedPoints(null, "W", "2026-03-02")).toEqual({ points: 0, note: "erwartungspunkte_null" });
  });
  it("ITF-Qualifikation trägt keine Punkte (9.03 G.3), Challenger-Quali schon", () => {
    expect(expectedPoints("M15", "Q", "2026-03-02")).toEqual({ points: 0, note: "kein_quali_itf" });
    expect(expectedPoints("Challenger 125", "Q", "2026-03-02").points).toBe(5);
  });
  it("ungültiges Datum ⇒ 0 mit Code ungueltiges_datum", () => {
    expect(expectedPoints("M25", "W", "kein-datum")).toEqual({ points: 0, note: "ungueltiges_datum" });
  });
});

describe("Damen (WTA) – toPointsCategory + expectedPoints (Appendix K, 32S)", () => {
  it("W-Kategorien werden gemappt; W25 ist bewusst eine Lücke (Altname)", () => {
    expect(toPointsCategory("W15")).toBe("w15");
    expect(toPointsCategory("W35")).toBe("w35");
    expect(toPointsCategory("W50")).toBe("w50");
    expect(toPointsCategory("W75")).toBe("w75");
    expect(toPointsCategory("W100")).toBe("w100");
    expect(toPointsCategory("W25")).toBeNull(); // 2026 keine gültige Kategorie
  });

  it("Sieger = Kategoriezahl; belegte Runden-Werte (WTA, nicht ATP)", () => {
    expect(expectedPoints("W100", "W", "2026-03-02").points).toBe(100);
    expect(expectedPoints("W75", "W", "2026-03-02").points).toBe(75);
    expect(expectedPoints("W50", "W", "2026-03-02").points).toBe(50);
    expect(expectedPoints("W35", "W", "2026-03-02").points).toBe(35);
    expect(expectedPoints("W15", "W", "2026-03-02").points).toBe(15);
  });

  it("R16 je Kategorie (32S): W100 12, W75 9, W50 6, W35 4, W15 1", () => {
    expect(expectedPoints("W100", "R16", "2026-03-02").points).toBe(12);
    expect(expectedPoints("W75", "R16", "2026-03-02").points).toBe(9);
    expect(expectedPoints("W50", "R16", "2026-03-02").points).toBe(6);
    expect(expectedPoints("W35", "R16", "2026-03-02").points).toBe(4); // 32S-Annahme (48S wäre 5)
    expect(expectedPoints("W15", "R16", "2026-03-02").points).toBe(1);
  });

  it("Finalist unterscheidet sich klar von ATP (W35 F=23, nicht Herrenwert)", () => {
    expect(expectedPoints("W35", "F", "2026-03-02").points).toBe(23);
    expect(expectedPoints("W100", "F", "2026-03-02").points).toBe(65);
  });

  it("WTA-Quali trägt Punkte (Q=QFR): W100 5, W50 2", () => {
    expect(expectedPoints("W100", "Q", "2026-03-02").points).toBe(5);
    expect(expectedPoints("W50", "Q", "2026-03-02").points).toBe(2);
  });

  it("Runde ohne Wert im 32er-Feld ⇒ 0 (keine_punkte), kein ATP-Erstrunden-Code", () => {
    expect(expectedPoints("W35", "R32", "2026-03-02")).toEqual({ points: 0, note: "keine_punkte" });
    expect(expectedPoints("W15", "R32", "2026-03-02")).toEqual({ points: 0, note: "keine_punkte" });
  });

  it("W25 (Lücke) ⇒ 0 mit erwartungspunkte_null (nicht geraten)", () => {
    expect(expectedPoints("W25", "W", "2026-03-02")).toEqual({ points: 0, note: "erwartungspunkte_null" });
  });
});
