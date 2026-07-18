/**
 * Deterministischer Empfehlungs-Kern v1 (Beratungsplattform, Phase 4).
 *
 *   Spielerprofil + Racket-Daten + Regelversion  →  Scores + Begründungen +
 *   Ausschlüsse + Confidence
 *
 * Reine Funktionen, keine Zufälligkeit, keine Seiteneffekte → gleiche Eingabe
 * ergibt immer dasselbe Ergebnis (per Unit-Test abgesichert). Gewichte liegen in
 * einer versionierten Config, damit spätere Regel-Versionen (v2 …) nachvollziehbar
 * danebengelegt werden können.
 */
import { AXES, type Axis, type Racket, type Level } from "@/domain/equipment/racket";
import { derivePriorities, type PlayerProfile } from "@/domain/advisory/playerProfile";

export const RULES_VERSION = "v1";

/** Versionierte Kalibrierung — bewusst zentral, nicht in der UI verstreut. */
const CONFIG = {
  // Ab diesem Prioritäts-Gewicht gilt eine Achse als „dem Nutzer wichtig".
  relevantWeight: 0.12,
  // Racket-Rating-Schwellen (0–100) für „stark" bzw. „schwach".
  strongRating: 62,
  weakRating: 45,
  // Steifigkeit (RA), ab der ein Rahmen für empfindliche Arme heikel ist.
  stiffArmRisk: 68,
  // Boni/Strafen (Punkte auf der 0–100-Match-Skala).
  levelMatchBonus: 6,
  levelMismatchPenalty: 8,
  confidencePenalty: { high: 0, medium: 2, low: 5 } as Record<Racket["provenance"]["confidence"], number>,
} as const;

export type Recommendation = {
  racket: Racket;
  matchScore: number;                         // 0–100, absolute Passung
  confidence: Racket["provenance"]["confidence"]; // Datensicherheit (getrennt!)
  topAxes: Axis[];                            // „Warum passend" (max 3)
  watchAxes: Axis[];                          // „Darauf achten" (max 2)
};

export type ScoreResult = {
  rulesVersion: string;
  recommendations: Recommendation[];          // sichtbar (Top-N, diversifiziert)
  excludedCount: number;                       // hart ausgeschlossen (nicht gezeigt)
};

const LEVEL_ORDER: Level[] = ["beginner", "intermediate", "advanced", "competitive"];

/** Harte Ausschlüsse — Rahmen, die für dieses Profil klar ungeeignet/riskant sind. */
function isExcluded(r: Racket, p: PlayerProfile): boolean {
  // Empfindlicher Arm + sehr steifer Rahmen → Verletzungsrisiko.
  if (p.armSensitivity === "high" && r.specs.stiffnessRa >= CONFIG.stiffArmRisk) return true;
  // Anfänger + reiner Profi-Rahmen (nicht für Anfänger, wenig verzeihend).
  if (p.level === "beginner" && !r.levels.includes("beginner") && r.ratings.forgiveness < CONFIG.weakRating) return true;
  return false;
}

function levelDistance(r: Racket, level: Level): number {
  if (r.levels.includes(level)) return 0;
  const li = LEVEL_ORDER.indexOf(level);
  return Math.min(...r.levels.map((l) => Math.abs(LEVEL_ORDER.indexOf(l) - li)));
}

/** Bewertet EINEN Rahmen gegen ein Profil (rein, deterministisch). */
export function scoreRacket(r: Racket, p: PlayerProfile): Recommendation {
  const w = derivePriorities(p);

  // Gewichtete Passung: hohe Priorität × hohes Rating = hoher Beitrag.
  let fit = 0;
  for (const a of AXES) fit += w[a] * (r.ratings[a] / 100);
  let score = fit * 100; // 0–100

  // Spielstärke-Fit.
  const dist = levelDistance(r, p.level);
  score += dist === 0 ? CONFIG.levelMatchBonus : -CONFIG.levelMismatchPenalty * dist;

  // Datensicherheit fliesst leicht in den Match-Score ein (Unsicherheits-Abzug).
  score -= CONFIG.confidencePenalty[r.provenance.confidence];

  const matchScore = Math.max(0, Math.min(100, Math.round(score)));

  // „Warum passend": dem Nutzer wichtige Achsen, auf denen der Rahmen stark ist.
  const relevant = AXES.filter((a) => w[a] >= CONFIG.relevantWeight);
  const topAxes = relevant
    .filter((a) => r.ratings[a] >= CONFIG.strongRating)
    .sort((a, b) => w[b] * r.ratings[b] - w[a] * r.ratings[a])
    .slice(0, 3);

  // „Darauf achten": dem Nutzer wichtige Achsen, auf denen der Rahmen schwach ist.
  const watchAxes = relevant
    .filter((a) => r.ratings[a] < CONFIG.weakRating)
    .sort((a, b) => w[b] - w[a])
    .slice(0, 2);

  return { racket: r, matchScore, confidence: r.provenance.confidence, topAxes, watchAxes };
}

/**
 * Empfiehlt Top-N Rahmen. Diversifiziert leicht: garantiert (falls vorhanden)
 * mindestens einen komfort- und einen kontrollbetonten Rahmen unter den Top-N,
 * damit die Liste nicht einseitig wird.
 */
export function recommend(p: PlayerProfile, rackets: Racket[], topN = 5): ScoreResult {
  const eligible = rackets.filter((r) => !isExcluded(r, p));
  const excludedCount = rackets.length - eligible.length;

  const scored = eligible
    .map((r) => scoreRacket(r, p))
    // Stabile Sortierung: Score desc, dann id asc → deterministisch.
    .sort((a, b) => b.matchScore - a.matchScore || a.racket.id.localeCompare(b.racket.id));

  const picked: Recommendation[] = scored.slice(0, topN);
  const has = (pred: (r: Recommendation) => boolean) => picked.some(pred);
  const ensure = (pred: (r: Recommendation) => boolean) => {
    if (has(pred)) return;
    const extra = scored.find((r) => !picked.includes(r) && pred(r));
    if (extra && picked.length) picked[picked.length - 1] = extra; // schwächsten ersetzen
  };
  ensure((r) => r.racket.ratings.comfort >= CONFIG.strongRating);
  ensure((r) => r.racket.ratings.control >= CONFIG.strongRating);
  picked.sort((a, b) => b.matchScore - a.matchScore || a.racket.id.localeCompare(b.racket.id));

  return { rulesVersion: RULES_VERSION, recommendations: picked, excludedCount };
}
