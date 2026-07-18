/**
 * Spielerprofil aus dem Schläger-Finder (Beratungsplattform, Phase 4 — MVP).
 * Die Antworten sind bewusst einfach (Anfängerpfad max. 6–8 Pflichtfragen).
 * Prioritäts-Gewichte werden daraus ABGELEITET (Nutzer stellt keine Slider ein).
 */
import type { Axis, Ratings, Level } from "@/domain/equipment/racket";
import { AXES } from "@/domain/equipment/racket";

export type SwingStyle = "compact" | "moderate" | "full";
export type Goal = "power" | "control" | "spin" | "comfort" | "allround";
export type PlayStyle = "baseline" | "allcourt" | "servevolley" | "defensive";
export type ArmSensitivity = "none" | "some" | "high";
export type Problem = "none" | "flies-long" | "no-control" | "arm-pain" | "too-heavy" | "no-spin";

export type PlayerProfile = {
  schemaVersion: 1;
  level: Level;
  swingStyle: SwingStyle;
  goal: Goal;
  playStyle: PlayStyle;
  armSensitivity: ArmSensitivity;
  problem: Problem;
};

/** Sinnvolle Defaults für „Ich weiss es nicht" (jede Frage überspringbar). */
export const defaultProfile: PlayerProfile = {
  schemaVersion: 1,
  level: "intermediate",
  swingStyle: "moderate",
  goal: "allround",
  playStyle: "baseline",
  armSensitivity: "some",
  problem: "none",
};

const zero = (): Ratings => ({ power: 0, control: 0, spin: 0, comfort: 0, stability: 0, maneuverability: 0, forgiveness: 0 });

/**
 * Leitet die Prioritäts-Gewichte (0–1, Summe = 1) deterministisch aus dem Profil
 * ab. Reine Funktion — Grundlage der Erklärbarkeit und der Tests.
 */
export function derivePriorities(p: PlayerProfile): Ratings {
  const w = zero();

  // Hauptziel (stärkstes Gewicht)
  const goalWeight: Record<Goal, Partial<Ratings>> = {
    power: { power: 3, spin: 1 },
    control: { control: 3, stability: 1 },
    spin: { spin: 3, maneuverability: 1 },
    comfort: { comfort: 3, forgiveness: 1 },
    allround: { control: 1.5, comfort: 1, forgiveness: 1, spin: 0.5 },
  };
  for (const [a, v] of Object.entries(goalWeight[p.goal])) w[a as Axis] += v as number;

  // Spielstärke: Anfänger → Verzeihung/Komfort; Wettkampf → Kontrolle/Stabilität
  const levelWeight: Record<Level, Partial<Ratings>> = {
    beginner: { forgiveness: 2, comfort: 1.5, maneuverability: 1 },
    intermediate: { forgiveness: 1, control: 0.5 },
    advanced: { control: 1, stability: 0.5 },
    competitive: { control: 1.5, stability: 1 },
  };
  for (const [a, v] of Object.entries(levelWeight[p.level])) w[a as Axis] += v as number;

  // Schwungstil: kurzer Schwung braucht mehr Power/Verzeihung, voller mehr Kontrolle
  if (p.swingStyle === "compact") { w.power += 1; w.forgiveness += 0.5; }
  if (p.swingStyle === "full") { w.control += 1; w.spin += 0.5; }

  // Spielweise
  const styleWeight: Record<PlayStyle, Partial<Ratings>> = {
    baseline: { spin: 0.5, control: 0.5 },
    allcourt: { maneuverability: 0.5, control: 0.5 },
    servevolley: { maneuverability: 1, stability: 0.5 },
    defensive: { forgiveness: 0.5, comfort: 0.5 },
  };
  for (const [a, v] of Object.entries(styleWeight[p.playStyle])) w[a as Axis] += v as number;

  // Armempfindlichkeit → Komfort stark gewichten
  if (p.armSensitivity === "some") w.comfort += 1;
  if (p.armSensitivity === "high") w.comfort += 2.5;

  // Konkretes Problem → gezielt gegensteuern
  const problemWeight: Record<Problem, Partial<Ratings>> = {
    none: {},
    "flies-long": { control: 2, stability: 0.5 },
    "no-control": { control: 2.5 },
    "arm-pain": { comfort: 3 },
    "too-heavy": { maneuverability: 2.5 },
    "no-spin": { spin: 2.5 },
  };
  for (const [a, v] of Object.entries(problemWeight[p.problem])) w[a as Axis] += v as number;

  // Normalisieren (Summe = 1)
  const total = AXES.reduce((s, a) => s + w[a], 0) || 1;
  const out = zero();
  for (const a of AXES) out[a] = w[a] / total;
  return out;
}
