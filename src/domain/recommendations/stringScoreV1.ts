/**
 * Deterministischer Saiten- & Spannungs-Kern v1 (Beratungsplattform, Phase 6).
 * Nutzt dasselbe Prinzip wie der Racket-Kern: reine Funktion, versionierte
 * Gewichte, Erklärbarkeit. Spannung wird IMMER als Bereich ausgegeben (kg),
 * nie als Einzelwert (Doc-Prinzip). Keine medizinische Aussage.
 */
import { STRING_AXES, type StringAxis, type StringProduct } from "@/domain/equipment/string";
import type { PlayerProfile } from "@/domain/advisory/playerProfile";

export const STRING_RULES_VERSION = "v1";

const CONFIG = {
  relevantWeight: 0.12,
  strongRating: 62,
  // Empfindlicher Arm: Saiten mit Komfort darunter ausschliessen.
  minComfortForSensitiveArm: 60,
  confidencePenalty: { high: 0, medium: 2, low: 5 } as Record<StringProduct["provenance"]["confidence"], number>,
  // Neutrale Basis-Spannung (kg, unbesaitet) als Bereich → dann profilabhängig verschoben.
  baseTension: { min: 24, max: 25.5 },
} as const;

export type StringRec = {
  product: StringProduct;
  matchScore: number;
  confidence: StringProduct["provenance"]["confidence"];
  topAxes: StringAxis[];
};
export type StringResult = {
  rulesVersion: string;
  recommendations: StringRec[];
  tensionKg: { min: number; max: number }; // empfohlener Spannungs-BEREICH
  excludedCount: number;
};

type Weights = Record<StringAxis, number>;
const zero = (): Weights => ({ power: 0, control: 0, spin: 0, comfort: 0, durability: 0, tensionMaintenance: 0, feel: 0 });

/** Prioritäts-Gewichte für Saiten aus dem Profil (rein, deterministisch). */
export function deriveStringPriorities(p: PlayerProfile): Weights {
  const w = zero();
  const goal: Record<PlayerProfile["goal"], Partial<Weights>> = {
    power: { power: 3, comfort: 1 },
    control: { control: 3, spin: 0.5 },
    spin: { spin: 3, control: 1 },
    comfort: { comfort: 3, feel: 1 },
    allround: { control: 1, comfort: 1, durability: 1, feel: 0.5 },
  };
  for (const [a, v] of Object.entries(goal[p.goal])) w[a as StringAxis] += v as number;

  if (p.armSensitivity === "some") w.comfort += 1.5;
  if (p.armSensitivity === "high") w.comfort += 3;

  if (p.level === "beginner") { w.comfort += 1; w.durability += 0.5; }
  if (p.level === "competitive") { w.control += 1; w.spin += 0.5; }
  if (p.swingStyle === "full") w.spin += 0.5;

  const prob: Record<PlayerProfile["problem"], Partial<Weights>> = {
    none: {}, "flies-long": { control: 2 }, "no-control": { control: 2.5 },
    "arm-pain": { comfort: 3 }, "too-heavy": {}, "no-spin": { spin: 2.5 },
  };
  for (const [a, v] of Object.entries(prob[p.problem])) w[a as StringAxis] += v as number;

  const total = STRING_AXES.reduce((s, a) => s + w[a], 0) || 1;
  const out = zero();
  for (const a of STRING_AXES) out[a] = w[a] / total;
  return out;
}

function isExcluded(s: StringProduct, p: PlayerProfile): boolean {
  if (p.armSensitivity === "high" && s.ratings.comfort < CONFIG.minComfortForSensitiveArm) return true;
  return false;
}

/** Empfohlener Spannungs-Bereich (kg) — profilabhängig verschobene Basis. */
export function recommendTension(p: PlayerProfile): { min: number; max: number } {
  let delta = 0;
  if (p.armSensitivity === "high") delta -= 1.5;
  else if (p.armSensitivity === "some") delta -= 0.5;
  if (p.goal === "control" || p.problem === "flies-long" || p.problem === "no-control") delta += 1;
  if (p.goal === "power") delta -= 1;
  if (p.level === "beginner") delta -= 0.5;
  if (p.swingStyle === "full") delta += 0.5;
  const round = (n: number) => Math.round(n * 2) / 2;
  return { min: round(CONFIG.baseTension.min + delta), max: round(CONFIG.baseTension.max + delta) };
}

export function recommendStrings(p: PlayerProfile, strings: StringProduct[], topN = 3): StringResult {
  const w = deriveStringPriorities(p);
  const eligible = strings.filter((s) => !isExcluded(s, p));
  const excludedCount = strings.length - eligible.length;

  const scored: StringRec[] = eligible.map((s) => {
    let fit = 0;
    for (const a of STRING_AXES) fit += w[a] * (s.ratings[a] / 100);
    const matchScore = Math.max(0, Math.min(100, Math.round(fit * 100 - CONFIG.confidencePenalty[s.provenance.confidence])));
    const topAxes = STRING_AXES
      .filter((a) => w[a] >= CONFIG.relevantWeight && s.ratings[a] >= CONFIG.strongRating)
      .sort((a, b) => w[b] * s.ratings[b] - w[a] * s.ratings[a])
      .slice(0, 3);
    return { product: s, matchScore, confidence: s.provenance.confidence, topAxes };
  }).sort((a, b) => b.matchScore - a.matchScore || a.product.id.localeCompare(b.product.id));

  return {
    rulesVersion: STRING_RULES_VERSION,
    recommendations: scored.slice(0, topN),
    tensionKg: recommendTension(p),
    excludedCount,
  };
}
