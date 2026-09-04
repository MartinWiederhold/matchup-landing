// Draw-Chance je Turnier: grobe Einschätzung Hauptfeld / Quali / eher nicht — aus dem
// Spieler-Ranking und TYPISCHEN Cutoff-Bändern je Kategorie. WICHTIG: bewusst ein
// RICHTWERT, kein garantierter Cutoff. Echte Acceptance-Cutoffs schwanken je Turnier,
// Woche und Meldelage (dafür gibt es keine offene, verlässliche Datenquelle). Die Bänder
// sind erfahrungsbasierte Näherungen an ATP/WTA/ITF-Acceptance-Ränge.

export type DrawChance = "main" | "quali" | "unlikely" | "unknown";

/** main/quali = Ranking, bis zu dem Direkteinstieg bzw. Quali-Einstieg typisch möglich ist. */
export type CutoffBand = { main: number; quali: number };

const CUTOFFS: Record<string, CutoffBand> = {
  // ATP Challenger
  "Challenger 175": { main: 120, quali: 220 },
  "Challenger 125": { main: 160, quali: 260 },
  "Challenger 100": { main: 200, quali: 300 },
  "Challenger 75": { main: 240, quali: 340 },
  "Challenger 50": { main: 280, quali: 400 },
  // ITF Herren
  M25: { main: 450, quali: 800 },
  M15: { main: 700, quali: 1200 },
  // WTA
  "WTA 1000": { main: 60, quali: 120 },
  "WTA 500": { main: 90, quali: 160 },
  "WTA 250": { main: 140, quali: 220 },
  "WTA 125": { main: 180, quali: 280 },
  // ITF Damen
  W100: { main: 250, quali: 450 },
  W75: { main: 300, quali: 550 },
  W50: { main: 400, quali: 700 },
  W35: { main: 500, quali: 850 },
  W25: { main: 550, quali: 950 },
  W15: { main: 700, quali: 1200 },
};

/**
 * Grobe Draw-Chance. `unknown`, wenn Kategorie/Ranking fehlen oder die Kategorie keine
 * hinterlegten Bänder hat (z. B. Junioren J*, Grand Slams) — dann KEINE Aussage.
 */
export function drawChance(
  category: string | null,
  ranking: number | null,
): { status: DrawChance; band: CutoffBand | null } {
  if (!category || ranking == null || ranking <= 0) return { status: "unknown", band: null };
  const band = CUTOFFS[category];
  if (!band) return { status: "unknown", band: null };
  if (ranking <= band.main) return { status: "main", band };
  if (ranking <= band.quali) return { status: "quali", band };
  return { status: "unlikely", band };
}
