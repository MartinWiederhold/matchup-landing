/**
 * Datenschicht für die Wildcard-Verwaltung der Route /tour (web.tour_wildcard_contact +
 * web.tour_wildcard_events). Ausschließlich der Anon-Client — die RLS wirkt (owner-only,
 * KEIN Agent-Read; Kontaktdaten Dritter, MU-035) und wird nie umgangen. Explizite
 * Spaltenlisten, kein select *.
 *
 * Zwei Tabellen wie beim Entry-Status: der aktuelle Anfragestand je (Nutzer, Turnier) in
 * tour_wildcard_contact, der VERLAUF der Beziehungspflege append-only in tour_wildcard_events.
 * Der Kontakt hängt am TURNIER (uuid), nicht an der Planzeile — er überlebt Saison-Änderungen.
 * Bekannte Grenze: tour_tournaments ist je Ausgabe/Jahr (keine jahresübergreifende Kennung,
 * MU-038) — der Kontakt ist damit je Edition.
 */
import { supabase } from "@/lib/supabase";

export type WildcardType = "main" | "qualifying";
export type WildcardOutcome = "pending" | "granted" | "declined";
export type WildcardEventKind = "contacted" | "follow_up" | "request" | "response" | "note";

export type TourWildcardContact = {
  id: string;
  tournament_id: string;
  director_name: string | null;
  email: string | null;
  phone: string | null;
  federation: string | null;
  note: string | null;
  wildcard_type: WildcardType | null;
  requested_on: string | null;
  outcome: WildcardOutcome | null;
};

export type TourWildcardEvent = {
  id: string;
  contact_id: string;
  occurred_on: string;
  kind: string;
  detail: string | null;
};

const CONTACT_COLUMNS =
  "id, tournament_id, director_name, email, phone, federation, note, wildcard_type, requested_on, outcome";
const EVENT_COLUMNS = "id, contact_id, occurred_on, kind, detail";

/** Alle Wildcard-Kontakte des Nutzers (RLS scoped auf die eigenen Zeilen). */
export async function loadWildcardContacts(userId: string): Promise<TourWildcardContact[]> {
  const { data, error } = await supabase
    .from("tour_wildcard_contact")
    .select(CONTACT_COLUMNS)
    .eq("user_id", userId);
  if (error) throw error;
  return (data as TourWildcardContact[]) ?? [];
}

/** ALLE Verlaufs-Einträge des Nutzers, chronologisch — EINE Abfrage; die UI gruppiert
 *  client-seitig nach contact_id (wie loadAllEntryEvents). */
export async function loadWildcardEvents(userId: string): Promise<TourWildcardEvent[]> {
  const { data, error } = await supabase
    .from("tour_wildcard_events")
    .select(EVENT_COLUMNS)
    .eq("user_id", userId)
    .order("occurred_on", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as TourWildcardEvent[]) ?? [];
}

/** Felder eines Kontakts (alle optional). Leere Strings räumt der Aufrufer nach null. */
export type WildcardContactPatch = {
  director_name?: string | null;
  email?: string | null;
  phone?: string | null;
  federation?: string | null;
  note?: string | null;
  wildcard_type?: WildcardType | null;
  requested_on?: string | null;
  outcome?: WildcardOutcome | null;
};

/**
 * Kontakt je (Nutzer, Turnier) anlegen oder aktualisieren (UNIQUE user_id+tournament_id).
 * Upsert mit onConflict — legt die Zeile an, wenn es sie noch nicht gibt, sonst aktualisiert
 * er die übergebenen Felder. Gibt die id zurück (für das Anhängen von Verlaufs-Einträgen).
 */
export async function upsertWildcardContact(
  userId: string,
  tournamentId: string,
  patch: WildcardContactPatch,
): Promise<string> {
  const { data, error } = await supabase
    .from("tour_wildcard_contact")
    .upsert({ user_id: userId, tournament_id: tournamentId, ...patch }, { onConflict: "user_id,tournament_id" })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

/**
 * Einen Verlaufs-Eintrag anhängen (append-only). occurred_on leer → DB-Default (heute).
 * user_id ist Pflicht (RLS WITH CHECK verlangt auth.uid() = user_id UND einen EIGENEN Kontakt).
 */
export async function logWildcardEvent(
  userId: string,
  contactId: string,
  ev: { kind: WildcardEventKind; occurredOn?: string; detail?: string | null },
): Promise<void> {
  const row: Record<string, unknown> = {
    user_id: userId,
    contact_id: contactId,
    kind: ev.kind,
    detail: ev.detail?.trim() ? ev.detail.trim() : null,
  };
  if (ev.occurredOn) row.occurred_on = ev.occurredOn;
  const { error } = await supabase.from("tour_wildcard_events").insert(row);
  if (error) throw error;
}

/** Einen Fehl-Eintrag entfernen (append-only kennt kein Update — löschen + neu erfassen). */
export async function deleteWildcardEvent(id: string): Promise<void> {
  const { error } = await supabase.from("tour_wildcard_events").delete().eq("id", id);
  if (error) throw error;
}
