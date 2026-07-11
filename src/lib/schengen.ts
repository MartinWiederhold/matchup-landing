/**
 * Schengen-90/180-Projektion aus dem Saisonplan. Zählt die geplanten Schengen-Tage
 * in einem rollierenden 180-Tage-Fenster und meldet die Spitzenauslastung.
 *
 * Wichtig: rein vorausschauend aus den eingeplanten Turnieren — vergangene Reisen
 * (Pass-Stempel) fließen NICHT ein. Also eine Planungshilfe, keine amtliche Zählung.
 * Schweiz, Liechtenstein, Monaco zählen zum Schengen-Raum; UK/USA/AUS nicht.
 */
const MS_DAY = 86_400_000;

export type Trip = { start: string; end: string; country: string | null };

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z]/g, "");
}

// Schengen-Mitglieder (2026) — deutsche + englische Namen, normalisiert.
const SCHENGEN = new Set(
  [
    "frankreich", "france", "deutschland", "germany", "osterreich", "austria",
    "schweiz", "switzerland", "italien", "italy", "spanien", "spain",
    "kroatien", "croatia", "niederlande", "netherlands", "portugal",
    "schweden", "sweden", "belgien", "belgium", "griechenland", "greece",
    "ungarn", "hungary", "polen", "poland", "tschechien", "czechia", "czechrepublic",
    "danemark", "denmark", "finnland", "finland", "norwegen", "norway",
    "island", "iceland", "luxemburg", "luxembourg", "slowenien", "slovenia",
    "slowakei", "slovakia", "estland", "estonia", "lettland", "latvia",
    "litauen", "lithuania", "malta", "liechtenstein", "bulgarien", "bulgaria",
    "rumanien", "romania", "monaco",
  ].map(norm),
);

export function isSchengen(country: string | null | undefined): boolean {
  if (!country) return false;
  return SCHENGEN.has(norm(country));
}

/** Alle Kalendertage (ISO) der Schengen-Aufenthalte im Plan, einmalig & sortiert. */
function schengenDayTimestamps(plan: Trip[]): number[] {
  const days = new Set<number>();
  for (const t of plan) {
    if (!isSchengen(t.country)) continue;
    const s = Date.parse(t.start + "T00:00:00Z");
    const e = Date.parse(t.end + "T00:00:00Z");
    if (Number.isNaN(s) || Number.isNaN(e)) continue;
    for (let d = s; d <= e; d += MS_DAY) days.add(d);
  }
  return [...days].sort((a, b) => a - b);
}

export type SchengenProjection = {
  used: number; // Spitzenauslastung im rollierenden 180-Tage-Fenster
  left: number; // 90 − used (min 0)
  totalPlanned: number; // geplante Schengen-Tage insgesamt
  upcoming: number; // davon ab heute
};

/** Projektion; null wenn gar keine Schengen-Tage geplant sind. */
export function schengenProjection(plan: Trip[], today = new Date()): SchengenProjection | null {
  const days = schengenDayTimestamps(plan);
  if (days.length === 0) return null;
  const t0 = Date.parse(today.toISOString().slice(0, 10) + "T00:00:00Z");

  // Rollierendes 180-Tage-Fenster: für jeden Schengen-Tag als Fensterende die Tage
  // in [ende−179, ende] zählen → Maximum ist die Spitzenauslastung.
  let peak = 0;
  for (const end of days) {
    const start = end - 179 * MS_DAY;
    const count = days.filter((d) => d >= start && d <= end).length;
    if (count > peak) peak = count;
  }
  return {
    used: peak,
    left: Math.max(0, 90 - peak),
    totalPlanned: days.length,
    upcoming: days.filter((d) => d >= t0).length,
  };
}
