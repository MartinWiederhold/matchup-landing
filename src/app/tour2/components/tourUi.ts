/**
 * Gemeinsame Gestaltungs-Klassen der /tour-Arbeitsfläche — an EINER Stelle statt
 * inline in jeder Komponente. Übernommen aus den Marketing-Komponenten (Memberships,
 * CompleteCard, Hero): dieselbe Formensprache (Radien, Ring, Schatten, Akzentpille),
 * nur dichter. Keine neuen Farben/Muster — nur vorhandene Tokens.
 *
 * Reines String-Modul (kein React) → sowohl in Server- als auch Client-Komponenten
 * importierbar.
 */

// Seiten-Wrapper: Fläche wie im Marketing (max-w-1280, Ränder bis 48 px), aber
// engerer vertikaler Rhythmus (py-8/12 statt der py-24-Bänder).
export const TOUR_MAIN = "mx-auto max-w-[1280px] px-4 py-8 sm:px-6 sm:py-12 lg:px-12";

// Standardkarte: wie die Produkt-/Compete-Kacheln (Ring + weicher Schatten).
export const CARD = "rounded-2xl bg-white shadow-sm ring-1 ring-black/5";
// Größere Fläche (Container): weicherer, größerer Radius.
export const CARD_LG = "rounded-3xl bg-white shadow-sm ring-1 ring-black/5";
// Zurückgenommene Karte ("Selteneres"): blasser, ohne Schatten.
export const CARD_SOFT = "rounded-2xl bg-black/[0.02] ring-1 ring-black/5";

// Hauptaktion: große Pille in Akzentfarbe (Fläche, nicht nur Text).
export const BTN_PRIMARY =
  "inline-flex items-center justify-center rounded-full bg-matchup px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-matchup-hover";

// Kopf der Seiten (Eyebrow / H1 / Untertitel) — für alle /tour-Seiten identisch.
export const EYEBROW = "text-sm font-bold uppercase tracking-[0.18em] text-matchup";
export const PAGE_H1 = "mt-3 text-[32px] font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl";
export const PAGE_SUB = "mt-4 max-w-2xl text-lg leading-relaxed text-neutral-400";
