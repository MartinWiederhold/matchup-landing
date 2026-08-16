/**
 * Datenschicht für die Spielerstammdaten (/tour-Setup + Planer-Warnungen).
 *
 * Drei Empfindlichkeits-Töpfe, EIN Lese-/Schreib-Layer:
 *  - Dokumente & Ablauf  → Spalten auf web.tour_profiles (owner-only)
 *  - Ausrüstung          → web.tour_equipment (owner-only; künftig Besaiter)
 *  - Notfallkontakt      → web.tour_emergency_contact (owner-only; künftig Coach)
 *
 * Nur Anon-Client, RLS wirkt (owner-only), wird nie umgangen. Explizite Spaltenlisten,
 * kein select *. KEINE Passnummer/Bankdaten/Steuerkennung/medizinischen Angaben — die App
 * rechnet mit keinem dieser Werte (siehe supabase/web_tour_player_master.sql).
 */
import { supabase } from "@/lib/supabase";

export type PlayerDocs = {
  passport_country: string | null;
  passport_expiry: string | null;
  passport2_country: string | null;
  passport2_expiry: string | null;
  insurance_provider: string | null;
  insurance_policy_no: string | null;
  insurance_expiry: string | null;
  insurance_international: boolean | null;
  ipin_id: string | null;
  atp_id: string | null;
};

export type PlayerEquipment = {
  racket: string | null;
  string_model: string | null;
  tension_main: number | null;
  tension_cross: number | null;
  grip_size: string | null;
};

export type EmergencyContact = {
  contact_name: string | null;
  relationship: string | null;
  phone: string | null;
};

export type PlayerMaster = {
  docs: PlayerDocs | null;
  equipment: PlayerEquipment | null;
  emergency: EmergencyContact | null;
};

const DOC_COLUMNS =
  "passport_country, passport_expiry, passport2_country, passport2_expiry, insurance_provider, insurance_policy_no, insurance_expiry, insurance_international, ipin_id, atp_id";
const EQUIP_COLUMNS = "racket, string_model, tension_main, tension_cross, grip_size";
const EMERGENCY_COLUMNS = "contact_name, relationship, phone";

/** Alle drei Töpfe des Nutzers laden (je 0/1 Zeile). Fehlt eine Zeile → null. */
export async function loadPlayerMaster(userId: string): Promise<PlayerMaster> {
  const [docsRes, equipRes, emergRes] = await Promise.all([
    supabase.from("tour_profiles").select(DOC_COLUMNS).eq("user_id", userId).maybeSingle(),
    supabase.from("tour_equipment").select(EQUIP_COLUMNS).eq("user_id", userId).maybeSingle(),
    supabase.from("tour_emergency_contact").select(EMERGENCY_COLUMNS).eq("user_id", userId).maybeSingle(),
  ]);
  if (docsRes.error) throw docsRes.error;
  if (equipRes.error) throw equipRes.error;
  if (emergRes.error) throw emergRes.error;
  return {
    docs: (docsRes.data as PlayerDocs) ?? null,
    equipment: (equipRes.data as PlayerEquipment) ?? null,
    emergency: (emergRes.data as EmergencyContact) ?? null,
  };
}

/** Nur die Ablauf-relevanten Felder — schlank für die Planer-Warnungen. */
export async function loadPlayerDocs(userId: string): Promise<PlayerDocs | null> {
  const { data, error } = await supabase.from("tour_profiles").select(DOC_COLUMNS).eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return (data as PlayerDocs) ?? null;
}

/** Dokument-Felder auf tour_profiles setzen (Upsert je user_id — legt die Zeile an, falls nötig). */
export async function savePlayerDocs(userId: string, patch: Partial<PlayerDocs>): Promise<void> {
  const { error } = await supabase.from("tour_profiles").upsert({ user_id: userId, ...patch }, { onConflict: "user_id" });
  if (error) throw error;
}

/** Ausrüstung setzen (Upsert je user_id). */
export async function saveEquipment(userId: string, patch: Partial<PlayerEquipment>): Promise<void> {
  const { error } = await supabase.from("tour_equipment").upsert({ user_id: userId, ...patch }, { onConflict: "user_id" });
  if (error) throw error;
}

/** Notfallkontakt setzen (Upsert je user_id). */
export async function saveEmergency(userId: string, patch: Partial<EmergencyContact>): Promise<void> {
  const { error } = await supabase.from("tour_emergency_contact").upsert({ user_id: userId, ...patch }, { onConflict: "user_id" });
  if (error) throw error;
}
