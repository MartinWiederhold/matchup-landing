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
import { useT } from "@/lib/i18n";
import { useAppNav } from "../appNav";
import { FullLoading, EmptyState } from "../shared/ui";

const STATUS_KEY: Record<string, string> = {
  planned: "games.statusPlanned",
  confirmed: "games.statusConfirmed",
  cancelled: "games.statusCancelled",
  completed: "games.statusCompleted",
};

type ResultInfo = {
  score: string | null;
  status: "pending" | "confirmed" | "disputed";
  reporter_id: string;
  sides: string[];
};

export default function GamesTab() {
  const t = useT();
  const { profile, openSubView } = useAppNav();
  const [mode, setMode] = useState<"mine" | "open" | "past">("mine");
  const [games, setGames] = useState<GameEvent[]>([]);
  const [results, setResults] = useState<Record<string, ResultInfo>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setResults({});
    const nowIso = new Date().toISOString();
    const select = `*,
      creator:profiles!game_events_created_by_fkey(display_name, first_name, profile_image),
      participants:game_participants(*, profile:profiles(display_name, first_name, profile_image))`;

    if (mode === "mine" || mode === "past") {
      // „Meine" (kommend) bzw. „Gespielt" (vergangen) = selbst erstellt ODER
      // Teilnehmer. Embedded-Filter geht nicht in .or(), daher Queries + Merge.
      const upcoming = mode === "mine";
      const applyTime = (
        q: ReturnType<ReturnType<typeof supabase.from>["select"]>,
      ) => (upcoming ? q.gte("date_time", nowIso) : q.lt("date_time", nowIso));

      const [created, parts] = await Promise.all([
        applyTime(
          supabase.from("game_events").select(select).eq("created_by", profile.id),
        ),
        supabase
          .from("game_participants")
          .select("game_event_id")
          .eq("user_id", profile.id),
      ]);
      const partIds = (parts.data ?? [])
        .map((p) => p.game_event_id)
        .filter(Boolean);
      let joined: GameEvent[] = [];
      if (partIds.length) {
        const { data } = await applyTime(
          supabase.from("game_events").select(select).in("id", partIds),
        );
        joined = (data as GameEvent[]) ?? [];
      }
      const merged = [...((created.data as GameEvent[]) ?? []), ...joined];
      const uniq = Array.from(new Map(merged.map((g) => [g.id, g])).values()).sort(
        (a, b) => {
          const ta = new Date(a.date_time).getTime();
          const tb = new Date(b.date_time).getTime();
          return upcoming ? ta - tb : tb - ta; // kommend aufsteigend, gespielt neueste zuerst
        },
      );
      setGames(uniq);

      // Für vergangene Spiele bereits erfasste Ergebnisse laden (Score-Anzeige).
      if (!upcoming && uniq.length) {
        const { data: res } = await supabase
          .from("game_results")
          .select("game_event_id, score, status, reporter_id, side_a, side_b")
          .in(
            "game_event_id",
            uniq.map((g) => g.id),
          );
        const map: Record<string, ResultInfo> = {};
        (
          res as
            | {
                game_event_id: string;
                score: string | null;
                status: ResultInfo["status"];
                reporter_id: string;
                side_a: string[] | null;
                side_b: string[] | null;
              }[]
            | null
        )?.forEach((r) => {
          if (!map[r.game_event_id])
            map[r.game_event_id] = {
              score: r.score,
              status: r.status,
              reporter_id: r.reporter_id,
              sides: [...(r.side_a ?? []), ...(r.side_b ?? [])],
            };
        });
        setResults(map);
      }
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
        {(["mine", "open", "past"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 rounded-full py-2 text-sm font-semibold ${
              mode === m ? "bg-matchup text-white" : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {m === "mine" ? t("games.mine") : m === "open" ? t("games.open") : t("games.past")}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-20">
        {loading ? (
          <FullLoading />
        ) : games.length === 0 ? (
          <EmptyState
            icon={<CalendarIcon size={44} />}
            title={
              mode === "mine"
                ? t("games.emptyMineTitle")
                : mode === "open"
                  ? t("games.emptyOpenTitle")
                  : t("games.emptyPastTitle")
            }
            message={mode === "past" ? t("games.emptyPastMessage") : t("games.emptyMessage")}
          />
        ) : (
          <ul className="space-y-3">
            {games.map((g) => {
              const accepted =
                g.participants?.filter((p) => p.status === "accepted").length ??
                0;
              const cap = g.max_participants ?? (g.game_type === "singles" ? 2 : 4);
              const people: { first_name?: string; profile_image?: string | null }[] = [
                ...(g.creator ? [g.creator] : []),
                ...(g.participants ?? [])
                  .filter((p) => p.status === "accepted" && p.profile)
                  .map((p) => p.profile!),
              ];
              return (
                <li key={g.id}>
                  <button
                    type="button"
                    onClick={() =>
                      openSubView({ type: "game-detail", gameId: g.id })
                    }
                    className="flex w-full items-start gap-3 rounded-2xl bg-zinc-900 p-4 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">
                        <SportIcon sport={g.sport} size={14} className="mr-0.5 inline-block align-[-2px]" /> {sportLabel(g.sport)} ·{" "}
                        {g.game_type === "singles" ? t("games.singles") : t("games.doubles")}
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
                        {t("games.participants", { count: `${accepted}/${cap}` })}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="inline-block rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                          {STATUS_KEY[g.status] ? t(STATUS_KEY[g.status]) : g.status}
                        </span>
                        {mode === "past" &&
                          (() => {
                            const r = results[g.id];
                            if (!r) {
                              return (
                                <span className="inline-block text-xs font-semibold text-matchup">
                                  {t("games.logResultHint")}
                                </span>
                              );
                            }
                            if (r.status === "confirmed") {
                              return (
                                <span className="inline-block rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
                                  {t("games.resultTag", { score: r.score ?? "" })}
                                </span>
                              );
                            }
                            if (r.status === "disputed") {
                              return (
                                <span className="inline-block rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-400">
                                  {t("games.resultDisputedTag")}
                                </span>
                              );
                            }
                            // pending
                            const amOpp =
                              r.sides.includes(profile.id) && r.reporter_id !== profile.id;
                            return amOpp ? (
                              <span className="inline-block rounded-full bg-matchup/20 px-3 py-1 text-xs font-semibold text-matchup ring-1 ring-matchup/40">
                                {t("games.resultConfirmBtn")} →
                              </span>
                            ) : (
                              <span className="inline-block rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-400">
                                {t("games.resultAwaitingConfirm")}
                              </span>
                            );
                          })()}
                      </div>
                    </div>

                    <div className="grid shrink-0 grid-cols-2 gap-1.5">
                      {Array.from({ length: cap }).map((_, i) => {
                        const person = people[i];
                        return person ? (
                          <span
                            key={i}
                            className="h-9 w-9 overflow-hidden rounded-full bg-zinc-800 ring-1 ring-white/10"
                          >
                            {person.profile_image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={person.profile_image}
                                alt={person.first_name ?? ""}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-xs font-bold text-zinc-400">
                                {person.first_name?.[0] ?? "?"}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span
                            key={i}
                            className="h-9 w-9 rounded-full border-2 border-dashed border-zinc-700"
                          />
                        );
                      })}
                    </div>
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
        aria-label={t("games.createGameAria")}
      >
        <PlusIcon size={26} />
      </button>
    </div>
  );
}
