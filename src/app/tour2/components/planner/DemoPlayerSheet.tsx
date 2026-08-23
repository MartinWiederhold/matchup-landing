"use client";

import { useState } from "react";
import { useT, useLocale } from "@/lib/i18n";
import type { DemoPlayer } from "@/lib/tourPresenceDemo";

/**
 * SIMULIERTE Profil-/Chat-Vorschau für einen Beispiel-Spieler aus „Vor Ort". Zeigt beim
 * Vorführen den ganzen Ablauf — anklicken, Profil sehen, verbinden, Chat — OHNE irgendetwas
 * zu speichern: kein Match, kein echter Chat, KEIN ensureMatch/startTourChat, kein Schreiben
 * in matches/messages/player_presence. Die Kennzeichnung als Vorschau bleibt durchgehend
 * sichtbar (Profil UND Chat). Der Nutzer kann tippen, aber nichts wird gesendet.
 */
export default function DemoPlayerSheet({ player, city, onClose }: { player: DemoPlayer; city: string; onClose: () => void }) {
  const t = useT();
  const { locale } = useLocale();
  const [view, setView] = useState<"profile" | "chat">("profile");
  const [draft, setDraft] = useState("");

  // Lesbare Detailwerte (Niveau/Tage/Belag bzw. Zeitraum/Ort/Kosten/Art).
  const fmtShort = (iso: string | null) => (iso ? new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z")) : "");
  const period = player.roomFrom && player.roomTo ? `${fmtShort(player.roomFrom)}–${fmtShort(player.roomTo)}` : null;
  const whenText = player.partnerDays.length ? player.partnerDays.join(" · ") : null; // Freitext „Wann"

  // Absicht als lesbare Aussage (wie in der Liste).
  const intentParts: string[] = [];
  if (player.looking) intentParts.push(t("tour.wsSeekPartnerStmt"));
  if (player.lookingRoom) intentParts.push(t("tour.wsSeekRoomStmt", { city }));
  const intent = intentParts.length ? intentParts.join(" · ") : t("tour.wsHerePresent");

  // Vorbereitete Beispiel-Unterhaltung — Skript je Absicht (Trainingspartner vor Unterkunft).
  const scriptRoom = !player.looking && player.lookingRoom;
  const script: { from: "me" | "them"; text: string }[] = scriptRoom
    ? [
        { from: "me", text: t("tour.demoChatRoom1", { name: player.name, city }) },
        { from: "them", text: t("tour.demoChatRoom2") },
        { from: "me", text: t("tour.demoChatRoom3") },
      ]
    : [
        { from: "me", text: t("tour.demoChatPartner1", { name: player.name, city }) },
        { from: "them", text: t("tour.demoChatPartner2") },
        { from: "me", text: t("tour.demoChatPartner3") },
      ];

  const badge = <span className="shrink-0 rounded-full bg-black/[0.06] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-neutral-500">{t("tour.wsHereDemoBadge")}</span>;
  const field = (label: string, value: string) => (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-400">{label}</span>
      <span className="text-[13px] font-semibold text-neutral-800">{value}</span>
    </div>
  );

  return (
    <div className="absolute inset-0 z-[80] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl ring-1 ring-black/10 sm:max-h-[88vh] sm:rounded-3xl">

        {view === "profile" ? (
          <>
            {/* Kopf mit Bild groß */}
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={player.image} alt="" className="h-44 w-full bg-neutral-100 object-cover" />
              <button type="button" onClick={onClose} aria-label={t("common.close")} className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[16px] text-neutral-600 shadow ring-1 ring-black/10 hover:bg-white">✕</button>
              <span className="absolute left-3 top-3">{badge}</span>
            </div>

            <div className="overflow-y-auto p-5">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold tracking-tight text-neutral-900">{player.name}</h2>
                {badge}
              </div>
              <p className="mt-0.5 text-[13px] font-semibold text-matchup">{intent}</p>

              <div className="mt-3 divide-y divide-black/[0.06]">
                {field(t("tour.demoFieldNationality"), player.nationality)}
                {field(t("tour.demoFieldRank"), player.rankLabel)}
                {field(t("tour.demoFieldAge"), t("tour.demoAgeYears", { n: player.age }))}
                {field(t("tour.demoFieldHome"), player.homeCity)}
                {/* Trainingspartner-Detail: nur WANN (Belag kommt vom Turnier, Niveau steht im Rang). */}
                {player.looking && whenText && field(t("tour.wsPartnerWhen"), whenText)}
                {/* Unterkunft-Details */}
                {player.lookingRoom && period && field(t("tour.demoFieldPeriod"), period)}
                {player.lookingRoom && player.roomArea && field(t("tour.wsRoomArea"), player.roomArea)}
                {player.lookingRoom && player.roomCost && field(t("tour.wsRoomCost"), player.roomCost)}
                {player.lookingRoom && player.roomType && field(t("tour.wsRoomTypeLabel"), t(`tour.roomType_${player.roomType}`))}
              </div>

              {/* Kennzeichnung: Vorschau, nichts wird gespeichert. */}
              <p className="mt-4 rounded-xl bg-black/[0.03] px-3 py-2.5 text-[12px] leading-relaxed text-neutral-500">{t("tour.demoProfilePreview")}</p>

              <button type="button" onClick={() => setView("chat")} className="mt-4 w-full rounded-2xl bg-matchup px-5 py-3.5 text-[15px] font-bold text-white shadow-sm transition-colors hover:bg-matchup-hover">
                {t("tour.demoConnect")}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Chat-Kopf: zurück zum Profil + Name + Beispiel-Merkmal */}
            <div className="flex shrink-0 items-center gap-2.5 border-b border-neutral-200 px-4 py-3">
              <button type="button" onClick={() => setView("profile")} aria-label={t("tour.demoBackToProfile")} className="flex h-8 w-8 items-center justify-center rounded-full text-[18px] text-neutral-500 hover:bg-black/[0.04]">←</button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={player.image} alt="" className="h-8 w-8 shrink-0 rounded-full bg-neutral-100 object-cover" />
              <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-neutral-900">{player.name}</span>
              {badge}
              <button type="button" onClick={onClose} aria-label={t("common.close")} className="flex h-8 w-8 items-center justify-center rounded-full text-[16px] text-neutral-400 hover:bg-black/[0.04]">✕</button>
            </div>

            {/* Durchgehende Kennzeichnung im Chat. */}
            <p className="shrink-0 bg-amber-50 px-4 py-2 text-[11px] font-semibold text-amber-800">{t("tour.demoChatBanner")}</p>

            {/* Beispiel-Unterhaltung */}
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-neutral-50 p-4">
              {script.map((m, i) => (
                <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                  <span className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[13px] leading-snug ${m.from === "me" ? "bg-matchup text-white" : "bg-white text-neutral-800 ring-1 ring-black/[0.06]"}`}>{m.text}</span>
                </div>
              ))}
            </div>

            {/* Verfassen — tippbar, aber Senden ist in der Vorschau inaktiv (nichts gesendet). */}
            <div className="shrink-0 border-t border-neutral-200 p-3">
              <div className="flex items-center gap-2">
                <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t("tour.demoChatPlaceholder")} className="min-w-0 flex-1 rounded-full border border-black/15 bg-white px-4 py-2 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:border-black/30 focus:outline-none" />
                {/* Bewusst KEIN Senden: kein ensureMatch/startTourChat, nichts wird geschrieben. */}
                <button type="button" disabled aria-label={t("tour.demoChatSendNote")} title={t("tour.demoChatSendNote")} className="flex h-9 w-9 shrink-0 cursor-not-allowed items-center justify-center rounded-full bg-matchup/40 text-white">➤</button>
              </div>
              <p className="mt-1.5 px-1 text-[11px] text-neutral-400">{t("tour.demoChatSendNote")}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
