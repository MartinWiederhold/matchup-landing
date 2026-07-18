/**
 * Demo-Seed für den Schläger-Finder (Beratungsplattform, Phase 3 — MVP).
 *
 * WICHTIG (Doc-Prinzip „keine erfundenen Fakten"):
 * - `specs` = öffentliche Herstellerangaben (Kopfgrösse, Gewicht, Balance, RA,
 *   Besaitungsbild). Rundungswerte, Generation kann variieren.
 * - `ratings` = REDAKTIONELLE Charakter-Einschätzung (0–100), KEINE gemessenen
 *   Laborwerte → deshalb `provenance.confidence: "medium"` und `isDemoData: true`.
 * Später wird dieses Modul durch echte, quellenbelegte Daten (Repository/Supabase)
 * ersetzt; die UI konsumiert nur `getRackets()`.
 */
import { assertRacket, type Racket } from "@/domain/equipment/racket";

const SEED: Racket[] = [
  {
    id: "clash-100", slug: "wilson-clash-100", brand: "Wilson", model: "Clash 100 v2", year: 2022,
    specs: { headSizeSqIn: 100, unstrungWeightG: 295, balanceMm: 310, stiffnessRa: 55, stringPattern: "16x19", gripSizes: ["L1", "L2", "L3", "L4"] },
    ratings: { power: 58, control: 66, spin: 60, comfort: 88, stability: 60, maneuverability: 66, forgiveness: 74 },
    levels: ["beginner", "intermediate", "advanced"],
    editorial: {
      summary: { de: "Sehr flexibler, armschonender Rahmen mit ordentlicher Kontrolle — angenehm für empfindliche Arme.", en: "Very flexible, arm-friendly frame with solid control — kind to sensitive arms." },
      strengths: ["Sehr komfortabel", "Verzeihend", "Gute Kontrolle für ein weiches Layout"],
      tradeoffs: ["Weniger reine Power", "Für harte Schläger evtl. zu weich"],
      notIdealFor: ["Spieler, die maximale Stabilität gegen schwere Bälle wollen"],
    },
    provenance: { confidence: "medium", isDemoData: true, sourceNote: "Specs: öffentliche Herstellerangaben; Ratings: redaktionelle Einschätzung (Demo)." },
  },
  {
    id: "pure-drive", slug: "babolat-pure-drive", brand: "Babolat", model: "Pure Drive", year: 2021,
    specs: { headSizeSqIn: 100, unstrungWeightG: 300, balanceMm: 320, stiffnessRa: 71, stringPattern: "16x19", gripSizes: ["L1", "L2", "L3", "L4"] },
    ratings: { power: 88, control: 52, spin: 70, comfort: 44, stability: 66, maneuverability: 62, forgiveness: 66 },
    levels: ["intermediate", "advanced"],
    editorial: {
      summary: { de: "Der Power-Klassiker: viel Tempo aus dem Rahmen, spritziges Spielgefühl — aber recht steif.", en: "The power classic: lots of free pace and a lively feel — but fairly stiff." },
      strengths: ["Viel Power", "Belohnt kurze Schwünge", "Alltagstauglich"],
      tradeoffs: ["Steif → weniger Komfort", "Kann bei vollem Schwung zu lang fliegen"],
      notIdealFor: ["Empfindliche Arme", "Spieler, die vor allem Kontrolle suchen"],
    },
    provenance: { confidence: "medium", isDemoData: true, sourceNote: "Specs: öffentliche Herstellerangaben; Ratings: redaktionelle Einschätzung (Demo)." },
  },
  {
    id: "pure-aero", slug: "babolat-pure-aero", brand: "Babolat", model: "Pure Aero", year: 2023,
    specs: { headSizeSqIn: 100, unstrungWeightG: 300, balanceMm: 320, stiffnessRa: 67, stringPattern: "16x19", gripSizes: ["L1", "L2", "L3", "L4"] },
    ratings: { power: 78, control: 56, spin: 90, comfort: 50, stability: 64, maneuverability: 66, forgiveness: 62 },
    levels: ["intermediate", "advanced", "competitive"],
    editorial: {
      summary: { de: "Spin-Maschine mit viel Power — ideal für Topspin-Grundlinienspiel.", en: "A spin machine with plenty of power — made for topspin baseline play." },
      strengths: ["Sehr viel Spin", "Gute Power", "Aggressives Grundlinienspiel"],
      tradeoffs: ["Weniger Komfort", "Braucht saubere Technik für Kontrolle"],
      notIdealFor: ["Anfänger mit kurzem Schwung", "Empfindliche Arme"],
    },
    provenance: { confidence: "medium", isDemoData: true, sourceNote: "Specs: öffentliche Herstellerangaben; Ratings: redaktionelle Einschätzung (Demo)." },
  },
  {
    id: "blade-98", slug: "wilson-blade-98", brand: "Wilson", model: "Blade 98 (16x19) v8", year: 2021,
    specs: { headSizeSqIn: 98, unstrungWeightG: 305, balanceMm: 325, stiffnessRa: 62, stringPattern: "16x19", gripSizes: ["L1", "L2", "L3", "L4"] },
    ratings: { power: 52, control: 84, spin: 66, comfort: 64, stability: 74, maneuverability: 58, forgiveness: 50 },
    levels: ["advanced", "competitive"],
    editorial: {
      summary: { de: "Kontroll- und Gefühls-Rahmen für ambitionierte Spieler mit voller Technik.", en: "A control-and-feel frame for ambitious players with full swings." },
      strengths: ["Sehr gute Kontrolle", "Stabil", "Angenehmes Spielgefühl"],
      tradeoffs: ["Wenig eigene Power", "Fordert saubere Technik"],
      notIdealFor: ["Anfänger", "Spieler mit kurzem Schwung"],
    },
    provenance: { confidence: "medium", isDemoData: true, sourceNote: "Specs: öffentliche Herstellerangaben; Ratings: redaktionelle Einschätzung (Demo)." },
  },
  {
    id: "speed-mp", slug: "head-speed-mp", brand: "Head", model: "Speed MP", year: 2022,
    specs: { headSizeSqIn: 100, unstrungWeightG: 300, balanceMm: 320, stiffnessRa: 62, stringPattern: "16x19", gripSizes: ["L1", "L2", "L3", "L4"] },
    ratings: { power: 64, control: 72, spin: 68, comfort: 62, stability: 68, maneuverability: 70, forgiveness: 62 },
    levels: ["intermediate", "advanced", "competitive"],
    editorial: {
      summary: { de: "Ausgewogener Allround-Rahmen — flott, kontrolliert, vielseitig.", en: "A balanced all-round frame — quick, controlled and versatile." },
      strengths: ["Ausgewogen", "Wendig", "Gute Kontrolle bei ordentlicher Power"],
      tradeoffs: ["Kein Spezialist in einer Disziplin"],
      notIdealFor: ["Wer maximale Power aus dem Rahmen will"],
    },
    provenance: { confidence: "medium", isDemoData: true, sourceNote: "Specs: öffentliche Herstellerangaben; Ratings: redaktionelle Einschätzung (Demo)." },
  },
  {
    id: "ezone-100", slug: "yonex-ezone-100", brand: "Yonex", model: "EZONE 100", year: 2022,
    specs: { headSizeSqIn: 100, unstrungWeightG: 300, balanceMm: 320, stiffnessRa: 65, stringPattern: "16x19", gripSizes: ["L1", "L2", "L3", "L4"] },
    ratings: { power: 76, control: 60, spin: 66, comfort: 70, stability: 66, maneuverability: 64, forgiveness: 70 },
    levels: ["beginner", "intermediate", "advanced"],
    editorial: {
      summary: { de: "Power mit ungewöhnlich viel Komfort — zugänglich und trotzdem druckvoll.", en: "Power with unusually good comfort — accessible yet punchy." },
      strengths: ["Power + Komfort", "Verzeihend", "Angenehmes Gefühl"],
      tradeoffs: ["Weniger reine Kontrolle als ein 98er"],
      notIdealFor: ["Reine Kontrollspieler mit voller Technik"],
    },
    provenance: { confidence: "medium", isDemoData: true, sourceNote: "Specs: öffentliche Herstellerangaben; Ratings: redaktionelle Einschätzung (Demo)." },
  },
  {
    id: "radical-mp", slug: "head-radical-mp", brand: "Head", model: "Radical MP", year: 2023,
    specs: { headSizeSqIn: 98, unstrungWeightG: 300, balanceMm: 320, stiffnessRa: 61, stringPattern: "16x19", gripSizes: ["L1", "L2", "L3", "L4"] },
    ratings: { power: 58, control: 76, spin: 70, comfort: 64, stability: 68, maneuverability: 66, forgiveness: 56 },
    levels: ["intermediate", "advanced", "competitive"],
    editorial: {
      summary: { de: "Kontrollorientierter Allrounder mit gutem Spin-Zugang.", en: "A control-oriented all-rounder with good access to spin." },
      strengths: ["Gute Kontrolle", "Vielseitig", "Solider Spin"],
      tradeoffs: ["Moderate Power", "Etwas weniger verzeihend"],
      notIdealFor: ["Absolute Anfänger"],
    },
    provenance: { confidence: "medium", isDemoData: true, sourceNote: "Specs: öffentliche Herstellerangaben; Ratings: redaktionelle Einschätzung (Demo)." },
  },
  {
    id: "pure-strike-98", slug: "babolat-pure-strike-98", brand: "Babolat", model: "Pure Strike 98 (16x19)", year: 2024,
    specs: { headSizeSqIn: 98, unstrungWeightG: 305, balanceMm: 320, stiffnessRa: 66, stringPattern: "16x19", gripSizes: ["L1", "L2", "L3", "L4"] },
    ratings: { power: 66, control: 80, spin: 68, comfort: 54, stability: 72, maneuverability: 58, forgiveness: 48 },
    levels: ["advanced", "competitive"],
    editorial: {
      summary: { de: "Präziser Kontroll-Power-Rahmen für Turnierspieler — direktes, festes Gefühl.", en: "A precise control-power frame for tournament players — direct, firm feel." },
      strengths: ["Sehr präzise", "Stabil", "Gute Power bei viel Kontrolle"],
      tradeoffs: ["Weniger Komfort", "Fordert Technik"],
      notIdealFor: ["Anfänger", "Empfindliche Arme"],
    },
    provenance: { confidence: "medium", isDemoData: true, sourceNote: "Specs: öffentliche Herstellerangaben; Ratings: redaktionelle Einschätzung (Demo)." },
  },
  {
    id: "vcore-98", slug: "yonex-vcore-98", brand: "Yonex", model: "VCORE 98", year: 2023,
    specs: { headSizeSqIn: 98, unstrungWeightG: 305, balanceMm: 315, stiffnessRa: 64, stringPattern: "16x19", gripSizes: ["L1", "L2", "L3", "L4"] },
    ratings: { power: 60, control: 76, spin: 82, comfort: 58, stability: 70, maneuverability: 62, forgiveness: 50 },
    levels: ["advanced", "competitive"],
    editorial: {
      summary: { de: "Spin und Kontrolle vereint — für aggressive, aber präzise Grundlinienspieler.", en: "Spin and control combined — for aggressive yet precise baseliners." },
      strengths: ["Viel Spin", "Gute Kontrolle", "Stabil"],
      tradeoffs: ["Moderate Power", "Weniger verzeihend"],
      notIdealFor: ["Anfänger"],
    },
    provenance: { confidence: "medium", isDemoData: true, sourceNote: "Specs: öffentliche Herstellerangaben; Ratings: redaktionelle Einschätzung (Demo)." },
  },
  {
    id: "ultra-100", slug: "wilson-ultra-100", brand: "Wilson", model: "Ultra 100 v4", year: 2022,
    specs: { headSizeSqIn: 100, unstrungWeightG: 300, balanceMm: 320, stiffnessRa: 73, stringPattern: "16x19", gripSizes: ["L1", "L2", "L3", "L4"] },
    ratings: { power: 82, control: 56, spin: 64, comfort: 56, stability: 64, maneuverability: 64, forgiveness: 68 },
    levels: ["beginner", "intermediate", "advanced"],
    editorial: {
      summary: { de: "Zugänglicher Power-Rahmen mit gutem Komfort für die steife Bauart.", en: "An accessible power frame with decent comfort for its stiff build." },
      strengths: ["Viel Power", "Verzeihend", "Einfach zu spielen"],
      tradeoffs: ["Weniger Kontrolle", "Recht steif"],
      notIdealFor: ["Kontrollspieler", "Sehr empfindliche Arme"],
    },
    provenance: { confidence: "medium", isDemoData: true, sourceNote: "Specs: öffentliche Herstellerangaben; Ratings: redaktionelle Einschätzung (Demo)." },
  },
  {
    id: "tour-100p", slug: "prince-textreme-tour-100p", brand: "Prince", model: "Textreme Tour 100P", year: 2021,
    specs: { headSizeSqIn: 100, unstrungWeightG: 310, balanceMm: 320, stiffnessRa: 63, stringPattern: "18x20", gripSizes: ["L1", "L2", "L3", "L4"] },
    ratings: { power: 50, control: 86, spin: 54, comfort: 66, stability: 76, maneuverability: 54, forgiveness: 52 },
    levels: ["advanced", "competitive"],
    editorial: {
      summary: { de: "Enges 18x20-Muster für maximale Kontrolle und Präzision — ruhiges, stabiles Gefühl.", en: "A tight 18x20 pattern for maximum control and precision — calm, stable feel." },
      strengths: ["Höchste Kontrolle", "Sehr stabil", "Präzise"],
      tradeoffs: ["Wenig Power", "Weniger Spin durch dichtes Muster"],
      notIdealFor: ["Anfänger", "Spieler mit kurzem Schwung"],
    },
    provenance: { confidence: "medium", isDemoData: true, sourceNote: "Specs: öffentliche Herstellerangaben; Ratings: redaktionelle Einschätzung (Demo)." },
  },
];

let cache: Racket[] | null = null;

/** Repository-Zugang. Später auf Supabase/CMS umstellbar, ohne die UI zu ändern. */
export function getRackets(): Racket[] {
  if (!cache) cache = SEED.map(assertRacket);
  return cache;
}
