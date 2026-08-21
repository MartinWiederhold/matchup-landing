/**
 * Datenschicht für die Route /tour/points: erfasste Matches (web.tour_events,
 * kind='match') → Ergebnisse für den Punkte-Rechner (src/domain/tour/points.ts).
 *
 * EIGENE DATEI, nur Anon-Client — nie Service-Client (RLS wirkt). Explizite
 * Spaltenlisten, kein select *. Diese Datei fasst NUR Lesen an; sie ändert nichts
 * an web.tour_events (das gehört /tour/calendar bzw. /app).
 *
 * Kernproblem: `tour_events.round` ist FREIER TEXT (in /app ein Freitext-Feld).
 * „QF", „Viertelfinale", „quarterfinal", „1/4" meinen dasselbe, der Rechner kennt
 * aber nur feste Codes. Lösung: eine EXPLIZITE, dokumentierte Zuordnungstabelle
 * (ROUND_ALIASES) — KEIN Fuzzy-Textvergleich. Was nicht in der Liste steht, wird
 * NICHT geraten, sondern als „unbekannte Runde" durchgereicht und in der UI mit
 * Grund gezeigt (nie stillschweigend weggelassen).
 *
 * Aggregation: /app speichert EINE Zeile pro Match. Ein QF-Aus sind drei Zeilen
 * (R32-Sieg, R16-Sieg, QF-Niederlage). Deshalb wird pro Turnier auf EIN terminales
 * Ergebnis verdichtet (die Niederlage bzw. der Titel via `won`), sonst zählte die
 * beste-n-Summe doppelt.
 *
 * Qualifikation: in dieser Version NICHT bewertet (Q/Q2 sind eine kleine Größe und
 * nur bei Challenger). Quali-Matches werden je Turnier einmal als „folgt" markiert.
 */

import { supabase } from "@/lib/supabase";
import { isTourTournamentId } from "@/lib/tourExpenses";
import type { MatchResult } from "@/domain/tour/points";

// ── Runden-Zuordnung (explizit, keine Fuzzy-Logik) ───────────────────────────
// Kanonische Hauptfeld-Stufen, früh → spät (für die „tiefste Runde"-Bestimmung).
// Bewusst OHNE R64/R128: die abgedeckten Kategorien (Challenger, ITF) haben 32er-
// Hauptfelder; höhere Runden kommen dort nicht vor und kennt der Rechner nicht.
const STAGE_ORDER = ["R32", "R16", "QF", "SF", "F"] as const;
type Stage = (typeof STAGE_ORDER)[number];

/** Text → Stufe. Schlüssel sind bereits normalisiert (klein, ohne Leer-/Satzzeichen). */
const ROUND_ALIASES: Record<string, Stage> = {
  // Finale
  f: "F", final: "F", finale: "F", endspiel: "F",
  // Halbfinale
  sf: "SF", semi: "SF", semifinal: "SF", semifinals: "SF", halbfinale: "SF", hf: "SF", "12": "SF",
  // Viertelfinale
  qf: "QF", quarter: "QF", quarterfinal: "QF", quarterfinals: "QF", viertelfinale: "QF", vf: "QF", "14": "QF",
  // Achtelfinale (Round of 16)
  r16: "R16", roundof16: "R16", last16: "R16", achtelfinale: "R16", af: "R16", "18": "R16",
  // Erste Runde im 32er-Feld (Round of 32) — gibt keine Punkte, aber gültige Runde
  r32: "R32", roundof32: "R32", last32: "R32", sechzehntelfinale: "R32", firstround: "R32",
  "1stround": "R32", "1runde": "R32", ersterunde: "R32", "116": "R32",
};

/** Schreibweisen, die eine Qualifikationsrunde meinen (v1: nicht bewertet, nur markiert). */
const QUALI_KEYS: ReadonlySet<string> = new Set([
  "q", "q1", "q2", "q3", "quali", "qualy", "qualifying", "qualifikation", "qualified",
  "qualifiziert", "qr", "qr1", "qr2", "qr3",
]);

/** Kategorie-Text (aus tour_tournaments.category) → Rechner-Code. */
const CATEGORY_MAP: Record<string, string> = {
  M15: "m15",
  M25: "m25",
  "Challenger 50": "challenger_50",
  "Challenger 75": "challenger_75",
  "Challenger 100": "challenger_100",
  "Challenger 125": "challenger_125",
  "Challenger 175": "challenger_175",
  // Damen (WTA). W25 fehlt bewusst (2026 keine gültige Kategorie) → "" → unbekannte_kategorie.
  W15: "w15",
  W35: "w35",
  W50: "w50",
  W75: "w75",
  W100: "w100",
};

/** Normalisiert eine Runden-Schreibweise auf den Vergleichsschlüssel. */
function normKey(raw: string): string {
  return raw.toLowerCase().replace(/[\s._/\-]+/g, "");
}

/** Ordnet einen Runden-Text ein: erkannte Stufe, Qualifikation oder unbekannt (nie geraten). */
export function classify(raw: string | null): { stage: Stage | null; quali: boolean; unknown: boolean } {
  const key = raw ? normKey(raw) : "";
  if (key && ROUND_ALIASES[key]) return { stage: ROUND_ALIASES[key], quali: false, unknown: false };
  if (key && QUALI_KEYS.has(key)) return { stage: null, quali: true, unknown: false };
  return { stage: null, quali: false, unknown: true };
}

/** Kategorie-Code oder "" (unbekannt → der Rechner markiert es als unbekannte_kategorie). */
function mapCategory(category: string | null, recognized: boolean): string {
  if (!recognized || !category) return "";
  return CATEGORY_MAP[category] ?? "";
}

// ── Ausgabetypen ─────────────────────────────────────────────────────────────
/** Ein wertbares Ergebnis (geht an scorePoints) plus Anzeigedaten. */
export type PointsRow = {
  result: MatchResult; // {category, round, tournamentMonday} für scorePoints
  tournamentId: string; // uuid des Turniers (für die Belag-Zuordnung in der Auswertung)
  tournamentName: string;
  rawRound: string | null; // Originaltext des round-Felds (für die Anzeige bei Unbekanntem)
  won: boolean | null;
  incomplete?: boolean; // nur Siege erfasst → weiteste belegte Runde gewertet, Verlauf evtl. unvollständig
};

/** Ein Match, das (noch) kein wertbares Ergebnis ergibt — mit Grund, nie still verworfen. */
export type PointsIssue = {
  reason: "quali_pending" | "result_open" | "unassigned";
  tournamentName: string;
  rawRound: string | null;
};

/** Zwischenform je Match: erkannte Stufe/Quali/unbekannt plus won. Exportiert für Tests. */
export type Parsed = { won: boolean | null; raw: string | null; stage: Stage | null; quali: boolean; unknown: boolean };

export type PointsData = { rows: PointsRow[]; issues: PointsIssue[] };

type MatchRow = { tournament_id: string | null; round: string | null; won: boolean | null };
type TourRow = {
  id: string;
  tournament_monday: string;
  category: string | null;
  category_recognized: boolean;
  name: string | null;
  city: string | null;
  country: string | null;
};

/**
 * Bestimmt aus den Hauptfeld-Matches eines Turniers das terminale Ergebnis:
 *  - Finalsieg (stage F, won=true) → „W" (Titel)
 *  - sonst die tiefste Niederlage (won=false) → deren Runde
 *  - nur Siege ohne Niederlage/Finalsieg → die weiteste belegte Runde wird gewertet:
 *    ein gewonnener Match führt in die NÄCHSTE Runde (SF gewonnen = Finale erreicht → „F"),
 *    markiert als `incomplete` (Verlauf evtl. unvollständig, Niederlage evtl. nicht erfasst)
 *  - nur unbekannte Ausgänge (won=null, kein einziger Sieg) → „result_open"
 *
 * Exportiert für den Unit-Test (hält die „nur Siege"-Regel fest).
 */
export function pickTerminal(
  main: Parsed[],
): { code: string; raw: string | null; won: boolean | null; incomplete: boolean } | { issue: "result_open" } {
  const terminals = main.filter((p) => p.won === false || (p.stage === "F" && p.won === true));
  if (terminals.length === 0) {
    // Kein Aus, kein Finalsieg. Gibt es wenigstens einen belegten Sieg?
    const wins = main.filter((p) => p.won === true);
    if (wins.length === 0) return { issue: "result_open" }; // nur offene Ausgänge → nicht bestimmbar
    // Weiteste belegte Runde: der tiefste Sieg führt in die nächste Runde (kein Titel ohne Finalsieg).
    wins.sort((a, b) => STAGE_ORDER.indexOf(b.stage!) - STAGE_ORDER.indexOf(a.stage!));
    const deepest = wins[0];
    const reached = STAGE_ORDER[STAGE_ORDER.indexOf(deepest.stage!) + 1]; // Sieg in S ⇒ erreichte Runde S+1
    return { code: reached, raw: deepest.raw, won: deepest.won, incomplete: true };
  }
  // tiefsten terminalen Kandidaten wählen (spätere Runde gewinnt)
  terminals.sort((a, b) => STAGE_ORDER.indexOf(b.stage!) - STAGE_ORDER.indexOf(a.stage!));
  const term = terminals[0];
  const code = term.stage === "F" && term.won === true ? "W" : term.stage!;
  return { code, raw: term.raw, won: term.won, incomplete: false };
}

/**
 * Lädt die Matches des Nutzers und verdichtet sie zu wertbaren Ergebnissen + Hinweisen.
 * scorePoints wird bewusst NICHT hier aufgerufen — der Stichtag kommt aus der Komponente.
 */
export async function loadPointsData(userId: string): Promise<PointsData> {
  const { data, error } = await supabase
    .from("tour_events")
    .select("tournament_id, round, won")
    .eq("user_id", userId)
    .eq("kind", "match");
  if (error) throw error;
  const matches = (data as MatchRow[]) ?? [];
  if (matches.length === 0) return { rows: [], issues: [] };

  // Turnierdaten (Kategorie, Turniermontag, Anzeigename) für die verknüpften uuids.
  const uuids = [...new Set(matches.map((m) => m.tournament_id).filter((id): id is string => isTourTournamentId(id)))];
  const byId = new Map<string, { monday: string; category: string | null; recognized: boolean; name: string }>();
  if (uuids.length) {
    const { data: ts, error: e2 } = await supabase
      .from("tour_tournaments")
      .select("id, tournament_monday, category, category_recognized, name, city, country")
      .in("id", uuids);
    if (e2) throw e2;
    for (const t of (ts as TourRow[]) ?? []) {
      const name = t.city ? `${t.city}${t.country ? ", " + t.country : ""}` : t.name ?? t.id;
      byId.set(t.id, { monday: t.tournament_monday, category: t.category, recognized: t.category_recognized, name });
    }
  }

  const rows: PointsRow[] = [];
  const issues: PointsIssue[] = [];

  // Nach Turnier gruppieren (nur echte /tour-uuids); Rest ist „nicht zugeordnet".
  const groups = new Map<string, MatchRow[]>();
  for (const m of matches) {
    if (!isTourTournamentId(m.tournament_id) || !byId.has(m.tournament_id!)) {
      issues.push({ reason: "unassigned", tournamentName: "—", rawRound: m.round });
      continue;
    }
    const arr = groups.get(m.tournament_id!) ?? [];
    arr.push(m);
    groups.set(m.tournament_id!, arr);
  }

  for (const [tid, ms] of groups) {
    const t = byId.get(tid)!;
    const category = mapCategory(t.category, t.recognized);
    const parsed: Parsed[] = ms.map((m) => ({ won: m.won, raw: m.round, ...classify(m.round) }));

    // Qualifikation: einmal je Turnier als „folgt" melden (v1 nicht bewertet).
    if (parsed.some((p) => p.quali)) {
      issues.push({ reason: "quali_pending", tournamentName: t.name, rawRound: null });
    }

    // Unbekannte Runden: jede einzeln durchreichen (scorePoints markiert „unbekannte_runde").
    for (const p of parsed.filter((p) => p.unknown)) {
      rows.push({
        result: { category, round: p.raw ?? "", tournamentMonday: t.monday },
        tournamentId: tid,
        tournamentName: t.name,
        rawRound: p.raw,
        won: p.won,
      });
    }

    // Hauptfeld-Stufen zu EINEM terminalen Ergebnis verdichten.
    const main = parsed.filter((p) => p.stage);
    if (main.length) {
      const term = pickTerminal(main);
      if ("code" in term) {
        rows.push({
          result: { category, round: term.code, tournamentMonday: t.monday },
          tournamentId: tid,
          tournamentName: t.name,
          rawRound: term.raw,
          won: term.won,
          incomplete: term.incomplete,
        });
      } else {
        issues.push({ reason: term.issue, tournamentName: t.name, rawRound: null });
      }
    }
  }

  return { rows, issues };
}
