"use client";

/**
 * Desktop: linke Leiste mit drei Zielen plus Mehr-Bereich.
 * Telefon: Kopfzeile + vier Tabs (Heute, Suchen, Saison, Mehr).
 */

import { useEffect, useState, type ReactNode, type UIEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useT, useLocale, type Locale } from "@/lib/i18n";
import { loadPlannerProfile, type PlannerProfile } from "@/lib/tourPlanner";
import { loadTravelDocuments } from "@/lib/tourTravelDocuments";
import { loadWildcardContacts } from "@/lib/tourWildcards";
import {
  T2_FINDER, T2_RANKING, T2_SEASON,
} from "@/app/tour2/components/t2Action";
import { t2markNavStart } from "@/app/tour2/t2mark";
import Tour2TabBar, { type T2Tab } from "./Tour2TabBar";

const PRIMARY = [
  { key: "overview", href: "/tour2", match: (p: string) => p === "/tour2", label: "t2navToday" as const },
  { key: "finder", href: T2_FINDER, match: (p: string) => p.startsWith("/tour2/finder") || p.startsWith("/tour2/tournaments") || p.startsWith("/tour2/browse") || p.startsWith("/tour2/map"), label: "t2navFinder" as const },
  { key: "season", href: T2_SEASON, match: (p: string) => p.startsWith("/tour2/season") || p.startsWith("/tour2/planner") || p.startsWith("/tour2/pipeline") || p.startsWith("/tour2/calendar") || p.startsWith("/tour2/timeline"), label: "t2navPlanner" as const },
] as const;

const MORE = [
  { key: "ranking", href: T2_RANKING, match: (p: string) => p.startsWith("/tour2/ranking") || p.startsWith("/tour2/points") || p.startsWith("/tour2/form"), label: "t2navRanking" as const },
  { key: "travel", href: "/tour2/travel", match: (p: string) => p.startsWith("/tour2/travel") || p.startsWith("/tour2/costs") || p.startsWith("/tour2/expenses") || p.startsWith("/tour2/finance") || p.startsWith("/tour2/schengen"), label: "t2navTravel" as const },
  { key: "docs", href: "/tour2/documents", match: (p: string) => p.startsWith("/tour2/documents") || p.startsWith("/tour2/setup"), label: "t2navDocs" as const },
  { key: "network", href: "/tour2/network", match: (p: string) => p.startsWith("/tour2/network") || p.startsWith("/tour2/wildcards"), label: "t2navNetwork" as const },
  { key: "profile", href: "/tour2/profile", match: (p: string) => p.startsWith("/tour2/profile"), label: "t2navProfile" as const },
] as const;

const FULL_BLEED = ["/tour2/finder", "/tour2/season", "/tour2/map"];

type IconName = (typeof PRIMARY)[number]["key"] | (typeof MORE)[number]["key"];

function Icon({ name }: { name: IconName }) {
  const p = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, "aria-hidden": true as const };
  if (name === "overview") return <svg {...p}><path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" /></svg>;
  if (name === "finder") return <svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.2 4.2" /></svg>;
  if (name === "season") return <svg {...p}><path d="M4 7h16M4 12h16M4 17h10" /></svg>;
  if (name === "ranking") return <svg {...p}><path d="M5 19V10M12 19V5M19 19v-7" /></svg>;
  if (name === "travel") return <svg {...p}><path d="M3 17 21 7M8 17l3-3M14 11l3-3" /></svg>;
  if (name === "docs") return <svg {...p}><path d="M7 4h7l5 5v11H7z" /><path d="M14 4v5h5" /></svg>;
  if (name === "profile") return <svg {...p}><circle cx="12" cy="8" r="3" /><path d="M5 19c1.4-3 3.6-4.5 7-4.5S17.6 16 19 19" /></svg>;
  return <svg {...p}><circle cx="8" cy="10" r="2.4" /><circle cx="16" cy="10" r="2.4" /><path d="M4.5 18c.8-2.4 2.5-3.6 4.5-3.6s3.7 1.2 4.5 3.6M13.5 18c.4-1.2 1.2-2 2.5-2.4" /></svg>;
}

function LangSwitchRail() {
  const { locale, setLocale } = useLocale();
  const options: Locale[] = ["de", "en"];
  return (
    <div className="ml-1 inline-flex items-center rounded-full bg-[var(--t2-surface)] p-0.5 t2-fs-meta font-bold">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => setLocale(opt)}
          aria-pressed={locale === opt}
          className={`rounded-full px-1.5 py-0.5 uppercase tracking-wide transition-colors ${
            locale === opt ? "bg-[var(--t2-ink)] text-[var(--t2-on-accent)]" : "text-[var(--t2-muted)] hover:text-[var(--t2-ink)]"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function LangSwitchSheet() {
  const { locale, setLocale } = useLocale();
  const options: Locale[] = ["de", "en"];
  return (
    <div className="inline-flex items-center rounded-full border border-[var(--t2-line-strong)] bg-[var(--t2-surface)] p-0.5 t2-fs-meta font-bold">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => setLocale(opt)}
          aria-pressed={locale === opt}
          className={`rounded-full px-2 py-0.5 uppercase tracking-wide transition-colors ${
            locale === opt ? "bg-[var(--t2-ink)] text-[var(--t2-on-accent)]" : "text-[var(--t2-muted)] hover:text-[var(--t2-ink)]"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function Tour2Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/tour2";
  const router = useRouter();
  const t = useT();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<PlannerProfile | null>(null);
  const [docCount, setDocCount] = useState(0);
  const [netCount, setNetCount] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const [navCompact, setNavCompact] = useState(false);

  useEffect(() => { setMoreOpen(false); }, [pathname]);

  useEffect(() => {
    if (!user) { setProfile(null); setDocCount(0); setNetCount(0); return; }
    let cancelled = false;
    void Promise.all([
      loadPlannerProfile(user.id),
      loadTravelDocuments(user.id),
      loadWildcardContacts(user.id),
    ]).then(([p, docs, wcs]) => {
      if (cancelled) return;
      setProfile(p);
      setDocCount(docs.length);
      setNetCount(wcs.length);
    }).catch(() => { /* Sidebar-Zähler optional */ });
    return () => { cancelled = true; };
  }, [user]);

  const name = profile?.displayName || profile?.firstName || user?.email || "";
  const country = profile?.countryName || profile?.country || "";
  const ranking = profile?.ranking;
  const year = new Date().getFullYear();
  const bleed = FULL_BLEED.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const currentPrimary = PRIMARY.find((a) => a.match(pathname));
  const currentMore = MORE.find((a) => a.match(pathname));
  const headerKey = currentPrimary?.label ?? currentMore?.label ?? "t2navToday";
  const moreActive = !!currentMore;

  const onMainScroll = (e: UIEvent<HTMLElement>) => {
    setNavCompact((e.currentTarget.scrollTop || 0) > 24);
  };

  const badge = (key: string): number | null => {
    if (key === "docs" && docCount > 0) return docCount;
    if (key === "network" && netCount > 0) return netCount;
    return null;
  };

  const railLink = (a: { key: string; href: string; match: (p: string) => boolean; label: "t2navToday" | "t2navFinder" | "t2navPlanner" | "t2navRanking" | "t2navTravel" | "t2navDocs" | "t2navNetwork" | "t2navProfile" }) => {
    const active = a.match(pathname);
    const n = badge(a.key);
    return (
      <Link
        key={a.key}
        href={a.href}
        className={`t2-rail-item ${active ? "is-on" : ""}`}
        aria-current={active ? "page" : undefined}
        onClick={() => t2markNavStart()}
      >
        <Icon name={a.key as IconName} />
        <span className="t2-rail-label">{t(`tour.${a.label}`)}</span>
        {n != null && <span className="t2-rail-badge">{n}</span>}
      </Link>
    );
  };

  const rail = (
    <>
      <Link href="/tour2" className="t2-rail-brand" onClick={() => t2markNavStart()}>
        <span className="t2-rail-mark" aria-hidden>M</span>
        <span className="t2-rail-word">MATCHUP TOUR</span>
      </Link>
      <nav className="t2-rail-nav" aria-label="Tour">
        {PRIMARY.map(railLink)}
        <p className="mt-4 px-3 t2-fs-meta font-semibold uppercase tracking-[0.16em] text-[var(--t2-on-accent)]/55">{t("tour.t2more")}</p>
        {MORE.map(railLink)}
      </nav>
      <div className="t2-rail-foot">
        {user && (
          <Link href="/tour2/profile" className="t2-rail-who">
            {profile?.profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.profileImage} alt="" className="t2-rail-avatar" />
            ) : (
              <span className="t2-rail-avatar t2-rail-avatar-fallback">{(name || "?").slice(0, 1)}</span>
            )}
            <span className="min-w-0">
              <span className="block truncate t2-fs-micro font-semibold leading-tight">{name || "—"}</span>
              <span className="mt-0.5 block truncate t2-fs-meta opacity-80">
                {[ranking != null ? `#${ranking}` : null, country || null].filter(Boolean).join(" · ")}
              </span>
            </span>
          </Link>
        )}
        <p className="t2-rail-season" title={t("tour.t2seasonCard")}>{year}</p>
        <div className="t2-rail-tools">
          <Link href="/tour2#t2-actions" className="t2-rail-tool" aria-label={t("tour.t2action")} title={t("tour.t2action")}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5" /><path d="M10 17a2 2 0 0 0 4 0" /></svg>
          </Link>
          {user && (
            <button
              type="button"
              className="t2-rail-tool"
              aria-label={t("tour.t2signOut")}
              title={t("tour.t2signOut")}
              onClick={() => { void signOut().then(() => router.push("/app")); }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M10 7V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-2M15 12H3m0 0 3-3M3 12l3 3" /></svg>
            </button>
          )}
          <LangSwitchRail />
        </div>
      </div>
    </>
  );

  const tabs: T2Tab[] = [
    { key: "overview", href: "/tour2", label: t("tour.t2navToday"), icon: "overview" },
    { key: "finder", href: T2_FINDER, label: t("tour.t2navFinder"), icon: "finder" },
    { key: "season", href: T2_SEASON, label: t("tour.t2navPlanner"), icon: "season" },
    { key: "more", label: t("tour.t2more"), icon: "more", badge: (badge("docs") ?? 0) + (badge("network") ?? 0) || null },
  ];
  const tabActive = moreActive ? "more" : (currentPrimary?.key ?? "overview");

  const moreLinks = MORE.map((a) => ({
    href: a.href,
    label: t(`tour.${a.label}`),
    match: a.match(pathname),
    n: badge(a.key),
  }));

  return (
    <div className="t2-root t2-shell">
      <aside className="t2-rail t2-rail-desk">{rail}</aside>
      <div className="t2-workspace">
        <header className="t2-mhead md:hidden">
          <span className="t2-rail-mark" aria-hidden>M</span>
          <p className="min-w-0 flex-1 truncate t2-fs-body font-semibold tracking-[-0.02em]">{t(`tour.${headerKey}`)}</p>
          {user && (
            <Link href="/tour2/profile" className="shrink-0" aria-label={t("tour.t2navProfile")}>
              {profile?.profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.profileImage} alt="" className="t2-rail-avatar" />
              ) : (
                <span className="t2-rail-avatar t2-rail-avatar-fallback text-[var(--t2-ink)]">{(name || "?").slice(0, 1)}</span>
              )}
            </Link>
          )}
        </header>
        <main
          className={bleed ? "t2-workspace-main is-bleed" : "t2-workspace-main"}
          onScroll={onMainScroll}
        >
          {children}
        </main>
        <Tour2TabBar tabs={tabs} active={tabActive} compact={navCompact} onMore={() => setMoreOpen((o) => !o)} />
        {moreOpen && (
          <div className="fixed inset-0 z-[35] md:hidden" onClick={() => setMoreOpen(false)}>
            <div
              className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-[var(--t2-on-accent)] px-5 pt-4 pb-[max(6.5rem,calc(5.5rem+env(safe-area-inset-bottom)))] shadow-[0_-12px_40px_rgba(0,0,0,0.18)] ring-1 ring-black/10"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="t2-section-title">{t("tour.t2more")}</p>
              <p className="mt-1 t2-fs-micro text-[var(--t2-muted)]">{t("tour.t2moreLead")}</p>
              <ul className="mt-3 space-y-1">
                {moreLinks.map((x) => (
                  <li key={x.href}>
                    <Link
                      href={x.href}
                      className={`flex items-center justify-between rounded-xl px-3 py-3 t2-fs-body font-semibold ${x.match ? "bg-[var(--t2-accent-soft)] text-[var(--t2-ink)]" : "text-[var(--t2-ink)]"}`}
                      onClick={() => t2markNavStart()}
                    >
                      <span>{x.label}</span>
                      {x.n != null && <span className="t2-fs-micro tabular-nums text-[var(--t2-muted)]">{x.n}</span>}
                    </Link>
                  </li>
                ))}
                {user && (
                  <li>
                    <button
                      type="button"
                      className="flex w-full items-center rounded-xl px-3 py-3 text-left t2-fs-body font-semibold text-[var(--t2-muted)]"
                      onClick={() => { void signOut().then(() => router.push("/app")); }}
                    >
                      {t("tour.t2signOut")}
                    </button>
                  </li>
                )}
                <li className="mt-2 flex items-center justify-between px-3 py-2 t2-fs-body-sm font-semibold text-[var(--t2-muted)]">
                  <span>{t("tour.t2langLabel")}</span>
                  <LangSwitchSheet />
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
