import { supabase } from "@/lib/supabase";

/**
 * Stößt die Server-Route an, die dem Angefragten eine E-Mail schickt (sofern er
 * sie nicht im Profil abbestellt hat). Fire-and-forget: Fehler dürfen den
 * „Verbinden"-Ablauf NIE stören. Die Route dedupliziert selbst (likes.notified_at),
 * daher ist ein erneuter Aufruf beim nochmaligen Antippen harmlos.
 */
export async function notifyConnect(toUserId: string): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    await fetch("/api/notify/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ toUserId }),
      keepalive: true,
    });
  } catch {
    /* egal — die E-Mail ist optional, der Verbinden-Vorgang bleibt unberührt */
  }
}
