"use client";

import { useEffect, useRef, useState } from "react";
import { useT, useLocale } from "@/lib/i18n";
import { loadMessages, sendMessage, loadTeam, type TourMessage, type TeamInvite } from "@/lib/tour";
import { useAppNav } from "../appNav";

export default function TourChatTab() {
  const t = useT();
  const { locale } = useLocale();
  const { profile, openSubView } = useAppNav();
  const [msgs, setMsgs] = useState<TourMessage[]>([]);
  const [team, setTeam] = useState<TeamInvite[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const name = profile.display_name || profile.first_name || "—";

  async function refresh() { setMsgs(await loadMessages(profile.id)); }

  useEffect(() => {
    void refresh();
    loadTeam(profile.id).then(setTeam);
    const iv = setInterval(() => { void refresh(); }, 6000);
    return () => clearInterval(iv);
  }, [profile.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { bottomRef.current?.scrollIntoView({ block: "end" }); }, [msgs.length]);

  async function send() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText("");
    await sendMessage(profile.id, profile.id, name, body);
    await refresh();
    setSending(false);
  }

  const activeTeam = team.filter((m) => m.status === "active");
  const time = (iso: string) => new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="pb-40">
      {/* Kopf */}
      <div className="flex items-center gap-3 border-b border-black/[0.06] px-4 py-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-matchup text-white">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-neutral-900">{t("mode.teamChatTitle")}</p>
          <p className="truncate text-[11.5px] text-neutral-500">
            {activeTeam.length > 0 ? activeTeam.map((m) => m.member_name || m.role).join(", ") : t("mode.teamChatEmpty")}
          </p>
        </div>
        <button type="button" onClick={() => openSubView({ type: "tour-profile-edit" })} className="shrink-0 rounded-full bg-black/[0.05] px-3 py-1.5 text-[12px] font-bold text-matchup">{t("mode.invite")}</button>
      </div>

      {/* Nachrichten */}
      <div className="space-y-2.5 px-4 py-4">
        {msgs.length === 0 ? (
          <p className="pt-10 text-center text-[13px] text-neutral-400">{t("mode.chatStart")}</p>
        ) : (
          msgs.map((m) => {
            const own = m.sender_id === profile.id;
            return (
              <div key={m.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 ${own ? "bg-matchup text-white" : "bg-black/[0.05] text-neutral-900"}`}>
                  {!own && <p className="mb-0.5 text-[10.5px] font-bold text-matchup">{m.sender_name || t("mode.player")}</p>}
                  <p className="whitespace-pre-wrap break-words text-[14px] leading-snug">{m.body}</p>
                  <p className={`mt-0.5 text-right text-[9.5px] ${own ? "text-white/70" : "text-neutral-400"}`}>{time(m.created_at)}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Eingabe */}
      <div className="fixed inset-x-0 bottom-[76px] z-40 mx-auto flex max-w-[430px] items-center gap-2 border-t border-black/[0.06] bg-white/95 px-3 py-2.5 backdrop-blur">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
          placeholder={t("mode.chatPlaceholder")}
          className="flex-1 rounded-full bg-black/[0.05] px-4 py-2.5 text-[14px] outline-none"
        />
        <button type="button" onClick={send} disabled={sending || !text.trim()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-matchup text-white disabled:opacity-40">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" /></svg>
        </button>
      </div>
    </div>
  );
}
