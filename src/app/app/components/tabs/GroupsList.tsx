"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sportLabel } from "@/lib/utils/formatters";
import { SportIcon, UsersIcon, PlusIcon, CheckIcon } from "../shared/icons";
import type { Group, Sport } from "@/lib/types";
import { useT } from "@/lib/i18n";
import { useAppNav } from "../appNav";
import { FullLoading, EmptyState } from "../shared/ui";

export default function GroupsList() {
  const t = useT();
  const { profile, openSubView } = useAppNav();
  const [mode, setMode] = useState<"all" | "mine">("all");
  const [sport, setSport] = useState<Sport | null>(null);
  const [search, setSearch] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [myIds, setMyIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: memberRows } = await supabase
      .from("group_members")
      .select("group_id, group:groups(*)")
      .eq("user_id", profile.id);
    const mine = new Set<string>((memberRows ?? []).map((r) => r.group_id));
    setMyIds(mine);

    if (mode === "mine") {
      setGroups(
        (memberRows ?? [])
          .map((r) => r.group as unknown as Group)
          .filter(Boolean),
      );
      setLoading(false);
      return;
    }

    let query = supabase
      .from("groups")
      .select("*")
      .order("created_at", { ascending: false });
    if (sport) query = query.eq("sport", sport);
    if (search.trim()) query = query.ilike("name", `%${search}%`);
    const { data } = await query;
    setGroups((data as Group[]) ?? []);
    setLoading(false);
  }, [profile.id, mode, sport, search]);

  useEffect(() => {
    load();
  }, [load]);

  async function join(g: Group) {
    await supabase
      .from("group_members")
      .insert({ group_id: g.id, user_id: profile.id, role: "member" });
    setMyIds((s) => new Set(s).add(g.id));
  }

  return (
    <div className="relative flex h-full flex-col">
      <div className="shrink-0 space-y-3 p-3">
        <div className="flex gap-2">
          {(["all", "mine"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 rounded-full py-2 text-sm font-semibold ${
                mode === m ? "bg-matchup text-white" : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {m === "all" ? t("groups.all") : t("groups.mine")}
            </button>
          ))}
        </div>
        {mode === "all" && (
          <>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("groups.searchPlaceholder")}
              className="w-full rounded-xl bg-zinc-800 px-4 py-2.5 text-sm outline-none"
            />
            <div className="flex gap-2">
              {[null, "tennis", "padel", "pickleball"].map((s) => (
                <button
                  key={s ?? "all"}
                  type="button"
                  onClick={() => setSport(s as Sport | null)}
                  className={`rounded-full px-3 py-1.5 text-xs capitalize ${
                    sport === s
                      ? "bg-matchup/20 text-white ring-1 ring-matchup"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {s ? sportLabel(s) : t("groups.sportAll")}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-20">
        {loading ? (
          <FullLoading />
        ) : groups.length === 0 ? (
          <EmptyState
            icon={<UsersIcon size={44} />}
            title={t("groups.emptyTitle")}
            message={t("groups.emptyMessage")}
          />
        ) : (
          <ul className="space-y-3">
            {groups.map((g) => (
              <li
                key={g.id}
                className="overflow-hidden rounded-2xl bg-zinc-900"
              >
                <button
                  type="button"
                  onClick={() =>
                    openSubView({ type: "group-detail", groupId: g.id })
                  }
                  className="block w-full p-4 text-left"
                >
                  <p className="font-semibold">{g.name}</p>
                  <p className="text-xs text-zinc-400">
                    <SportIcon sport={g.sport} size={14} className="mr-0.5 inline-block align-[-2px]" /> {sportLabel(g.sport)} ·{" "}
                    {t("groups.maxMembers", { count: g.max_members })}
                  </p>
                  {g.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                      {g.description}
                    </p>
                  )}
                </button>
                <div className="px-4 pb-4">
                  {myIds.has(g.id) ? (
                    <span className="flex items-center gap-1 text-sm text-matchup">
                      <CheckIcon size={15} /> {t("groups.member")}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => join(g)}
                      className="rounded-full bg-matchup px-5 py-2 text-sm font-bold text-white"
                    >
                      {t("groups.join")}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={() => openSubView({ type: "create-group" })}
        className="absolute bottom-4 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-matchup text-white shadow-lg"
        aria-label={t("groups.createGroupAria")}
      >
        <PlusIcon size={26} />
      </button>
    </div>
  );
}
