/**
 * Datenschicht für den geführten Einstieg (/tour Setup-Trichter, Schritt 2 des Umbaus).
 *
 * EIGENE DATEI, nur Anon-Client — nie Service-Client (RLS wirkt). Liest den
 * Einrichtungsstand aus den VORHANDENEN Tabellen (keine neue Spalte, keine Migration):
 *   - profiles      → gender, city, country   (Heimatdaten, von /app befüllt)
 *   - tour_profiles → ranking, passports, season_budget
 *   - tour_cost_rates → Existenz
 *   - tour_season_plan → Anzahl aufgenommener Turniere
 *
 * Schreiben ausschließlich über benannte Spalten und nur, was der Aufrufer als geändert
 * übergibt (kein select *, kein Blind-Upsert der ganzen Zeile).
 */

import { supabase } from "@/lib/supabase";
import { loadTourProfile, saveTourProfile } from "@/lib/tour";
import { loadCostRates } from "@/lib/tourCosts";
import { loadSeasonTournamentIds } from "@/lib/tourSeason";
import { isTargetRegion } from "@/domain/tour/region";
import type { TourCostRates } from "@/lib/types";

// ── Ranking → vorausgewählte Kategorien ──────────────────────────────────────
// ERFAHRUNGSWERTE OHNE QUELLE — grobe Zuordnung Ranking → übliche Turnierstufe, exakt
// im selben Geist wie SUGGESTED_RATES_MINOR in tourCosts.ts: nur eine überschreibbare
// VORAUSWAHL mit Begründung, KEIN sportliches Urteil darüber, was jemand spielen sollte.
// Die Ränder sind bewusst überlappend. Die Kategorie-Strings müssen exakt den Werten in
// web.tour_tournaments.category entsprechen ("M15", "Challenger 75", …).
export const RANKING_BANDS: { maxRank: number; categories: string[] }[] = [
  { maxRank: 199, categories: ["Challenger 100", "Challenger 125", "Challenger 175"] },
  { maxRank: 399, categories: ["Challenger 75", "Challenger 100", "Challenger 125"] },
  { maxRank: 699, categories: ["M25", "Challenger 50", "Challenger 75"] },
  { maxRank: Infinity, categories: ["M15", "M25"] }, // schlechteres/kein Ranking
];

/** Kategorien für ein Ranking (kein Ranking → oberstes Band M15/M25). Reine Funktion. */
export function presetCategories(ranking: number | null): string[] {
  if (ranking == null) return ["M15", "M25"];
  return (RANKING_BANDS.find((b) => ranking <= b.maxRank) ?? RANKING_BANDS[RANKING_BANDS.length - 1]).categories;
}

/**
 * Vorfilter aus dem Profil: Kategorien nach Ranking, Land nach Heimatland — aber NUR,
 * wenn das Heimatland in der Zielregion liegt (sonst kein Länderfilter, kein künstlich
 * leeres Ergebnis). Nationalität schränkt hier NICHT ein (sie ist nur Rückfall fürs
 * Heimatland, siehe loadSetupState).
 */
export function presetFromProfile(
  ranking: number | null,
  homeCountry: string | null,
): { category: string[]; country: string[] } {
  return {
    category: presetCategories(ranking),
    country: homeCountry && isTargetRegion(homeCountry) ? [homeCountry] : [],
  };
}

// ── Einrichtungsstand ────────────────────────────────────────────────────────
export type SetupState = {
  gender: string | null;
  city: string | null;
  country: string | null; // profiles.country = Heimatland
  ranking: number | null;
  passports: string[];
  seasonBudget: number | null;
  rates: TourCostRates | null; // aktuelle Kostensätze (für das Formular in Schritt 2)
  hasRates: boolean;
  entriesCount: number;
  step1Done: boolean;
  step2Done: boolean;
  step3Done: boolean;
  complete: boolean;
};

/** Nur die benötigten Heimatfelder aus profiles (benannte Spalten, kein select *). */
export async function loadProfileBasics(
  userId: string,
): Promise<{ gender: string | null; city: string | null; country: string | null }> {
  const { data, error } = await supabase.from("profiles").select("gender, city, country").eq("id", userId).maybeSingle();
  if (error) throw error;
  return { gender: data?.gender ?? null, city: data?.city ?? null, country: data?.country ?? null };
}

/** Berechnet die Schritt-Flags aus den vorhandenen Tabellen. */
export async function loadSetupState(userId: string): Promise<SetupState> {
  const [basics, profile, rates, planIds] = await Promise.all([
    loadProfileBasics(userId),
    loadTourProfile(userId),
    loadCostRates(),
    loadSeasonTournamentIds(),
  ]);

  const seasonBudget = profile?.season_budget ?? null;
  const hasRates = rates != null;
  const entriesCount = planIds.size;

  const step1Done = !!basics.gender && !!basics.city;
  const step2Done = seasonBudget != null && hasRates;
  const step3Done = entriesCount > 0;

  return {
    gender: basics.gender,
    city: basics.city,
    country: basics.country, // rohes Heimatland (profiles.country); Pass-Rückfall macht der Vorfilter
    ranking: profile?.ranking ?? null,
    passports: profile?.passports ?? [],
    seasonBudget,
    rates,
    hasRates,
    entriesCount,
    step1Done,
    step2Done,
    step3Done,
    complete: step1Done && step2Done && step3Done,
  };
}

/**
 * Speichert Schritt 1. profiles-Felder (gender/city/country) nur, wenn im patch enthalten,
 * und nur über benannte Spalten; tour_profiles-Felder (ranking/passports) via Upsert.
 * Der Aufrufer übergibt ausschließlich GEÄNDERTE Felder.
 */
export async function saveWhoAmI(
  userId: string,
  patch: { gender?: string | null; city?: string | null; country?: string | null; ranking?: number | null; passports?: string[] },
): Promise<void> {
  const profilePatch: Record<string, string | null> = {};
  if ("gender" in patch) profilePatch.gender = patch.gender ?? null;
  if ("city" in patch) profilePatch.city = patch.city ?? null;
  if ("country" in patch) profilePatch.country = patch.country ?? null;
  if (Object.keys(profilePatch).length > 0) {
    const { error } = await supabase.from("profiles").update(profilePatch).eq("id", userId);
    if (error) throw error;
  }

  const tp: { ranking?: number | null; passports?: string[] } = {};
  if ("ranking" in patch) tp.ranking = patch.ranking ?? null;
  if ("passports" in patch) tp.passports = patch.passports ?? [];
  if (Object.keys(tp).length > 0) await saveTourProfile(userId, tp);
}

/** Saisonbudget (Major Units) speichern — eigener Aufruf, damit „nur Geändertes" gilt. */
export async function saveSeasonBudget(userId: string, budget: number | null): Promise<void> {
  await saveTourProfile(userId, { season_budget: budget });
}
