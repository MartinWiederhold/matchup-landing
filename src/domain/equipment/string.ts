/**
 * Saiten-Domänenmodell (Beratungsplattform, Phase 6 — MVP-Teilmenge).
 * Getrennt vom Racket-Modell: Saiten haben eigene Achsen (u.a. Haltbarkeit,
 * Spannungshaltung). Keine Preise/Commerce in diesem Increment.
 */
export type StringMaterial = "polyester" | "multifilament" | "natural-gut" | "synthetic-gut";

export type StringAxis =
  | "power"
  | "control"
  | "spin"
  | "comfort"       // armfreundlich / weich
  | "durability"
  | "tensionMaintenance"
  | "feel";

export const STRING_AXES: StringAxis[] = [
  "power", "control", "spin", "comfort", "durability", "tensionMaintenance", "feel",
];

export type StringRatings = Record<StringAxis, number>; // 0–100

export type StringProduct = {
  id: string;
  slug: string;
  brand: string;
  name: string;
  material: StringMaterial;
  ratings: StringRatings;
  /** Empfohlene Basis-Spannung (kg, unbesaitet) als BEREICH — nie Einzelwert. */
  baseTensionKg: { min: number; max: number };
  editorial: { summary: { de: string; en: string } };
  provenance: { confidence: "high" | "medium" | "low"; isDemoData: boolean; sourceNote: string };
};

export function assertString(s: StringProduct): StringProduct {
  for (const a of STRING_AXES) {
    const v = s.ratings[a];
    if (typeof v !== "number" || v < 0 || v > 100) throw new Error(`String ${s.id}: rating '${a}' 0–100 (ist ${v}).`);
  }
  if (s.baseTensionKg.min > s.baseTensionKg.max) throw new Error(`String ${s.id}: Spannungsbereich min > max.`);
  return s;
}
