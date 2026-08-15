/**
 * Datenschicht für die Erinnerungs-Einstellung (web.tour_reminder_settings). Anon-Client,
 * RLS wirkt (nur die eigene Zeile). Fehlende Zeile = Vorgabe „an", Sprache 'de'.
 * Beim Speichern wird die aktuelle UI-Sprache mitpersistiert, damit die Mail sie trifft
 * (die UI-Sprache ist ein Cookie und serverseitig sonst nicht sichtbar).
 */
import { supabase } from "@/lib/supabase";

export type ReminderSettings = { enabled: boolean; locale: "de" | "en" };

export async function loadReminderSettings(userId: string): Promise<ReminderSettings> {
  const { data, error } = await supabase.from("tour_reminder_settings").select("enabled, locale").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return { enabled: data?.enabled ?? true, locale: (data?.locale as "de" | "en") ?? "de" };
}

export async function saveReminderSettings(userId: string, enabled: boolean, locale: "de" | "en"): Promise<void> {
  const { error } = await supabase.from("tour_reminder_settings").upsert({ user_id: userId, enabled, locale }, { onConflict: "user_id" });
  if (error) throw error;
}
