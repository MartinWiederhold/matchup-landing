"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Profile } from "@/lib/types";
import { useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { useOnline } from "@/lib/hooks/useOnline";
import { AppNavContext, type TabKey, type SubViewState } from "./appNav";
import DiscoverTab from "./tabs/DiscoverTab";
import LikesTab from "./tabs/LikesTab";
import MatchesTab from "./tabs/MatchesTab";
import GamesTab from "./tabs/GamesTab";
import ProfileTab from "./tabs/ProfileTab";
import SubViewRenderer from "./SubViewRenderer";
import TabBar, { type TabDef } from "./TabBar";

const TAB_DEFS: { key: TabKey; labelKey: string; icon: string }[] = [
  { key: "discover", labelKey: "app.tabDiscover", icon: "M12 2 4 7v10l8 5 8-5V7z" },
  { key: "likes", labelKey: "app.tabLikes", icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M19 8v6 M22 11h-6" },
  { key: "matches", labelKey: "app.tabMatches", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
  { key: "games", labelKey: "app.tabGames", icon: "M8 21h8m-4-4v4M5 4h14v7a7 7 0 0 1-14 0z" },
  { key: "profile", labelKey: "app.tabProfile", icon: "M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
];

export default function AppShell({ profile }: { profile: Profile }) {
  const t = useT();
  const tabs: TabDef[] = TAB_DEFS.map((tab) => ({
    key: tab.key,
    label: t(tab.labelKey),
    icon: tab.icon,
  }));
  const [activeTab, setActiveTab] = useState<TabKey>("discover");
  const [stack, setStack] = useState<SubViewState[]>([]);
  const [likeCount, setLikeCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [navHidden, setNavHidden] = useState(false);
  const lastScroll = useRef(0);
  const online = useOnline();
  // iOS: dvh-Höhe „setzt" sich erst nach einem Repaint → exakte Pixelhöhe per JS,
  // damit die schwarze Fläche sofort (ohne Scrollen) bis zum Home-Indikator reicht.
  // Der App-Container wird oben (an visualViewport.offsetTop) UND unten (an der
  // Tastaturhöhe) fixiert → er deckt sich immer exakt mit dem sichtbaren Viewport,
  // egal wie Safari beim Tastatur-Öffnen verschiebt. Kein Verrutschen, kein Weiss.
  const [kb, setKb] = useState(0);
  const [vtop, setVtop] = useState(0);

  // Dokument-Scroll sperren + Body schwarz, solange die App offen ist.
  // Verhindert, dass Safari beim Öffnen der Tastatur die Seite hochscrollt und
  // darunter der (weisse) Body sichtbar wird.
  useEffect(() => {
    const body = document.body;
    const prev = {
      background: body.style.background,
      overflow: body.style.overflow,
      position: body.style.position,
      width: body.style.width,
      height: body.style.height,
    };
    body.style.background = "#000";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.width = "100%";
    body.style.height = "100%";
    return () => {
      body.style.background = prev.background;
      body.style.overflow = prev.overflow;
      body.style.position = prev.position;
      body.style.width = prev.width;
      body.style.height = prev.height;
    };
  }, []);

  useEffect(() => {
    // Tastaturhöhe aus dem visuellen Viewport ableiten. Da der Body per
    // position:fixed gesperrt ist, bleibt window.innerHeight die volle Layouthöhe;
    // die Differenz zur sichtbaren Höhe (inkl. evtl. offsetTop) ist die Tastatur.
    const set = () => {
      const vv = window.visualViewport;
      if (!vv) {
        setKb(0);
        setVtop(0);
        return;
      }
      const top = vv.offsetTop;
      const gap = window.innerHeight - vv.height - top; // Tastaturhöhe
      setVtop(Math.round(top));
      setKb(Math.max(0, Math.round(gap)));
    };
    set();
    // iOS löst die untere Safe-Area erst nach einem Repaint auf → mehrfach messen.
    const raf = requestAnimationFrame(set);
    const timers: number[] = [120, 400, 1000].map((ms) => window.setTimeout(set, ms));
    // Beim Fokussieren/Verlassen eines Feldes animiert die Tastatur ~300ms — in
    // dieser Zeit meldet iOS die finale Höhe verspätet. Deshalb mehrfach nachmessen.
    const remeasure = () => {
      set();
      [50, 150, 300, 500, 800].forEach((ms) => timers.push(window.setTimeout(set, ms)));
    };
    const vv = window.visualViewport;
    window.addEventListener("resize", set);
    window.addEventListener("orientationchange", set);
    vv?.addEventListener("resize", set);
    vv?.addEventListener("scroll", set);
    document.addEventListener("focusin", remeasure);
    document.addEventListener("focusout", remeasure);
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      window.removeEventListener("resize", set);
      window.removeEventListener("orientationchange", set);
      vv?.removeEventListener("resize", set);
      vv?.removeEventListener("scroll", set);
      document.removeEventListener("focusin", remeasure);
      document.removeEventListener("focusout", remeasure);
    };
  }, []);

  const selectTab = useCallback((t: TabKey) => {
    setStack([]);
    setActiveTab(t);
    setNavHidden(false);
    lastScroll.current = 0;
  }, []);

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const y = e.currentTarget.scrollTop;
    if (y > lastScroll.current + 6 && y > 56) setNavHidden(true);
    else if (y < lastScroll.current - 6) setNavHidden(false);
    lastScroll.current = y;
  }

  const openSubView = useCallback(
    (sv: SubViewState) => setStack((s) => [...s, sv]),
    [],
  );
  const closeSubView = useCallback(() => setStack((s) => s.slice(0, -1)), []);

  const refreshBadges = useCallback(async () => {
    // Offene Anfragen = eingehende Likes von Personen, mit denen noch KEIN Match
    // besteht. Gematchte werden ausgeschlossen (sonst zeigt der Badge nach einem
    // Match fälschlich eine 1 — wie im LikesTab gefiltert).
    const [{ data: likeRows }, { data: matchRows }] = await Promise.all([
      supabase.from("likes").select("from_user_id").eq("to_user_id", profile.id),
      supabase
        .from("matches")
        .select("user1_id, user2_id")
        .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`),
    ]);
    const matched = new Set<string>();
    (matchRows ?? []).forEach((m) =>
      matched.add(m.user1_id === profile.id ? m.user2_id : m.user1_id),
    );
    const pending = ((likeRows as { from_user_id: string }[]) ?? []).filter(
      (l) => !matched.has(l.from_user_id),
    ).length;
    setLikeCount(pending);

    const { count: unread } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false)
      .neq("sender_id", profile.id);
    setUnreadCount(unread ?? 0);
  }, [profile.id]);

  useEffect(() => {
    refreshBadges();
  }, [refreshBadges, activeTab]);

  const current = stack[stack.length - 1] ?? null;

  return (
    <AppNavContext.Provider
      value={{
        profile,
        activeTab,
        setActiveTab: selectTab,
        openSubView,
        closeSubView,
        refreshBadges,
        onScroll: handleScroll,
      }}
    >
      <div
        className="fixed inset-x-0 flex justify-center overflow-hidden bg-black"
        style={{
          top: vtop,
          bottom: kb,
          // Kanten sanft nachziehen → der Ein-Frame-Sprung während der
          // Tastatur-Animation wird zu einer gleitenden Bewegung geglättet.
          transition: "top 0.16s ease-out, bottom 0.16s ease-out",
        }}
      >
        <div className="relative flex h-full w-full max-w-[430px] flex-col bg-black pt-[env(safe-area-inset-top)] text-white">
          {!online && (
            <div className="shrink-0 bg-yellow-900 px-4 py-2 text-center text-xs text-yellow-200">
              {t("app.offline")}
            </div>
          )}
          {current ? (
            <SubViewRenderer subView={current} />
          ) : (
            <>
              <div
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto overscroll-contain pb-28"
              >
                {activeTab === "discover" && <DiscoverTab />}
                {activeTab === "likes" && <LikesTab />}
                {activeTab === "matches" && <MatchesTab />}
                {activeTab === "games" && <GamesTab />}
                {activeTab === "profile" && <ProfileTab />}
              </div>

              <TabBar
                tabs={tabs}
                active={activeTab}
                onSelect={selectTab}
                badges={{ likes: likeCount, matches: unreadCount }}
                hidden={navHidden}
              />
            </>
          )}
        </div>
      </div>
    </AppNavContext.Provider>
  );
}
