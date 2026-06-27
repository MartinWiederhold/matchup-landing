import { supabase } from "./supabase";

/**
 * Erstellt (idempotent) das Match bei gegenseitigem Like. Das isolierte
 * web-Schema hat keinen DB-Trigger dafür, daher clientseitig.
 * Gibt die Match-ID zurück (oder null bei Fehler).
 */
export async function ensureMatch(
  a: string,
  b: string,
): Promise<string | null> {
  const [user1_id, user2_id] = [a, b].sort();
  const { data: existing } = await supabase
    .from("matches")
    .select("id")
    .eq("user1_id", user1_id)
    .eq("user2_id", user2_id)
    .maybeSingle();
  if (existing) return existing.id as string;

  const { data, error } = await supabase
    .from("matches")
    .insert({ user1_id, user2_id, is_active: true })
    .select("id")
    .maybeSingle();
  return error ? null : ((data?.id as string) ?? null);
}
