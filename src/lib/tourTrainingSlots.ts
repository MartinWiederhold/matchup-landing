/**
 * Datenschicht für Trainingsslots + Antworten (web.tour_training_slot / _response).
 * Nur Anon-Client, RLS wirkt: Slots lesen alle Eingeloggten, schreibt der Eigentümer;
 * Antworten sieht der Anfrager (seine) und der Slot-Eigentümer (die zu seinen Slots).
 * Explizite Spaltenlisten, kein select *.
 */
import { supabase } from "@/lib/supabase";

export type TrainingSlot = { id: string; user_id: string; slot_date: string; time_block: string; tournament_id: string };
export type SlotResponse = { id: string; slot_id: string; responder_id: string; status: string; contact: string | null };
export type SlotPerson = { id: string; first_name: string | null; display_name: string | null; profile_image: string | null };

const SLOT_COLUMNS = "id, user_id, slot_date, time_block, tournament_id";
const RESP_COLUMNS = "id, slot_id, responder_id, status, contact";

/** Alle Slots eines Turniers + die für mich sichtbaren Antworten (RLS filtert). */
export async function loadTournamentSlots(tournamentId: string): Promise<{ slots: TrainingSlot[]; responses: SlotResponse[] }> {
  const { data: slots, error } = await supabase
    .from("tour_training_slot")
    .select(SLOT_COLUMNS)
    .eq("tournament_id", tournamentId)
    .order("slot_date", { ascending: true });
  if (error) throw error;
  const slotRows = (slots as TrainingSlot[]) ?? [];
  if (slotRows.length === 0) return { slots: [], responses: [] };

  const ids = slotRows.map((s) => s.id);
  const { data: resp, error: e2 } = await supabase.from("tour_training_slot_response").select(RESP_COLUMNS).in("slot_id", ids);
  if (e2) throw e2;
  return { slots: slotRows, responses: (resp as SlotResponse[]) ?? [] };
}

/** Slots an konkreten Tagen über mehrere Turniere (Overview-Tagesblick). */
export async function loadSlotsOnDates(tournamentIds: string[], dates: string[]): Promise<{ slots: TrainingSlot[]; responses: SlotResponse[] }> {
  if (tournamentIds.length === 0 || dates.length === 0) return { slots: [], responses: [] };
  const { data: slots, error } = await supabase
    .from("tour_training_slot")
    .select(SLOT_COLUMNS)
    .in("tournament_id", tournamentIds)
    .in("slot_date", dates);
  if (error) throw error;
  const slotRows = (slots as TrainingSlot[]) ?? [];
  if (slotRows.length === 0) return { slots: [], responses: [] };
  const ids = slotRows.map((s) => s.id);
  const { data: resp, error: e2 } = await supabase.from("tour_training_slot_response").select(RESP_COLUMNS).in("slot_id", ids);
  if (e2) throw e2;
  return { slots: slotRows, responses: (resp as SlotResponse[]) ?? [] };
}

/** Profile (Name/Bild) zu einer ID-Liste — für Slot-Eigentümer und Anfrager. */
export async function loadSlotPeople(ids: string[]): Promise<Map<string, SlotPerson>> {
  const uniq = [...new Set(ids)];
  if (uniq.length === 0) return new Map();
  const { data, error } = await supabase.from("profiles").select("id, first_name, display_name, profile_image").in("id", uniq);
  if (error) throw error;
  return new Map(((data as SlotPerson[]) ?? []).map((p) => [p.id, p]));
}

/** Eigenen Slot anlegen (idempotent auf dem UNIQUE-Quadrupel; 23505 ist kein Fehler). */
export async function addSlot(userId: string, tournamentId: string, slotDate: string, timeBlock: string): Promise<void> {
  const { error } = await supabase.from("tour_training_slot").insert({ user_id: userId, tournament_id: tournamentId, slot_date: slotDate, time_block: timeBlock });
  if (error && error.code !== "23505") throw error;
}

/** Eigenen Slot entfernen (RLS: nur Eigentümer). */
export async function removeSlot(id: string): Promise<void> {
  const { error } = await supabase.from("tour_training_slot").delete().eq("id", id);
  if (error) throw error;
}

/** Sich auf einen fremden Slot melden (Status pending). contact optional (Draht nach Zusage). */
export async function respondToSlot(slotId: string, responderId: string, contact: string | null): Promise<void> {
  const { error } = await supabase.from("tour_training_slot_response").insert({ slot_id: slotId, responder_id: responderId, contact: contact?.trim() || null });
  if (error && error.code !== "23505") throw error;
}

/** Eigene Anfrage zurückziehen (RLS: Anfrager) bzw. Eigentümer entfernt sie. */
export async function removeResponse(id: string): Promise<void> {
  const { error } = await supabase.from("tour_training_slot_response").delete().eq("id", id);
  if (error) throw error;
}

/** Zu-/Absagen — nur der Slot-Eigentümer (RLS). */
export async function setResponseStatus(id: string, status: "accepted" | "declined"): Promise<void> {
  const { error } = await supabase.from("tour_training_slot_response").update({ status }).eq("id", id);
  if (error) throw error;
}
