"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { isOnline } from "@/lib/utils/formatters";
import type { AppMatch, Message, Profile } from "@/lib/types";
import { useAppNav } from "../appNav";
import Avatar from "../shared/Avatar";
import { SendIcon } from "../shared/icons";

// Schnell-Reaktionen (Doppeltipp setzt ❤️, das Halte-Menü bietet alle an).
const REACTION_EMOJIS = ["❤️", "😂", "👍", "😮", "😢", "🔥"];

// Entwurf pro Match lokal sichern, damit getippter (noch nicht gesendeter) Text
// beim Verlassen des Chats, App-Wechsel oder ohne Internet nicht verloren geht.
const draftKey = (matchId: string) => `mu_chat_draft_${matchId}`;

export default function ChatDetail({ matchId }: { matchId: string }) {
  const t = useT();
  const { profile, openSubView, closeSubView } = useAppNav();
  const [partner, setPartner] = useState<Profile | null>(null);
  const [active, setActive] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  // Beim Öffnen einen zuvor gesicherten Entwurf wiederherstellen.
  const [text, setText] = useState<string>(() => {
    try { return localStorage.getItem(draftKey(matchId)) ?? ""; } catch { return ""; }
  });
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [action, setAction] = useState<null | "unmatch" | "block" | "report">(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  // Nachricht bearbeiten (id) bzw. gedrückt-halten-Menü für eine Nachricht.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sheetMsg, setSheetMsg] = useState<Message | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pressTimer = useRef<number | undefined>(undefined);

  // Entwurf laufend sichern (nur für neue Nachrichten, nicht während des Bearbeitens).
  useEffect(() => {
    if (editingId) return;
    try {
      if (text.trim()) localStorage.setItem(draftKey(matchId), text);
      else localStorage.removeItem(draftKey(matchId));
    } catch { /* ignore */ }
  }, [text, editingId, matchId]);

  // Wiederhergestellten (mehrzeiligen) Entwurf beim Öffnen direkt aufwachsen lassen.
  useEffect(() => {
    requestAnimationFrame(adjustHeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          event: "*",
          schema: "web",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const oldId = (payload.old as { id?: string }).id;
            if (oldId) setMessages((prev) => prev.filter((m) => m.id !== oldId));
            return;
          }
          const row = payload.new as Message;
          if (payload.eventType === "UPDATE") {
            // Bearbeitung/Reaktion/Lesestatus — Zeile an Ort und Stelle ersetzen.
            setMessages((prev) => prev.map((m) => (m.id === row.id ? { ...m, ...row } : m)));
            return;
          }
          // INSERT
          setMessages((prev) => {
            if (
              row.client_message_id &&
              prev.some((m) => m.client_message_id === row.client_message_id)
            )
              return prev.map((m) =>
                m.client_message_id === row.client_message_id ? row : m,
              );
            return [...prev, row];
          });
          if (row.sender_id !== profile.id) markAsRead();
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

  // Textfeld wächst mit dem Inhalt (mehrzeilig, bis max. ~140px, dann scrollt es).
  function adjustHeight() {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }
  function resetInputHeight() {
    if (inputRef.current) inputRef.current.style.height = "auto";
  }

  async function send() {
    const body = text.trim();
    if (!body) return;
    // Bearbeitungs-Modus: bestehende eigene Nachricht ändern statt neue senden.
    if (editingId) {
      const id = editingId;
      const now = new Date().toISOString();
      setEditingId(null);
      setText("");
      resetInputHeight();
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, content: body, edited_at: now } : m)),
      );
      await supabase
        .from("messages")
        .update({ content: body, edited_at: now })
        .eq("id", id)
        .eq("sender_id", profile.id);
      return;
    }
    const clientId = crypto.randomUUID();
    const optimistic: Message = {
      id: clientId,
      match_id: matchId,
      sender_id: profile.id,
      content: body,
      is_read: false,
      client_message_id: clientId,
      created_at: new Date().toISOString(),
      delivered_at: null,
      read_at: null,
      reactions: {},
      edited_at: null,
    };
    setMessages((prev) => [...prev, optimistic]);
    setText("");
    resetInputHeight();
    const { error } = await supabase.from("messages").insert({
      match_id: matchId,
      sender_id: profile.id,
      content: optimistic.content,
      client_message_id: clientId,
    });
    if (error) {
      // Senden fehlgeschlagen (z. B. offline): optimistische Nachricht entfernen und
      // den Text zurück ins Feld holen (Entwurf bleibt gesichert), statt ihn zu verlieren.
      setMessages((prev) => prev.filter((m) => m.client_message_id !== clientId));
      setText((cur) => (cur.trim() ? cur : body));
      requestAnimationFrame(adjustHeight);
    }
  }

  // Reaktion umschalten: eigener Eintrag im jsonb-Feld { userId: emoji }.
  async function toggleReaction(m: Message, emoji: string) {
    const next = { ...(m.reactions ?? {}) };
    if (next[profile.id] === emoji) delete next[profile.id];
    else next[profile.id] = emoji;
    setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, reactions: next } : x)));
    setSheetMsg(null);
    await supabase.from("messages").update({ reactions: next }).eq("id", m.id);
  }

  // Eigene Nachricht bearbeiten: Inhalt ins Eingabefeld laden, Bearbeitungs-Modus an.
  function startEdit(m: Message) {
    setSheetMsg(null);
    setEditingId(m.id);
    setText(m.content);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      adjustHeight();
    });
  }

  async function deleteMsg(m: Message) {
    setSheetMsg(null);
    if (!window.confirm(t("matches.msgDeleteConfirm"))) return;
    setMessages((prev) => prev.filter((x) => x.id !== m.id));
    if (editingId === m.id) {
      setEditingId(null);
      setText("");
      resetInputHeight();
    }
    await supabase.from("messages").delete().eq("id", m.id).eq("sender_id", profile.id);
  }

  async function copyMsg(m: Message) {
    setSheetMsg(null);
    try {
      await navigator.clipboard.writeText(m.content);
    } catch {
      /* Zwischenablage nicht verfügbar — still ignorieren */
    }
  }

  // Gedrückt-halten (~480ms) öffnet das Aktionsmenü; Scrollen/Loslassen bricht ab.
  function startPress(m: Message) {
    window.clearTimeout(pressTimer.current);
    pressTimer.current = window.setTimeout(() => setSheetMsg(m), 480);
  }
  function cancelPress() {
    window.clearTimeout(pressTimer.current);
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
          const reactions = Object.values(m.reactions ?? {});
          return (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex max-w-[78%] flex-col ${mine ? "items-end" : "items-start"}`}>
                <div
                  onPointerDown={() => startPress(m)}
                  onPointerUp={cancelPress}
                  onPointerLeave={cancelPress}
                  onPointerMove={cancelPress}
                  onPointerCancel={cancelPress}
                  onContextMenu={(e) => e.preventDefault()}
                  onDoubleClick={() => toggleReaction(m, "❤️")}
                  className={`select-none whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm ${
                    mine
                      ? "rounded-tr-sm bg-matchup text-white"
                      : "rounded-tl-sm bg-black/[0.05] text-neutral-800"
                  }`}
                >
                  {m.content}
                  {m.edited_at && (
                    <span className="ml-2 text-[10px] opacity-60">{t("matches.msgEdited")}</span>
                  )}
                  {mine && (
                    <span className="ml-2 text-[10px] opacity-70">
                      {m.read_at ? "✓✓" : "✓"}
                    </span>
                  )}
                </div>
                {reactions.length > 0 && (
                  <div className={`-mt-1.5 flex gap-0.5 ${mine ? "pr-2" : "pl-2"}`}>
                    {reactions.map((emoji, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-white px-1.5 py-0.5 text-xs shadow-sm ring-1 ring-black/10"
                      >
                        {emoji}
                      </span>
                    ))}
                  </div>
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
        <div className="shrink-0 border-t border-black/10 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {editingId && (
            <div className="flex items-center justify-between px-2 pb-1.5 text-xs font-medium text-neutral-500">
              <span className="flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                {t("matches.msgEditingBanner")}
              </span>
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setText("");
                  resetInputHeight();
                }}
                className="font-semibold text-neutral-500"
              >
                {t("common.cancel")}
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              rows={1}
              value={text}
              onChange={(e) => {
                onType(e.target.value);
                adjustHeight();
              }}
              onKeyDown={(e) => {
                // Auf Zeigern mit grobem Raster (Touch) fügt Enter eine neue Zeile ein;
                // am Desktop sendet Enter, Shift+Enter macht eine neue Zeile.
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !window.matchMedia("(pointer: coarse)").matches
                ) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={t("matches.messagePlaceholder")}
              className="min-w-0 flex-1 resize-none rounded-3xl bg-neutral-100 px-4 py-2.5 text-base leading-snug text-neutral-900 outline-none placeholder:text-neutral-400"
              style={{ maxHeight: 140 }}
            />
            {text.trim() && (
              <button
                type="button"
                onClick={send}
                className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-matchup text-white"
                aria-label={t("common.send")}
              >
                <SendIcon size={18} className="text-white" />
              </button>
            )}
          </div>
        </div>
      )}

      {sheetMsg && (
        <div
          onClick={() => setSheetMsg(null)}
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-3xl bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-neutral-900 ring-1 ring-black/10 sm:rounded-3xl"
          >
            <div className="flex items-center justify-around gap-1 pb-1">
              {REACTION_EMOJIS.map((emoji) => {
                const on = sheetMsg.reactions?.[profile.id] === emoji;
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => toggleReaction(sheetMsg, emoji)}
                    className={`flex h-11 w-11 items-center justify-center rounded-full text-2xl transition-colors ${
                      on ? "bg-matchup/15" : "hover:bg-black/5"
                    }`}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
            <div className="mt-1 space-y-1 border-t border-black/10 pt-2">
              <button
                type="button"
                onClick={() => copyMsg(sheetMsg)}
                className="block w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-neutral-800 hover:bg-neutral-50"
              >
                {t("matches.msgCopy")}
              </button>
              {sheetMsg.sender_id === profile.id && (
                <>
                  <button
                    type="button"
                    onClick={() => startEdit(sheetMsg)}
                    className="block w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-neutral-800 hover:bg-neutral-50"
                  >
                    {t("matches.msgEdit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMsg(sheetMsg)}
                    className="block w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    {t("matches.msgDelete")}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
