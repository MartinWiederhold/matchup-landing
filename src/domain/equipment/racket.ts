/**
 * Equipment-Domänenmodell (Beratungsplattform, Phase 3 — MVP-Teilmenge).
 * Bewusst schlank: nur was der deterministische Schläger-Finder braucht.
 * Keine Preise/Commerce in diesem Increment.
 */

/** Bewertungs-Achsen (0–100, editoriell normalisiert). */
export type Axis =
  | "power"
  | "control"
  | "spin"
  | "comfort"
  | "stability"
  | "maneuverability"
  | "forgiveness";

export const AXES: Axis[] = [
  "power", "control", "spin", "comfort", "stability", "maneuverability", "forgiveness",
];

export type Ratings = Record<Axis, number>;

export type Level = "beginner" | "intermediate" | "advanced" | "competitive";

export type Racket = {
  id: string;
  slug: string;
  brand: string;
  model: string;
  year: number;
  specs: {
    headSizeSqIn: number;
    unstrungWeightG: number;
    balanceMm: number;      // 320 = kopflastig, 340 = grifflastig (unstrung)
    stiffnessRa: number;    // RA-Wert (höher = steifer)
    stringPattern: string;  // z.B. "16x19"
    gripSizes: string[];    // z.B. ["L1","L2","L3"]
  };
  /** Editoriell normalisierte Charakteristik (0–100). Schätzung, s. provenance. */
  ratings: Ratings;
  /** Für welche Spielstärken der Rahmen gedacht ist. */
  levels: Level[];
  editorial: {
    summary: { de: string; en: string };
    strengths: string[];   // (noch nicht in der UI gerendert — für spätere Detailseite)
    tradeoffs: string[];
    notIdealFor: string[];
  };
  provenance: {
    /** Wie belastbar die Daten sind → getrennt vom Match-Score angezeigt. */
    confidence: "high" | "medium" | "low";
    isDemoData: boolean;
    sourceNote: string;
  };
};

/** Leichte Laufzeit-Prüfung (statt Zod) — fängt kaputte Seed-Einträge früh ab. */
export function assertRacket(r: Racket): Racket {
  for (const a of AXES) {
    const v = r.ratings[a];
    if (typeof v !== "number" || v < 0 || v > 100) {
      throw new Error(`Racket ${r.id}: rating '${a}' muss 0–100 sein (ist ${v}).`);
    }
  }
  if (!r.slug || !r.brand || !r.model) throw new Error(`Racket ${r.id}: slug/brand/model fehlt.`);
  return r;
}
