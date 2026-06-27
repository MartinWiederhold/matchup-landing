"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { timeAgo, isOnline } from "@/lib/utils/formatters";
import type { AppMatch, Message, Profile } from "@/lib/types";
import { useAppNav } from "../appNav";
import Avatar from "../shared/Avatar";
import { MessageIcon } from "../shared/icons";
import { FullLoading, EmptyState } from "../shared/ui";

export default function MatchesList() {
  const { profile, setActiveTab, openSubView } = useAppNav();
  const [matches, setMatches] = useState<AppMatch[]>([]);
  const [loading, setLoading] = useState(true);

  const other = useCallback(
    (m: AppMatch): Profile | undefined =>
      m.user1_id === profile.id ? m.user2 : m.user1,
    [profile.id],
  );

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("matches")
      .select(
        `*,
        user1:profiles!matches_user1_id_fkey(id, display_name, first_name, profile_image, last_active),
        user2:profiles!matches_user2_id_fkey(id, display_name, first_name, profile_image, last_active)`,
      )
      .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    const rows = (data as AppMatch[]) ?? [];
    await Promise.all(
      rows.map(async (m) => {
        const { data: msg } = await supabase
          .from("messages")
          .select("content, sender_id, created_at, is_read")
          .eq("match_id", m.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        m.last_message = (msg as Message | null) ?? null;
      }),
    );
    setMatches(rows);
    setLoading(false);
  }, [profile.id]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`all-messages:${profile.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "web", table: "messages" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load, profile.id]);

  if (loading) return <FullLoading />;
  if (matches.length === 0)
    return (
      <EmptyState
        icon={<MessageIcon size={44} />}
        title="Noch keine Matches"
        message="Like Spieler im Discover-Tab!"
        actionLabel="Entdecken"
        onAction={() => setActiveTab("discover")}
      />
    );

  return (
    <ul className="h-full divide-y divide-zinc-800 overflow-y-auto">
      {matches.map((m) => {
        const u = other(m);
        if (!u) return null;
        const unread =
          m.last_message &&
          !m.last_message.is_read &&
          m.last_message.sender_id !== profile.id;
        return (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => openSubView({ type: "chat", matchId: m.id })}
              className="flex w-full items-center gap-3 p-4 text-left"
            >
              <Avatar
                src={u.profile_image}
                alt={u.first_name}
                size="md"
                online={isOnline(u.last_active)}
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{u.first_name}</p>
                <p className="truncate text-sm text-zinc-400">
                  {m.last_message?.content ?? "Sag Hallo"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {m.last_message && (
                  <span className="text-xs text-zinc-500">
                    {timeAgo(m.last_message.created_at)}
                  </span>
                )}
                {unread && <span className="h-2.5 w-2.5 rounded-full bg-matchup" />}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
