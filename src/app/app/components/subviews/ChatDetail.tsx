"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { isOnline } from "@/lib/utils/formatters";
import type { AppMatch, Message, Profile } from "@/lib/types";
import { useAppNav } from "../appNav";
import Avatar from "../shared/Avatar";

export default function ChatDetail({ matchId }: { matchId: string }) {
  const { profile, openSubView, closeSubView } = useAppNav();
  const [partner, setPartner] = useState<Profile | null>(null);
  const [active, setActive] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [partnerTyping, setPartnerTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeout = useRef<number | undefined>(undefined);

  const markAsRead = useCallback(async () => {
    await supabase
      .from("messages")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("match_id", matchId)
      .neq("sender_id", profile.id)
      .is("read_at", null);
  }, [matchId, profile.id]);

  // Match + Partner + Nachrichten laden
  useEffect(() => {
    (async () => {
      const { data: match } = await supabase
        .from("matches")
        .select(
          `*, user1:profiles!matches_user1_id_fkey(*), user2:profiles!matches_user2_id_fkey(*)`,
        )
        .eq("id", matchId)
        .maybeSingle();
      if (match) {
        const m = match as AppMatch;
        setActive(m.is_active);
        setPartner(m.user1_id === profile.id ? m.user2! : m.user1!);
      }
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });
      setMessages((msgs as Message[]) ?? []);
      markAsRead();
    })();
  }, [matchId, profile.id, markAsRead]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (
              newMsg.client_message_id &&
              prev.some((m) => m.client_message_id === newMsg.client_message_id)
            )
              return prev.map((m) =>
                m.client_message_id === newMsg.client_message_id ? newMsg : m,
              );
            return [...prev, newMsg];
          });
          if (newMsg.sender_id !== profile.id) markAsRead();
        },
      )
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload.userId !== profile.id) {
          setPartnerTyping(true);
          window.clearTimeout(typingTimeout.current);
          typingTimeout.current = window.setTimeout(
            () => setPartnerTyping(false),
            3000,
          );
        }
      })
      .subscribe();
    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, profile.id, markAsRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, partnerTyping]);

  const typingThrottle = useRef(0);
  function onType(v: string) {
    setText(v);
    const now = Date.now();
    if (now - typingThrottle.current > 2500) {
      typingThrottle.current = now;
      channelRef.current?.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: profile.id },
      });
    }
  }

  async function send() {
    if (!text.trim()) return;
    const clientId = crypto.randomUUID();
    const optimistic: Message = {
      id: clientId,
      match_id: matchId,
      sender_id: profile.id,
      content: text.trim(),
      is_read: false,
      client_message_id: clientId,
      created_at: new Date().toISOString(),
      delivered_at: null,
      read_at: null,
    };
    setMessages((prev) => [...prev, optimistic]);
    setText("");
    await supabase.from("messages").insert({
      match_id: matchId,
      sender_id: profile.id,
      content: optimistic.content,
      client_message_id: clientId,
    });
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-zinc-800 px-4 py-3">
        <button
          type="button"
          onClick={closeSubView}
          className="text-xl"
          aria-label="Zurück"
        >
          ←
        </button>
        {partner && (
          <button
            type="button"
            onClick={() =>
              openSubView({
                type: "full-profile",
                userId: partner.id,
                viewOnly: true,
              })
            }
            className="flex items-center gap-2.5"
          >
            <Avatar
              src={partner.profile_image}
              alt={partner.first_name}
              size="sm"
              online={isOnline(partner.last_active)}
            />
            <span className="font-semibold">{partner.first_name}</span>
          </button>
        )}
      </header>

      {!active && (
        <div className="bg-zinc-800 px-4 py-2 text-center text-xs text-zinc-300">
          Dieses Match wurde aufgelöst.
        </div>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.map((m) => {
          const mine = m.sender_id === profile.id;
          return (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  mine
                    ? "rounded-tr-sm bg-matchup text-white"
                    : "rounded-tl-sm bg-zinc-800 text-white"
                }`}
              >
                {m.content}
                {mine && (
                  <span className="ml-2 text-[10px] opacity-70">
                    {m.read_at ? "✓✓" : "✓"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {partnerTyping && (
          <div className="flex gap-1 pl-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-2 rounded-full bg-zinc-500"
                style={{
                  animation: "typingBounce 1.2s infinite",
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {active && (
        <div className="flex shrink-0 items-center gap-2 border-t border-zinc-800 p-3">
          <input
            value={text}
            onChange={(e) => onType(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Nachricht schreiben…"
            className="flex-1 rounded-full bg-zinc-800 px-4 py-2.5 text-sm outline-none"
          />
          {text.trim() && (
            <button
              type="button"
              onClick={send}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-matchup text-white"
              aria-label="Senden"
            >
              ➤
            </button>
          )}
        </div>
      )}
    </div>
  );
}
