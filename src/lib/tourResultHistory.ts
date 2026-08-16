/**
 * Datenschicht für die Punktehistorie / Rangprognose (web.tour_result_history).
 *
 * Die vom Spieler EINMAL erfassten zählenden Ergebnisse (Turnier, Kategorie, Runde, Datum).
 * Nur Anon-Client, RLS wirkt (owner-only), wird nie umgangen. Explizite Spaltenliste, kein
 * select *. Kategorie/Runde sind bereits points.ts-CODES (die UI bietet Auswahllisten) —
 * so gehen sie direkt in scorePoints/pointsForecast.
 *
 * tournament_monday = Montag der Turnierwoche (Anker für Jahrgang + 52-Wochen-Verfall). Der
 * Spieler gibt ein beliebiges Datum der Turnierwoche an; wir SNAPPEN es beim Speichern auf den
 * Montag, damit der Verfall präzise ist (points.ts flaggt sonst „eingabe_kein_montag").
 */
import { supabase } from "@/lib/supabase";
import type { MatchResult } from "@/domain/tour/points";

export type ResultHistoryRow = {
  id: string;
  tournament_name: string;
  category: string; // points.ts-Code (m15, m25, challenger_125 …)
  round: string; // points.ts-Code (W, F, SF, QF, R16, R32, Q, Q2)
  tournament_monday: string; // ISO-Datum (Montag der Turnierwoche)
};

const COLUMNS = "id, tournament_name, category, round, tournament_monday";

/** Beliebiges Datum → Montag DERSELBEN ISO-Woche (UTC, deterministisch). */
export function mondayOf(iso: string): string {
  const ms = Date.parse(iso + "T00:00:00Z");
  if (Number.isNaN(ms)) return iso;
  const dow = new Date(ms).getUTCDay(); // 0=So … 6=Sa
  const diff = dow === 0 ? -6 : 1 - dow; // zurück auf Montag
  return new Date(ms + diff * 86_400_000).toISOString().slice(0, 10);
}

/** Alle erfassten Ergebnisse des Nutzers (RLS scoped), jüngste Turnierwoche zuerst. */
export async function loadResultHistory(userId: string): Promise<ResultHistoryRow[]> {
  const { data, error } = await supabase
    .from("tour_result_history")
    .select(COLUMNS)
    .eq("user_id", userId)
    .order("tournament_monday", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as ResultHistoryRow[]) ?? [];
}

/** Zeilen → MatchResult[] für scorePoints/pointsForecast (Anzeigereihenfolge bleibt). */
export function toMatchResults(rows: ResultHistoryRow[]): MatchResult[] {
  return rows.map((r) => ({ category: r.category, round: r.round, tournamentMonday: r.tournament_monday }));
}

export type ResultInput = { tournamentName: string; category: string; round: string; date: string };

/** Ein Ergebnis erfassen. Datum wird auf den Wochen-Montag gesnappt. */
export async function addResult(userId: string, input: ResultInput): Promise<void> {
  const name = input.tournamentName.trim();
  const { error } = await supabase.from("tour_result_history").insert({
    user_id: userId,
    tournament_name: name === "" ? "—" : name,
    category: input.category,
    round: input.round,
    tournament_monday: mondayOf(input.date),
  });
  if (error) throw error;
}

/** Ein Ergebnis entfernen (eigene Zeile, RLS). */
export async function deleteResult(id: string): Promise<void> {
  const { error } = await supabase.from("tour_result_history").delete().eq("id", id);
  if (error) throw error;
}
