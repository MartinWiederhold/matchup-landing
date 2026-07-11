"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useAppNav } from "../appNav";
import Avatar from "../shared/Avatar";
import { loadTourProfile, loadTourPlan, loadMyPlayers, setMode } from "@/lib/tour";
import { flagEmoji } from "@/lib/flags";
import type { TourProfile } from "@/lib/types";

const CIRCUIT_LABEL: Record<string, string> = { atp: "ATP Tour", challenger: "ATP Challenger", itf: "ITF World Tennis Tour", wta: "WTA Tour" };

function Row({ icon, label, right, onClick, accent }: { icon: string; label: string; right?: React.ReactNode; onClick: () => void; accent?: boolean }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 border-b border-black/[0.06] py-3.5 text-left last:border-0">
      <svg viewBox="0 0 24 24" className={`h-5 w-5 shrink-0 ${accent ? "text-matchup" : "text-neutral-500"}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>
      <span className={`flex-1 text-[14px] font-medium ${accent ? "text-matchup" : "text-neutral-900"}`}>{label}</span>
      {right}
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-neutral-300" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m9 6 6 6-6 6" /></svg>
    </button>
  );
}

export default function TourProfileTab() {
  const t = useT();
  const { refreshProfile } = useAuth();
  const { profile, openSubView } = useAppNav();
  const [tour, setTour] = useState<TourProfile | null>(null);
  const [planCount, setPlanCount] = useState(0);
  const [playerCount, setPlayerCount] = useState(0);

  useEffect(() => {
    (async () => {
      const [tp, ids, players] = await Promise.all([loadTourProfile(profile.id), loadTourPlan(profile.id), loadMyPlayers(profile.id)]);
      setTour(tp); setPlanCount(ids.length); setPlayerCount(players.length);
    })();
  }, [profile.id]);

  const name = profile.display_name || profile.first_name || "—";
  const passport = tour?.passports?.[0] ?? null;
  const coach = tour?.team?.find((m) => m.role === "coach")?.name ?? null;
  const info: { l: string; v: string }[] = [];
  if (passport) info.push({ l: t("mode.nationality"), v: `${passport} ${flagEmoji(passport)}` });
  if (tour?.circuit) info.push({ l: t("mode.circuit"), v: CIRCUIT_LABEL[tour.circuit] });
  if (tour?.tax_residence) info.push({ l: t("mode.residence"), v: tour.tax_residence });
  if (coach) info.push({ l: t("mode.coachLabel"), v: coach });

  async function switchToPlay() {
    await setMode(profile.id, "play");
    await refreshProfile();
  }

  return (
    <div className="overflow-y-auto pb-28">
      {/* Header */}
      <div className="px-4 pt-6 text-center">
        <div className="flex justify-center"><Avatar src={profile.profile_image} alt={name} size="xl" /></div>
        <h1 className="mt-3 text-[20px] font-extrabold tracking-tight text-neutral-900">{name}</h1>
        <p className="mt-0.5 text-[13px] text-neutral-500">
          {tour?.circuit ? CIRCUIT_LABEL[tour.circuit] : "Tour"}{tour?.ranking != null ? ` · #${tour.ranking}` : ""}{tour?.points != null ? ` · ${tour.points} ${t("mode.points")}` : ""}
        </p>
        <div className="mt-3 flex items-stretch justify-center gap-4">
          {[
            { v: tour?.ranking != null ? String(tour.ranking) : "—", l: t("mode.ranking") },
            { v: tour?.points != null ? String(tour.points) : "—", l: t("mode.points") },
            { v: String(planCount), l: t("mode.plannedCount") },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-4">
              {i > 0 && <span className="h-8 w-px bg-black/[0.08]" />}
              <div className="text-center">
                <div className="text-[16px] font-extrabold text-neutral-900">{s.v}</div>
                <div className="text-[10px] text-neutral-400">{s.l}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-center gap-2">
          <button type="button" onClick={() => openSubView({ type: "tour-profile-edit" })} className="rounded-xl bg-neutral-900 px-5 py-2 text-[13px] font-bold text-white">{t("mode.editBtn")}</button>
          <button type="button" onClick={() => openSubView({ type: "tour-planner" })} className="rounded-xl bg-black/[0.05] px-5 py-2 text-[13px] font-bold text-neutral-800">{t("mode.plannerTitle")}</button>
        </div>
      </div>

      {/* Player info */}
      {info.length > 0 && (
        <>
          <p className="mb-2 mt-6 px-5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">{t("mode.playerInfo")}</p>
          <div className="mx-4 rounded-2xl bg-black/[0.035] px-4">
            {info.map((r, i) => (
              <div key={i} className="flex justify-between border-b border-black/[0.06] py-2.5 last:border-0">
                <span className="text-[13px] text-neutral-500">{r.l}</span>
                <span className="text-[13px] font-semibold text-neutral-900">{r.v}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Team */}
      {tour?.team && tour.team.length > 0 && (
        <>
          <p className="mb-2 mt-6 px-5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">{t("mode.yourTeam")}</p>
          <div className="flex gap-4 overflow-x-auto no-scrollbar px-5">
            {tour.team.map((m, i) => (
              <div key={i} className="flex w-16 shrink-0 flex-col items-center gap-1.5">
                <span className="flex h-13 w-13 items-center justify-center rounded-full bg-neutral-200 text-[16px] font-bold text-neutral-500" style={{ height: 52, width: 52 }}>{(m.name?.[0] ?? "?").toUpperCase()}</span>
                <span className="max-w-16 truncate text-[11.5px] font-semibold text-neutral-800">{m.name}</span>
                <span className="text-[9.5px] text-neutral-400">{m.role}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Account */}
      <p className="mb-1 mt-6 px-5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">{t("mode.account")}</p>
      <div className="px-5">
        <Row icon="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11zM12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18M5 10h14" label={t("mode.visaTitle")} onClick={() => openSubView({ type: "tour-visa" })} />
        <Row icon="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2M9 12h6M12 9v6" label={t("mode.openFinance")} onClick={() => openSubView({ type: "tour-expenses" })} />
        <Row icon="M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" label={t("mode.scheduleTitle")} onClick={() => openSubView({ type: "tour-schedule" })} />
        <Row icon="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8v4l2.5 2.5" label={t("mode.editProfileTitle")} onClick={() => openSubView({ type: "tour-profile-edit" })} />
        {playerCount > 0 && (
          <Row icon="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" label={t("mode.myPlayers")} right={<span className="text-[11px] font-bold text-matchup">{playerCount}</span>} onClick={() => openSubView({ type: "tour-players" })} />
        )}
        <Row icon="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" label={t("profile.settingsTitle")} onClick={() => openSubView({ type: "settings" })} />
        <Row icon="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3" label={t("mode.switchToPlay")} accent onClick={switchToPlay} />
      </div>
    </div>
  );
}
