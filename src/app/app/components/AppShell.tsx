"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Profile } from "@/lib/types";
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

const TABS: TabDef[] = [
  { key: "discover", label: "Entdecken", icon: "M12 2 4 7v10l8 5 8-5V7z" },
  { key: "likes", label: "Anfragen", icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M19 8v6 M22 11h-6" },
  { key: "matches", label: "Matches", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
  { key: "games", label: "Spiele", icon: "M8 21h8m-4-4v4M5 4h14v7a7 7 0 0 1-14 0z" },
  { key: "profile", label: "Profil", icon: "M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
];

export default function AppShell({ profile }: { profile: Profile }) {
  const [activeTab, setActiveTab] = useState<TabKey>("discover");
  const [stack, setStack] = useState<SubViewState[]>([]);
  const [likeCount, setLikeCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [navHidden, setNavHidden] = useState(false);
  const lastScroll = useRef(0);
  const online = useOnline();

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
    const { count: likes } = await supabase
      .from("likes")
      .select("id", { count: "exact", head: true })
      .eq("to_user_id", profile.id);
    setLikeCount(likes ?? 0);

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
      }}
    >
      <div className="fixed inset-0 flex justify-center overflow-hidden bg-black">
        <div className="relative flex h-full w-full max-w-[430px] flex-col bg-black pt-[env(safe-area-inset-top)] text-white">
          {!online && (
            <div className="shrink-0 bg-yellow-900 px-4 py-2 text-center text-xs text-yellow-200">
              Keine Internetverbindung
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
                tabs={TABS}
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
