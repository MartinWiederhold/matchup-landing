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
  const [action, setAction] = useState<null | "unmatch" | "block" | "report">(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const REPORT_REASONS = [
    t("matches.reasonHarass"),
    t("matches.reasonSpam"),
    t("matches.reasonInappropriate"),
    t("matches.reasonFake"),
    t("matches.reasonOther"),
  ];
  async function submitReport(reasonText: string) {
    if (!partner || busy) return;
    setBusy(true);
    await supabase.from("reports").insert({
      reporter_id: profile.id,
      reported_user_id: partner.id,
      reason: reasonText,
      status: "pending",
    });
    setBusy(false);
    setAction(null);
    window.alert(t("matches.reportDone"));
  }

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
    <div className="flex h-full flex-col bg-white text-neutral-900">
      <header className="flex shrink-0 items-center gap-3 border-b border-black/10 px-4 py-3">
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
            <span className="flex flex-col items-start leading-tight">
              <span className="font-semibold">{partner.first_name}</span>
              {isOnline(partner.last_active) && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {t("matches.online")}
                </span>
              )}
            </span>
          </button>
        )}

        {partner && active && (
          <div className="relative ml-auto">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={t("matches.menuLabel")}
              className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 hover:bg-black/5"
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
                <div className="absolute right-0 top-11 z-20 w-48 overflow-hidden rounded-xl bg-white p-1 shadow-xl ring-1 ring-black/10">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setReason("");
                      setAction("report");
                    }}
                    className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                  >
                    {t("matches.report")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setReason("");
                      setAction("unmatch");
                    }}
                    className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50"
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
                    className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
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
            className="w-full max-w-md rounded-t-3xl bg-white p-6 text-neutral-900 ring-1 ring-black/10 sm:rounded-3xl"
          >
            {action === "report" ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold tracking-tight">{t("matches.reportTitle", { name: partner.first_name })}</h3>
                  <button type="button" onClick={() => setAction(null)} disabled={busy} className="text-sm font-medium text-neutral-500">{t("common.cancel")}</button>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">{t("matches.reportSub")}</p>
                <div className="mt-4 space-y-1.5">
                  {REPORT_REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      disabled={busy}
                      onClick={() => submitReport(r)}
                      className="flex w-full items-center justify-between rounded-xl bg-black/[0.04] px-4 py-3 text-left text-sm font-medium text-neutral-800 hover:bg-black/[0.06] disabled:opacity-50"
                    >
                      {r}
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400"><path d="M9 6l6 6-6 6" /></svg>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold tracking-tight">
                  {action === "block"
                    ? t("matches.blockTitle", { name: partner.first_name })
                    : t("matches.dissolveTitle")}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                  {action === "block"
                    ? t("matches.blockText", { name: partner.first_name })
                    : t("matches.dissolveText", { name: partner.first_name })}
                </p>
                <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  {t("matches.reasonLabel")}
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t("matches.reasonPlaceholder")}
                  className="mt-1.5 w-full rounded-xl bg-neutral-100 px-4 py-3 text-sm text-neutral-900 outline-none"
                />
                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setAction(null)}
                    disabled={busy}
                    className="flex-1 rounded-full border border-neutral-300 py-3 text-sm font-semibold"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={performAction}
                    disabled={busy}
                    className="flex-1 rounded-full bg-neutral-900 py-3 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {action === "block"
                      ? t("matches.confirmBlock")
                      : t("matches.confirmUnmatch")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {!active && (
        <div className="bg-neutral-100 px-4 py-2 text-center text-xs text-neutral-500">
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
                    : "rounded-tl-sm bg-black/[0.05] text-neutral-800"
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
                className="h-2 w-2 rounded-full bg-neutral-400"
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
        <div className="flex shrink-0 items-center gap-2 border-t border-black/10 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <input
            value={text}
            onChange={(e) => onType(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={t("matches.messagePlaceholder")}
            className="min-w-0 flex-1 rounded-full bg-neutral-100 px-4 py-2.5 text-base text-neutral-900 outline-none placeholder:text-neutral-400"
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
