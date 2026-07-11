"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { haversineKm } from "@/lib/utils/haversine";
import { CheckIcon, UsersIcon } from "../shared/icons";
import type { Profile, FilterState } from "@/lib/types";
import { defaultFilters } from "@/lib/types";
import { useT } from "@/lib/i18n";
import { useAppNav } from "../appNav";
import { FullLoading, EmptyState } from "../shared/ui";
import Avatar from "../shared/Avatar";
import { StoryRow, SportGroups, NextGameCard, CommunityCard, NewsSection } from "../home/HomeSections";
import WimbledonWidget from "../../mockup/WimbledonWidget";
import FilterSheet from "./FilterSheet";

const SKILL_ORDER = ["beginner", "intermediate", "advanced", "competitive"];

export default function DiscoverTab() {
  const t = useT();
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
  const [weekGames, setWeekGames] = useState(0);

  // 7-Tage-Match-Challenge: gespielte Games der letzten 7 Tage (erstellt oder beigetreten).
  useEffect(() => {
    let alive = true;
    (async () => {
      const since = new Date(Date.now() - 7 * 86400000).toISOString();
      const nowIso = new Date().toISOString();
      const [mine, joined] = await Promise.all([
        supabase
          .from("game_events")
          .select("id")
          .eq("created_by", profile.id)
          .gte("date_time", since)
          .lte("date_time", nowIso),
        supabase
          .from("game_participants")
          .select("game:game_events(id, date_time)")
          .eq("user_id", profile.id)
          .eq("status", "accepted"),
      ]);
      const ids = new Set<string>((mine.data ?? []).map((g) => g.id as string));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (joined.data ?? []).forEach((r: any) => {
        const g = Array.isArray(r.game) ? r.game[0] : r.game;
        if (g?.id && g.date_time >= since && g.date_time <= nowIso) ids.add(g.id);
      });
      if (alive) setWeekGames(ids.size);
    })();
    return () => { alive = false; };
  }, [profile.id]);

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
    const [blocksRes, matchesRes, skipsRes] = await Promise.all([
      supabase
        .from("blocks")
        .select("blocked_id, blocker_id")
        .or(`blocker_id.eq.${profile.id},blocked_id.eq.${profile.id}`),
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

    setCandidates(filtered.slice(0, 40));
    setIsLoading(false);
  }, [profile, filters]);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  if (isLoading) return <FullLoading />;

  return (
    <div className="relative flex flex-col">
      <div className="pb-28">
        {/* Kopf im mockup2-Stil: Avatar links, Suche rechts + Hero-Text */}
        <div className="px-4 pt-[max(16px,env(safe-area-inset-top))]">
          <header className="flex items-center justify-between pt-1">
            <button type="button" onClick={() => openSubView({ type: "edit-profile" })} aria-label="Profil">
              <Avatar src={profile.profile_image} alt={profile.first_name} size="lg" />
            </button>
            <button
              type="button"
              onClick={() => openSubView({ type: "people-browse" })}
              aria-label={t("discover.find")}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-black/[0.04] text-neutral-900 ring-1 ring-black/10"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" />
              </svg>
            </button>
          </header>

          {/* Hero-Text */}
          <h1 className="mt-6 text-[30px] font-medium leading-[1.15] tracking-tight text-black">
            Your <span className="font-extrabold">Journey</span>
            <br />
            With Matchup
          </h1>
        </div>

        {/* Live im Profitennis — Google-Style-Widget (wie mockup2) */}
        <div className="mt-6 px-4">
          <WimbledonWidget theme="light" />
        </div>

        {/* Neue Leute (Stories) */}
        <StoryRow
          people={candidates.slice(0, 10)}
          onOpen={(id) => openSubView({ type: "full-profile", userId: id })}
          onFind={() => openSubView({ type: "people-browse" })}
        />

        {/* Nach Sportart (Tennis/Padel/Pickleball) */}
        <SportGroups
          people={candidates}
          weekMatches={weekGames}
          onFind={() => openSubView({ type: "people-browse" })}
          onCreateGame={(sport) => openSubView({ type: "create-game", sport })}
          onSelect={(sport) => {
            const next = { ...filters, sports: [sport] };
            // Filter synchron persistieren, damit die Uebersicht ihn beim Mounten liest.
            try { window.localStorage.setItem("mu_discover_filters", JSON.stringify(next)); } catch { /* ignore */ }
            setFilters(next);
            openSubView({ type: "people-browse" });
          }}
        />

        {/* Dein nächstes Spiel */}
        <NextGameCard onOpen={(id) => openSubView({ type: "game-detail", gameId: id })} onAll={() => setActiveTab("games")} />

        {/* Schlagzeilen (Tennis/Padel/Pickleball-News) — über „Für dich" */}
        <NewsSection />

        {/* Für dich empfohlen */}
        <section className="mt-6 px-4">
          <div className="mb-2.5 flex items-center justify-between px-0.5">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-neutral-400">{t("discover.forYou")}</span>
            <span className="text-[11px] font-bold text-neutral-400">{candidates.length}</span>
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
            <div className="grid grid-cols-3 gap-2.5">
              {candidates.map((c) => (
                <FeedCard
                  key={c.id}
                  player={c}
                  onOpen={() => openSubView({ type: "full-profile", userId: c.id })}
                />
              ))}
            </div>
          )}
        </section>

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
    </div>
  );
}

function FeedCard({
  player,
  onOpen,
}: {
  player: Profile;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-200 text-left"
    >
      {player.profile_image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={player.profile_image}
          alt={player.first_name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      )}
      {player.is_verified && (
        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-black/45 text-matchup backdrop-blur-sm">
          <CheckIcon size={12} />
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2.5 pt-8">
        <span className="text-[13px] font-bold text-white">{player.first_name}</span>
      </div>
    </button>
  );
}
