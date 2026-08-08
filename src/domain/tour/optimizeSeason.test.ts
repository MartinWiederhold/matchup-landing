import { describe, it, expect } from "vitest";
import { optimizeSeason, OPTIMIZE_RULES_VERSION, type SeasonCandidate, type OptimizeInput } from "./optimizeSeason";
import { computeSeasonCost, type Money, type CostParams } from "./costs";
import { schengenUsage, type Stay } from "./schengen";

// ── Bausteine für die Tests ──────────────────────────────────────────────────
const NOW = new Date("2026-01-05T00:00:00Z"); // Montag; alle Turniere unten liegen danach → keine verstrichene Frist
const EUR = (amount: number): Money => ({ amount, currency: "EUR" });
// Klare Zahlen: Anreise 100, Nacht 10, Essen 0 → neue Station 110, Cluster-Station 10 (bei 1 Nacht).
const PARAMS: CostParams = { arrival: EUR(100), perNight: EUR(10), foodPerDay: EUR(0) };
const monday = (iso: string) => new Date(iso + "T00:00:00Z");

// Fortlaufende Montage ab NOW (weit genug in der Zukunft → eignungsfähig).
const WK = ["2026-02-02", "2026-02-09", "2026-02-16", "2026-02-23", "2026-03-02", "2026-03-09", "2026-03-16", "2026-03-23"];

function cand(id: string, weekIso: string, place: string, o: Partial<SeasonCandidate> = {}): SeasonCandidate {
  return {
    id,
    tournamentMonday: monday(weekIso),
    series: o.series ?? "itf_wtt",
    category: o.category ?? "M25",
    place,
    country: o.country ?? place.split("|")[0],
    hasMapCoords: o.hasMapCoords ?? true,
    entryFee: o.entryFee ?? null,
  };
}
function baseInput(candidates: SeasonCandidate[], o: Partial<OptimizeInput> = {}): OptimizeInput {
  return {
    candidates,
    budget: o.budget !== undefined ? o.budget : EUR(100_000),
    params: o.params ?? PARAMS,
    homePlace: o.homePlace ?? "CH|Zurich",
    nightsPerWeek: o.nightsPerWeek !== undefined ? o.nightsPerWeek : 1,
    now: o.now ?? NOW,
    schengen: o.schengen ?? null,
    objective: o.objective,
    beamWidth: o.beamWidth,
  };
}
const codes = (rs: { code: string }[]) => rs.map((r) => r.code);

describe("optimizeSeason — Vertrag & Determinismus", () => {
  it("1) deterministisch: gleiche Eingabe zweimal ⇒ deep-equal", () => {
    const cs = [cand("a", WK[0], "TN|Monastir"), cand("b", WK[1], "ES|Barcelona"), cand("c", WK[1], "TN|Monastir")];
    const inp = baseInput(cs, { budget: EUR(500) });
    expect(optimizeSeason(inp)).toEqual(optimizeSeason(inp));
  });
  it("2) rulesVersion gesetzt; notes enthält immer 'naeherung'", () => {
    const r = optimizeSeason(baseInput([cand("a", WK[0], "TN|Monastir")]));
    expect(r.rulesVersion).toBe(OPTIMIZE_RULES_VERSION);
    expect(r.notes).toContain("naeherung");
  });
  it("3) leere Kandidaten ⇒ leere picks, value 0, keine Fehler", () => {
    const r = optimizeSeason(baseInput([]));
    expect(r.picks).toEqual([]);
    expect(r.value).toBe(0);
  });
});

describe("Budget & eine Woche, ein Turnier", () => {
  it("4/5) cost ≤ budget je Währung; budget=null ⇒ kein Cap", () => {
    const cs = [cand("a", WK[0], "TN|Monastir"), cand("b", WK[1], "ES|Barcelona")];
    const withCap = optimizeSeason(baseInput(cs, { budget: EUR(110) }));
    expect(withCap.cost.total.EUR ?? 0).toBeLessThanOrEqual(110);
    const noCap = optimizeSeason(baseInput(cs, { budget: null }));
    expect(noCap.value).toBe(2); // ohne Cap beide
  });
  it("6) Turnier über Budget ⇒ rejected budget_erschoepft", () => {
    const cs = [cand("a", WK[0], "TN|Monastir"), cand("b", WK[1], "ES|Barcelona")];
    const r = optimizeSeason(baseInput(cs, { budget: EUR(110) })); // nur eines (110) passt, zweites (→220) nicht
    expect(r.value).toBe(1);
    const rej = r.rejected.find((x) => x.id === "b" || x.id === "a");
    expect(rej && codes(rej.reasons)).toContain("budget_erschoepft");
  });
  it("8) zwei Turniere dieselbe Woche ⇒ höchstens eines; anderes woche_belegt", () => {
    const cs = [cand("a", WK[0], "TN|Monastir"), cand("b", WK[0], "ES|Barcelona")];
    const r = optimizeSeason(baseInput(cs, { budget: EUR(100_000) }));
    expect(r.picks.length).toBe(1);
    const rej = r.rejected[0];
    expect(codes(rej.reasons)).toContain("woche_belegt");
  });
});

describe("Fristen", () => {
  it("9) ITF mit verstrichener Frist (Woche in der Vergangenheit) ⇒ rejected frist_verstrichen", () => {
    const past = cand("p", "2025-11-03", "ES|Barcelona"); // vor NOW
    const r = optimizeSeason(baseInput([past]));
    expect(r.value).toBe(0);
    expect(codes(r.rejected.find((x) => x.id === "p")!.reasons)).toContain("frist_verstrichen");
  });
  it("10) Challenger (Frist unbekannt) ⇒ wählbar, Pick trägt frist_unbekannt_challenger", () => {
    const ch = cand("c", WK[0], "ES|Barcelona", { series: "challenger" });
    const r = optimizeSeason(baseInput([ch]));
    expect(r.value).toBe(1);
    expect(codes(r.picks[0].reasons)).toContain("frist_unbekannt_challenger");
  });
});

describe("Cluster — der Prüfstein", () => {
  it("14) 3× Monastir vs 3× verschiedene Orte, knappes Budget ⇒ Cluster gewählt, arrivalsSaved=2", () => {
    const clusterCs = [cand("m1", WK[0], "TN|Monastir"), cand("m2", WK[1], "TN|Monastir"), cand("m3", WK[2], "TN|Monastir")];
    const scatterCs = [cand("s1", WK[0], "TN|Monastir"), cand("s2", WK[1], "ES|Barcelona"), cand("s3", WK[2], "IT|Rome")];
    const cluster = optimizeSeason(baseInput(clusterCs, { budget: EUR(130) })); // 100 + 3×10 = 130
    const scatter = optimizeSeason(baseInput(scatterCs, { budget: EUR(130) })); // 110, 220 → nur 1 passt
    expect(cluster.value).toBe(3);
    expect(cluster.cost.arrivalsSaved).toBe(2);
    expect(scatter.value).toBe(1);
  });
  it("15) Konsistenz: result.cost == computeSeasonCost(result.stations, params) — kein Drift DP↔Engine", () => {
    const cs = [cand("m1", WK[0], "TN|Monastir"), cand("m2", WK[1], "TN|Monastir"), cand("b", WK[2], "ES|Barcelona")];
    const r = optimizeSeason(baseInput(cs, { budget: EUR(500) }));
    expect(computeSeasonCost(r.stations, PARAMS)).toEqual(r.cost);
  });
  it("16) Cluster macht Budget frei — die Zahlen sprechen: Cluster 5, verstreut 3, GLEICHES Budget", () => {
    const budget = EUR(330);
    // Cluster: 5 Wochen am selben Ort → 100 + 5×10 = 150 ≤ 330 → alle 5.
    const clusterCs = WK.slice(0, 5).map((wk, i) => cand(`c${i}`, wk, "TN|Monastir"));
    // Verstreut: 6 Wochen, je anderer Ort → je 110; 110,220,330 → nur 3 passen in 330.
    const places = ["ES|Barcelona", "IT|Rome", "FR|Paris", "DE|Berlin", "PT|Lisbon", "GR|Athens"];
    const scatterCs = WK.slice(0, 6).map((wk, i) => cand(`s${i}`, wk, places[i]));

    const cluster = optimizeSeason(baseInput(clusterCs, { budget }));
    const scatter = optimizeSeason(baseInput(scatterCs, { budget }));

    expect(cluster.value).toBe(5); // Cluster: 5 Turniere
    expect(scatter.value).toBe(3); // verstreut: 3 Turniere
    expect(cluster.value).toBeGreaterThan(scatter.value); // mehr Turniere fürs gleiche Geld
    expect(cluster.cost.arrivalsSaved).toBe(4); // 5 Stationen, 1 Anreise
    expect(cluster.cost.total.EUR).toBeLessThanOrEqual(330);
    expect(scatter.cost.total.EUR).toBeLessThanOrEqual(330);
  });
});

describe("Näherung vs. Brute-Force (mit Laufzeitmessung)", () => {
  it("17) auf kleiner Eingabe == Brute-Force-Optimum (value gleich, Kosten ≤)", () => {
    // 10 Kandidaten über 6 Wochen, gemischte Orte, moderates Budget → Brute-Force 2^10 = 1024.
    const places = ["TN|Monastir", "ES|Barcelona", "TN|Monastir", "IT|Rome", "ES|Barcelona", "TN|Monastir"];
    const cs: SeasonCandidate[] = [];
    let i = 0;
    for (let w = 0; w < 6; w++) {
      const n = w % 2 === 0 ? 2 : 1; // manche Wochen mit zwei Optionen (Ein-Woche-Regel greift)
      for (let k = 0; k < n && i < 10; k++, i++) cs.push(cand(`t${i}`, WK[w], places[(i) % places.length]));
    }
    const budget = EUR(400);

    // Brute-Force für Objektiv D: alle Teilmengen, gültig (eine Woche/eins, Budget), max Anzahl, dann min Kosten.
    const t0 = Date.now();
    let best = { value: 0, cost: Infinity };
    for (let mask = 0; mask < (1 << cs.length); mask++) {
      const sub = cs.filter((_, b) => mask & (1 << b));
      const weeks = new Set(sub.map((c) => c.tournamentMonday.toISOString()));
      if (weeks.size !== sub.length) continue; // zwei in einer Woche → ungültig
      const ordered = [...sub].sort((a, b) => +a.tournamentMonday - +b.tournamentMonday);
      const cost = computeSeasonCost(ordered.map((c) => ({ place: c.place!, nights: 1, entryFee: null })), PARAMS);
      const eur = cost.total.EUR ?? 0;
      if (eur > budget.amount) continue;
      if (sub.length > best.value || (sub.length === best.value && eur < best.cost)) best = { value: sub.length, cost: eur };
    }
    const bruteMs = Date.now() - t0;

    const r = optimizeSeason(baseInput(cs, { budget }));
    // Laufzeit sichtbar machen — wenn spürbar, Grenze senken (Kommentar oben).
    console.log(`Brute-Force (${cs.length} Kandidaten, ${1 << cs.length} Teilmengen): ${bruteMs} ms · optimum value=${best.value}`);
    expect(bruteMs).toBeLessThan(500); // Reißleine: Test darf nicht bremsen
    expect(r.value).toBe(best.value);
    expect(r.cost.total.EUR ?? 0).toBeLessThanOrEqual(best.cost);
  });
});

describe("Nächte-Parameter", () => {
  it("18) nightsPerWeek gesetzt ⇒ Kosten skalieren; notes OHNE naechte_annahme", () => {
    const cs = [cand("a", WK[0], "TN|Monastir")];
    const r1 = optimizeSeason(baseInput(cs, { nightsPerWeek: 1, budget: EUR(100_000) }));
    const r7 = optimizeSeason(baseInput(cs, { nightsPerWeek: 7, budget: EUR(100_000) }));
    expect(r1.cost.total.EUR).toBe(110); // 100 + 1×10
    expect(r7.cost.total.EUR).toBe(170); // 100 + 7×10
    expect(r1.notes).not.toContain("naechte_annahme");
  });
  it("19) nightsPerWeek null ⇒ 7 verwendet; notes MIT naechte_annahme", () => {
    const cs = [cand("a", WK[0], "TN|Monastir")];
    const r = optimizeSeason(baseInput(cs, { nightsPerWeek: null, budget: EUR(100_000) }));
    expect(r.cost.total.EUR).toBe(170); // Fallback 7 Nächte
    expect(r.notes).toContain("naechte_annahme");
  });
});

describe("Koordinaten / Ortsschlüssel", () => {
  it("20) Kandidat ohne place ⇒ unassessable kein_ortsschluessel, nicht still verschluckt", () => {
    const cs: SeasonCandidate[] = [{ ...cand("x", WK[0], "TN|Monastir"), place: null }];
    const r = optimizeSeason(baseInput(cs));
    expect(r.unassessable).toEqual([{ id: "x", code: "kein_ortsschluessel" }]);
    expect(r.value).toBe(0);
  });
  it("21) place vorhanden, hasMapCoords false ⇒ gewählt, onMap false + ohne_kartenpunkt", () => {
    const cs = [cand("a", WK[0], "TN|Monastir", { hasMapCoords: false })];
    const r = optimizeSeason(baseInput(cs));
    expect(r.value).toBe(1);
    expect(r.picks[0].onMap).toBe(false);
    expect(codes(r.picks[0].reasons)).toContain("ohne_kartenpunkt");
  });
});

describe("Schengen 90/180", () => {
  // Fünf Schengen-Turniere (ES), ~monatlich, 25 Nächte je Woche → zusammen > 90 Tage.
  const ES_WEEKS = ["2026-02-02", "2026-03-02", "2026-04-06", "2026-05-04", "2026-06-01"];
  const NIGHTS = 25;
  const esCands = ES_WEEKS.map((wk, i) => cand(`es${i}`, wk, "ES|Barcelona"));
  // Precondition: alle fünf zusammen überschreiten wirklich (sonst wäre der Test wertlos).
  const allStays: Stay[] = ES_WEEKS.map((wk) => {
    const start = Date.parse(wk + "T00:00:00Z");
    const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
    return { country: "ES", entry: iso(start), exit: iso(start + NIGHTS * 86_400_000) };
  });
  const lastExit = allStays.reduce((mx, s) => (s.exit! > mx ? s.exit! : mx), "");

  it("Precondition: alle fünf ES-Aufenthalte überschreiten 90/180", () => {
    expect(schengenUsage(allStays, lastExit).exceeds).toBe(true);
  });
  it("11) applies=true ⇒ Optimierer schlägt NIE eine überschreitende Saison vor; ein Kandidat trägt schengen_grenze", () => {
    const r = optimizeSeason(baseInput(esCands, { budget: null, nightsPerWeek: NIGHTS, schengen: { applies: true, existingStays: [] } }));
    expect(r.schengen).not.toBeNull();
    expect(r.schengen!.exceeds).toBe(false);
    expect(r.value).toBeLessThan(esCands.length);
    expect(r.rejected.some((x) => x.reasons.some((rr) => rr.code === "schengen_grenze"))).toBe(true);
  });
  it("12) applies=false (EU-Pass) ⇒ keine Schengen-Beschränkung, alle fünf gewählt", () => {
    const r = optimizeSeason(baseInput(esCands, { budget: null, nightsPerWeek: NIGHTS, schengen: null }));
    expect(r.value).toBe(esCands.length);
  });
  it("13) bestehende existingStays zählen mit ⇒ weniger Spielraum als ohne", () => {
    const heavy: Stay[] = [{ country: "ES", entry: "2026-01-10", exit: "2026-02-20" }]; // ~40 Vor-Tage
    const withPrior = optimizeSeason(baseInput(esCands, { budget: null, nightsPerWeek: NIGHTS, schengen: { applies: true, existingStays: heavy } }));
    const without = optimizeSeason(baseInput(esCands, { budget: null, nightsPerWeek: NIGHTS, schengen: { applies: true, existingStays: [] } }));
    expect(withPrior.value).toBeLessThanOrEqual(without.value);
    expect(withPrior.schengen!.exceeds).toBe(false);
  });
});

describe("Mehrwährung & Begründung", () => {
  it("22) entryFee in anderer Währung ⇒ notes mehrwaehrung; Budget-Vergleich je Währung", () => {
    const cs = [cand("a", WK[0], "TN|Monastir", { entryFee: { amount: 40, currency: "USD" } })];
    const r = optimizeSeason(baseInput(cs, { budget: EUR(100_000) }));
    expect(r.notes).toContain("mehrwaehrung");
    expect(r.cost.total.EUR).toBe(110);
    expect(r.cost.total.USD).toBe(40);
  });
  it("23/24) jeder Pick ≥1 dafür-Reason; notes trägt arrivals_gespart:N mit korrektem N", () => {
    const cs = [cand("m1", WK[0], "TN|Monastir"), cand("m2", WK[1], "TN|Monastir")];
    const r = optimizeSeason(baseInput(cs, { budget: EUR(500) }));
    for (const p of r.picks) expect(p.reasons.some((x) => x.direction === "dafuer")).toBe(true);
    const saved = r.cost.arrivalsSaved;
    expect(r.notes).toContain(`arrivals_gespart:${saved}`);
    expect(saved).toBe(1); // 2 Stationen gleicher Ort → 1 Anreise gespart
  });
});
