/**
 * Datenschicht für die Fact-Sheet-Notizen des Spielers je Turnier (web.tour_tournament_note).
 * Nur Anon-Client, RLS wirkt (owner-only), wird nie umgangen. Explizite Spaltenliste.
 *
 * Es sind EIGENE Notizen (Selbstauskunft aus dem offiziellen Fact Sheet), KEINE Bestands-
 * daten — die UI kennzeichnet das. Eine Zeile je (Nutzer, Turnier), Upsert.
 *
 * fee_amount ist numeric in HAUPTWÄHRUNG (wie tour_expenses/tour_prize). PostgREST liefert
 * numeric konto-abhängig als String ODER Zahl → der Aufrufer coerct vor der Anzeige.
 */
import { supabase } from "@/lib/supabase";

export type TournamentNote = {
  fee_amount: string | number | null;
  fee_currency: string | null;
  training_courts: string | null;
  conditions: string | null;
  official_hotel: string | null;
};

const NOTE_COLUMNS = "fee_amount, fee_currency, training_courts, conditions, official_hotel";

/** Notiz zu einem Turnier laden (eigene Zeile, RLS). Null, wenn noch nichts erfasst. */
export async function loadTournamentNote(userId: string, tournamentId: string): Promise<TournamentNote | null> {
  const { data, error } = await supabase
    .from("tour_tournament_note")
    .select(NOTE_COLUMNS)
    .eq("user_id", userId)
    .eq("tournament_id", tournamentId)
    .maybeSingle();
  if (error) throw error;
  return (data as TournamentNote) ?? null;
}

export type TournamentNotePatch = {
  fee_amount: number | null;
  fee_currency: string | null;
  training_courts: string | null;
  conditions: string | null;
  official_hotel: string | null;
};

/** Notiz je (Nutzer, Turnier) anlegen/aktualisieren (Upsert auf dem UNIQUE-Paar). */
export async function saveTournamentNote(userId: string, tournamentId: string, patch: TournamentNotePatch): Promise<void> {
  const { error } = await supabase
    .from("tour_tournament_note")
    .upsert({ user_id: userId, tournament_id: tournamentId, ...patch }, { onConflict: "user_id,tournament_id" });
  if (error) throw error;
}
