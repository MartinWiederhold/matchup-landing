/**
 * Optimierer-Angaben des Spielers (Nächte, Puffer, Caps, Sperre).
 * Gleiche Keys wie der Planer — Profil ist die Quelle, das Sheet liest mit.
 * Kein neues Schema: localStorage wie mu_tour_nights / mu_tour_buffer_days.
 */

export const OPT_NIGHTS_KEY = "mu_tour_nights";
export const OPT_BUFFER_KEY = "mu_tour_buffer_days";
export const OPT_MAX_PICKS_KEY = "mu_tour_max_picks";
export const OPT_MAX_STREAK_KEY = "mu_tour_max_streak";
export const OPT_BLOCKED_FROM_KEY = "mu_tour_blocked_from";
export const OPT_BLOCKED_TO_KEY = "mu_tour_blocked_to";
export const SETUP_SKIP_KEY = "mu_tour_setup_skipped";

export type TourOptPrefs = {
  nights: string;
  buffer: string;
  maxPicks: string;
  maxStreak: string;
  blockedFrom: string;
  blockedTo: string;
};

function lsGet(key: string): string {
  try { return localStorage.getItem(key) ?? ""; } catch { return ""; }
}
function lsSet(key: string, v: string): void {
  try {
    if (v.trim() === "") localStorage.removeItem(key);
    else localStorage.setItem(key, v.trim());
  } catch { /* egal */ }
}

/** Leeres / ungültiges Feld = kein Cap. */
export function parseCap(raw: string): number | null {
  const n = Number(raw.trim().replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}

/** Ein inklusiver Zeitraum, sonst leer — ungültige Reihenfolge fällt raus. */
export function blockedRangesFrom(from: string, to: string): { from: string; to: string }[] {
  const a = from.trim();
  const b = to.trim();
  if (!a || !b || a > b) return [];
  return [{ from: a, to: b }];
}

export function loadTourOptPrefs(): TourOptPrefs {
  return {
    nights: lsGet(OPT_NIGHTS_KEY),
    buffer: lsGet(OPT_BUFFER_KEY),
    maxPicks: lsGet(OPT_MAX_PICKS_KEY),
    maxStreak: lsGet(OPT_MAX_STREAK_KEY),
    blockedFrom: lsGet(OPT_BLOCKED_FROM_KEY),
    blockedTo: lsGet(OPT_BLOCKED_TO_KEY),
  };
}

export function saveTourOptPrefs(patch: Partial<TourOptPrefs>): void {
  if (patch.nights != null) lsSet(OPT_NIGHTS_KEY, patch.nights);
  if (patch.buffer != null) lsSet(OPT_BUFFER_KEY, patch.buffer);
  if (patch.maxPicks != null) lsSet(OPT_MAX_PICKS_KEY, patch.maxPicks);
  if (patch.maxStreak != null) lsSet(OPT_MAX_STREAK_KEY, patch.maxStreak);
  if (patch.blockedFrom != null) lsSet(OPT_BLOCKED_FROM_KEY, patch.blockedFrom);
  if (patch.blockedTo != null) lsSet(OPT_BLOCKED_TO_KEY, patch.blockedTo);
}
