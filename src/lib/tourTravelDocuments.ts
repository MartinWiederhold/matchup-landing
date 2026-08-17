/**
 * Datenschicht für die eigenen Reisedokumente (web.tour_travel_document, owner-only).
 *
 * Anders als die Stammdaten-Töpfe (tour_profiles/tour_equipment/tour_emergency_contact,
 * je eine Zeile pro Nutzer) ist dies eine LISTE: ein Spieler kann ESTA, Schengen-Visum
 * und ein türkisches eVisa gleichzeitig halten. Nur Anon-Client, RLS wirkt (owner-only).
 *
 * KEINE Dokumentnummer — dieselbe Regel wie beim Pass. Die App rechnet mit keiner Nummer.
 */
import { supabase } from "@/lib/supabase";
import type { TourTravelDocument, TravelDocKind, TravelDocStatus } from "@/lib/types";

const COLUMNS = "id, user_id, kind, scope, valid_until, status, lead_weeks, note, created_at, updated_at";

/** Alle Reisedokumente des Nutzers (owner-only via RLS). */
export async function loadTravelDocuments(userId: string): Promise<TourTravelDocument[]> {
  const { data, error } = await supabase
    .from("tour_travel_document")
    .select(COLUMNS)
    .eq("user_id", userId)
    .order("kind", { ascending: true });
  if (error) throw error;
  return (data as TourTravelDocument[] | null) ?? [];
}

export type TravelDocInput = {
  kind: TravelDocKind;
  scope: string | null;
  valid_until: string | null;
  status: TravelDocStatus;
  note: string | null;
};

/** Dokument anlegen. */
export async function addTravelDocument(userId: string, doc: TravelDocInput): Promise<void> {
  const { error } = await supabase.from("tour_travel_document").insert({ user_id: userId, ...doc });
  if (error) throw error;
}

/** Dokument ändern (nur eigene Felder; user_id/kind/scope bleiben). */
export async function updateTravelDocument(id: string, patch: Partial<TravelDocInput>): Promise<void> {
  const { error } = await supabase.from("tour_travel_document").update(patch).eq("id", id);
  if (error) throw error;
}

/** Dokument löschen. */
export async function removeTravelDocument(id: string): Promise<void> {
  const { error } = await supabase.from("tour_travel_document").delete().eq("id", id);
  if (error) throw error;
}
