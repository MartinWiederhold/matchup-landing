/**
 * Datenlayer für den Saisonplaner (/tour, Schritt 1 + 2).
 *
 * Ausschließlich der Anon-Client (RLS wirkt) — nie der Service-Client. Reine
 * Lade-/Filterhilfen; die Reihenfolge/Bedienung steckt in den Planer-Komponenten.
 * Zielregion kommt aus der Domain-Schicht (src/domain/tour/region.ts), unverändert.
 */
import { supabase } from "@/lib/supabase";
import { fetchAllPaged } from "@/lib/supabasePaginate";
import { isTargetRegion } from "@/domain/tour/region";
import type { TourTournament, TourCostRates } from "@/lib/types";
import type { SeasonEntry } from "@/lib/tourSeason";
import type { SeasonCandidate, SeasonPick } from "@/domain/tour/optimizeSeason";
import type { CostParams, Money } from "@/domain/tour/costs";

// ── Schritt 1: Profil (Wohnort-Koordinaten + Anzeige) ───────────────────────
export type PlannerProfile = {
  firstName: string | null;
  city: string | null;
  country: string | null;    // Heimatland (profiles.country)
  lat: number | null;        // Wohnort-Koordinaten (profiles, aus Onboarding-Geocoding)
  lng: number | null;
  age: number | null;        // profiles.age (rohes Geburtsdatum wird NICHT gespeichert)
  ranking: number | null;    // tour_profiles.ranking
  passports: string[];       // tour_profiles.passports
  seasonBudget: number | null; // tour_profiles.season_budget
};

/** Lädt die für den Planer nötigen Profilfelder — benannte Spalten, kein select *. */
export async function loadPlannerProfile(userId: string): Promise<PlannerProfile> {
  // Eigene Koordinaten liegen in web.profiles_private (Sicherheitsaudit 2026-08),
  // nicht mehr in profiles. Eigene Zeile → RLS erlaubt das Lesen.
  const [{ data: p }, { data: tp }, { data: pp }] = await Promise.all([
    supabase.from("profiles").select("first_name, city, country, age").eq("id", userId).maybeSingle(),
    supabase.from("tour_profiles").select("ranking, passports, season_budget").eq("user_id", userId).maybeSingle(),
    supabase.from("profiles_private").select("latitude, longitude").eq("user_id", userId).maybeSingle(),
  ]);
  return {
    firstName: p?.first_name ?? null,
    city: p?.city ?? null,
    country: p?.country ?? null,
    lat: pp?.latitude ?? null,
    lng: pp?.longitude ?? null,
    age: p?.age ?? null,
    ranking: tp?.ranking ?? null,
    passports: tp?.passports ?? [],
    seasonBudget: tp?.season_budget ?? null,
  };
}

/** Alter speichern (profiles.age, benannte Spalte). Rohes Geburtsdatum bleibt bewusst
 *  ungespeichert — eine birthdate-Spalte kommt erst, wenn die Eignungslogik sie braucht. */
export async function savePlannerAge(userId: string, age: number | null): Promise<void> {
  const { error } = await supabase.from("profiles").update({ age }).eq("id", userId);
  if (error) throw error;
}

// ── Schritt 2: Turniere im Rahmen ───────────────────────────────────────────
// Nur die für Karte + Zählung nötigen Spalten (kein select *). Aktive Turniere.
const TOURNAMENT_COLUMNS =
  "id, tournament_monday, series, category, name, city, country, latitude, longitude, surface, valid_to, created_at";

/** Alle aktiven Turniere (valid_to null) — einmal laden, dann client-seitig filtern.
 *  PAGINIERT über die gemeinsame Hilfe (sonst stille 1000-Zeilen-Kappung, ~1489 aktiv).
 *  `.order("id")` sorgt für eine deterministische, totale Seitensortierung. */
export async function loadActiveTournaments(): Promise<TourTournament[]> {
  return fetchAllPaged<TourTournament>((from, to) =>
    supabase
      .from("tour_tournaments")
      .select(TOURNAMENT_COLUMNS)
      .is("valid_to", null)
      .order("id", { ascending: true })
      .range(from, to),
  );
}

export type RegionMode = "ch" | "europe" | "all";
// countries (ISO-3166-1 alpha-2): explizite Länder-Mehrfachauswahl. Ist sie gesetzt
// (nicht leer), GEWINNT sie über region — sonst greift region (Schnellwahl Europa/alle).
export type Frame = { region: RegionMode; from: string; to: string; countries?: string[] };

/** Liegt ein Turnierland im gewählten Regionsmodus? „europe" nutzt die Domain-Zielregion. */
function inRegion(country: string | null | undefined, mode: RegionMode): boolean {
  if (mode === "all") return true;
  if (mode === "ch") return country === "CH";
  return isTargetRegion(country); // europe = kanonische Zielregion (region.ts)
}

/** Länderfilter des Rahmens: explizite Ländermenge (falls gesetzt) sonst die Region. */
export function matchesFrameRegion(country: string | null | undefined, frame: Frame): boolean {
  if (frame.countries && frame.countries.length > 0) return !!country && frame.countries.includes(country);
  return inRegion(country, frame.region);
}

export type FrameResult = {
  inFrame: number;                 // Turniere im Rahmen (Region ∩ Zeitraum)
  mapEntries: SeasonEntry[];       // davon MIT Koordinaten → als Punkte auf der Karte
  noCoords: number;                // davon OHNE Koordinaten → NICHT auf der Karte (MU-029)
};

/**
 * Filtert die aktiven Turniere auf den Rahmen (Region ∩ Zeitraum) und trennt dabei
 * die mit Koordinaten (Karte) von denen ohne (MU-029 — dürfen nicht still verschwinden).
 * Reine Funktion über bereits geladene Daten (kein Netz).
 */
export function filterFrame(tours: TourTournament[], frame: Frame): FrameResult {
  const mapEntries: SeasonEntry[] = [];
  let inFrame = 0;
  let noCoords = 0;
  for (const t of tours) {
    if (!matchesFrameRegion(t.country, frame)) continue;
    if (frame.from && t.tournament_monday < frame.from) continue;
    if (frame.to && t.tournament_monday > frame.to) continue;
    inFrame++;
    if (t.latitude != null && t.longitude != null) {
      mapEntries.push({ planId: t.id, status: "planned", note: null, addedAt: t.created_at, tournament: t, tournamentInactive: false });
    } else {
      noCoords++;
    }
  }
  return { inFrame, mapEntries, noCoords };
}

// ── Schritt 3: Anbindung des Saison-Optimierers (Domain) ────────────────────

/**
 * Ortsschlüssel „country|city" — DIESELBE Bildung für Kandidaten UND Wohnort, damit
 * der Optimierer Cluster/Heimatnähe über reine String-Gleichheit erkennt. Ohne Stadt
 * gibt es keinen Schlüssel → null (der Optimierer führt das Turnier als „unbewertbar").
 */
export function placeKey(country: string | null, city: string | null): string | null {
  if (!city) return null;
  return `${country ?? ""}|${city}`;
}

/** Sind ALLE Pflicht-Kostensätze gesetzt? Nur dann darf gerechnet werden (kein Vorschlagswert). */
export function costRatesComplete(rates: TourCostRates | null): boolean {
  return (
    rates != null &&
    rates.currency != null &&
    rates.arrival_minor != null &&
    rates.per_night_minor != null &&
    rates.food_per_day_minor != null
  );
}

/** Kostensätze (Minor-Einheiten) → CostParams des Domain-Moduls. Setzt Vollständigkeit voraus. */
export function ratesToCostParams(rates: TourCostRates): CostParams {
  const cur = rates.currency ?? "EUR";
  const money = (minor: number | null): Money | null => (minor != null ? { amount: minor, currency: cur } : null);
  return {
    arrival: money(rates.arrival_minor),
    perNight: money(rates.per_night_minor),
    foodPerDay: money(rates.food_per_day_minor),
    coachPerWeek: money(rates.coach_per_week_minor), // optional
  };
}

/**
 * Saisonbudget (in tour_profiles als GANZE Einheiten gespeichert) → Money in Minor-
 * Einheiten der Kostensatz-Währung. Der Optimierer rechnet durchgängig in Minor.
 */
export function budgetMoney(seasonBudget: number | null, currency: string): Money | null {
  if (seasonBudget == null) return null;
  return { amount: Math.round(seasonBudget * 100), currency };
}

/**
 * Aktive Turniere im Rahmen (Region ∩ Zeitraum) → Kandidaten für den Optimierer.
 * `blockedWeeks` (bereits verplante Turnierwochen) und `existingIds` (schon in der
 * Saison) werden ausgelassen — so schlägt der Optimierer NUR freie Wochen vor und
 * kollidiert nie mit dem, was der Nutzer bereits geplant hat (Ergänzen, nicht ersetzen).
 */
export function buildSeasonCandidates(
  tours: TourTournament[],
  frame: Frame,
  blockedWeeks: Set<string>,
  existingIds: Set<string>,
): SeasonCandidate[] {
  const out: SeasonCandidate[] = [];
  for (const t of tours) {
    if (!matchesFrameRegion(t.country, frame)) continue;
    if (frame.from && t.tournament_monday < frame.from) continue;
    if (frame.to && t.tournament_monday > frame.to) continue;
    if (blockedWeeks.has(t.tournament_monday)) continue; // Woche schon belegt
    if (existingIds.has(t.id)) continue;                 // schon in der Saison
    out.push({
      id: t.id,
      tournamentMonday: new Date(t.tournament_monday), // ISO → UTC-Mitternacht (deterministisch)
      series: t.series,
      category: t.category,
      place: placeKey(t.country, t.city),
      country: t.country,
      hasMapCoords: t.latitude != null && t.longitude != null,
    });
  }
  return out;
}

/**
 * Turniere im Rahmen (Region ∩ Zeitraum), OHNE die Wochen-/Bestand-Sperre von
 * buildSeasonCandidates. Für die Leermeldung: unterscheidet „gar kein Turnier im
 * Rahmen" von „Turniere da, aber alle Wochen belegt".
 */
export function tournamentsInFrame(tours: TourTournament[], frame: Frame): TourTournament[] {
  return tours.filter(
    (t) =>
      matchesFrameRegion(t.country, frame) &&
      !(frame.from && t.tournament_monday < frame.from) &&
      !(frame.to && t.tournament_monday > frame.to),
  );
}

/**
 * Vorgeschlagene Picks → Kartenpunkte (in Reise-Reihenfolge). Nur Picks MIT
 * Koordinaten kommen auf die Karte; die ohne werden in der Liste getrennt geführt.
 */
export function picksToMapEntries(picks: SeasonPick[], tours: TourTournament[]): SeasonEntry[] {
  const byId = new Map(tours.map((t) => [t.id, t]));
  const entries: SeasonEntry[] = [];
  for (const p of picks) {
    const t = byId.get(p.id);
    if (!t || t.latitude == null || t.longitude == null) continue;
    entries.push({ planId: t.id, status: "planned", note: null, addedAt: t.created_at, tournament: t, tournamentInactive: false });
  }
  return entries;
}
