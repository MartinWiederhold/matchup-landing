"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatEventDate, sportLabel } from "@/lib/utils/formatters";
import {
  SportIcon,
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  PlusIcon,
} from "../shared/icons";
import type { GameEvent } from "@/lib/types";
import { useAppNav } from "../appNav";
import { FullLoading, EmptyState } from "../shared/ui";

const STATUS_LABEL: Record<string, string> = {
  planned: "Geplant",
  confirmed: "Bestätigt",
  cancelled: "Abgesagt",
  completed: "Abgeschlossen",
};

export default function GamesTab() {
  const { profile, openSubView } = useAppNav();
  const [mode, setMode] = useState<"mine" | "open">("mine");
  const [games, setGames] = useState<GameEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const nowIso = new Date().toISOString();
    const select = `*,
      creator:profiles!game_events_created_by_fkey(display_name, first_name, profile_image),
      participants:game_participants(*, profile:profiles(display_name, first_name, profile_image))`;

    if (mode === "mine") {
      const { data } = await supabase
        .from("game_events")
        .select(select)
        .or(`created_by.eq.${profile.id},participants.user_id.eq.${profile.id}`)
        .gte("date_time", nowIso)
        .order("date_time", { ascending: true });
      setGames((data as GameEvent[]) ?? []);
    } else {
      const { data } = await supabase
        .from("game_events")
        .select(select)
        .eq("is_open", true)
        .eq("status", "planned")
        .neq("created_by", profile.id)
        .gte("date_time", nowIso)
        .order("date_time", { ascending: true });
      setGames((data as GameEvent[]) ?? []);
    }
    setLoading(false);
  }, [profile.id, mode]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex shrink-0 gap-2 p-3">
        {(["mine", "open"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 rounded-full py-2 text-sm font-semibold ${
              mode === m ? "bg-matchup text-white" : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {m === "mine" ? "Meine Spiele" : "Offene Spiele"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-20">
        {loading ? (
          <FullLoading />
        ) : games.length === 0 ? (
          <EmptyState
            icon={<CalendarIcon size={44} />}
            title={mode === "mine" ? "Keine Spiele geplant" : "Keine offenen Spiele"}
            message="Erstelle ein Spiel und finde Mitspieler."
          />
        ) : (
          <ul className="space-y-3">
            {games.map((g) => {
              const accepted =
                g.participants?.filter((p) => p.status === "accepted").length ??
                0;
              const cap = g.max_participants ?? (g.game_type === "singles" ? 2 : 4);
              return (
                <li key={g.id}>
                  <button
                    type="button"
                    onClick={() =>
                      openSubView({ type: "game-detail", gameId: g.id })
                    }
                    className="block w-full rounded-2xl bg-zinc-900 p-4 text-left"
                  >
                    <p className="font-semibold">
                      <SportIcon sport={g.sport} size={14} className="mr-0.5 inline-block align-[-2px]" /> {sportLabel(g.sport)} ·{" "}
                      {g.game_type === "singles" ? "Singles" : "Doubles"}
                    </p>
                    <p className="mt-1 text-sm text-zinc-300">
                      <CalendarIcon size={14} className="mr-1 inline-block align-[-2px]" />
                      {formatEventDate(g.date_time)}
                    </p>
                    <p className="text-sm text-zinc-400">
                      <MapPinIcon size={14} className="mr-1 inline-block align-[-2px]" />
                      {g.location}
                      {g.court_number ? `, ${g.court_number}` : ""}
                    </p>
                    <p className="mt-1 text-sm text-zinc-400">
                      <UsersIcon size={14} className="mr-1 inline-block align-[-2px]" />
                      {accepted}/{cap} Teilnehmer
                    </p>
                    <span className="mt-2 inline-block rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                      {STATUS_LABEL[g.status] ?? g.status}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={() => openSubView({ type: "create-game" })}
        className="absolute bottom-4 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-matchup text-white shadow-lg"
        aria-label="Spiel erstellen"
      >
        <PlusIcon size={26} />
      </button>
    </div>
  );
}
