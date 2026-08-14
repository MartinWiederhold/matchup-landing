import { supabase } from "@/lib/supabase";
import { ensureMatch } from "@/lib/matchmaking";
import type { Message } from "@/lib/types";

/**
 * Wiederverwendbare Chat-Datenschicht (1:1 über web.messages, an ein Match gebunden).
 * BEWUSST von /app entkoppelt: /app's ChatDetail hängt an useAppNav — diese Schicht
 * kapselt nur die Supabase-Zugriffe, damit sie z. B. der /tour-Turnier-Chat nutzen kann,
 * ohne /app anzufassen. Realtime + Read-Receipts + client_message_id-Dedup wie in ChatDetail.
 */
export type { Message };

/** Nachrichten eines Matches chronologisch laden. */
export async function loadMessages(matchId: string): Promise<Message[]> {
  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });
  return (data as Message[]) ?? [];
}

/** Nachricht senden. clientId dedupliziert die eigene Zeile gegen den Realtime-Echo. */
export async function sendMessage(matchId: string, senderId: string, content: string, clientId: string): Promise<void> {
  await supabase.from("messages").insert({ match_id: matchId, sender_id: senderId, content, client_message_id: clientId });
}

/** Eingehende (fremde) Nachrichten eines Matches als gelesen markieren. */
export async function markRead(matchId: string, meId: string): Promise<void> {
  await supabase
    .from("messages")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("match_id", matchId)
    .neq("sender_id", meId)
    .is("read_at", null);
}

/** Realtime-Abo auf neue Nachrichten eines Matches. Liefert eine Unsubscribe-Funktion. */
export function subscribeMessages(matchId: string, onInsert: (m: Message) => void): () => void {
  const channel = supabase
    .channel(`messages:${matchId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "web", table: "messages", filter: `match_id=eq.${matchId}` },
      (payload) => onInsert(payload.new as Message),
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

/**
 * Turnier-Chat starten: stellt (idempotent) das Match sicher und liefert die matchId.
 * Setzt voraus, dass beide beim selben Turnier mit Absicht eingetragen sind — sonst lehnt
 * die RLS (web.may_match, MU-036) den Match-Insert ab und wir liefern null (UI zeigt Hinweis).
 */
export async function startTourChat(meId: string, otherId: string): Promise<string | null> {
  return ensureMatch(meId, otherId);
}
