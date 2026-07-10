"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { haversineKm } from "@/lib/utils/haversine";
import { skillLabel, formatDistance } from "@/lib/utils/formatters";
import { SportIcon, FilterIcon, CheckIcon, MapPinIcon } from "../shared/icons";
import type { Profile, FilterState } from "@/lib/types";
import { defaultFilters } from "@/lib/types";
import { ensureMatch } from "@/lib/matchmaking";
import { useT } from "@/lib/i18n";
import { useAppNav } from "../appNav";
import { FullLoading, EmptyState, SubViewHeader } from "../shared/ui";
import MatchAnimation from "../shared/MatchAnimation";
import FilterSheet from "../tabs/FilterSheet";

const SKILL_ORDER = ["beginner", "intermediate", "advanced", "competitive"];

export default function BrowsePeople() {
  const t = useT();
  const { profile, openSubView, refreshBadges } = useAppNav();
  const [candidates, setCandidates] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<FilterState>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem("mu_discover_filters");
        if (raw) return { ...defaultFilters, ...JSON.parse(raw) };
      } catch { /* ignore */ }
    }
    return defaultFilters;
  });
  const [matchWith, setMatchWith] = useState<Profile | null>(null);
  const [requested, setRequested] = useState<Set<string>>(new Set());

  useEffect(() => {
    try { window.localStorage.setItem("mu_discover_filters", JSON.stringify(filters)); } catch { /* ignore */ }
  }, [filters]);

  const load = useCallback(async () => {
    setLoading(true);
    const since = new Date(Date.now() - 14 * 86400000).toISOString();
    const [blocksRes, likesRes, matchesRes, skipsRes] = await Promise.all([
      supabase.from("blocks").select("blocked_id, blocker_id").or(`blocker_id.eq.${profile.id},blocked_id.eq.${profile.id}`),
      supabase.from("likes").select("to_user_id").eq("from_user_id", profile.id).gte("created_at", since),
      supabase.from("matches").select("user1_id, user2_id").or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`),
      supabase.from("skips").select("skipped_user_id").eq("user_id", profile.id).gte("skipped_at", since),
    ]);

    const exclude = new Set<string>([profile.id]);
    (blocksRes.data ?? []).forEach((b) => { exclude.add(b.blocked_id); exclude.add(b.blocker_id); });
    (matchesRes.data ?? []).forEach((m) => exclude.add(m.user1_id === profile.id ? m.user2_id : m.user1_id));
    const alreadyRequested = new Set<string>((likesRes.data ?? []).map((l) => l.to_user_id).filter((id) => !exclude.has(id)));
    (skipsRes.data ?? []).forEach((s) => exclude.add(s.skipped_user_id));

    const { data: raw } = await supabase
      .from("profiles").select("*")
      .eq("is_paused", false).eq("is_banned", false).eq("is_seed", false)
      .order("last_active", { ascending: false }).limit(300);

    const effectiveSports = filters.sports.length ? filters.sports : profile.sports;
    const filtered = ((raw as Profile[]) ?? []).filter((c) => {
      if (exclude.has(c.id)) return false;
      if (effectiveSports?.length && !effectiveSports.some((s) => c.sports?.includes(s))) return false;
      if (filters.gender && c.gender !== filters.gender) return false;
      if (filters.skillLevels.length && !filters.skillLevels.includes(c.skill_level)) return false;
      if (c.age < filters.ageMin || c.age > filters.ageMax) return false;
      if (filters.clubId && c.club_id !== filters.clubId) return false;
      if (filters.radius < 201 && profile.latitude && profile.longitude && c.latitude && c.longitude) {
        const dist = haversineKm(profile.latitude, profile.longitude, c.latitude, c.longitude);
        if (dist > filters.radius) return false;
        c._distance = dist;
      }
      return true;
    });

    filtered.sort((a, b) => {
      const mySkill = SKILL_ORDER.indexOf(profile.skill_level);
      const diffA = Math.abs(SKILL_ORDER.indexOf(a.skill_level) - mySkill);
      const diffB = Math.abs(SKILL_ORDER.indexOf(b.skill_level) - mySkill);
      if (diffA !== diffB) return diffA - diffB;
      if (a._distance !== undefined && b._distance !== undefined) return a._distance - b._distance;
      return new Date(b.last_active).getTime() - new Date(a.last_active).getTime();
    });

    setRequested(alreadyRequested);
    setCandidates(filtered);
    setLoading(false);
  }, [profile, filters]);

  useEffect(() => { load(); }, [load]);

  async function connect(target: Profile) {
    setRequested((prev) => new Set(prev).add(target.id));
    await supabase.from("likes").upsert({ from_user_id: profile.id, to_user_id: target.id }, { onConflict: "from_user_id,to_user_id" });
    const { data: reverse } = await supabase.from("likes").select("id").eq("from_user_id", target.id).eq("to_user_id", profile.id).maybeSingle();
    if (reverse) { await ensureMatch(profile.id, target.id); setMatchWith(target); }
    refreshBadges();
  }

  function dist(c: Profile): string | null {
    if (c._distance !== undefined) return formatDistance(c._distance);
    if (profile.latitude && profile.longitude && c.latitude && c.longitude)
      return formatDistance(haversineKm(profile.latitude, profile.longitude, c.latitude, c.longitude));
    return null;
  }

  return (
    <div className="flex h-full flex-col bg-white text-neutral-900">
      <SubViewHeader
        light
        title={t("discover.newPeople")}
        rightActions={
          <button
            type="button"
            onClick={() => setShowFilter(true)}
            aria-label={t("discover.filter")}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-black/[0.04] text-neutral-700"
          >
            <FilterIcon size={18} />
          </button>
        }
      />

      {loading ? (
        <FullLoading />
      ) : candidates.length === 0 ? (
        <EmptyState icon={<FilterIcon size={44} />} title={t("discover.emptyTitle")} message={t("discover.emptyMessage")} actionLabel={t("discover.emptyAction")} onAction={() => setShowFilter(true)} />
      ) : (
        <div className="flex-1 overflow-y-auto p-3 pb-24">
          <div className="grid grid-cols-3 gap-2.5">
            {candidates.map((p) => {
              const d = dist(p);
              const req = requested.has(p.id);
              return (
                <div key={p.id} className="overflow-hidden rounded-xl bg-black/[0.04]">
                  <button type="button" onClick={() => openSubView({ type: "full-profile", userId: p.id })} className="relative block aspect-[3/4] w-full bg-neutral-200 text-left">
                    {p.profile_image && <img src={p.profile_image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-2 pt-8">
                      <h2 className="truncate text-[13px] font-bold leading-tight text-white">{p.first_name}, {p.age}</h2>
                      <p className="mt-0.5 flex items-center gap-1 text-[10px] text-zinc-300"><SportIcon sport={p.sports[0]} size={11} /><span className="truncate">{skillLabel(p.skill_level)}</span></p>
                      {d && <p className="mt-0.5 flex items-center gap-0.5 text-[10px] text-zinc-400"><MapPinIcon size={10} /><span className="truncate">{d}</span></p>}
                    </div>
                  </button>
                  <div className="p-1.5">
                    <button type="button" onClick={() => connect(p)} disabled={req} className={`flex w-full items-center justify-center gap-1 rounded-full py-1.5 text-[11px] font-bold transition-colors ${req ? "bg-black/[0.06] text-neutral-400" : "bg-matchup text-white hover:bg-matchup-hover"}`}>
                      <CheckIcon size={13} /> {req ? t("discover.requested") : t("discover.connect")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showFilter && (
        <FilterSheet
          filters={filters}
          onApply={(f) => { setFilters(f); setShowFilter(false); }}
          onClose={() => setShowFilter(false)}
        />
      )}

      {matchWith && (
        <MatchAnimation
          me={profile}
          other={matchWith}
          onSuggestGame={() => { const id = matchWith.id; setMatchWith(null); openSubView({ type: "create-game", invite: id }); }}
          onMessage={async () => {
            const [u1, u2] = [profile.id, matchWith.id].sort();
            const { data } = await supabase.from("matches").select("id").eq("user1_id", u1).eq("user2_id", u2).maybeSingle();
            setMatchWith(null);
            if (data) openSubView({ type: "chat", matchId: data.id });
          }}
          onContinue={() => setMatchWith(null)}
        />
      )}
    </div>
  );
}
