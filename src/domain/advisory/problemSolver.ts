/**
 * Problem-Solver (Beratungsplattform, Phase 8) — deterministische Zuordnung.
 *
 * Doc-Prinzip: Der Nutzer startet mit einem Problem und bekommt zuerst
 * RISIKOARME Massnahmen (Spannung, Saite, Technik) — ein Neukauf steht bewusst
 * am Ende der Leiter, nicht am Anfang. Keine medizinische Aussage; bei
 * Beschwerden ist der Hinweis auf fachlichen Rat Pflicht (siehe `medical`).
 *
 * Inhalt ist hier zweisprachig hinterlegt (wie beim Racket-Seed) und wandert
 * später in ein CMS. Reine Daten + reine Funktion → testbar.
 */
import type { Problem } from "@/domain/advisory/playerProfile";

type L = { de: string; en: string };
export type ProblemAdvice = {
  problem: Exclude<Problem, "none">;
  firstTry: L[];      // risikoarm, günstig — zuerst probieren
  thenConsider: L[];  // erst danach: Ausrüstung anpassen
  medical?: boolean;  // true → Gesundheitshinweis (keine Diagnose) einblenden
};

const ADVICE: Record<Exclude<Problem, "none">, ProblemAdvice> = {
  "flies-long": {
    problem: "flies-long",
    firstTry: [
      { de: "Bespannung 1–2 kg höher ziehen — mehr Kontrolle, weniger Katapult.", en: "String 1–2 kg tighter — more control, less trampoline." },
      { de: "Eine kontrollorientierte Polyestersaite testen.", en: "Try a control-oriented polyester string." },
      { de: "Schwung & Treffpunkt prüfen: früher/kürzer ausschwingen.", en: "Check swing & contact point: finish earlier/shorter." },
    ],
    thenConsider: [
      { de: "Kontroll-Rahmen (98 in², engeres Muster wie 18x20).", en: "A control frame (98 in², tighter pattern like 18x20)." },
    ],
  },
  "no-control": {
    problem: "no-control",
    firstTry: [
      { de: "Spannung erhöhen und eine kontrollstarke Saite wählen.", en: "Raise tension and pick a control-strong string." },
      { de: "Etwas kürzere, kompaktere Schläge spielen.", en: "Play slightly shorter, more compact strokes." },
    ],
    thenConsider: [
      { de: "Kontroll-/Präzisions-Rahmen mit stabilem Kopf.", en: "A control/precision frame with a stable head." },
    ],
  },
  "no-spin": {
    problem: "no-spin",
    firstTry: [
      { de: "Eine spinstarke (kantige) Polyestersaite testen.", en: "Try a spin-friendly (shaped) polyester string." },
      { de: "Spannung leicht senken — mehr Snapback = mehr Spin.", en: "Lower tension slightly — more snapback = more spin." },
      { de: "Technik: steilerer Aufwärtsschwung, Bürsten am Ball.", en: "Technique: steeper upward swing, brush up the ball." },
    ],
    thenConsider: [
      { de: "Spin-orientierter Rahmen mit offenem Muster (16x19).", en: "A spin-oriented frame with an open pattern (16x19)." },
    ],
  },
  "arm-pain": {
    problem: "arm-pain",
    medical: true,
    firstTry: [
      { de: "Auf eine weiche Multifilament- oder Naturdarmsaite wechseln.", en: "Switch to a soft multifilament or natural-gut string." },
      { de: "Spannung reduzieren — weicheres, gelenkschonenderes Spielgefühl.", en: "Reduce tension — softer, more joint-friendly feel." },
      { de: "Griffgröße & Aufwärmen prüfen; ein dämpfender Griff kann helfen.", en: "Check grip size & warm-up; a cushioned grip can help." },
    ],
    thenConsider: [
      { de: "Flexibler, komfortbetonter Rahmen (niedriger RA-Wert).", en: "A flexible, comfort-focused frame (low RA value)." },
    ],
  },
  "too-heavy": {
    problem: "too-heavy",
    firstTry: [
      { de: "Griffgröße prüfen — ein zu grosser Griff wirkt träge.", en: "Check grip size — an oversized grip feels sluggish." },
      { de: "Leichtere Saite / dünnere Stärke reduziert das Gesamtgewicht minimal.", en: "A lighter string / thinner gauge trims a little overall weight." },
    ],
    thenConsider: [
      { de: "Leichterer, handlicherer Rahmen (niedrigeres Gewicht/Swingweight).", en: "A lighter, more maneuverable frame (lower weight/swingweight)." },
    ],
  },
};

/** Reine Funktion: liefert die Ratschläge zu einem Problem (oder null bei „none"). */
export function getProblemAdvice(problem: Problem): ProblemAdvice | null {
  if (problem === "none") return null;
  return ADVICE[problem];
}
