"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatEventDate, sportLabel } from "@/lib/utils/formatters";
import { SportIcon, CalendarIcon, MapPinIcon } from "../shared/icons";
import type { GameEvent } from "@/lib/types";
import { useT } from "@/lib/i18n";
import { useAppNav } from "../appNav";
import Avatar from "../shared/Avatar";
import { FullLoading, SubViewHeader } from "../shared/ui";

const STATUS_KEY: Record<string, string> = {
  planned: "games.statusPlanned",
  confirmed: "games.statusConfirmed",
  cancelled: "games.statusCancelled",
  completed: "games.statusCompleted",
};

type GameResultRow = {
  id: string;
  status: "pending" | "confirmed" | "disputed";
  reporter_id: string;
  side_a: string[];
  side_b: string[];
  score: string | null;
  winner: "a" | "b";
};

export default function GameDetail({ gameId }: { gameId: string }) {
  const t = useT();
  const { profile, openSubView, closeSubView } = useAppNav();
  const [game, setGame] = useState<GameEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<GameResultRow | null>(null);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data }, { data: r }] = await Promise.all([
      supabase
        .from("game_events")
        .select(
          `*, creator:profiles!game_events_created_by_fkey(*),
           participants:game_participants(*, profile:profiles(*))`,
        )
        .eq("id", gameId)
        .maybeSingle(),
      supabase
        .from("game_results")
        .select("id, status, reporter_id, side_a, side_b, score, winner")
        .eq("game_event_id", gameId)
        .maybeSingle(),
    ]);
    setGame(data as GameEvent | null);
    setResult((r as GameResultRow | null) ?? null);
    setLoading(false);
  }, [gameId]);

  async function confirmResult(action: "confirm" | "dispute") {
    if (!result || working) return;
    setWorking(true);
    await supabase.rpc("confirm_result", { p_result: result.id, p_action: action });
    setWorking(false);
    load();
  }

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !game) return <FullLoading />;

  const isCreator = game.created_by === profile.id;
  const myPart = game.participants?.find((p) => p.user_id === profile.id);
  const accepted = game.participants?.filter((p) => p.status === "accepted") ?? [];
  const requests =
    game.participants?.filter((p) => p.status === "requested") ?? [];

  // Ergebnis-Status
  const nameById = new Map<string, string>();
  if (game.creator?.id)
    nameById.set(game.creator.id, game.creator.first_name || game.creator.display_name || "?");
  (game.participants ?? []).forEach((p) => {
    if (p.profile?.id)
      nameById.set(p.profile.id, p.profile.first_name || p.profile.display_name || "?");
  });
  const inSides =
    !!result && (result.side_a.includes(profile.id) || result.side_b.includes(profile.id));
  const amOpponent =
    !!result &&
    result.status === "pending" &&
    inSides &&
    result.reporter_id !== profile.id;
  const reporterName = result ? nameById.get(result.reporter_id) ?? "" : "";

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
    if (!window.confirm(t("games.cancelGameConfirm"))) return;
    await supabase
      .from("game_events")
      .update({ status: "cancelled" })
      .eq("id", gameId);
    closeSubView();
  }

  return (
    <div className="flex h-full flex-col">
      <SubViewHeader title={t("games.detailTitle")} />
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <div>
          <h1 className="text-xl font-bold">
            <SportIcon sport={game.sport} size={14} className="mr-0.5 inline-block align-[-2px]" /> {sportLabel(game.sport)} ·{" "}
            {game.game_type === "singles" ? t("games.singles") : t("games.doubles")}
          </h1>
          <span className="mt-2 inline-block rounded-full bg-zinc-800 px-3 py-1 text-xs">
            {STATUS_KEY[game.status] ? t(STATUS_KEY[game.status]) : game.status}
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
            {game.court_booked ? t("games.courtBookedYes") : t("games.courtBookedNo")}
          </li>
          {game.description && <li>{game.description}</li>}
        </ul>

        <div>
          <h2 className="mb-2 text-xs font-bold uppercase text-zinc-500">
            {t("games.participantsHeading", {
              current: accepted.length,
              max:
                game.max_participants ?? (game.game_type === "singles" ? 2 : 4),
            })}
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
            {t("games.manageRequests", { count: requests.length })}
          </button>
        )}
      </div>

      <div className="shrink-0 space-y-3 border-t border-zinc-800 p-5">
        {/* Ergebnis-Status */}
        {result?.status === "confirmed" && (
          <div className="rounded-xl bg-emerald-500/10 px-4 py-3 text-center text-sm font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
            {t("games.resultConfirmedTag")}
            {result.score ? ` · ${result.score}` : ""}
          </div>
        )}
        {result?.status === "disputed" && (
          <div className="rounded-xl bg-zinc-800 px-4 py-3 text-center text-sm text-zinc-400">
            {t("games.resultDisputedNote")}
          </div>
        )}
        {result?.status === "pending" && amOpponent && (
          <div className="space-y-3 rounded-2xl bg-zinc-900 p-4 ring-1 ring-matchup/30">
            <p className="text-sm font-semibold text-white">{t("games.resultConfirmTitle")}</p>
            {result.score && (
              <p className="text-2xl font-bold tabular-nums text-white">{result.score}</p>
            )}
            {reporterName && (
              <p className="text-xs text-zinc-500">
                {t("games.resultReportedBy", { name: reporterName })}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={working}
                onClick={() => confirmResult("dispute")}
                className="flex-1 rounded-full border border-zinc-700 py-3 text-sm font-semibold text-zinc-300 disabled:opacity-50"
              >
                {t("games.resultDisputeBtn")}
              </button>
              <button
                type="button"
                disabled={working}
                onClick={() => confirmResult("confirm")}
                className="flex-1 rounded-full bg-matchup py-3 text-sm font-bold text-white hover:bg-matchup-hover disabled:opacity-50"
              >
                {t("games.resultConfirmBtn")}
              </button>
            </div>
          </div>
        )}
        {result?.status === "pending" && !amOpponent && (
          <p className="text-center text-sm text-zinc-400">
            {t("games.resultAwaitingConfirm")}
          </p>
        )}

        {(isCreator || myPart) && (
          <>
            {!result && (
              <button
                type="button"
                onClick={() => openSubView({ type: "game-result", gameId })}
                className="w-full rounded-full bg-matchup py-3.5 text-sm font-bold text-white hover:bg-matchup-hover"
              >
                {t("games.resultButton")}
              </button>
            )}
            <button
              type="button"
              onClick={() => openSubView({ type: "game-review", gameId })}
              className="w-full rounded-full border border-zinc-700 py-3.5 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              {t("games.reviewButton")}
            </button>
          </>
        )}
        {isCreator ? (
          <>
            <button
              type="button"
              onClick={() => openSubView({ type: "edit-game", gameId })}
              className="w-full rounded-full bg-matchup py-3.5 text-sm font-bold text-white hover:bg-matchup-hover"
            >
              {t("games.editGame")}
            </button>
            <button
              type="button"
              onClick={cancelGame}
              className="w-full rounded-full bg-zinc-800 py-3.5 text-sm font-semibold text-zinc-300"
            >
              {t("games.cancelGame")}
            </button>
          </>
        ) : myPart ? (
          <button
            type="button"
            onClick={leave}
            className="w-full rounded-full border border-zinc-700 py-3.5 text-sm font-semibold"
          >
            {myPart.status === "requested"
              ? t("games.withdrawRequest")
              : t("games.leave")}
          </button>
        ) : (
          <button
            type="button"
            onClick={join}
            className="w-full rounded-full bg-matchup py-3.5 text-sm font-bold text-white"
          >
            {t("games.join")}
          </button>
        )}
      </div>
    </div>
  );
}
