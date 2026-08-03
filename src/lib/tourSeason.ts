/**
 * Datenschicht für den Saisonplan der Route /tour (web.tour_season_plan).
 *
 * BEWUSST EIGENE DATEI (nicht in src/lib/tour.ts): /app-Compete und /tour bleiben
 * entkoppelt. Ausschließlich der Anon-Client (RLS wirkt, wird NICHT umgangen) —
 * nie der Service-Client. Explizite Spaltenlisten, kein select *.
 *
 * Zeilen-Scoping übernimmt die RLS-Policy tour_season_plan_own (auth.uid() =
 * user_id) für Lesen UND Schreiben; die Funktionen filtern nicht zusätzlich nach
 * user_id (außer beim Insert, wo WITH CHECK den Wert verlangt).
 */

import { supabase } from "@/lib/supabase";
import type { TourSeasonPlanEntry, TourTournament } from "@/lib/types";

// Explizite Spaltenlisten (kein select *).
const PLAN_COLUMNS = "id, user_id, tournament_id, status, note, created_at, updated_at";
const TOURNAMENT_COLUMNS =
  "id, source_ref, tournament_monday, series, category, category_recognized, name, city, country, latitude, longitude, surface, indoor, prize_money, prize_currency, website, status, valid_from, valid_to, created_at, updated_at";

export type SeasonStatus = TourSeasonPlanEntry["status"]; // planned|entered|confirmed|cancelled

/** Ein Saisoneintrag: Planzeile + verbundenes Turnier + Soft-Delete-Kennzeichen. */
export type SeasonEntry = {
  planId: string;
  status: SeasonStatus;
  note: string | null;
  addedAt: string; // created_at der Planzeile
  tournament: TourTournament;
  tournamentInactive: boolean; // valid_to gesetzt → Turnier soft-gelöscht
};

/**
 * Alle Saisoneinträge des Nutzers, mit den Turnierdaten verbunden.
 *
 * ZWEI ABFRAGEN statt Embed: hält die expliziten Spaltenlisten sauber und gibt
 * volle Kontrolle über das Soft-Delete-Kennzeichen. Soft-gelöschte Turniere
 * (valid_to gesetzt) werden NICHT herausgefiltert — die Planzeile bleibt erhalten
 * und wird über `tournamentInactive` markiert, damit die UI sie erklären kann.
 *
 * Sortierung deterministisch: tournament_monday → created_at der Planzeile → planId.
 */
export async function loadSeason(): Promise<SeasonEntry[]> {
  const { data: plan, error } = await supabase.from("tour_season_plan").select(PLAN_COLUMNS);
  if (error) throw error;
  const rows = (plan as TourSeasonPlanEntry[]) ?? [];
  if (rows.length === 0) return [];

  const ids = [...new Set(rows.map((r) => r.tournament_id))];
  // Bewusst OHNE valid_to-Filter: auch soft-gelöschte Turniere laden, um sie zu markieren.
  const { data: tours, error: e2 } = await supabase.from("tour_tournaments").select(TOURNAMENT_COLUMNS).in("id", ids);
  if (e2) throw e2;
  const byId = new Map((tours as TourTournament[] ?? []).map((t) => [t.id, t]));

  const entries: SeasonEntry[] = [];
  for (const r of rows) {
    const t = byId.get(r.tournament_id);
    if (!t) continue; // Turnier nicht auffindbar (via FK unwahrscheinlich) → still überspringen
    entries.push({
      planId: r.id,
      status: r.status,
      note: r.note,
      addedAt: r.created_at,
      tournament: t,
      tournamentInactive: t.valid_to != null,
    });
  }

  entries.sort(
    (a, b) =>
      a.tournament.tournament_monday.localeCompare(b.tournament.tournament_monday) ||
      a.addedAt.localeCompare(b.addedAt) ||
      a.planId.localeCompare(b.planId),
  );
  return entries;
}

/** IDs der aktuell aufgenommenen Turniere — für den Aufnehmen-Knopf in der Liste. */
export async function loadSeasonTournamentIds(): Promise<Set<string>> {
  const { data, error } = await supabase.from("tour_season_plan").select("tournament_id");
  if (error) throw error;
  return new Set(((data as { tournament_id: string }[]) ?? []).map((r) => r.tournament_id));
}

/**
 * Turnier in die Saison aufnehmen. Idempotent: ein bereits vorhandenes Turnier
 * (UNIQUE-Verstoß 23505) ist KEIN Fehler. JEDER andere Fehler — insbesondere ein
 * RLS-Verstoß (42501) — wird geworfen und darf NICHT als „schon vorhanden"
 * durchrutschen; der Nutzer muss ihn sehen.
 */
export async function addToSeason(userId: string, tournamentId: string): Promise<void> {
  const { error } = await supabase.from("tour_season_plan").insert({ user_id: userId, tournament_id: tournamentId });
  if (error && error.code !== "23505") throw error;
}

/** Turnier aus der Saison entfernen (RLS beschränkt auf eigene Zeilen). */
export async function removeFromSeason(tournamentId: string): Promise<void> {
  const { error } = await supabase.from("tour_season_plan").delete().eq("tournament_id", tournamentId);
  if (error) throw error;
}

/** Status eines Eintrags ändern. */
export async function setSeasonStatus(planId: string, status: SeasonStatus): Promise<void> {
  const { error } = await supabase.from("tour_season_plan").update({ status }).eq("id", planId);
  if (error) throw error;
}

/** Notiz setzen (leerer String → null, damit „keine Notiz" sauber bleibt). */
export async function setSeasonNote(planId: string, note: string): Promise<void> {
  const clean = note.trim();
  const { error } = await supabase.from("tour_season_plan").update({ note: clean === "" ? null : clean }).eq("id", planId);
  if (error) throw error;
}
