"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { haversineKm } from "@/lib/utils/haversine";
import { skillLabel, formatDistance } from "@/lib/utils/formatters";
import {
  SportIcon,
  FilterIcon,
  GridIcon,
  CardsIcon,
  HeartIcon,
  XIcon,
  UsersIcon,
  MapPinIcon,
  CheckIcon,
} from "../shared/icons";
import type { Profile, FilterState } from "@/lib/types";
import { defaultFilters } from "@/lib/types";
import { useAppNav } from "../appNav";
import Avatar from "../shared/Avatar";
import { FullLoading, EmptyState } from "../shared/ui";
import MatchAnimation from "../shared/MatchAnimation";
import FilterSheet from "./FilterSheet";

const SKILL_ORDER = ["beginner", "intermediate", "advanced", "competitive"];

export default function DiscoverTab() {
  const { profile, setActiveTab, openSubView, refreshBadges } = useAppNav();
  const [candidates, setCandidates] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"card" | "grid">("card");
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [matchWith, setMatchWith] = useState<Profile | null>(null);

  const loadCandidates = useCallback(async () => {
    setIsLoading(true);
    const since = new Date(Date.now() - 14 * 86400000).toISOString();
    const [blocksRes, likesRes, matchesRes, skipsRes] = await Promise.all([
      supabase
        .from("blocks")
        .select("blocked_id, blocker_id")
        .or(`blocker_id.eq.${profile.id},blocked_id.eq.${profile.id}`),
      supabase
        .from("likes")
        .select("to_user_id")
        .eq("from_user_id", profile.id)
        .gte("created_at", since),
      supabase
        .from("matches")
        .select("user1_id, user2_id")
        .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`),
      supabase
        .from("skips")
        .select("skipped_user_id")
        .eq("user_id", profile.id)
        .gte("skipped_at", since),
    ]);

    const exclude = new Set<string>([profile.id]);
    (blocksRes.data ?? []).forEach((b) => {
      exclude.add(b.blocked_id);
      exclude.add(b.blocker_id);
    });
    (likesRes.data ?? []).forEach((l) => exclude.add(l.to_user_id));
    (matchesRes.data ?? []).forEach((m) =>
      exclude.add(m.user1_id === profile.id ? m.user2_id : m.user1_id),
    );
    (skipsRes.data ?? []).forEach((s) => exclude.add(s.skipped_user_id));

    const { data: raw } = await supabase
      .from("profiles")
      .select("*")
      .eq("is_paused", false)
      .eq("is_banned", false)
      .eq("is_seed", false)
      .order("last_active", { ascending: false })
      .limit(200);

    const filtered = ((raw as Profile[]) ?? []).filter((c) => {
      if (exclude.has(c.id)) return false;
      if (!c.visibility_gender?.includes(profile.gender)) return false;
      if (profile.age < (c.visibility_age_min ?? 18)) return false;
      if (profile.age > (c.visibility_age_max ?? 99)) return false;
      const common = c.sports?.filter((s) => profile.sports?.includes(s));
      if (!common?.length) return false;

      if (filters.sports.length && !filters.sports.some((s) => c.sports?.includes(s)))
        return false;
      if (filters.gender && c.gender !== filters.gender) return false;
      if (filters.skillLevels.length && !filters.skillLevels.includes(c.skill_level))
        return false;
      if (c.age < filters.ageMin || c.age > filters.ageMax) return false;
      if (filters.clubId && c.club_id !== filters.clubId) return false;

      if (
        filters.radius < 201 &&
        profile.latitude &&
        profile.longitude &&
        c.latitude &&
        c.longitude
      ) {
        const dist = haversineKm(
          profile.latitude,
          profile.longitude,
          c.latitude,
          c.longitude,
        );
        if (dist > filters.radius) return false;
        c._distance = dist;
      }
      return true;
    });

    filtered.sort((a, b) => {
      if (a.club_id === profile.club_id && b.club_id !== profile.club_id) return -1;
      if (b.club_id === profile.club_id && a.club_id !== profile.club_id) return 1;
      const mySkill = SKILL_ORDER.indexOf(profile.skill_level);
      const diffA = Math.abs(SKILL_ORDER.indexOf(a.skill_level) - mySkill);
      const diffB = Math.abs(SKILL_ORDER.indexOf(b.skill_level) - mySkill);
      if (diffA !== diffB) return diffA - diffB;
      if (a._distance !== undefined && b._distance !== undefined)
        return a._distance - b._distance;
      return (
        new Date(b.last_active).getTime() - new Date(a.last_active).getTime()
      );
    });

    setCandidates(filtered.slice(0, 20));
    setCurrentIndex(0);
    setIsLoading(false);
  }, [profile, filters]);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  async function handleLike(target: Profile) {
    setCurrentIndex((i) => i + 1);
    await supabase
      .from("likes")
      .upsert(
        { from_user_id: profile.id, to_user_id: target.id },
        { onConflict: "from_user_id,to_user_id" },
      );
    const { data: reverse } = await supabase
      .from("likes")
      .select("id")
      .eq("from_user_id", target.id)
      .eq("to_user_id", profile.id)
      .maybeSingle();
    if (reverse) setMatchWith(target);
    refreshBadges();
  }

  async function handleSkip(target: Profile) {
    setCurrentIndex((i) => i + 1);
    await supabase
      .from("skips")
      .insert({ user_id: profile.id, skipped_user_id: target.id });
  }

  if (isLoading) return <FullLoading />;

  const remaining = candidates.slice(currentIndex);

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800 px-4">
        <button
          type="button"
          onClick={() => setShowFilter(true)}
          className="flex items-center gap-1.5 text-sm text-zinc-300"
        >
          <FilterIcon size={18} /> Filter
        </button>
        <span className="font-bold tracking-wide">ENTDECKEN</span>
        <button
          type="button"
          onClick={() => setViewMode((v) => (v === "card" ? "grid" : "card"))}
          className="text-sm text-zinc-300"
          aria-label="Ansicht wechseln"
        >
          {viewMode === "card" ? <GridIcon size={20} /> : <CardsIcon size={20} />}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {remaining.length === 0 ? (
          <EmptyState
            icon={<UsersIcon size={44} />}
            title="Keine weiteren Spieler"
            message="Erweitere deinen Suchradius oder ändere die Filter."
            actionLabel="Filter öffnen"
            onAction={() => setShowFilter(true)}
          />
        ) : viewMode === "card" ? (
          <CardView
            profile={remaining[0]}
            onLike={() => handleLike(remaining[0])}
            onSkip={() => handleSkip(remaining[0])}
            onOpen={() =>
              openSubView({ type: "full-profile", userId: remaining[0].id })
            }
            myLat={profile.latitude}
            myLng={profile.longitude}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 p-3">
            {remaining.map((c) => (
              <GridCard
                key={c.id}
                profile={c}
                onLike={() => handleLike(c)}
                onOpen={() =>
                  openSubView({ type: "full-profile", userId: c.id })
                }
              />
            ))}
          </div>
        )}
      </div>

      {showFilter && (
        <FilterSheet
          filters={filters}
          onApply={(f) => {
            setFilters(f);
            setShowFilter(false);
          }}
          onClose={() => setShowFilter(false)}
        />
      )}

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

function distanceLabel(
  myLat: number | null,
  myLng: number | null,
  c: Profile,
): string | null {
  if (c._distance !== undefined) return formatDistance(c._distance);
  if (myLat && myLng && c.latitude && c.longitude)
    return formatDistance(haversineKm(myLat, myLng, c.latitude, c.longitude));
  return null;
}

function CardView({
  profile,
  onLike,
  onSkip,
  onOpen,
  myLat,
  myLng,
}: {
  profile: Profile;
  onLike: () => void;
  onSkip: () => void;
  onOpen: () => void;
  myLat: number | null;
  myLng: number | null;
}) {
  const [start, setStart] = useState(0);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dist = distanceLabel(myLat, myLng, profile);

  function end() {
    setDragging(false);
    if (dx > 100) onLike();
    else if (dx < -100) onSkip();
    setDx(0);
  }

  return (
    <div className="p-4">
      <div
        className="relative overflow-hidden rounded-2xl bg-zinc-900"
        style={{
          transform: `translateX(${dx}px) rotate(${dx * 0.04}deg)`,
          transition: dragging ? "none" : "transform 0.25s ease",
        }}
        onTouchStart={(e) => {
          setStart(e.touches[0].clientX);
          setDragging(true);
        }}
        onTouchMove={(e) => setDx(e.touches[0].clientX - start)}
        onTouchEnd={end}
        onClick={onOpen}
        role="button"
        tabIndex={0}
      >
        <div className="aspect-[3/4] w-full bg-zinc-800">
          {profile.profile_image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.profile_image}
              alt={profile.first_name}
              className="h-full w-full object-cover"
            />
          )}
        </div>
        {dx > 40 && (
          <div className="absolute left-4 top-4 rounded-lg border-2 border-green-400 px-3 py-1 text-lg font-bold text-green-400">
            LIKE
          </div>
        )}
        {dx < -40 && (
          <div className="absolute right-4 top-4 rounded-lg border-2 border-red-400 px-3 py-1 text-lg font-bold text-red-400">
            SKIP
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-5 pt-16">
          <h2 className="text-xl font-bold">
            {profile.first_name}, {profile.age}
          </h2>
          <p className="mt-1 text-sm text-zinc-200">
            <SportIcon sport={profile.sports[0]} size={14} className="mr-0.5 inline-block align-[-2px]" />{" "}
            {profile.sports.map((s) => s).join(", ")} ·{" "}
            {skillLabel(profile.skill_level)}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-zinc-400">
            {dist && <MapPinIcon size={13} />}
            <span>
              {dist}
              {profile.club_name_manual ? ` · ${profile.club_name_manual}` : ""}
            </span>
          </p>
          {profile.is_verified && (
            <p className="mt-1 flex items-center gap-1 text-xs text-matchup">
              <CheckIcon size={13} /> Verifiziert
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-12">
        <button
          type="button"
          onClick={onSkip}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800 text-white transition-transform active:scale-90"
          aria-label="Skip"
        >
          <XIcon size={26} />
        </button>
        <button
          type="button"
          onClick={onLike}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-matchup text-white transition-transform active:scale-90"
          aria-label="Like"
        >
          <HeartIcon size={26} filled />
        </button>
      </div>
    </div>
  );
}

function GridCard({
  profile,
  onLike,
  onOpen,
}: {
  profile: Profile;
  onLike: () => void;
  onOpen: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl bg-zinc-900">
      <button type="button" onClick={onOpen} className="block w-full">
        <div className="aspect-square w-full bg-zinc-800">
          {profile.profile_image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.profile_image}
              alt={profile.first_name}
              className="h-full w-full object-cover"
            />
          )}
        </div>
      </button>
      <div className="p-3">
        <p className="text-sm font-semibold">
          {profile.first_name}, {profile.age}
        </p>
        <p className="text-xs text-zinc-400">
          <SportIcon sport={profile.sports[0]} size={14} className="mr-0.5 inline-block align-[-2px]" /> {skillLabel(profile.skill_level)}
        </p>
        <button
          type="button"
          onClick={onLike}
          className="mt-2 flex w-full items-center justify-center gap-1 rounded-full bg-matchup py-1.5 text-xs font-bold text-white"
        >
          <HeartIcon size={13} filled /> Like
        </button>
      </div>
    </div>
  );
}
