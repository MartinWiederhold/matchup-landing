"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Profile } from "@/lib/types";
import { useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { useOnline } from "@/lib/hooks/useOnline";
import { tourUnlocked, TOUR_UNLOCK_EVENT } from "@/lib/tour";
import { AppNavContext, type TabKey, type SubViewState } from "./appNav";
import DiscoverTab from "./tabs/DiscoverTab";
import MatchesTab from "./tabs/MatchesTab";
import GamesTab from "./tabs/GamesTab";
import ProfileTab from "./tabs/ProfileTab";
import TourProfileTab from "./tabs/TourProfileTab";
import TourMatchesTab from "./tabs/TourMatchesTab";
import TourChatTab from "./tabs/TourChatTab";
import EarthTab from "./tabs/EarthTab";
import SubViewRenderer from "./SubViewRenderer";
import TabBar, { type TabDef } from "./TabBar";

// Design wie /app/mockup2: home · chat · earth · stats · people.
const TAB_DEFS: { key: TabKey; labelKey: string; icon: string }[] = [
  { key: "discover", labelKey: "app.tabDiscover", icon: "M3 11l9-8 9 8M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" },
  { key: "matches", labelKey: "app.tabMatches", icon: "M21 11.5a8.4 8.4 0 0 1-9 8.4 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.2A8.4 8.4 0 1 1 21 11.5z" },
  { key: "earth", labelKey: "app.tabEarth", icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2c3 3 4 7 4 10s-1 7-4 10M12 2c-3 3-4 7-4 10s1 7 4 10" },
  { key: "games", labelKey: "app.tabGames", icon: "M6 20V10M12 20V4M18 20v-7" },
  { key: "profile", labelKey: "app.tabProfile", icon: "M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M17 3.13a4 4 0 0 1 0 7.75" },
];

export default function AppShell({ profile }: { profile: Profile }) {
  const t = useT();
  /* Compete ist nur aktiv, wenn es am Profil gewählt UND auf diesem Gerät
     freigeschaltet ist. profile.mode allein reicht nicht: das Feld liegt in der
     DB und reist mit dem Account auf jedes Gerät — damit haette man die Sperre
     umgehen koennen. Erst nach dem Mount pruefen (localStorage gibt es beim
     Server-Render nicht), und auf das Unlock-Event hoeren, damit die Shell nach
     Code-Eingabe sofort nachzieht. */
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => {
    const sync = () => setUnlocked(tourUnlocked());
    sync();
    window.addEventListener(TOUR_UNLOCK_EVENT, sync);
    return () => window.removeEventListener(TOUR_UNLOCK_EVENT, sync);
  }, []);
  const isTour = profile.mode === "tour" && unlocked;
  const tabs: TabDef[] = TAB_DEFS
    // Earth-Tab nur im Play-Modus (Tour behält 4 Tabs + zentralen Planner-Button).
    .filter((tab) => !(isTour && tab.key === "earth"))
    .map((tab) => {
      // Im Tour-Modus wird der Games-Slot zum Team-Chat.
      if (isTour && tab.key === "games") return { key: tab.key, label: t("mode.chatTab"), icon: "M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8A8.5 8.5 0 0 1 12.5 3 8.5 8.5 0 0 1 21 11.5z" };
      return { key: tab.key, label: t(tab.labelKey), icon: tab.icon };
    });
  const [activeTab, setActiveTab] = useState<TabKey>("discover");
  const [stack, setStack] = useState<SubViewState[]>([]);
  const [likeCount, setLikeCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [navHidden, setNavHidden] = useState(false);
  const [subIn, setSubIn] = useState(false);   // Subview eingefahren?
  const lastScroll = useRef(0);
  const online = useOnline();
  // iOS: dvh-Höhe „setzt" sich erst nach einem Repaint → exakte Pixelhöhe per JS,
  // damit die schwarze Fläche sofort (ohne Scrollen) bis zum Home-Indikator reicht.
  // Der App-Container wird oben (an visualViewport.offsetTop) UND unten (an der
  // Tastaturhöhe) fixiert → er deckt sich immer exakt mit dem sichtbaren Viewport,
  // egal wie Safari beim Tastatur-Öffnen verschiebt. Kein Verrutschen, kein Weiss.
  const [kb, setKb] = useState(0);
  const [vtop, setVtop] = useState(0);

  const current = stack[stack.length - 1] ?? null;
  const inSubview = !!current;

  // Body-Hintergrund passend zum aktiven Rahmen: Tabs = hell, Subviews (noch dunkel) = schwarz.
  useEffect(() => {
    const body = document.body;
    const prevBg = body.style.background;
    body.style.background = inSubview ? "#000" : "#fff";
    return () => { body.style.background = prevBg; };
  }, [inSubview]);

  // Harten Scroll-Lock (position:fixed) NUR in Subviews mit Texteingabe
  // (Chat, Formulare), wo die Tastatur-Logik den fixen Rahmen braucht. In der
  // Tab-Ansicht bleibt das Dokument frei scrollbar → iOS-Safari klappt seine
  // untere Adressleiste ein (Blue-Cinema-Effekt) und die fixe Tab-Bar rutscht
  // mit nach unten.
  useEffect(() => {
    const body = document.body;
    if (!inSubview) return;
    const prev = {
      overflow: body.style.overflow,
      position: body.style.position,
      width: body.style.width,
      height: body.style.height,
    };
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.width = "100%";
    body.style.height = "100%";
    return () => {
      body.style.overflow = prev.overflow;
      body.style.position = prev.position;
      body.style.width = prev.width;
      body.style.height = prev.height;
    };
  }, [inSubview]);

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
    // Beim Tab-Wechsel nach oben, damit der neue Tab von oben startet.
    window.scrollTo(0, 0);
  }, []);

  // In der Tab-Ansicht scrollt jetzt das Dokument (window) selbst. Der Handler
  // bleibt in den Context gehängt (Kompatibilität), wird aber nicht mehr zum
  // Ausblenden der Tab-Bar genutzt — die bleibt sichtbar und rutscht wie bei
  // Blue Cinema mit der einklappenden Safari-Leiste mit.
  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const y = e.currentTarget.scrollTop;
    if (y > lastScroll.current + 6 && y > 56) setNavHidden(true);
    else if (y < lastScroll.current - 6) setNavHidden(false);
    lastScroll.current = y;
  }

  /* Subviews (z.B. „+ Finden") wurden bisher hart ein-/ausgehaengt. Jetzt fahren
     sie ein — und beim Schliessen wieder raus, bevor sie unmounten. Der Ref
     haelt den aktuellen Stack, damit closeSubView stabil bleibt und trotzdem
     weiss, ob es der letzte Eintrag ist. */
  const stackRef = useRef<SubViewState[]>([]);
  useEffect(() => { stackRef.current = stack; }, [stack]);
  useEffect(() => {
    // Zuruecksetzen ist wichtig: der Tab-Wechsel leert den Stack direkt (ohne
    // closeSubView). Bliebe subIn dann true, waere der naechste Subview sofort
    // „drin" und wuerde gar nicht mehr einfahren.
    if (!inSubview) { setSubIn(false); return; }
    const id = requestAnimationFrame(() => setSubIn(true));
    return () => cancelAnimationFrame(id);
  }, [inSubview]);

  /* Jeder geoeffnete Subview bekommt einen History-Eintrag (pushState). Sonst
     verlaesst die Browser-Zurueck-Taste die ganze /app-SPA und landet auf der
     Landing-Seite. Mit dem Eintrag faengt der popstate-Listener „Zurueck" ab und
     schliesst stattdessen genau eine Subview-Ebene → man ist wieder im Home-Tab. */
  const openSubView = useCallback((sv: SubViewState) => {
    setStack((s) => [...s, sv]);
    try { window.history.pushState({ muSub: true }, ""); } catch { /* ignore */ }
  }, []);

  // Ausgeblendeten Top-Eintrag entfernen — letzter Eintrag mit Ausfahr-Animation,
  // innere Ebenen (Stack > 1) direkt, dort wuerde ein Ausfahren nur flackern.
  const popTop = useCallback(() => {
    if (stackRef.current.length > 1) { setStack((s) => s.slice(0, -1)); return; }
    setSubIn(false);
    window.setTimeout(() => setStack([]), 220);
  }, []);

  // In-App-Schliessen laeuft ueber die History (history.back → popstate → popTop),
  // damit der pushState-Eintrag mitentfernt wird und beides synchron bleibt.
  const closeSubView = useCallback(() => {
    if (stackRef.current.length === 0) return;
    try { window.history.back(); } catch { popTop(); }
  }, [popTop]);

  useEffect(() => {
    const onPop = () => { if (stackRef.current.length > 0) popTop(); };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [popTop]);

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
      {inSubview ? (
        // Subview: fixer, tastatursicherer Rahmen (deckt sich exakt mit dem
        // sichtbaren Viewport, kein Verrutschen beim Tastatur-Öffnen).
        <div
          className="fixed inset-x-0 flex justify-center overflow-hidden bg-black"
          style={{
            top: vtop,
            bottom: kb,
            transition: "top 0.16s ease-out, bottom 0.16s ease-out",
          }}
        >
          <div
            className="relative flex h-full w-full max-w-[430px] flex-col bg-black pt-[env(safe-area-inset-top)] text-white"
            style={{
              transform: subIn ? "translateY(0) scale(1)" : "translateY(22px) scale(0.985)",
              opacity: subIn ? 1 : 0,
              transition: "transform 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 240ms ease-out",
            }}
          >
            {!online && (
              <div className="shrink-0 bg-yellow-900 px-4 py-2 text-center text-xs text-yellow-200">
                {t("app.offline")}
              </div>
            )}
            <SubViewRenderer subView={current} />
          </div>
        </div>
      ) : (
        // Tab-Ansicht: das DOKUMENT scrollt (kein fixer Rahmen) → iOS-Safari
        // klappt seine untere Leiste ein, die fixe Tab-Bar rutscht mit.
        <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col bg-white pt-[env(safe-area-inset-top)] text-neutral-900">
          {!online && (
            <div className="bg-yellow-900 px-4 py-2 text-center text-xs text-yellow-200">
              {t("app.offline")}
            </div>
          )}
          <div className="pb-28">
            {activeTab === "discover" && <DiscoverTab />}
            {activeTab === "earth" && <EarthTab />}
            {activeTab === "matches" && (isTour ? <TourMatchesTab /> : <MatchesTab />)}
            {activeTab === "games" && (isTour ? <TourChatTab /> : <GamesTab />)}
            {activeTab === "profile" && (isTour ? <TourProfileTab /> : <ProfileTab />)}
          </div>

          <TabBar
            tabs={tabs}
            active={activeTab}
            onSelect={selectTab}
            badges={{ matches: unreadCount + likeCount }}
            hidden={navHidden}
            center={isTour ? { icon: "M6 9a6 6 0 0 0 12 0V4H6zM6 6H3v1a3 3 0 0 0 3 3M18 6h3v1a3 3 0 0 1-3 3M9 21h6M12 15v6", label: t("mode.plannerTitle"), onClick: () => openSubView({ type: "tour-planner" }) } : undefined}
          />
        </div>
      )}
    </AppNavContext.Provider>
  );
}
