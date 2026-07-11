"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { useAppNav } from "../appNav";
import { SubViewHeader } from "../shared/ui";
import { loadMyPlayers, type MyPlayer } from "@/lib/tour";

const ROLE_KEY: Record<string, string> = {
  coach: "onboarding.roleCoach", physio: "onboarding.rolePhysio", agent: "onboarding.roleAgent", hitting_partner: "onboarding.roleHitting", sc: "onboarding.roleHitting",
};

export default function TourPlayers() {
  const t = useT();
  const { profile, openSubView } = useAppNav();
  const [players, setPlayers] = useState<MyPlayer[] | null>(null);

  useEffect(() => { loadMyPlayers(profile.id).then(setPlayers); }, [profile.id]);

  return (
    <div className="flex h-full flex-col bg-white text-neutral-900">
      <SubViewHeader light title={t("mode.myPlayers")} />
      <div className="flex-1 overflow-y-auto p-4">
        {players === null ? null : players.length === 0 ? (
          <p className="pt-8 text-center text-[13px] text-neutral-400">{t("mode.noPlayers")}</p>
        ) : (
          <div className="space-y-2">
            {players.map((p) => (
              <button
                key={`${p.player_id}-${p.role}`}
                type="button"
                onClick={() => openSubView({ type: "tour-player-view", playerId: p.player_id, role: p.role, playerName: p.player_name ?? undefined })}
                className="flex w-full items-center gap-3 rounded-2xl bg-black/[0.035] p-4 text-left"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-[15px] font-bold text-neutral-500">
                  {(p.player_name?.[0] ?? "?").toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold text-neutral-900">{p.player_name ?? "—"}</p>
                  <p className="text-[12px] text-neutral-500">{t(ROLE_KEY[p.role] ?? "onboarding.roleCoach")}</p>
                </div>
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
