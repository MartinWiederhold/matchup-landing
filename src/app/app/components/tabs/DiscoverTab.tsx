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
import { useT, useLocale, type TFunction } from "@/lib/i18n";
import { useAppNav } from "../appNav";
import { FullLoading, EmptyState } from "../shared/ui";
import MatchAnimation from "../shared/MatchAnimation";
import Avatar from "../shared/Avatar";
import { greeting, FormRing, StoryRow, NextGameCard, LiveTennisCard, CommunityCard } from "../home/HomeSections";
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
  const { locale } = useLocale();
  const { profile, setActiveTab, openSubView, refreshBadges } = useAppNav();
  const [candidates, setCandidates] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<FilterState>(() => {
    // Gesetzte Filter überdauern Tab-Wechsel & Reload (localStorage).
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem("mu_discover_filters");
        if (raw) return { ...defaultFilters, ...JSON.parse(raw) };
      } catch {
        /* ignore */
      }
    }
    return defaultFilters;
  });
  const [matchWith, setMatchWith] = useState<Profile | null>(null);
  const [requested, setRequested] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      window.localStorage.setItem("mu_discover_filters", JSON.stringify(filters));
    } catch {
      /* ignore */
    }
  }, [filters]);

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
    // Bereits gematchte Personen ganz ausschliessen (man ist ja verbunden und
    // chattet bereits). Nur noch offene, gesendete Anfragen werden als
    // „Angefragt" markiert angezeigt. Geblockte & ältere Skips bleiben raus.
    (matchesRes.data ?? []).forEach((m) =>
      exclude.add(m.user1_id === profile.id ? m.user2_id : m.user1_id),
    );
    const alreadyRequested = new Set<string>(
      (likesRes.data ?? [])
        .map((l) => l.to_user_id)
        .filter((id) => !exclude.has(id)),
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

  const dateLabel = new Date().toLocaleDateString(locale === "de" ? "de-CH" : "en-GB", { weekday: "long", day: "numeric", month: "long" });
  const displayName = profile.display_name || profile.first_name;

  return (
    <div className="relative flex h-full flex-col">
      {/* Home-Header: Begrüßung + Filter + Avatar */}
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 pt-3 pb-1">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[10px] font-extrabold uppercase tracking-[0.18em] text-zinc-500">{dateLabel}</div>
          <h1 className="mt-1 truncate text-[22px] font-extrabold tracking-tight">{greeting(t, displayName)}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowFilter(true)}
            aria-label={t("discover.filter")}
            className="relative flex h-[42px] w-[42px] items-center justify-center rounded-[13px] border border-white/10 bg-white/[0.04] text-white"
          >
            <FilterIcon size={20} />
            {activeChips.length > 0 && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-matchup" />}
          </button>
          <button type="button" onClick={() => openSubView({ type: "edit-profile" })} aria-label="Profil">
            <Avatar src={profile.profile_image} alt={profile.first_name} size="md" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Form-Ring */}
        <section className="mt-4 px-4">
          <FormRing score={profile.match_score ?? 1000} onOpen={() => openSubView({ type: "leaderboard" })} />
        </section>

        {/* Neue Leute (Stories) */}
        <StoryRow
          people={candidates.slice(0, 10)}
          onOpen={(id) => openSubView({ type: "full-profile", userId: id })}
          onFind={() => setShowFilter(true)}
        />

        {/* Dein nächstes Spiel */}
        <NextGameCard onOpen={(id) => openSubView({ type: "game-detail", gameId: id })} onAll={() => setActiveTab("games")} />

        {/* Für dich empfohlen */}
        <section className="mt-6 px-4">
          <div className="mb-2.5 flex items-center justify-between px-0.5">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-zinc-500">{t("discover.forYou")}</span>
            <span className="text-[11px] font-bold text-zinc-600">{candidates.length}</span>
          </div>
          {candidates.length === 0 ? (
            <EmptyState
              icon={<UsersIcon size={44} />}
              title={t("discover.emptyTitle")}
              message={t("discover.emptyMessage")}
              actionLabel={t("discover.emptyAction")}
              onAction={() => setShowFilter(true)}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
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
        </section>

        {/* Live im Profitennis */}
        <LiveTennisCard />

        {/* Community-Puls */}
        <CommunityCard onOpen={() => setActiveTab("matches")} />
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
          onSuggestGame={() => {
            const id = matchWith.id;
            setMatchWith(null);
            openSubView({ type: "create-game", invite: id });
          }}
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
