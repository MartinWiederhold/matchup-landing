"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatEventDate, sportLabel } from "@/lib/utils/formatters";
import { CalendarIcon, MapPinIcon, UsersIcon, SportIcon } from "./icons";
import type { GameEvent } from "@/lib/types";
import { useT } from "@/lib/i18n";
import { useAppNav } from "../appNav";

/**
 * Session-first: offene Spiele der nächsten Tage – als Erstes im Discover-Feed,
 * damit die App mit „Sessions", nicht mit Gesichtern startet (Anti-Dating-Design).
 */
export default function OpenGamesStrip() {
  const t = useT();
  const { profile, openSubView, setActiveTab } = useAppNav();
  const [games, setGames] = useState<GameEvent[]>([]);

  const load = useCallback(async () => {
    const nowIso = new Date().toISOString();
    const { data } = await supabase
      .from("game_events")
      .select(`*, participants:game_participants(status)`)
      .eq("is_open", true)
      .eq("status", "planned")
      .neq("created_by", profile.id)
      .gte("date_time", nowIso)
      .order("date_time", { ascending: true })
      .limit(12);
    setGames((data as GameEvent[]) ?? []);
  }, [profile.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (games.length === 0) return null;

  return (
    <div className="pt-3">
      <div className="mb-2 flex items-center justify-between px-3">
        <h2 className="text-sm font-bold text-zinc-100">🎾 {t("discover.openGamesTitle")}</h2>
        <button type="button" onClick={() => setActiveTab("games")} className="text-xs font-semibold text-matchup">
          {t("discover.openGamesAll")} →
        </button>
      </div>
      <div className="flex gap-2.5 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {games.map((g) => {
          const accepted = 1 + (g.participants?.filter((p) => p.status === "accepted").length ?? 0);
          const cap = g.max_participants ?? (g.game_type === "singles" ? 2 : 4);
          const free = Math.max(0, cap - accepted);
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => openSubView({ type: "game-detail", gameId: g.id })}
              className="w-44 shrink-0 rounded-2xl bg-zinc-900 p-3 text-left ring-1 ring-zinc-800 transition-colors hover:ring-matchup/50"
            >
              <p className="flex items-center gap-1 truncate text-sm font-semibold text-zinc-100">
                <SportIcon sport={g.sport} size={14} className="shrink-0" />
                {sportLabel(g.sport)} · {g.game_type === "singles" ? "1v1" : "2v2"}
              </p>
              <p className="mt-1.5 flex items-center gap-1 truncate text-xs text-zinc-300">
                <CalendarIcon size={13} className="shrink-0" /> {formatEventDate(g.date_time)}
              </p>
              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-zinc-400">
                <MapPinIcon size={13} className="shrink-0" /> {g.location}
              </p>
              <span
                className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  free > 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-zinc-800 text-zinc-400"
                }`}
              >
                <UsersIcon size={12} /> {free > 0 ? t("discover.openGamesSpots", { count: free }) : `${accepted}/${cap}`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
