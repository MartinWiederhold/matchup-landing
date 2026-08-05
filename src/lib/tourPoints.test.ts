import { describe, it, expect } from "vitest";
import { classify, pickTerminal, type Parsed } from "./tourPoints";

// Baut eine Match-Zwischenform wie in loadPointsData (Runden-Text + won).
const m = (round: string | null, won: boolean | null): Parsed => ({ won, raw: round, ...classify(round) });

describe("pickTerminal – nur Siege eingetragen, Niederlage vergessen", () => {
  // QF gewonnen, SF gewonnen, kein weiterer Eintrag.
  const nurSiege = [m("QF", true), m("SF", true)];

  it("wertet die weiteste belegte Runde: SF gewonnen ⇒ Finale erreicht (F)", () => {
    const r = pickTerminal(nurSiege);
    expect("code" in r && r.code).toBe("F");
  });

  it("vergibt KEINEN Titel (W entsteht nur bei Finale + won=true)", () => {
    const r = pickTerminal(nurSiege);
    expect("code" in r && r.code).not.toBe("W");
  });

  it("markiert den Verlauf als unvollständig", () => {
    const r = pickTerminal(nurSiege);
    expect("code" in r && r.incomplete).toBe(true);
  });

  it("einzelner Erstrundensieg (R32 gewonnen) ⇒ R16 erreicht, unvollständig", () => {
    const r = pickTerminal([m("R32", true)]);
    expect("code" in r && r.code).toBe("R16");
    expect("code" in r && r.incomplete).toBe(true);
  });
});

describe("pickTerminal – normale Fälle bleiben korrekt", () => {
  it("mit Niederlage wird DIESE Runde gewertet, nicht unvollständig", () => {
    const r = pickTerminal([m("R16", true), m("QF", false)]);
    expect("code" in r && r.code).toBe("QF");
    expect("code" in r && r.incomplete).toBe(false);
  });

  it("Finalsieg ⇒ Titel (W)", () => {
    const r = pickTerminal([m("SF", true), m("F", true)]);
    expect("code" in r && r.code).toBe("W");
    expect("code" in r && r.incomplete).toBe(false);
  });

  it("Finalniederlage ⇒ Finalist (F)", () => {
    const r = pickTerminal([m("F", false)]);
    expect("code" in r && r.code).toBe("F");
  });

  it("nur offener Ausgang (won=null) ⇒ nicht bestimmbar", () => {
    const r = pickTerminal([m("QF", null)]);
    expect("issue" in r && r.issue).toBe("result_open");
  });
});

describe("classify – explizite Runden-Zuordnung, nichts geraten", () => {
  it("erkennt Schreibvarianten für dieselbe Runde", () => {
    for (const raw of ["QF", "Viertelfinale", "quarterfinal", "1/4", "vf"]) {
      expect(classify(raw).stage).toBe("QF");
    }
  });

  it("markiert Unbekanntes als unbekannt (kein Fuzzy-Treffer)", () => {
    expect(classify("Gruppenphase").unknown).toBe(true);
    expect(classify("R8").unknown).toBe(true);
  });

  it("erkennt Qualifikation getrennt", () => {
    expect(classify("Quali").quali).toBe(true);
    expect(classify("Q2").quali).toBe(true);
  });
});
