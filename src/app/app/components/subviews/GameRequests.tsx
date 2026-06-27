"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { skillLabel } from "@/lib/utils/formatters";
import type { GameParticipant } from "@/lib/types";
import Avatar from "../shared/Avatar";
import { FullLoading, EmptyState, SubViewHeader } from "../shared/ui";

export default function GameRequests({ gameId }: { gameId: string }) {
  const [requests, setRequests] = useState<GameParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("game_participants")
      .select("*, profile:profiles(*)")
      .eq("game_event_id", gameId)
      .eq("status", "requested");
    setRequests((data as GameParticipant[]) ?? []);
    setLoading(false);
  }, [gameId]);

  useEffect(() => {
    load();
  }, [load]);

  async function respond(id: string, status: "accepted" | "declined") {
    await supabase
      .from("game_participants")
      .update({
        status,
        confirmed_at: status === "accepted" ? new Date().toISOString() : null,
      })
      .eq("id", id);
    setRequests((r) => r.filter((x) => x.id !== id));
  }

  return (
    <div className="flex h-full flex-col">
      <SubViewHeader title="Anfragen" />
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <FullLoading />
        ) : requests.length === 0 ? (
          <EmptyState icon="📭" title="Keine Anfragen" message="Aktuell warten keine Anfragen." />
        ) : (
          <ul className="divide-y divide-zinc-800">
            {requests.map((r) => (
              <li key={r.id} className="flex items-center gap-3 p-4">
                <Avatar
                  src={r.profile?.profile_image}
                  alt={r.profile?.first_name}
                  size="md"
                />
                <div className="flex-1">
                  <p className="font-semibold">{r.profile?.first_name}</p>
                  <p className="text-xs text-zinc-400">
                    {r.profile && skillLabel(r.profile.skill_level)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => respond(r.id, "accepted")}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-matchup"
                  aria-label="Annehmen"
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => respond(r.id, "declined")}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800"
                  aria-label="Ablehnen"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
