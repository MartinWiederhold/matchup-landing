"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sportLabel } from "@/lib/utils/formatters";
import { ChevronRightIcon } from "./icons";
import type { GameEvent } from "@/lib/types";
import { useT } from "@/lib/i18n";
import { useAppNav } from "../appNav";

type Person = { display_name?: string | null; first_name?: string | null; profile_image?: string | null };

function initials(p: Person): string {
  return (p.display_name || p.first_name || "").trim().slice(0, 1).toUpperCase() || "·";
}
function whenLabel(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString("de-CH", { weekday: "short", day: "numeric", month: "numeric" });
  const time = d.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
  return `${day} · ${time}`;
}

/** Session-first: kompakte, glasige „Offene Spiele"-Karte zuoberst im Discover-Feed. */
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

  return (
    <div className="mx-3 mt-3 overflow-hidden rounded-2xl bg-white/[0.05] ring-1 ring-white/10 backdrop-blur-md">
      <div className="flex items-center justify-between px-3.5 pt-2.5 pb-1.5">
        <h2 className="text-[12px] font-semibold text-white/90">{t("discover.openGamesTitle")}</h2>
        <span className="flex items-center gap-1 text-[10px] font-medium text-white/45">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {games.length}
        </span>
      </div>

      <div className="divide-y divide-white/[0.06]">
        {games.slice(0, 3).map((g) => {
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
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left transition-colors active:bg-white/[0.04]"
            >
              <span className="flex -space-x-2">
                {people.slice(0, 3).map((p, i) => (
                  <span key={i} className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-white/10 text-[9px] font-bold text-white/80 ring-2 ring-black/40">
                    {p.profile_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.profile_image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials(p)
                    )}
                  </span>
                ))}
                {extra > 0 && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[9px] font-bold text-white/70 ring-2 ring-black/40">+{extra}</span>
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-semibold leading-tight text-white/95">
                  {sportLabel(g.sport)} · {g.game_type === "singles" ? "1v1" : "2v2"}
                </span>
                <span className="block truncate text-[10.5px] leading-tight text-white/40">
                  {whenLabel(g.date_time)} · {g.location}
                </span>
              </span>

              {free > 0 && (
                <span className="shrink-0 rounded-full bg-emerald-400/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                  {t("discover.openGamesSpots", { count: free })}
                </span>
              )}
              <ChevronRightIcon size={14} className="shrink-0 text-white/30" />
            </button>
          );
        })}
      </div>

      {games.length > 3 && (
        <button
          type="button"
          onClick={() => setActiveTab("games")}
          className="w-full border-t border-white/[0.06] py-1.5 text-center text-[11px] font-semibold text-white/60"
        >
          {t("discover.openGamesAll")} →
        </button>
      )}
    </div>
  );
}
