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

/** Lädt die eingeplanten Turnier-IDs (Saisonplan) des Users. */
export async function loadTourPlan(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from("tour_plan")
    .select("tournament_id")
    .eq("user_id", userId);
  return (data ?? []).map((r) => r.tournament_id as string);
}

/** Ersetzt den Saisonplan des Users komplett durch die übergebene ID-Liste. */
export async function saveTourPlan(userId: string, tournamentIds: string[]): Promise<void> {
  // Diff gegen den aktuellen Stand → nur nötige Inserts/Deletes.
  const current = new Set(await loadTourPlan(userId));
  const next = new Set(tournamentIds);
  const toAdd = tournamentIds.filter((id) => !current.has(id));
  const toRemove = [...current].filter((id) => !next.has(id));
  if (toAdd.length) {
    await supabase
      .from("tour_plan")
      .upsert(toAdd.map((tournament_id) => ({ user_id: userId, tournament_id })), {
        onConflict: "user_id,tournament_id",
      });
  }
  if (toRemove.length) {
    await supabase.from("tour_plan").delete().eq("user_id", userId).in("tournament_id", toRemove);
  }
}
