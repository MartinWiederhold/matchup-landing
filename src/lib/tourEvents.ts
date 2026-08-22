/**
 * Datenschicht für Termine (web.tour_events) — genutzt vom Zeitstrahl /tour/timeline.
 *
 * EIGENE DATEI, nur Anon-Client — nie Service-Client (RLS wirkt). Explizite
 * Spaltenlisten, kein select *. web.tour_events wird von /app (ScheduleView)
 * mitbenutzt — Formate müssen kompatibel bleiben (siehe Kommentare).
 *
 * KEIN ICS-Feed: der bestehende Feed-Token lässt sich nicht widerrufen (MU-020,
 * Launch-Sperre). Diese Datei fasst web.tour_calendar bewusst NICHT an.
 */

import { supabase } from "@/lib/supabase";
import { isTourTournamentId } from "@/lib/tourExpenses";

/** Die sechs Codes, die /app kennt — keine neuen erfinden (kind hat keinen CHECK). */
export type EventKind = "training" | "match" | "physio" | "travel" | "gym" | "other";
export const EVENT_KINDS: EventKind[] = ["training", "match", "physio", "travel", "gym", "other"];

export type TourEvent = {
  id: string;
  kind: string;
  title: string;
  event_date: string; // ISO date
  event_time: string | null; // "HH:MM:SS" via PostgREST; null = ganztägig. Wanduhr OHNE Zeitzone (MU-021).
  note: string | null;
  tournament_id: string | null;
  won: boolean | null;
  score: string | null; // Freitext "6-3 7-5"
  round: string | null;
  opponent: string | null;
};

const COLUMNS = "id, kind, title, event_date, event_time, note, tournament_id, won, score, round, opponent";

/** Termine des Nutzers + Turniernamen NUR für uuid-Bezüge (Slugs aus /app bleiben ohne Namen). */
export async function loadEvents(userId: string): Promise<{ rows: TourEvent[]; names: Map<string, string> }> {
  const { data, error } = await supabase
    .from("tour_events")
    .select(COLUMNS)
    .eq("user_id", userId)
    .order("event_date", { ascending: true })
    .order("event_time", { ascending: true, nullsFirst: true });
  if (error) throw error;
  const rows = (data as TourEvent[]) ?? [];

  const uuids = [...new Set(rows.map((r) => r.tournament_id).filter((id): id is string => isTourTournamentId(id)))];
  const names = new Map<string, string>();
  if (uuids.length) {
    const { data: ts, error: e2 } = await supabase.from("tour_tournaments").select("id, city, country, name").in("id", uuids);
    if (e2) throw e2;
    for (const tt of (ts as { id: string; city: string | null; country: string | null; name: string | null }[]) ?? []) {
      names.set(tt.id, tt.city ? `${tt.city}${tt.country ? ", " + tt.country : ""}` : tt.name ?? tt.id);
    }
  }
  return { rows, names };
}

export type EventInput = {
  kind: EventKind;
  title: string;
  event_date: string;
  event_time: string | null; // "HH:MM" oder null
  note: string | null;
  tournament_id: string | null; // uuid aus der eigenen Saison oder null
  won: boolean | null;
  score: string | null;
  round: string | null;
  opponent: string | null;
};

/**
 * Match-Felder werden HIER in der Datenschicht auf null gezwungen, wenn kind !== 'match'
 * — genau wie /app es in ScheduleView.save() tut, aber aufruferunabhängig garantiert.
 */
function normalized(input: EventInput) {
  const isMatch = input.kind === "match";
  return {
    kind: input.kind,
    title: input.title,
    event_date: input.event_date,
    event_time: input.event_time,
    note: input.note,
    tournament_id: input.tournament_id,
    round: isMatch ? input.round : null,
    opponent: isMatch ? input.opponent : null,
    score: isMatch ? input.score : null,
    won: isMatch ? input.won : null,
  };
}

export async function addEvent(userId: string, input: EventInput): Promise<void> {
  const { error } = await supabase.from("tour_events").insert({ user_id: userId, ...normalized(input) });
  if (error) throw error;
}

export async function updateEvent(id: string, input: EventInput): Promise<void> {
  const { error } = await supabase.from("tour_events").update(normalized(input)).eq("id", id);
  if (error) throw error;
}

export async function removeEvent(id: string): Promise<void> {
  const { error } = await supabase.from("tour_events").delete().eq("id", id);
  if (error) throw error;
}
