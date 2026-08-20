/**
 * Turnier-Entscheider (Domain-Schicht, v1).
 *
 *   Fristenlage (aus deadlines.ts) + Kostenlage (Orts-/Anreise-Signal)
 *   + aktuelle Zeit  →  eine begründete Einordnung je Turnier
 *
 * Reine Funktion: keine DB, kein Netzwerk, KEINE Systemzeit (kein `new Date()`/
 * `Date.now()`). Die aktuelle Zeit kommt als Parameter `now` herein; gleiche Eingabe
 * ⇒ gleiches Ergebnis (per Unit-Test abgesichert). Rückgaben tragen nur Codes, keine
 * Sätze — die Übersetzung passiert in der UI über i18n.
 *
 * Ehrlichkeit ist der Kern dieses Moduls:
 *  - Es gibt KEINE Punktehistorie (siehe BACKLOG MU-016) und KEINE Cut-off-Prognose.
 *    Beides wird NICHT simuliert, sondern als fehlende Grundlage im Ergebnisfeld
 *    `basisLuecken` ausgewiesen (nicht in einem Kommentar versteckt).
 *  - Bei Challenger sind die Meldefristen unbekannt. Das führt NICHT zu einer
 *    schlechteren Einordnung, sondern zu einer EIGENEN Aussage `fristen_unbekannt`.
 *  - Die Kostenlage kann eine Einordnung nie allein tragen: Sie liefert nur
 *    Begründungen (Anreise entfällt / nötig, Kostensatz unbekannt), keine Klasse.
 *
 * Der Vertrauenswert erbt vom SCHWÄCHSTEN beteiligten Baustein (Minimum), nicht als
 * Durchschnitt — ein unsicherer Baustein soll das Gesamtvertrauen ziehen, nicht
 * durch einen sicheren geglättet werden.
 *
 * Kopplung bewusst minimal: aus costs.ts wird NUR der Typ `CostParams` importiert
 * (keine Funktion). Die Ortsgleichheit ist ein reiner Zeichenkettenvergleich —
 * kein Kostenrechner-Aufruf, damit ein späteres Verhalten von costs.ts diesen
 * Entscheider nicht unbemerkt bricht.
 */

import { tourDeadlines, type TourSeries } from "./deadlines";
import type { CostParams } from "./costs";

export const DECIDE_RULES_VERSION = "v1";

/** Einordnung als Code (keine Note). `fristen_unbekannt` ist die eigene Challenger-Aussage. */
export type DecideClassification =
  | "frist_verstrichen"
  | "frist_laeuft_bald_ab"
  | "planbar"
  | "zu_weit_entfernt"
  | "fristen_unbekannt";

/** Richtung einer Begründung: spricht dafür / dagegen / neutral. */
export type ReasonDirection = "dafuer" | "dagegen" | "neutral";

/** Eine Begründung: Code + Richtung. Nur Codes, keine Sätze. */
export type DecideReason = { code: string; direction: ReasonDirection };

/** Das zu bewertende Turnier. */
export type TournamentToDecide = {
  tournamentMonday: Date; // wird auf 00:00 UTC reduziert (wie in deadlines.ts)
  series: TourSeries;
  category?: string | null; // nur mitgeführt, hier NICHT bewertet
  place: string; // Ortsschlüssel wie in costs.ts, z. B. "TN|Monastir"
};

/** Optionaler Kosten-Kontext. Nur wenn gesetzt, zählt der Kosten-Baustein mit. */
export type DecideCostContext = {
  prevPlace?: string | null; // Vorstation der Reisekette (für Anreise-entfällt-Begründung)
  params?: CostParams; // Kostensätze; fehlender Anreisesatz → kosten_unbekannt
};

export type DecideInput = {
  tournament: TournamentToDecide;
  now: Date; // aktuelle Zeit ALS PARAMETER — keine Systemuhr
  cost?: DecideCostContext; // optional
};

export type TournamentDecision = {
  rulesVersion: string;
  classification: DecideClassification;
  reasons: DecideReason[]; // Begründungs-Codes mit Richtung
  basisLuecken: string[]; // worauf die Einschätzung NICHT beruht (eigenes Feld, kein Kommentar)
  confidence: number; // 0..1 = MIN der beteiligten Bausteine (kein Durchschnitt)
  notes: string[]; // technische Codes, u. a. aus deadlines durchgereicht
};

// ── Schwellen & Vertrauenswerte (benannt, damit spätere Versionen nachvollziehbar sind) ──
const DAY = 86_400_000; // ms/Tag
const SOON_DAYS = 7; // Entry ≤ 7 Tage entfernt → „läuft bald ab"
const HORIZON_DAYS = 56; // Entry > 56 Tage entfernt → „zu weit entfernt"

const CONF_DEADLINE_ITF = 0.9; // ITF-Fristen belegt (Entry/Withdrawal solide)
const CONF_DEADLINE_CHALLENGER = 0.2; // Challenger-Fristen unbekannt
const CONF_INPUT_SUSPECT_CAP = 0.5; // Deckel, wenn die Eingabe kein Montag ist
const CONF_COST_KNOWN = 0.8; // Anreisesatz vorhanden
const CONF_COST_UNKNOWN = 0.5; // Anreisesatz fehlt

const round2 = (x: number) => Math.round(x * 100) / 100;

/**
 * Führt Fristenlage und Kostenlage zu einer begründeten Einschätzung zusammen.
 *
 * Reihenfolge der Einordnung:
 *   1. Turnierwoche liegt in der Vergangenheit → `frist_verstrichen` (serienneutral,
 *      man kann sich zu einem gespielten Turnier nicht mehr melden).
 *   2. ITF: Entry verstrichen → `frist_verstrichen`; sonst nach Tagen bis Entry
 *      (≤7 bald, ≤56 planbar, sonst zu weit).
 *   3. Challenger (zukünftig): eigene Aussage `fristen_unbekannt` — KEINE Ableitung
 *      aus geratenen Fristen.
 * Die Kostenlage ergänzt nur Begründungen, nie die Klasse.
 */
export function decideTournament(input: DecideInput): TournamentDecision {
  const { tournament: t, now, cost } = input;

  // Fristen aus dem bestehenden Baustein holen (verändert deadlines.ts nicht).
  // Grad mitgeben — nur für Junioren relevant, bestimmt dort die Berechenbarkeit des Entry.
  const dl = tourDeadlines(t.tournamentMonday, t.series, t.category);
  const mondayMs = dl.tournamentMonday.getTime(); // bereits auf 00:00 UTC normalisiert
  const nowMs = now.getTime();

  // Turnierwoche begonnen/vorbei? Serienneutraler, ehrlicher Auslöser für „verstrichen".
  const tournamentPast = nowMs >= mondayMs;

  const reasons: DecideReason[] = [];
  let classification: DecideClassification;

  if (t.series === "challenger") {
    if (tournamentPast) {
      // Vergangenes Challenger-Turnier: nicht meldbar — Tatsache, keine geratene Frist.
      classification = "frist_verstrichen";
      reasons.push({ code: "turnier_bereits_vorbei", direction: "dagegen" });
    } else {
      // Zukünftig: eigene Aussage statt schlechterer Bewertung.
      classification = "fristen_unbekannt";
      reasons.push({ code: "fristenregel_unbekannt", direction: "neutral" });
    }
  } else if (!dl.entry) {
    // Junioren J500/Grand Slam (oder Grad unbekannt): Meldeschluss turnierspezifisch, hier
    // nicht bestimmbar. Entry ist der Handlungsanker — ohne ihn wird NICHT geraten, sondern
    // ehrlich „Frist unbekannt" ausgewiesen (wie bei Challengern). Withdrawal/Freeze der
    // Junioren sind zwar bekannt, aber die Pipeline-Klassifikation hängt am Entry (Schritt 2).
    if (tournamentPast) {
      classification = "frist_verstrichen";
      reasons.push({ code: "turnier_bereits_vorbei", direction: "dagegen" });
    } else {
      classification = "fristen_unbekannt";
      reasons.push({ code: "fristenregel_unbekannt", direction: "neutral" });
    }
  } else {
    // ITF World Tennis Tour (und Junioren J30–J300): Entry bekannt, handlungsrelevanter Bezug.
    const entry = dl.entry;
    if (tournamentPast) {
      classification = "frist_verstrichen";
      reasons.push({ code: "turnier_bereits_vorbei", direction: "dagegen" });
    } else if (nowMs > entry.getTime()) {
      // Zwischen Entry-Ablauf und Turnierbeginn: nicht mehr meldbar.
      classification = "frist_verstrichen";
      reasons.push({ code: "meldefrist_verstrichen", direction: "dagegen" });
    } else {
      // Tage bis zur Entry Deadline (Grenzen inklusive: exakt 7 → bald, exakt 56 → planbar).
      const daysUntilEntry = (entry.getTime() - nowMs) / DAY;
      if (daysUntilEntry <= SOON_DAYS) {
        classification = "frist_laeuft_bald_ab";
        reasons.push({ code: "meldefrist_in_wenigen_tagen", direction: "neutral" });
      } else if (daysUntilEntry <= HORIZON_DAYS) {
        classification = "planbar";
        reasons.push({ code: "meldefrist_reichlich_zeit", direction: "dafuer" });
      } else {
        classification = "zu_weit_entfernt";
        reasons.push({ code: "turnier_weit_entfernt", direction: "neutral" });
      }
    }
  }

  // ── Kostenlage: nur Begründungen, nie die Einordnung ─────────────────────────
  // Anreise-Signal per reinem Ortsvergleich (kein computeSeasonCost-Aufruf).
  if (cost) {
    if (cost.prevPlace != null) {
      if (cost.prevPlace === t.place) {
        // Gleicher Ort wie die Vorstation → keine erneute Anreise (spart Kosten).
        reasons.push({ code: "anreise_entfaellt_gleicher_ort", direction: "dafuer" });
      } else {
        reasons.push({ code: "anreise_noetig_ortswechsel", direction: "neutral" });
      }
    }
    // Kostensatz-Prüfung ohne Kostenrechner: ist der Anreisesatz überhaupt gesetzt?
    if (!cost.params?.arrival) {
      reasons.push({ code: "kosten_unbekannt", direction: "neutral" });
    }
  }

  // ── Fehlende Grundlagen: gehören ins Ergebnis, nicht in einen Kommentar ───────
  const basisLuecken: string[] = ["keine_punktehistorie", "keine_cutoff_prognose"];
  // Die Freeze-Variante ist bei ITF bewusst ungeklärt (zwei Lesarten in deadlines.ts).
  if (t.series === "itf_wtt") basisLuecken.push("freeze_variante_ungeprueft");

  // ── Vertrauenswert: Minimum der beteiligten Bausteine (kein Durchschnitt) ─────
  let deadlineConf = t.series === "challenger" ? CONF_DEADLINE_CHALLENGER : CONF_DEADLINE_ITF;
  // Ist die Eingabe kein Montag, ist die gesamte Fristenrechnung fragwürdig → deckeln.
  if (dl.notes.includes("eingabe_kein_montag")) {
    deadlineConf = Math.min(deadlineConf, CONF_INPUT_SUSPECT_CAP);
  }
  const blocks: number[] = [deadlineConf];
  if (cost) blocks.push(cost.params?.arrival ? CONF_COST_KNOWN : CONF_COST_UNKNOWN);
  const confidence = round2(Math.min(...blocks));

  return {
    rulesVersion: DECIDE_RULES_VERSION,
    classification,
    reasons,
    basisLuecken,
    confidence,
    notes: [...dl.notes], // technische Codes aus der Fristenrechnung durchreichen
  };
}
