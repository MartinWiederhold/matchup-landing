/**
 * Datenlayer für den Saisonplaner (/tour, Schritt 1 + 2).
 *
 * Ausschließlich der Anon-Client (RLS wirkt) — nie der Service-Client. Reine
 * Lade-/Filterhilfen; die Reihenfolge/Bedienung steckt in den Planer-Komponenten.
 * Zielregion kommt aus der Domain-Schicht (src/domain/tour/region.ts), unverändert.
 */
import { supabase } from "@/lib/supabase";
import { isTargetRegion } from "@/domain/tour/region";
import type { TourTournament } from "@/lib/types";
import type { SeasonEntry } from "@/lib/tourSeason";

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
  const [{ data: p }, { data: tp }] = await Promise.all([
    supabase.from("profiles").select("first_name, city, country, latitude, longitude, age").eq("id", userId).maybeSingle(),
    supabase.from("tour_profiles").select("ranking, passports, season_budget").eq("user_id", userId).maybeSingle(),
  ]);
  return {
    firstName: p?.first_name ?? null,
    city: p?.city ?? null,
    country: p?.country ?? null,
    lat: p?.latitude ?? null,
    lng: p?.longitude ?? null,
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
 *  PAGINIERT: der Supabase-Client kappt sonst STILL bei 1000 Zeilen (~1489 aktiv →
 *  die Rahmen-Zahl wäre falsch). Seitenweise über id, bis eine Teilseite kleiner ist. */
export async function loadActiveTournaments(): Promise<TourTournament[]> {
  const pageSize = 1000;
  const all: TourTournament[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("tour_tournaments")
      .select(TOURNAMENT_COLUMNS)
      .is("valid_to", null)
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const batch = (data as TourTournament[] | null) ?? [];
    all.push(...batch);
    if (batch.length < pageSize) break; // letzte Seite erreicht
  }
  return all;
}

export type RegionMode = "ch" | "europe" | "all";
export type Frame = { region: RegionMode; from: string; to: string }; // from/to: ISO yyyy-mm-dd oder ""

/** Liegt ein Turnierland im gewählten Regionsmodus? „europe" nutzt die Domain-Zielregion. */
function inRegion(country: string | null | undefined, mode: RegionMode): boolean {
  if (mode === "all") return true;
  if (mode === "ch") return country === "CH";
  return isTargetRegion(country); // europe = kanonische Zielregion (region.ts)
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
    if (!inRegion(t.country, frame.region)) continue;
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
