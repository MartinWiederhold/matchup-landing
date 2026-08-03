import { describe, it, expect } from "vitest";
import { decideTournament, DECIDE_RULES_VERSION, type DecideInput } from "./decide";
import { tourDeadlines } from "./deadlines";

const DAY = 86_400_000;

// 2025-06-16 ist ein Montag (in deadlines.test.ts verifiziert).
const MONDAY = new Date(Date.UTC(2025, 5, 16));
// Entry-Zeitpunkt aus dem echten Fristen-Baustein ableiten (kein hartkodierter Wert,
// keine Systemuhr) — darauf beziehen sich die Grenzfall-Tests.
const ENTRY_MS = tourDeadlines(MONDAY, "itf_wtt").entry!.getTime();
/** `now`, das k Tage VOR der Entry Deadline liegt. */
const nowBeforeEntry = (days: number) => new Date(ENTRY_MS - days * DAY);

const itf = (now: Date, cost?: DecideInput["cost"]): DecideInput => ({
  tournament: { tournamentMonday: MONDAY, series: "itf_wtt", place: "TN|Monastir" },
  now,
  cost,
});

describe("decideTournament – verstrichene Frist (ITF)", () => {
  // now nach Entry (29.05.), aber vor dem Turniermontag (16.06.): nicht mehr meldbar.
  const r = decideTournament(itf(new Date(Date.UTC(2025, 5, 5))));
  it("Einordnung frist_verstrichen mit Begründung dagegen", () => {
    expect(r.classification).toBe("frist_verstrichen");
    expect(r.reasons).toContainEqual({ code: "meldefrist_verstrichen", direction: "dagegen" });
    expect(r.rulesVersion).toBe(DECIDE_RULES_VERSION);
  });
});

describe("decideTournament – Frist in wenigen Tagen (ITF)", () => {
  const r = decideTournament(itf(nowBeforeEntry(3)));
  it("Einordnung frist_laeuft_bald_ab, Dringlichkeit neutral", () => {
    expect(r.classification).toBe("frist_laeuft_bald_ab");
    expect(r.reasons).toContainEqual({ code: "meldefrist_in_wenigen_tagen", direction: "neutral" });
  });
});

describe("decideTournament – Challenger: eigene Aussage statt schlechterer Bewertung", () => {
  // Turniermontag liegt in der Zukunft (now = 2025-01-01).
  const r = decideTournament({
    tournament: { tournamentMonday: MONDAY, series: "challenger", place: "TN|Monastir" },
    now: new Date(Date.UTC(2025, 0, 1)),
  });
  it("bekommt fristen_unbekannt, nicht planbar/verstrichen", () => {
    expect(r.classification).toBe("fristen_unbekannt");
    expect(r.reasons).toContainEqual({ code: "fristenregel_unbekannt", direction: "neutral" });
  });
  it("Vertrauenswert folgt dem unbekannten Fristen-Baustein (niedrig)", () => {
    expect(r.confidence).toBe(0.2);
  });
  it("führt die Freeze-Lücke NICHT (gibt es bei Challenger nicht)", () => {
    expect(r.basisLuecken).not.toContain("freeze_variante_ungeprueft");
  });
});

describe("decideTournament – vergangenes Challenger-Turnier", () => {
  // now = 2025-12-01: Turnierwoche (16.06.) liegt in der Vergangenheit.
  const r = decideTournament({
    tournament: { tournamentMonday: MONDAY, series: "challenger", place: "TN|Monastir" },
    now: new Date(Date.UTC(2025, 11, 1)),
  });
  it("ist frist_verstrichen (Turnier vorbei), NICHT fristen_unbekannt", () => {
    expect(r.classification).toBe("frist_verstrichen");
    expect(r.reasons).toContainEqual({ code: "turnier_bereits_vorbei", direction: "dagegen" });
  });
});

describe("decideTournament – selber Ort wie die Vorstation (Kosten-Begründung)", () => {
  const r = decideTournament(itf(nowBeforeEntry(30), { prevPlace: "TN|Monastir" }));
  it("Anreise entfällt → dafuer; Kostenlage trägt die Einordnung nicht (bleibt planbar)", () => {
    expect(r.classification).toBe("planbar");
    expect(r.reasons).toContainEqual({ code: "anreise_entfaellt_gleicher_ort", direction: "dafuer" });
  });
  it("Ortswechsel dagegen: eigener neutraler Code", () => {
    const s = decideTournament(itf(nowBeforeEntry(30), { prevPlace: "ES|Manacor" }));
    expect(s.reasons).toContainEqual({ code: "anreise_noetig_ortswechsel", direction: "neutral" });
  });
});

describe("decideTournament – Turnier weit in der Zukunft (ITF)", () => {
  const r = decideTournament(itf(nowBeforeEntry(200)));
  it("Einordnung zu_weit_entfernt, neutral", () => {
    expect(r.classification).toBe("zu_weit_entfernt");
    expect(r.reasons).toContainEqual({ code: "turnier_weit_entfernt", direction: "neutral" });
  });
});

describe("decideTournament – Grenzfälle exakt auf der Schwelle", () => {
  it("exakt 7 Tage vor Entry → noch frist_laeuft_bald_ab (Grenze inklusive)", () => {
    expect(decideTournament(itf(nowBeforeEntry(7))).classification).toBe("frist_laeuft_bald_ab");
  });
  it("eine Sekunde jenseits von 7 Tagen → planbar", () => {
    expect(decideTournament(itf(new Date(ENTRY_MS - 7 * DAY - 1000))).classification).toBe("planbar");
  });
  it("exakt 56 Tage vor Entry → noch planbar (Grenze inklusive)", () => {
    expect(decideTournament(itf(nowBeforeEntry(56))).classification).toBe("planbar");
  });
  it("eine Sekunde jenseits von 56 Tagen → zu_weit_entfernt", () => {
    expect(decideTournament(itf(new Date(ENTRY_MS - 56 * DAY - 1000))).classification).toBe("zu_weit_entfernt");
  });
});

describe("decideTournament – fehlende Grundlagen erscheinen im Ergebnis", () => {
  const r = decideTournament(itf(nowBeforeEntry(30)));
  it("basisLuecken ist ein Ergebnisfeld, kein Kommentar", () => {
    expect(r.basisLuecken).toContain("keine_punktehistorie");
    expect(r.basisLuecken).toContain("keine_cutoff_prognose");
    expect(r.basisLuecken).toContain("freeze_variante_ungeprueft");
  });
});

describe("decideTournament – Vertrauenswert erbt vom schwächsten Baustein", () => {
  // ITF-Fristen 0.9, aber Kostensatz (Anreise) fehlt → Kosten-Baustein 0.5.
  const r = decideTournament(itf(nowBeforeEntry(30), { params: {} }));
  it("nimmt das Minimum (0.5), nicht den Durchschnitt (0.7)", () => {
    expect(r.confidence).toBe(0.5);
    expect(r.confidence).not.toBe(0.7);
    expect(r.reasons).toContainEqual({ code: "kosten_unbekannt", direction: "neutral" });
  });
});

describe("decideTournament – Determinismus", () => {
  it("gleiche Eingabe → exakt gleiches Ergebnis", () => {
    const input = itf(nowBeforeEntry(30), { prevPlace: "TN|Monastir", params: {} });
    const a = decideTournament(input);
    const b = decideTournament(input);
    expect(a).toEqual(b);
    expect(a.rulesVersion).toBe(DECIDE_RULES_VERSION);
  });
});
