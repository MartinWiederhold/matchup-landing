import { supabase } from "@/lib/supabase";
import type { TourProfile } from "@/lib/types";

/** Lädt das Tour-Profil des Users (oder null, wenn noch keins existiert). */
export async function loadTourProfile(userId: string): Promise<TourProfile | null> {
  const { data } = await supabase
    .from("tour_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as TourProfile | null) ?? null;
}

/** Legt das Tour-Profil an bzw. aktualisiert es (Upsert). */
export async function saveTourProfile(
  userId: string,
  patch: Partial<Omit<TourProfile, "user_id">>,
): Promise<void> {
  await supabase
    .from("tour_profiles")
    .upsert(
      { user_id: userId, ...patch, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
}

/** Wechselt den Modus (play/tour) am Profil. */
export async function setMode(userId: string, mode: "play" | "tour"): Promise<void> {
  await supabase.from("profiles").update({ mode }).eq("id", userId);
}
