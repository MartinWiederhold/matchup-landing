/**
 * Zentrale Feature-Flags (aus dem Beratungsplattform-Umsetzungsplan, Phase 1).
 *
 * Regel des Dokuments: unfertige/nicht konfigurierte Features sind standardmässig
 * unsichtbar. Hier bewusst nur die aktuell gebauten Features auf `true`.
 */
export const featureFlags = {
  advisory_enabled: true,        // Schläger-Finder (dieser Increment) — live
  player_setups_enabled: false,  // Pro-Setup-DB — später
  problem_solver_enabled: false, // Problem Solver — später
  lead_capture_enabled: false,   // Lead-Erfassung — später
  accounts_enabled: false,       // Konten — später
  commerce_enabled: false,       // Shop/Warenkorb — später
  ai_explanations_enabled: false, // KI-Erklärungen — später
} as const;

export type FeatureFlag = keyof typeof featureFlags;

export function isEnabled(flag: FeatureFlag): boolean {
  return featureFlags[flag] === true;
}
