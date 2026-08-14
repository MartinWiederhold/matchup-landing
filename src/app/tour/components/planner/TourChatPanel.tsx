"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import { loadMessages, sendMessage, markRead, subscribeMessages, startTourChat, type Message } from "@/lib/chat";

/**
 * Turnier-Chat als Overlay im /tour-Panel. Nutzt die wiederverwendbare Schicht chat.ts
 * (Match sicherstellen → laden → Realtime → senden), ohne /app-Kopplung (kein useAppNav,
 * eigene Initialen statt shared/Avatar). Das Anschreiben ist DB-seitig an beidseitige
 * Turnier-Präsenz mit Absicht gebunden (web.may_match); scheitert das, zeigt das Panel
 * einen Hinweis statt eines Absturzes.
 */
export default function TourChatPanel({
  meId, otherId, otherName, onClose,
}: {
  meId: string;
  otherId: string;
  otherName: string;
  onClose: () => void;
}) {
  const t = useT();
  const [matchId, setMatchId] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Match sicherstellen (RLS erlaubt es nur bei beidseitiger Präsenz+Absicht) + laden.
  useEffect(() => {
    let alive = true;
    (async () => {
      const id = await startTourChat(meId, otherId);
      if (!alive) return;
      if (!id) { setStatus("error"); return; }
      setMatchId(id);
      setMessages(await loadMessages(id));
      setStatus("ready");
      void markRead(id, meId);
    })();
    return () => { alive = false; };
  }, [meId, otherId]);

  // Realtime auf neue Nachrichten.
  useEffect(() => {
    if (!matchId) return;
    return subscribeMessages(matchId, (m) => {
      setMessages((prev) => {
        if (m.client_message_id && prev.some((p) => p.client_message_id === m.client_message_id))
          return prev.map((p) => (p.client_message_id === m.client_message_id ? m : p));
        return [...prev, m];
      });
      if (m.sender_id !== meId) void markRead(matchId, meId);
    });
  }, [matchId, meId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    if (!text.trim() || !matchId) return;
    const clientId = crypto.randomUUID();
    const content = text.trim();
    const optimistic: Message = {
      id: clientId, match_id: matchId, sender_id: meId, content, is_read: false,
      client_message_id: clientId, created_at: new Date().toISOString(), delivered_at: null, read_at: null,
    };
    setMessages((prev) => [...prev, optimistic]);
    setText("");
    await sendMessage(matchId, meId, content, clientId);
  }

  return (
    <div className="fixed inset-0 z-[700] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="flex h-[70dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white ring-1 ring-black/10 sm:rounded-3xl">
        <header className="flex shrink-0 items-center gap-2.5 border-b border-black/10 px-4 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-matchup/10 text-[13px] font-bold text-matchup">
            {(otherName || "?").slice(0, 1).toUpperCase()}
          </span>
          <span className="font-semibold text-neutral-900">{otherName || t("tour.fieldMissing")}</span>
          <button type="button" onClick={onClose} aria-label={t("common.back")} className="ml-auto text-lg text-neutral-400 hover:text-neutral-700">✕</button>
        </header>

        {status === "error" ? (
          <div className="flex flex-1 items-center justify-center p-6 text-center text-[13px] leading-relaxed text-neutral-500">
            {t("tour.chatUnavailable")}
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {messages.map((m) => {
                const mine = m.sender_id === meId;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-[13px] ${mine ? "rounded-tr-sm bg-matchup text-white" : "rounded-tl-sm bg-black/[0.05] text-neutral-800"}`}>
                      {m.content}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <div className="flex shrink-0 items-center gap-2 border-t border-black/10 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder={t("tour.chatPlaceholder")}
                disabled={status !== "ready"}
                className="min-w-0 flex-1 rounded-full bg-neutral-100 px-4 py-2.5 text-[15px] text-neutral-900 outline-none placeholder:text-neutral-400 disabled:opacity-50"
              />
              {text.trim() && (
                <button type="button" onClick={send} aria-label={t("common.send")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-matchup text-white">➤</button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
