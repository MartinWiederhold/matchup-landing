"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { haversineKm } from "@/lib/utils/haversine";
import { skillLabel, sportLabel, formatDistance } from "@/lib/utils/formatters";
import {
  SportIcon,
  FilterIcon,
  CheckIcon,
  UsersIcon,
  MapPinIcon,
} from "../shared/icons";
import type { Profile, FilterState } from "@/lib/types";
import { defaultFilters } from "@/lib/types";
import { ensureMatch } from "@/lib/matchmaking";
import { useT, type TFunction } from "@/lib/i18n";
import { useAppNav } from "../appNav";
import { FullLoading, EmptyState } from "../shared/ui";
import MatchAnimation from "../shared/MatchAnimation";
import FilterSheet from "./FilterSheet";

const SKILL_ORDER = ["beginner", "intermediate", "advanced", "competitive"];

function ConnectIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6M22 11h-6" />
    </svg>
  );
}

export default function DiscoverTab() {
  const t = useT();
  const { profile, setActiveTab, openSubView, refreshBadges } = useAppNav();
  const [candidates, setCandidates] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [matchWith, setMatchWith] = useState<Profile | null>(null);
  const [requested, setRequested] = useState<Set<string>>(new Set());

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
    // bereits gesendete Anfragen / Matches NICHT ausschliessen — wir zeigen sie
    // im Feed als „Angefragt" markiert. Geblockte & ältere Skips bleiben raus.
    const alreadyRequested = new Set<string>(
      (likesRes.data ?? []).map((l) => l.to_user_id),
    );
    (matchesRes.data ?? []).forEach((m) =>
      alreadyRequested.add(m.user1_id === profile.id ? m.user2_id : m.user1_id),
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

    // Die Discover-Filter sind die EINZIGE Quelle der Wahrheit. Die Profil-/
    // Sichtbarkeitseinstellungen der anderen Person blockieren NICHT mehr (kein
    // Doppel mit den Filtern). Sportarten: aktiver Sport-Filter überschreibt;
    // ohne gesetzten Filter werden standardmässig deine eigenen Sportarten genutzt.
    const effectiveSports = filters.sports.length
      ? filters.sports
      : profile.sports;

    const filtered = ((raw as Profile[]) ?? []).filter((c) => {
      if (exclude.has(c.id)) return false;

      if (
        effectiveSports?.length &&
        !effectiveSports.some((s) => c.sports?.includes(s))
      )
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

    setRequested(alreadyRequested);
    setCandidates(filtered.slice(0, 40));
    setIsLoading(false);
  }, [profile, filters]);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  async function connect(target: Profile) {
    setRequested((prev) => new Set(prev).add(target.id));
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
    if (reverse) {
      await ensureMatch(profile.id, target.id);
      setMatchWith(target);
    }
    refreshBadges();
  }

  // Aktive Filter als entfernbare Chips (Standardwerte werden nicht angezeigt).
  const d = defaultFilters;
  const activeChips: { key: string; label: string; clear: () => void }[] = [];
  filters.sports.forEach((s) =>
    activeChips.push({
      key: `sport-${s}`,
      label: sportLabel(s),
      clear: () =>
        setFilters((f) => ({ ...f, sports: f.sports.filter((x) => x !== s) })),
    }),
  );
  if (filters.gender)
    activeChips.push({
      key: "gender",
      label: filters.gender === "male" ? t("discover.genderMale") : t("discover.genderFemale"),
      clear: () => setFilters((f) => ({ ...f, gender: null })),
    });
  if (filters.ageMin !== d.ageMin || filters.ageMax !== d.ageMax)
    activeChips.push({
      key: "age",
      label: t("discover.ageChip", { min: filters.ageMin, max: filters.ageMax }),
      clear: () =>
        setFilters((f) => ({ ...f, ageMin: d.ageMin, ageMax: d.ageMax })),
    });
  if (filters.radius !== d.radius)
    activeChips.push({
      key: "radius",
      label:
        filters.radius > 200
          ? t("discover.worldwide")
          : t("discover.radiusChip", { km: filters.radius }),
      clear: () => setFilters((f) => ({ ...f, radius: d.radius })),
    });
  filters.skillLevels.forEach((s) =>
    activeChips.push({
      key: `skill-${s}`,
      label: skillLabel(s),
      clear: () =>
        setFilters((f) => ({
          ...f,
          skillLevels: f.skillLevels.filter((x) => x !== s),
        })),
    }),
  );
  if (filters.clubId && filters.clubId !== profile.club_id)
    activeChips.push({
      key: "club",
      label: filters.clubName
        ? t("discover.clubChip", { name: filters.clubName })
        : t("discover.clubChipFallback"),
      clear: () =>
        setFilters((f) => ({ ...f, clubId: null, clubName: null })),
    });

  if (isLoading) return <FullLoading />;

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800 px-4">
        <button
          type="button"
          onClick={() => setShowFilter(true)}
          className="flex items-center gap-1.5 text-sm text-zinc-300"
        >
          <FilterIcon size={18} /> {t("discover.filter")}
        </button>
        <span className="font-bold tracking-wide">{t("discover.title")}</span>
        <span className="w-12 text-right text-xs text-zinc-500">
          {candidates.length}
        </span>
      </header>

      {(profile.club_id || activeChips.length > 0) && (
        <div className="no-scrollbar flex shrink-0 items-center gap-2 overflow-x-auto border-b border-zinc-800 px-4 py-2">
          {profile.club_id && (
            <button
              type="button"
              onClick={() =>
                setFilters((f) => ({
                  ...f,
                  clubId: f.clubId === profile.club_id ? null : profile.club_id,
                }))
              }
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                filters.clubId === profile.club_id
                  ? "bg-matchup text-white"
                  : "bg-zinc-800 text-zinc-300"
              }`}
            >
              {t("discover.onlyMyClub")}
            </button>
          )}
          {activeChips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={c.clear}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-matchup/20 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-matchup/60"
            >
              {c.label}
              <span className="text-white/60">✕</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {candidates.length === 0 ? (
          <EmptyState
            icon={<UsersIcon size={44} />}
            title={t("discover.emptyTitle")}
            message={t("discover.emptyMessage")}
            actionLabel={t("discover.emptyAction")}
            onAction={() => setShowFilter(true)}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 p-3">
            {candidates.map((c) => (
              <FeedCard
                key={c.id}
                t={t}
                player={c}
                requested={requested.has(c.id)}
                onConnect={() => connect(c)}
                onOpen={() => openSubView({ type: "full-profile", userId: c.id })}
                myLat={profile.latitude}
                myLng={profile.longitude}
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

function FeedCard({
  t,
  player,
  requested,
  onConnect,
  onOpen,
  myLat,
  myLng,
}: {
  t: TFunction;
  player: Profile;
  requested: boolean;
  onConnect: () => void;
  onOpen: () => void;
  myLat: number | null;
  myLng: number | null;
}) {
  const dist = distanceLabel(myLat, myLng, player);
  return (
    <div className="overflow-hidden rounded-2xl bg-zinc-900">
      <button
        type="button"
        onClick={onOpen}
        className="relative block aspect-[4/5] w-full bg-zinc-800 text-left"
      >
        {player.profile_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={player.profile_image}
            alt={player.first_name}
            className="h-full w-full object-cover"
          />
        )}
        {player.is_verified && (
          <span className="absolute right-2 top-2 flex items-center gap-0.5 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-matchup backdrop-blur-sm">
            <CheckIcon size={11} /> {t("discover.verified")}
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-3 pt-10">
          <h2 className="text-sm font-bold leading-tight text-white">
            {player.first_name}, {player.age}
          </h2>
          <p className="mt-0.5 text-[11px] text-zinc-200">
            <SportIcon
              sport={player.sports[0]}
              size={12}
              className="mr-0.5 inline-block align-[-2px]"
            />{" "}
            {skillLabel(player.skill_level)}
          </p>
          {(dist || player.club_name_manual) && (
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-zinc-400">
              {dist && <MapPinIcon size={11} />}
              <span className="truncate">
                {dist}
                {player.club_name_manual ? ` · ${player.club_name_manual}` : ""}
              </span>
            </p>
          )}
        </div>
      </button>

      <div className="p-2.5">
        <button
          type="button"
          onClick={onConnect}
          disabled={requested}
          className={`flex w-full items-center justify-center gap-1.5 rounded-full py-2 text-xs font-bold transition-colors ${
            requested
              ? "bg-zinc-800 text-zinc-400"
              : "bg-matchup text-white hover:bg-matchup-hover"
          }`}
        >
          {requested ? (
            <>
              <CheckIcon size={14} /> {t("discover.requested")}
            </>
          ) : (
            <>
              <ConnectIcon size={14} /> {t("discover.connect")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
