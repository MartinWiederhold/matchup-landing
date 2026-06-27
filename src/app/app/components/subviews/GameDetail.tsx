"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatEventDate, sportLabel } from "@/lib/utils/formatters";
import { SportIcon, CalendarIcon, MapPinIcon } from "../shared/icons";
import type { GameEvent } from "@/lib/types";
import { useAppNav } from "../appNav";
import Avatar from "../shared/Avatar";
import { FullLoading, SubViewHeader } from "../shared/ui";

export default function GameDetail({ gameId }: { gameId: string }) {
  const { profile, openSubView, closeSubView } = useAppNav();
  const [game, setGame] = useState<GameEvent | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("game_events")
      .select(
        `*, creator:profiles!game_events_created_by_fkey(*),
         participants:game_participants(*, profile:profiles(*))`,
      )
      .eq("id", gameId)
      .maybeSingle();
    setGame(data as GameEvent | null);
    setLoading(false);
  }, [gameId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !game) return <FullLoading />;

  const isCreator = game.created_by === profile.id;
  const myPart = game.participants?.find((p) => p.user_id === profile.id);
  const accepted = game.participants?.filter((p) => p.status === "accepted") ?? [];
  const requests =
    game.participants?.filter((p) => p.status === "requested") ?? [];

  async function join() {
    await supabase.from("game_participants").insert({
      game_event_id: gameId,
      user_id: profile.id,
      status: "requested",
      requested_at: new Date().toISOString(),
    });
    load();
  }
  async function leave() {
    await supabase
      .from("game_participants")
      .delete()
      .eq("game_event_id", gameId)
      .eq("user_id", profile.id);
    load();
  }
  async function cancelGame() {
    if (!window.confirm("Spiel wirklich absagen?")) return;
    await supabase
      .from("game_events")
      .update({ status: "cancelled" })
      .eq("id", gameId);
    closeSubView();
  }

  return (
    <div className="flex h-full flex-col">
      <SubViewHeader title="Spiel-Details" />
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <div>
          <h1 className="text-xl font-bold">
            <SportIcon sport={game.sport} size={14} className="mr-0.5 inline-block align-[-2px]" /> {sportLabel(game.sport)} ·{" "}
            {game.game_type === "singles" ? "Singles" : "Doubles"}
          </h1>
          <span className="mt-2 inline-block rounded-full bg-zinc-800 px-3 py-1 text-xs">
            {game.status}
          </span>
        </div>

        <ul className="space-y-1.5 text-sm text-zinc-300">
          <li className="flex items-center gap-2">
            <CalendarIcon size={15} className="shrink-0" />
            {formatEventDate(game.date_time)}
          </li>
          <li className="flex items-center gap-2">
            <MapPinIcon size={15} className="shrink-0" />
            <span>
              {game.location}
              {game.court_number ? `, ${game.court_number}` : ""}
            </span>
          </li>
          <li>
            {game.court_booked ? "Platz gebucht" : "Platz nicht gebucht"}
          </li>
          {game.description && <li>{game.description}</li>}
        </ul>

        <div>
          <h2 className="mb-2 text-xs font-bold uppercase text-zinc-500">
            Teilnehmer ({accepted.length}/
            {game.max_participants ?? (game.game_type === "singles" ? 2 : 4)})
          </h2>
          <div className="flex flex-wrap gap-3">
            {accepted.map((p) => (
              <div key={p.id} className="flex flex-col items-center gap-1">
                <Avatar
                  src={p.profile?.profile_image}
                  alt={p.profile?.first_name}
                  size="md"
                />
                <span className="text-xs">{p.profile?.first_name}</span>
              </div>
            ))}
          </div>
        </div>

        {isCreator && requests.length > 0 && (
          <button
            type="button"
            onClick={() => openSubView({ type: "game-requests", gameId })}
            className="w-full rounded-full border border-zinc-700 py-3 text-sm font-semibold"
          >
            Anfragen verwalten ({requests.length})
          </button>
        )}
      </div>

      <div className="shrink-0 space-y-3 border-t border-zinc-800 p-5">
        {isCreator ? (
          <button
            type="button"
            onClick={cancelGame}
            className="w-full rounded-full bg-red-500/90 py-3.5 text-sm font-bold text-white"
          >
            Spiel absagen
          </button>
        ) : myPart ? (
          <button
            type="button"
            onClick={leave}
            className="w-full rounded-full border border-zinc-700 py-3.5 text-sm font-semibold"
          >
            {myPart.status === "requested" ? "Anfrage zurückziehen" : "Verlassen"}
          </button>
        ) : (
          <button
            type="button"
            onClick={join}
            className="w-full rounded-full bg-matchup py-3.5 text-sm font-bold text-white"
          >
            Beitreten
          </button>
        )}
      </div>
    </div>
  );
}
