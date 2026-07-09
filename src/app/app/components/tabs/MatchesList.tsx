"use client";

import { useCallback, useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { timeAgo, isOnline } from "@/lib/utils/formatters";
import type { AppMatch, Like, Message, Profile } from "@/lib/types";
import { useAppNav } from "../appNav";
import Avatar from "../shared/Avatar";
import { MessageIcon } from "../shared/icons";
import { FullLoading, EmptyState } from "../shared/ui";

export default function MatchesList() {
  const t = useT();
  const { profile, setActiveTab, openSubView } = useAppNav();
  const [matches, setMatches] = useState<AppMatch[]>([]);
  const [requests, setRequests] = useState<Like[]>([]);
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

    // Offene Anfragen = eingehende Likes ohne bestehendes Match (oben im Chat).
    const { data: likeRows } = await supabase
      .from("likes")
      .select("*, from_user:profiles!likes_from_user_id_fkey(*)")
      .eq("to_user_id", profile.id)
      .order("created_at", { ascending: false });
    const matchedIds = new Set<string>(
      rows.map((m) => (m.user1_id === profile.id ? m.user2_id : m.user1_id)),
    );
    setRequests(((likeRows as Like[]) ?? []).filter((l) => !matchedIds.has(l.from_user_id)));

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

  const RequestsStrip = requests.length > 0 && (
    <div className="border-b border-zinc-800 px-4 py-3">
      <p className="mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-zinc-500">
        {t("discover.requestsTitle", { count: requests.length })}
      </p>
      <div className="no-scrollbar flex gap-3.5 overflow-x-auto">
        {requests.map((r) => {
          const u = r.from_user;
          if (!u) return null;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => openSubView({ type: "full-profile", userId: u.id })}
              className="flex w-[62px] shrink-0 flex-col items-center gap-1.5"
            >
              <span className="block h-[60px] w-[60px] rounded-full bg-gradient-to-br from-matchup to-indigo-500 p-[2px]">
                <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-zinc-700 text-sm font-bold text-white ring-[2.5px] ring-black">
                  {u.profile_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.profile_image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (u.first_name?.[0] ?? "?").toUpperCase()
                  )}
                </span>
              </span>
              <span className="max-w-[62px] truncate text-[11px] font-medium text-zinc-300">{u.first_name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  if (matches.length === 0)
    return (
      <div>
        {RequestsStrip}
        <EmptyState
          icon={<MessageIcon size={44} />}
          title={t("matches.emptyTitle")}
          message={t("matches.emptyMessage")}
          actionLabel={t("matches.emptyAction")}
          onAction={() => setActiveTab("discover")}
        />
      </div>
    );

  return (
    <div>
      {RequestsStrip}
      <ul className="divide-y divide-zinc-800">
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
                    {m.last_message?.content ?? t("matches.sayHello")}
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
    </div>
  );
}
