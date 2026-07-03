"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { isOnline } from "@/lib/utils/formatters";
import type { AppMatch, Message, Profile } from "@/lib/types";
import { useAppNav } from "../appNav";
import Avatar from "../shared/Avatar";
import { SendIcon } from "../shared/icons";

export default function ChatDetail({ matchId }: { matchId: string }) {
  const t = useT();
  const { profile, openSubView, closeSubView } = useAppNav();
  const [partner, setPartner] = useState<Profile | null>(null);
  const [active, setActive] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [action, setAction] = useState<null | "unmatch" | "block">(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function performAction() {
    if (!partner || !action || busy) return;
    setBusy(true);
    await supabase.from("match_dissolutions").insert({
      user_id: profile.id,
      other_user_id: partner.id,
      match_id: matchId,
      action,
      reason: reason.trim() || null,
    });
    await supabase.from("matches").update({ is_active: false }).eq("id", matchId);
    if (action === "block") {
      await supabase
        .from("blocks")
        .upsert(
          { blocker_id: profile.id, blocked_id: partner.id },
          { onConflict: "blocker_id,blocked_id" },
        );
    }
    setBusy(false);
    setAction(null);
    closeSubView();
  }
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
          schema: "web",
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
          aria-label={t("common.back")}
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

        {partner && active && (
          <div className="relative ml-auto">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={t("matches.menuLabel")}
              className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-300 hover:bg-zinc-800"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <circle cx="12" cy="5" r="1.6" />
                <circle cx="12" cy="12" r="1.6" />
                <circle cx="12" cy="19" r="1.6" />
              </svg>
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-11 z-20 w-48 overflow-hidden rounded-xl bg-zinc-900 p-1 shadow-xl ring-1 ring-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setReason("");
                      setAction("unmatch");
                    }}
                    className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-white hover:bg-zinc-800"
                  >
                    {t("matches.unmatch")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setReason("");
                      setAction("block");
                    }}
                    className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-amber-300 hover:bg-zinc-800"
                  >
                    {t("matches.block")}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </header>

      {action && partner && (
        <div
          onClick={() => !busy && setAction(null)}
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-3xl bg-zinc-950 p-6 text-white ring-1 ring-white/10 sm:rounded-3xl"
          >
            <h3 className="text-lg font-bold tracking-tight">
              {action === "block"
                ? t("matches.blockTitle", { name: partner.first_name })
                : t("matches.dissolveTitle")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              {action === "block"
                ? t("matches.blockText", { name: partner.first_name })
                : t("matches.dissolveText", { name: partner.first_name })}
            </p>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t("matches.reasonLabel")}
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("matches.reasonPlaceholder")}
              className="mt-1.5 w-full rounded-xl bg-zinc-800 px-4 py-3 text-sm outline-none"
            />
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setAction(null)}
                disabled={busy}
                className="flex-1 rounded-full border border-zinc-700 py-3 text-sm font-semibold"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={performAction}
                disabled={busy}
                className="flex-1 rounded-full bg-zinc-700 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {action === "block"
                  ? t("matches.confirmBlock")
                  : t("matches.confirmUnmatch")}
              </button>
            </div>
          </div>
        </div>
      )}

      {!active && (
        <div className="bg-zinc-800 px-4 py-2 text-center text-xs text-zinc-300">
          {t("matches.matchDissolved")}
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
        <div className="flex shrink-0 items-center gap-2 border-t border-zinc-800 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <input
            value={text}
            onChange={(e) => onType(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={t("matches.messagePlaceholder")}
            className="min-w-0 flex-1 rounded-full bg-zinc-800 px-4 py-2.5 text-base outline-none"
          />
          {text.trim() && (
            <button
              type="button"
              onClick={send}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-matchup text-white"
              aria-label={t("common.send")}
            >
              <SendIcon size={18} className="text-white" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
