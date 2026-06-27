"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { skillLabel, sportIcon } from "@/lib/utils/formatters";
import type { Like, Profile } from "@/lib/types";
import { useAppNav } from "../appNav";
import Avatar from "../shared/Avatar";
import { FullLoading, EmptyState } from "../shared/ui";
import MatchAnimation from "../shared/MatchAnimation";

export default function LikesTab() {
  const { profile, setActiveTab, openSubView, refreshBadges } = useAppNav();
  const [likes, setLikes] = useState<Like[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [matchWith, setMatchWith] = useState<Profile | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: likeRows } = await supabase
      .from("likes")
      .select("*, from_user:profiles!likes_from_user_id_fkey(*)")
      .eq("to_user_id", profile.id)
      .order("created_at", { ascending: false });

    const { data: matchRows } = await supabase
      .from("matches")
      .select("user1_id, user2_id")
      .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`);

    const matchedIds = new Set<string>();
    (matchRows ?? []).forEach((m) =>
      matchedIds.add(m.user1_id === profile.id ? m.user2_id : m.user1_id),
    );

    const unmatched = ((likeRows as Like[]) ?? []).filter(
      (l) => !matchedIds.has(l.from_user_id),
    );
    setLikes(unmatched);
    setLoading(false);
  }, [profile.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function likeBack(like: Like) {
    setDismissed((d) => new Set(d).add(like.id));
    await supabase
      .from("likes")
      .upsert(
        { from_user_id: profile.id, to_user_id: like.from_user_id },
        { onConflict: "from_user_id,to_user_id" },
      );
    if (like.from_user) setMatchWith(like.from_user);
    refreshBadges();
  }

  if (loading) return <FullLoading />;

  const visible = likes.filter((l) => !dismissed.has(l.id));

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center justify-center border-b border-zinc-800">
        <span className="font-bold tracking-wide">LIKES ({visible.length})</span>
      </header>

      <div className="flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          <EmptyState
            icon="💤"
            title="Noch keine Likes"
            message="Vervollständige dein Profil und werde sichtbar."
            actionLabel="Entdecken"
            onAction={() => setActiveTab("discover")}
          />
        ) : (
          <ul className="divide-y divide-zinc-800">
            {visible.map((like) => {
              const u = like.from_user;
              if (!u) return null;
              return (
                <li key={like.id} className="flex items-center gap-3 p-4">
                  <button
                    type="button"
                    onClick={() =>
                      openSubView({ type: "full-profile", userId: u.id })
                    }
                  >
                    <Avatar src={u.profile_image} alt={u.first_name} size="md" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {u.first_name}, {u.age}
                    </p>
                    <p className="truncate text-xs text-zinc-400">
                      {sportIcon(u.sports?.[0])} {skillLabel(u.skill_level)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDismissed((d) => new Set(d).add(like.id))}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800"
                      aria-label="Ablehnen"
                    >
                      ✕
                    </button>
                    <button
                      type="button"
                      onClick={() => likeBack(like)}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-matchup"
                      aria-label="Like zurück"
                    >
                      ♥
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {matchWith && (
        <MatchAnimation
          me={profile}
          other={matchWith}
          onMessage={async () => {
            const [u1, u2] = [profile.id, matchWith.id].sort();
            const { data } = await supabase
              .from("matches")
              .select("id")
              .eq("user1_id", u1)
              .eq("user2_id", u2)
              .maybeSingle();
            setMatchWith(null);
            if (data) openSubView({ type: "chat", matchId: data.id });
            else setActiveTab("matches");
          }}
          onContinue={() => setMatchWith(null)}
        />
      )}
    </div>
  );
}
