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

// Standardkarte — Etappe 1: Rahmen statt Schatten.
export const CARD = "rounded-xl bg-[var(--t2-surface)] border border-[var(--t2-line)]";
// Größere Fläche (Container): identischer Rahmen, größerer Radius für Papierwirkung.
export const CARD_LG = "rounded-3xl bg-[var(--t2-surface)] border border-[var(--t2-line)]";
// Zurückgenommene Karte („Selteneres"): blasser, dezenter Rahmen.
export const CARD_SOFT = "rounded-xl bg-[var(--t2-surface-muted)] border border-[var(--t2-line)]";

// Hauptaktion: große Pille in Akzentfarbe (Fläche, nicht nur Text).
export const BTN_PRIMARY =
  "inline-flex items-center justify-center rounded-full bg-[var(--t2-accent)] px-6 py-3.5 t2-fs-body font-bold text-[var(--t2-on-accent)] transition-colors hover:bg-[var(--t2-accent)]-hover";

// Kopf der Seiten (Eyebrow / H1 / Untertitel) — für alle /tour-Seiten identisch.
export const EYEBROW = "t2-fs-body font-bold uppercase tracking-[0.18em] text-[var(--t2-accent)]";
export const PAGE_H1 = "mt-3 t2-fs-h1 font-extrabold leading-[1.05] tracking-tight text-[var(--t2-on-accent)] sm:t2-fs-display";
export const PAGE_SUB = "mt-4 max-w-2xl t2-fs-h3 leading-relaxed text-[var(--t2-text-soft)]";
