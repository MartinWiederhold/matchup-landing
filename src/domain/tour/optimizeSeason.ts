/**
 * Saison-Optimierer (Domain-Schicht, v1) — Objektiv D: „meiste Turniere im Budget".
 *
 * Reine Funktion: keine DB, kein Netz, KEINE Systemuhr (`now` als Parameter),
 * deterministisch (gleiche Eingabe ⇒ gleiches Ergebnis), Rückgaben tragen nur Codes.
 * Ruft die vorhandenen Bausteine AUF, ändert sie nicht:
 *   - computeSeasonCost  → DIE Autorität für Kosten inkl. Cluster-Effekt
 *   - schengenUsage      → 90/180-Nebenbedingung
 *   - decideTournament   → Fristenlage (verstrichen ⇒ raus)
 *
 * NÄHERUNG: Strahlsuche als Wochen-DP. Findet ein GUTES, nicht beweisbar das BESTE
 * Ergebnis → Code `naeherung` in notes (immer). Auf kleinen Eingaben per Test gegen
 * Brute-Force abgesichert.
 *
 * KOORDINATEN-BEFUND (DB-geprüft, Stand 2026-08): Die Kostenrechnung läuft über den
 * Ortsschlüssel `country|city` (Station.place), NICHT über Koordinaten. Fehlende
 * latitude/longitude betreffen NUR das Kartenbild — alle koordinatenlosen aktiven
 * Turniere haben eine Stadt und sind damit VOLLSTÄNDIG kostenbewertbar. `hasMapCoords`
 * ist reine Anzeige-Info (Code `ohne_kartenpunkt`), KEIN Ausschlussgrund.
 *
 * REASON-/NOTE-CODES sind i18n-Wurzeln (nur Codes, keine Sätze). ACHTUNG für die UI:
 * fast alle Codes sind reine Bezeichner — DREI tragen einen Wert im Code (am ":" trennen):
 *   `arrivals_gespart:${n}`          (Note; eingesparte Anreisen, SeasonCost.arrivalsSaved)
 *   `erwartungspunkte:${n}`          (Pick-Reason, Objektiv C; erwartete Punkte des Turniers)
 *   `erwartungspunkte_annahme:${r}`  (Note, Objektiv C; angenommene Zielrunde, z. B. R16)
 * Alle anderen Codes sind ohne ":" zu übersetzen.
 */
import { computeSeasonCost, type CostParams, type Money, type Station, type SeasonCost, type MoneyBag } from "./costs";
import { schengenUsage, isSchengenCode, type Stay, type SchengenUsage } from "./schengen";
import { decideTournament, type DecideReason } from "./decide";
import { expectedPoints, type PointsRound } from "./points";
import { isTightLeg, restDaysBetween } from "./travelBuffer";
import type { TourSeries } from "./deadlines";

// v3: zweites Objektiv C „most_points" — maximiere ERWARTETE ATP-Punkte im Budget unter
//     einer SICHTBAREN Annahme (expectedRound). Kosten bleiben harte Grenze + Tiebreaker
//     (belohnt weiter Cluster/Heimatnähe). Jeder Punktwert ist eine gekennzeichnete Erwartung
//     (Code erwartungspunkte_annahme:<Runde>), kein Versprechen.
// v2: Einreisesperren (entryBanned) — Länder mit „admission refused" für die
//     Nationalität werden NICHT vorgeschlagen (Reject-Grund einreise_gesperrt).
// v4: Reise-Puffer zwischen Turnieren an VERSCHIEDENEN Orten (bufferDays, Nutzerangabe wie
//     die Nächte). WEICH: bei gleicher Turnierzahl UND gleichen Kosten wird die Variante mit
//     weniger engen Übergängen bevorzugt (Tiebreaker NACH den Kosten → ändert value/Kosten
//     nicht). Ein enger Übergang wirft NIE ein Turnier raus — der Pick trägt `enge_anreise:<Tage>`.
export const OPTIMIZE_RULES_VERSION = "v4";

const DAY = 86_400_000;
const DEFAULT_NIGHTS = 7;      // Fallback, wenn nightsPerWeek nicht gesetzt ist → Code `naechte_annahme`
const DEFAULT_BUFFER = 2;      // Fallback-Puffer (Tage), wenn bufferDays nicht gesetzt → Code `puffer_annahme`
const DEFAULT_BEAM = 64;       // Strahlbreite K
const SCHENGEN_NEAR = 80;      // used ≥ 80 von 90 → Code `schengen_nah`

// Objektive: D „meiste Turniere im Budget" (Standard) · C „meiste erwartete Punkte im Budget".
export type SeasonObjective = "most_tournaments" | "most_points";

export type SeasonCandidate = {
  id: string;
  tournamentMonday: Date;    // Woche + Fristbezug (auf 00:00 UTC reduziert)
  series: TourSeries;        // Fristen bekannt (itf_wtt) | unbekannt (challenger)
  category: string | null;   // mitgeführt, in D nicht bewertet
  place: string | null;      // Ortsschlüssel "country|city"; null = kein Schlüssel → nicht bewertbar
  country: string | null;    // ISO-3166-1 alpha-2 (für Schengen-Zugehörigkeit)
  hasMapCoords: boolean;      // NUR Anzeige (ohne_kartenpunkt), NICHT für die Rechnung
  entryFee?: Money | null;    // optionale Meldegebühr (sonst weggelassen)
};

export type SchengenContext = {
  applies: boolean;       // true, wenn die Nationalität der 90/180-Regel unterliegt
  existingStays: Stay[];  // echte/gebuchte Aufenthalte (zählen mit)
};

export type OptimizeInput = {
  candidates: SeasonCandidate[];
  budget: Money | null;         // Cap in EINER Währung; null = kein Cap
  params: CostParams;           // Kostensätze
  homePlace: string;            // Startpunkt-Ortsschlüssel (Wohnort)
  nightsPerWeek: number | null; // aus /tour/costs (localStorage "mu_tour_nights"); null → 7 + naechte_annahme
  bufferDays?: number | null;   // Anreisepuffer zwischen verschiedenen Orten (Tage); null → 2 + puffer_annahme
  now: Date;                    // für Fristen (decide)
  schengen: SchengenContext | null; // null = nicht betroffen
  /** Ziel-Länder (ISO-3166-1 alpha-2), für die die Nationalität eine Einreisesperre
   *  hat („admission refused"). Solche Turniere werden NICHT vorgeschlagen, sondern
   *  landen mit Grund `einreise_gesperrt` in rejected. Aufgelöst vom Aufrufer aus
   *  web.tour_visa_requirements — der Optimierer bleibt rein (kein DB/Netz). */
  entryBanned?: Set<string>;
  objective?: SeasonObjective;  // Default "most_tournaments"
  /** Objektiv C: angenommene Zielrunde je Turnier (Erwartungspunkte). Die UI setzt beim
   *  Umschalten auf "most_points" eine Vorgabe (R16), damit dies nie leer ankommt. Kommt es
   *  DOCH null bei "most_points" an → Rückfall auf "most_tournaments" + Note erwartungspunkte_null
   *  (Absicherung, greift regulär nie). */
  expectedRound?: PointsRound | null;
  beamWidth?: number;           // Default 64
};

export type SeasonPick = {
  id: string;
  weekMonday: string;       // ISO yyyy-mm-dd
  place: string;
  onMap: boolean;
  reasons: DecideReason[];
};
export type RejectedCandidate = { id: string; reasons: DecideReason[] };

export type SeasonProposal = {
  rulesVersion: string;
  objective: SeasonObjective;
  approximate: true;
  picks: SeasonPick[];
  stations: Station[];
  cost: SeasonCost;
  schengen: SchengenUsage | null;
  value: number;
  budgetLeft: MoneyBag;
  rejected: RejectedCandidate[];
  unassessable: { id: string; code: "kein_ortsschluessel" }[];
  notes: string[];
};

// ── Hilfen ───────────────────────────────────────────────────────────────────
const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const mondayMs = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
const reason = (code: string, direction: DecideReason["direction"]): DecideReason => ({ code, direction });

/** Turniere in Reise-Reihenfolge → Stationen (place = country|city, nights je Turnierwoche). */
function buildStations(chosen: SeasonCandidate[], nights: number): Station[] {
  return chosen.map((c) => ({ place: c.place as string, nights, entryFee: c.entryFee ?? null }));
}

/** Schengen-Aufenthalte der Auswahl (nur Turniere in Schengen-Ländern) + bestehende. */
function schengenStays(chosen: SeasonCandidate[], nights: number, existing: Stay[]): Stay[] {
  const out: Stay[] = [...existing];
  for (const c of chosen) {
    if (!c.country || !isSchengenCode(c.country)) continue;
    const start = mondayMs(c.tournamentMonday);
    out.push({ country: c.country, entry: isoDay(start), exit: isoDay(start + nights * DAY) });
  }
  return out;
}

/** Skalar für den Kosten-Tiebreaker: Betrag in der maßgeblichen Währung (Budget bzw. Anreisesatz). */
function costScalar(cost: SeasonCost, primaryCurrency: string | null): number {
  if (primaryCurrency && cost.total[primaryCurrency] != null) return cost.total[primaryCurrency];
  // sonst: die einzige/erste Währung (nie währungsübergreifend addiert)
  const c = cost.currencies[0];
  return c ? cost.total[c] : 0;
}

type State = { chosen: SeasonCandidate[]; cost: SeasonCost; scalar: number; points: number; tightLegs: number };

/**
 * Objektiv D: maximiere Anzahl Turniere unter Budget; bei gleicher Anzahl minimiere
 * Kosten (Tiebreaker → belohnt Cluster). Strahlsuche über die chronologischen Wochen;
 * pro Woche höchstens ein Turnier. Kosten IMMER via computeSeasonCost (Autorität).
 */
export function optimizeSeason(input: OptimizeInput): SeasonProposal {
  const { candidates, budget, params, homePlace, now, schengen } = input;
  const K = input.beamWidth ?? DEFAULT_BEAM;
  const nightsGiven = input.nightsPerWeek;
  const nights = nightsGiven != null && nightsGiven >= 0 ? Math.round(nightsGiven) : DEFAULT_NIGHTS;
  const bufferGiven = input.bufferDays;
  const buffer = bufferGiven != null && bufferGiven >= 0 ? Math.round(bufferGiven) : DEFAULT_BUFFER;
  const primaryCurrency = budget?.currency ?? params.arrival?.currency ?? params.perNight?.currency ?? null;

  // Objektiv auflösen. Absicherung (greift regulär NIE, weil die UI beim Umschalten eine
  // Zielrunde setzt): most_points ohne Zielrunde → Rückfall auf most_tournaments + Note.
  const expectedRound = input.expectedRound ?? null;
  const fallbackNoRound = (input.objective ?? "most_tournaments") === "most_points" && expectedRound == null;
  const objective: SeasonObjective = fallbackNoRound ? "most_tournaments" : (input.objective ?? "most_tournaments");

  const budgetOk = (cost: SeasonCost): boolean => {
    if (!budget) return true;
    return (cost.total[budget.currency] ?? 0) <= budget.amount;
  };
  const schengenOk = (chosen: SeasonCandidate[]): boolean => {
    if (!schengen?.applies) return true;
    const stays = schengenStays(chosen, nights, schengen.existingStays);
    if (stays.length === 0) return true;
    const asOf = stays.reduce((mx, s) => (s.exit && s.exit > mx ? s.exit : mx), isoDay(mondayMs(now)));
    return !schengenUsage(stays, asOf).exceeds;
  };

  // ── Kandidaten einteilen: einreisegesperrt (raus), unbewertbar (kein Ort), fristverstrichen (raus), sonst eignungsfähig ──
  const entryBanned = input.entryBanned ?? new Set<string>();
  const bannedEntry: SeasonCandidate[] = [];
  const unassessable: { id: string; code: "kein_ortsschluessel" }[] = [];
  const excludedFrist: SeasonCandidate[] = [];
  const eligible: SeasonCandidate[] = [];
  const classOf = new Map<string, string>();
  for (const c of candidates) {
    // Einreisesperre zuerst: dominanter Grund, unabhängig von Ort/Frist. Ein betroffenes
    // Turnier kommt gar nicht in Betracht — nie vorschlagen, aber Grund ausweisen.
    if (c.country && entryBanned.has(c.country)) { bannedEntry.push(c); continue; }
    if (!c.place) { unassessable.push({ id: c.id, code: "kein_ortsschluessel" }); continue; }
    const cls = decideTournament({
      tournament: { tournamentMonday: c.tournamentMonday, series: c.series, category: c.category ?? null, place: c.place },
      now,
    }).classification;
    classOf.set(c.id, cls);
    if (cls === "frist_verstrichen") { excludedFrist.push(c); continue; }
    eligible.push(c);
  }

  // ── Wochen (chronologisch); je Woche die Kandidaten, deterministisch nach id ──
  const byWeek = new Map<string, SeasonCandidate[]>();
  for (const c of eligible) {
    const wk = isoDay(mondayMs(c.tournamentMonday));
    if (!byWeek.has(wk)) byWeek.set(wk, []);
    byWeek.get(wk)!.push(c);
  }
  const weeks = [...byWeek.keys()].sort();
  for (const wk of weeks) byWeek.get(wk)!.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  // ── Erwartungspunkte je eignungsfähigem Kandidaten (nur Objektiv C). maxExpected = 0
  //    heißt: mit dieser Zielrunde bringt KEIN Turnier im Rahmen Punkte (z. B. R32/1. Runde,
  //    9.03 G.2) → das Ergebnis sagt das (Note), statt willkürlich Turniere zu wählen. ──
  const pointsOf = new Map<string, number>();
  let maxExpected = 0;
  if (objective === "most_points" && expectedRound) {
    for (const c of eligible) {
      const p = expectedPoints(c.category, expectedRound, isoDay(mondayMs(c.tournamentMonday))).points;
      pointsOf.set(c.id, p);
      if (p > maxExpected) maxExpected = p;
    }
  }

  const emptyCost = computeSeasonCost([], params);
  let beam: State[] = [{ chosen: [], cost: emptyCost, scalar: 0, points: 0, tightLegs: 0 }];

  const better = (a: State, b: State): number => {
    if (objective === "most_points") {
      if (a.points !== b.points) return b.points - a.points;                            // mehr Punkte zuerst
    } else if (a.chosen.length !== b.chosen.length) {
      return b.chosen.length - a.chosen.length;                                          // mehr Turniere zuerst
    }
    if (a.scalar !== b.scalar) return a.scalar - b.scalar;                              // dann günstiger (Tiebreaker)
    if (a.tightLegs !== b.tightLegs) return a.tightLegs - b.tightLegs;                  // dann weniger enge Übergänge (Puffer, weich)
    // stabiler Schlüssel (deterministisch)
    const ka = a.chosen.map((c) => c.id).join(","), kb = b.chosen.map((c) => c.id).join(",");
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  };

  for (const wk of weeks) {
    const weekCands = byWeek.get(wk)!;
    const next: State[] = [];
    for (const st of beam) {
      next.push(st); // Woche überspringen
      for (const c of weekCands) {
        const chosen = [...st.chosen, c];
        const cost = computeSeasonCost(buildStations(chosen, nights), params);
        if (!budgetOk(cost)) continue;      // Budget-Grenze
        if (!schengenOk(chosen)) continue;  // Schengen 90/180
        // Enger Übergang vom zuletzt gewählten Turnier (Reise-Reihenfolge) → zählen (weich, kein Ausschluss).
        const last = st.chosen[st.chosen.length - 1];
        const tight = last ? isTightLeg(last.place, mondayMs(last.tournamentMonday), c.place, mondayMs(c.tournamentMonday), buffer) : false;
        next.push({ chosen, cost, scalar: costScalar(cost, primaryCurrency), points: st.points + (pointsOf.get(c.id) ?? 0), tightLegs: st.tightLegs + (tight ? 1 : 0) });
      }
    }
    next.sort(better);
    beam = next.slice(0, K);
  }

  const best = beam[0] ?? { chosen: [], cost: emptyCost, scalar: 0, points: 0, tightLegs: 0 };
  const chosenIds = new Set(best.chosen.map((c) => c.id));
  const stations = buildStations(best.chosen, nights);
  const cost = computeSeasonCost(stations, params); // Re-Bewertung = die ausgewiesene Autorität

  // ── Picks + Begründungen ────────────────────────────────────────────────────
  const picks: SeasonPick[] = [];
  let prevPlace: string | null = null;
  let prevMondayMs: number | null = null;
  for (const c of best.chosen) {
    const cMondayMs = mondayMs(c.tournamentMonday);
    const reasons: DecideReason[] = [reason("passt_ins_budget", "dafuer")];
    if (c.place === prevPlace) reasons.push(reason("keine_anreise_cluster", "dafuer"));
    else if (c.place === homePlace) reasons.push(reason("heimatnah", "dafuer"));
    else reasons.push(reason("guenstige_anreise", "neutral"));
    // Enger Übergang vom Vorgänger (nur verschiedene Orte) — wertführender Code (UI trennt am ":"),
    // markiert, NICHT ausgeschlossen: „nur X Tage Anreise".
    if (prevMondayMs != null && isTightLeg(prevPlace, prevMondayMs, c.place, cMondayMs, buffer)) {
      reasons.push(reason(`enge_anreise:${restDaysBetween(prevMondayMs, cMondayMs)}`, "dagegen"));
    }
    reasons.push(classOf.get(c.id) === "fristen_unbekannt" ? reason("frist_unbekannt_challenger", "neutral") : reason("frist_offen", "dafuer"));
    // Objektiv C: erwartete Punkte je Pick (wertführender Code — UI trennt am ":").
    if (objective === "most_points") reasons.push(reason(`erwartungspunkte:${pointsOf.get(c.id) ?? 0}`, "dafuer"));
    if (!c.hasMapCoords) reasons.push(reason("ohne_kartenpunkt", "neutral"));
    picks.push({ id: c.id, weekMonday: isoDay(cMondayMs), place: c.place as string, onMap: c.hasMapCoords, reasons });
    prevPlace = c.place;
    prevMondayMs = cMondayMs;
  }

  // ── Verworfene (nichts still): Grund je nicht gewähltem Kandidaten ──────────
  const weekHasPick = new Set(best.chosen.map((c) => isoDay(mondayMs(c.tournamentMonday))));
  const rejected: RejectedCandidate[] = [
    ...bannedEntry.map((c) => ({ id: c.id, reasons: [reason("einreise_gesperrt", "dagegen")] })),
    ...excludedFrist.map((c) => ({ id: c.id, reasons: [reason("frist_verstrichen", "dagegen")] })),
  ];
  for (const c of eligible) {
    if (chosenIds.has(c.id)) continue;
    const wk = isoDay(mondayMs(c.tournamentMonday));
    if (weekHasPick.has(wk)) { rejected.push({ id: c.id, reasons: [reason("woche_belegt", "dagegen")] }); continue; }
    const test = [...best.chosen, c];
    const tc = computeSeasonCost(buildStations(test, nights), params);
    if (!budgetOk(tc)) rejected.push({ id: c.id, reasons: [reason("budget_erschoepft", "dagegen")] });
    else if (!schengenOk(test)) rejected.push({ id: c.id, reasons: [reason("schengen_grenze", "dagegen")] });
    else rejected.push({ id: c.id, reasons: [reason("naeherung", "neutral")] }); // machbar, aber von der Näherung ausgelassen
  }

  // ── Schengen-Auslastung der vorgeschlagenen Saison ──────────────────────────
  let schengenResult: SchengenUsage | null = null;
  if (schengen?.applies) {
    const stays = schengenStays(best.chosen, nights, schengen.existingStays);
    const asOf = stays.reduce((mx, s) => (s.exit && s.exit > mx ? s.exit : mx), isoDay(mondayMs(now)));
    schengenResult = schengenUsage(stays, asOf);
  }

  // ── budgetLeft je Währung ───────────────────────────────────────────────────
  const budgetLeft: MoneyBag = {};
  if (budget) budgetLeft[budget.currency] = budget.amount - (cost.total[budget.currency] ?? 0);

  // ── Notes (Saison-weit) ─────────────────────────────────────────────────────
  const notes: string[] = ["naeherung"]; // Näherung — immer
  if (nightsGiven == null) notes.push("naechte_annahme");
  if (bufferGiven == null) notes.push("puffer_annahme"); // Puffer nicht gesetzt → mit 2 Tagen gerechnet
  if (best.tightLegs > 0) notes.push("enge_anreise_vorhanden"); // ≥1 enger Übergang im Plan (markiert, nicht entfernt)
  if (cost.multiCurrency) notes.push("mehrwaehrung");
  notes.push(`arrivals_gespart:${cost.arrivalsSaved}`); // wertführender Code — UI trennt am ":"
  if (budget) {
    const left = budgetLeft[budget.currency] ?? 0;
    notes.push(left <= 0 ? "budget_ausgeschoepft" : "budget_uebrig");
  }
  if (schengenResult && schengenResult.used >= SCHENGEN_NEAR) notes.push("schengen_nah");
  // Objektiv C: Annahme sichtbar machen; leere Runde melden statt willkürlich zu wählen.
  if (objective === "most_points" && expectedRound) {
    notes.push(`erwartungspunkte_annahme:${expectedRound}`); // wertführend — UI trennt am ":"
    if (maxExpected === 0) notes.push("erwartungspunkte_runde_wertlos"); // z. B. R32: alle 0 (9.03 G.2)
  }
  if (fallbackNoRound) notes.push("erwartungspunkte_null"); // Absicherung: greift regulär nie

  return {
    rulesVersion: OPTIMIZE_RULES_VERSION,
    objective,
    approximate: true,
    picks,
    stations,
    cost,
    schengen: schengenResult,
    value: objective === "most_points" ? best.points : best.chosen.length,
    budgetLeft,
    rejected,
    unassessable,
    notes,
  };
}
