"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useT } from "@/lib/i18n";
import { useAppNav } from "../appNav";
import Avatar from "../shared/Avatar";
import { FullLoading, SubViewHeader, EmptyState } from "../shared/ui";
import { UsersIcon } from "../shared/icons";

type Row = { id: string; name: string; image: string | null; score: number };
type Scope = "club" | "friends" | "global";

type LooseProfile = {
  id: string;
  first_name?: string | null;
  display_name?: string | null;
  profile_image?: string | null;
  match_score?: number | null;
};

function toRow(p: LooseProfile): Row {
  return {
    id: p.id,
    name: p.first_name || p.display_name || "?",
    image: p.profile_image ?? null,
    score: p.match_score ?? 1000,
  };
}

export default function Leaderboard() {
  const t = useT();
  const { profile } = useAppNav();
  const hasClub = !!profile.club_id;
  const [scope, setScope] = useState<Scope>(hasClub ? "club" : "friends");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const sel = "id, first_name, display_name, profile_image, match_score";
    let list: LooseProfile[] = [];

    if (scope === "global") {
      const { data } = await supabase
        .from("profiles")
        .select(sel)
        .order("match_score", { ascending: false })
        .limit(50);
      list = (data as LooseProfile[]) ?? [];
    } else if (scope === "club") {
      const { data } = await supabase
        .from("profiles")
        .select(sel)
        .eq("club_id", profile.club_id)
        .order("match_score", { ascending: false })
        .limit(100);
      list = (data as LooseProfile[]) ?? [];
    } else {
      // Freunde = gematchte Spieler (+ ich selbst)
      const { data } = await supabase
        .from("matches")
        .select(
          `user1:profiles!matches_user1_id_fkey(${sel}),
           user2:profiles!matches_user2_id_fkey(${sel})`,
        )
        .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
        .eq("is_active", true);
      const acc: LooseProfile[] = [profile as unknown as LooseProfile];
      (data ?? []).forEach((m) => {
        const row = m as unknown as { user1?: LooseProfile; user2?: LooseProfile };
        if (row.user1) acc.push(row.user1);
        if (row.user2) acc.push(row.user2);
      });
      list = acc;
    }

    // dedupe + sortieren
    const seen = new Set<string>();
    const deduped = list.filter((p) => {
      if (!p?.id || seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
    const sorted = deduped.map(toRow).sort((a, b) => b.score - a.score);
    setRows(sorted);
    setLoading(false);
  }, [scope, profile]);

  useEffect(() => {
    load();
  }, [load]);

  const scopes = useMemo<Scope[]>(
    () => (hasClub ? ["club", "friends", "global"] : ["friends", "global"]),
    [hasClub],
  );

  return (
    <div className="flex h-full flex-col">
      <SubViewHeader title={t("profile.leaderboard")} />

      <div className="flex shrink-0 gap-2 p-3">
        {scopes.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScope(s)}
            className={`flex-1 rounded-full py-2 text-sm font-semibold ${
              scope === s ? "bg-matchup text-white" : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {s === "club" ? t("profile.lbClub") : s === "friends" ? t("profile.lbFriends") : t("profile.lbGlobal")}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-8">
        {loading ? (
          <FullLoading />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<UsersIcon size={44} />}
            title={t("profile.lbEmpty")}
            message={t("profile.lbEmptyHint")}
          />
        ) : (
          <ul className="space-y-2">
            {rows.map((r, i) => {
              const me = r.id === profile.id;
              const rank = i + 1;
              const medal = rank <= 3;
              return (
                <li
                  key={r.id}
                  className={`flex items-center gap-3 rounded-2xl p-3 ${
                    me ? "bg-matchup/15 ring-1 ring-matchup/40" : "bg-zinc-900"
                  }`}
                >
                  <span
                    className={`w-7 shrink-0 text-center text-sm font-bold ${
                      medal ? "text-matchup" : "text-zinc-500"
                    }`}
                  >
                    {rank}
                  </span>
                  <Avatar src={r.image} alt={r.name} size="md" />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {r.name}
                    {me && <span className="ml-1 text-xs text-matchup">· {t("profile.lbYou")}</span>}
                  </span>
                  <span className="shrink-0 text-base font-bold tabular-nums text-white">
                    {r.score}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
