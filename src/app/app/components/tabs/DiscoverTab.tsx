"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { haversineKm } from "@/lib/utils/haversine";
import type { Profile, FilterState } from "@/lib/types";
import { defaultFilters } from "@/lib/types";
import { useT } from "@/lib/i18n";
import { useAppNav } from "../appNav";
import { FullLoading } from "../shared/ui";
import Avatar from "../shared/Avatar";
import { SportGroups, NextGameCard, CommunityCard, NewsSection, SeedStoryRow, PostComposerCard } from "../home/HomeSections";
import ModeToggle from "../home/ModeToggle";
import TourHome from "../home/TourHome";
import TourGate from "../home/TourGate";
import { setMode as persistMode, tourUnlocked, acceptInvite } from "@/lib/tour";
import { useAuth } from "@/lib/auth";
import WimbledonWidget from "../../mockup/WimbledonWidget";
import PostComposer from "../shared/PostComposer";
import FilterSheet from "./FilterSheet";

const SKILL_ORDER = ["beginner", "intermediate", "advanced", "competitive"];

export default function DiscoverTab() {
  const t = useT();
  const { profile, setActiveTab, openSubView, refreshBadges } = useAppNav();
  const { refreshProfile } = useAuth();
  // Tour ist gesperrt (Early Access): nur mit lokalem Freischalt-Code aktiv.
  const [mode, setModeState] = useState<"play" | "tour">(
    profile.mode === "tour" && typeof window !== "undefined" && tourUnlocked() ? "tour" : "play",
  );
  const [showTourGate, setShowTourGate] = useState(false);
  const [invite, setInvite] = useState<{ role?: string; player?: string; done?: boolean; error?: string } | null>(null);

  // Team-Einladung über ?team=<token> annehmen.
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("team");
    if (!token) return;
    (async () => {
      const r = await acceptInvite(token);
      setInvite(r.ok ? { role: r.role, player: r.player, done: true } : { error: r.error });
      const url = new URL(window.location.href);
      url.searchParams.delete("team");
      window.history.replaceState({}, "", url.toString());
    })();
  }, []);
  const [candidates, setCandidates] = useState<Profile[]>([]);
  const [seedPeople, setSeedPeople] = useState<Profile[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
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

  // Seed-Profile (echte, verbindbare Demo-Profile aus /public/seed) für die
  // Sport-Circle-Avatare. Erkennung über das Bildmuster, damit der Discover-Deck
  // (is_seed = false) unangetastet bleibt.
  useEffect(() => {
    let alive = true;
    supabase
      .from("profiles")
      .select("*")
      .like("profile_image", "%/seed/%")
      .eq("is_paused", false)
      .eq("is_banned", false)
      .limit(60)
      .then(({ data }) => { if (alive) setSeedPeople((data as Profile[]) ?? []); });
    return () => { alive = false; };
  }, [profile.id]);

  function applyMode(m: "play" | "tour") {
    setModeState(m);
    void persistMode(profile.id, m).then(() => refreshProfile());
  }
  function changeMode(m: "play" | "tour") {
    if (m === mode) return;
    if (m === "tour" && !tourUnlocked()) { setShowTourGate(true); return; }
    applyMode(m);
  }

  if (isLoading) return <FullLoading />;

  return (
    <div className="relative flex flex-col">
      {/* Kopf: Avatar + Play/Tour-Toggle links, Suche rechts */}
      <div className="px-4 pt-[max(16px,env(safe-area-inset-top))]">
        <header className="flex items-center justify-between gap-2 pt-1">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => openSubView({ type: "edit-profile" })} aria-label="Profil">
              <Avatar src={profile.profile_image} alt={profile.first_name} size="lg" />
            </button>
            <ModeToggle mode={mode} onChange={changeMode} />
          </div>
          <button
            type="button"
            onClick={() => openSubView({ type: "people-browse" })}
            aria-label={t("discover.find")}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black/[0.04] text-neutral-900 ring-1 ring-black/10"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" />
            </svg>
          </button>
        </header>
      </div>

      {mode === "tour" ? (
        <TourHome />
      ) : (
      <div className="pb-28">
        {/* Hero-Text */}
        <div className="px-4">
          <h1 className="mt-5 text-[30px] font-medium leading-[1.15] tracking-tight text-black">
            Your <span className="font-extrabold">Journey</span>
            <br />
            With Matchup
          </h1>
        </div>

        {/* Beitrag verfassen (wie mockup2 Home) */}
        <PostComposerCard onCompose={() => setComposerOpen(true)} />

        {/* Live im Profitennis — Google-Style-Widget (wie mockup2) */}
        <div className="mt-6 px-4">
          <WimbledonWidget theme="light" />
        </div>

        {/* Für dich — kuratierte Demo-Profile (Anzeige); „Finden" öffnet echte Suche */}
        <SeedStoryRow onFind={() => openSubView({ type: "people-browse" })} />

        {/* Nach Sportart (Tennis/Padel/Pickleball) */}
        <SportGroups
          people={candidates}
          seedPeople={seedPeople}
          onOpenProfile={(id) => openSubView({ type: "full-profile", userId: id })}
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

        {/* Schlagzeilen (Tennis/Padel/Pickleball-News) */}
        <NewsSection />

        {/* Community-Puls */}
        <CommunityCard onOpen={() => setActiveTab("matches")} />
      </div>
      )}

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

      {showTourGate && (
        <TourGate
          onClose={() => setShowTourGate(false)}
          onUnlock={() => { setShowTourGate(false); applyMode("tour"); }}
        />
      )}

      {invite && (
        <div className="fixed inset-0 z-[70] mx-auto flex max-w-[430px] items-center justify-center bg-black/40 p-6 backdrop-blur-sm" onClick={() => setInvite(null)}>
          <div className="w-full rounded-[24px] bg-white p-5 text-center" onClick={(e) => e.stopPropagation()}>
            {invite.done ? (
              <>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </div>
                <h3 className="text-[17px] font-bold text-neutral-900">{t("mode.teamJoinedTitle")}</h3>
                <p className="mt-1 text-[13px] text-neutral-500">{t("mode.teamJoinedBody", { player: invite.player ?? "", role: invite.role ? t(`onboarding.role${invite.role === "hitting_partner" ? "Hitting" : invite.role.charAt(0).toUpperCase() + invite.role.slice(1)}`) : "" })}</p>
              </>
            ) : (
              <>
                <h3 className="text-[17px] font-bold text-neutral-900">{t("mode.teamInviteError")}</h3>
                <p className="mt-1 text-[13px] text-neutral-500">{invite.error}</p>
              </>
            )}
            <button type="button" onClick={() => setInvite(null)} className="mt-4 w-full rounded-full bg-matchup py-3 text-sm font-bold text-white">{t("common.close")}</button>
          </div>
        </div>
      )}

      <PostComposer open={composerOpen} onClose={() => setComposerOpen(false)} />
    </div>
  );
}
