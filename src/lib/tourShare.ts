import { supabase } from "./supabase";

// Read-only Saison-Freigabe: unratbarer Token in tour_profiles.season_share_token.
// Der Nutzer erzeugt/erneuert/löscht ihn selbst (RLS: eigene tour_profiles-Zeile).

export async function loadShareToken(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("tour_profiles")
    .select("season_share_token")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as { season_share_token: string | null } | null)?.season_share_token ?? null;
}

/** Token setzen (neuer/erster Link) oder mit null die Freigabe deaktivieren. */
export async function setShareToken(userId: string, token: string | null): Promise<void> {
  await supabase
    .from("tour_profiles")
    .upsert({ user_id: userId, season_share_token: token }, { onConflict: "user_id" });
}
