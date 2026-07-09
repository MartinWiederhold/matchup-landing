"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatEventDate, sportLabel } from "@/lib/utils/formatters";
import { ChevronRightIcon } from "./icons";
import type { GameEvent } from "@/lib/types";
import { useT } from "@/lib/i18n";
import { useAppNav } from "../appNav";

type Person = { display_name?: string | null; first_name?: string | null; profile_image?: string | null };

function initials(p: Person): string {
  const n = p.display_name || p.first_name || "";
  return n.trim().slice(0, 1).toUpperCase() || "·";
}

/**
 * Session-first: kompakte, hochwertige Karte „Offene Spiele" zuoberst im Discover-Feed –
 * dunkel, überlappende Avatare, dezent (Landing-Look). Sessions vor Gesichtern.
 */
export default function OpenGamesStrip() {
  const t = useT();
  const { profile, openSubView, setActiveTab } = useAppNav();
  const [games, setGames] = useState<GameEvent[]>([]);

  const load = useCallback(async () => {
    const nowIso = new Date().toISOString();
    const { data } = await supabase
      .from("game_events")
      .select(
        `*, creator:profiles!game_events_created_by_fkey(display_name, first_name, profile_image),
         participants:game_participants(status, profile:profiles(display_name, first_name, profile_image))`,
      )
      .eq("is_open", true)
      .eq("status", "planned")
      .neq("created_by", profile.id)
      .gte("date_time", nowIso)
      .order("date_time", { ascending: true })
      .limit(10);
    setGames((data as GameEvent[]) ?? []);
  }, [profile.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (games.length === 0) return null;
  const shown = games.slice(0, 3);

  return (
    <div className="mx-3 mt-3 overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-white/[0.06]">
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
        <h2 className="text-[15px] font-bold tracking-tight text-white">{t("discover.openGamesTitle")}</h2>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {games.length}
        </span>
      </div>

      <div className="divide-y divide-white/[0.06]">
        {shown.map((g) => {
          const people: Person[] = [
            ...(g.creator ? [g.creator as Person] : []),
            ...((g.participants ?? []).filter((p) => p.status === "accepted" && p.profile).map((p) => p.profile as Person)),
          ];
          const cap = g.max_participants ?? (g.game_type === "singles" ? 2 : 4);
          const free = Math.max(0, cap - people.length);
          const extra = people.length - 3;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => openSubView({ type: "game-detail", gameId: g.id })}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-white/[0.03]"
            >
              <span className="flex -space-x-2.5">
                {people.slice(0, 3).map((p, i) => (
                  <span key={i} className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-zinc-700 text-[10px] font-bold text-zinc-200 ring-2 ring-zinc-900">
                    {p.profile_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.profile_image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials(p)
                    )}
                  </span>
                ))}
                {extra > 0 && (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-300 ring-2 ring-zinc-900">+{extra}</span>
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-zinc-100">
                  {sportLabel(g.sport)} · {g.game_type === "singles" ? "1v1" : "2v2"} · {formatEventDate(g.date_time)}
                </span>
                <span className="block truncate text-[11px] text-zinc-500">{g.location}</span>
              </span>

              {free > 0 && (
                <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
                  {t("discover.openGamesSpots", { count: free })}
                </span>
              )}
              <ChevronRightIcon size={16} className="shrink-0 text-zinc-600" />
            </button>
          );
        })}
      </div>

      {games.length > 3 && (
        <button
          type="button"
          onClick={() => setActiveTab("games")}
          className="w-full border-t border-white/[0.06] px-4 py-2.5 text-center text-xs font-semibold text-matchup"
        >
          {t("discover.openGamesAll")} →
        </button>
      )}
    </div>
  );
}
