"use client";

/**
 * Linke Tour-Leiste (Markenblau) + Arbeitsfläche. Die sieben Bereiche
 * stehen als Zeilen, nicht als Dock unten.
 */

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { loadPlannerProfile, type PlannerProfile } from "@/lib/tourPlanner";
import { loadTravelDocuments } from "@/lib/tourTravelDocuments";
import { loadWildcardContacts } from "@/lib/tourWildcards";
import {
  T2_FINDER, T2_RANKING, T2_SEASON,
} from "@/app/tour2/components/t2Action";
import { t2markNavStart } from "@/app/tour2/t2mark";

const AREA = [
  { key: "overview", href: "/tour2", match: (p: string) => p === "/tour2", label: "t2navOverview" as const },
  { key: "finder", href: T2_FINDER, match: (p: string) => p.startsWith("/tour2/finder") || p.startsWith("/tour2/tournaments") || p.startsWith("/tour2/browse") || p.startsWith("/tour2/map"), label: "t2navFinder" as const },
  { key: "season", href: T2_SEASON, match: (p: string) => p.startsWith("/tour2/season") || p.startsWith("/tour2/planner") || p.startsWith("/tour2/pipeline"), label: "t2navPlanner" as const },
  { key: "ranking", href: T2_RANKING, match: (p: string) => p.startsWith("/tour2/ranking") || p.startsWith("/tour2/points") || p.startsWith("/tour2/form"), label: "t2navRanking" as const },
  { key: "travel", href: "/tour2/travel", match: (p: string) => p.startsWith("/tour2/travel") || p.startsWith("/tour2/costs") || p.startsWith("/tour2/expenses") || p.startsWith("/tour2/finance") || p.startsWith("/tour2/schengen"), label: "t2navTravel" as const },
  { key: "docs", href: "/tour2/documents", match: (p: string) => p.startsWith("/tour2/documents") || p.startsWith("/tour2/setup"), label: "t2navDocs" as const },
  { key: "network", href: "/tour2/network", match: (p: string) => p.startsWith("/tour2/network") || p.startsWith("/tour2/wildcards"), label: "t2navNetwork" as const },
] as const;

const FULL_BLEED = [
  "/tour2/finder", "/tour2/tournaments", "/tour2/browse", "/tour2/map",
  "/tour2/season", "/tour2/planner", "/tour2/pipeline",
];

function Icon({ name }: { name: (typeof AREA)[number]["key"] }) {
  const p = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, "aria-hidden": true as const };
  if (name === "overview") return <svg {...p}><path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" /></svg>;
  if (name === "finder") return <svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.2 4.2" /></svg>;
  if (name === "season") return <svg {...p}><path d="M4 7h16M4 12h16M4 17h10" /></svg>;
  if (name === "ranking") return <svg {...p}><path d="M5 19V10M12 19V5M19 19v-7" /></svg>;
  if (name === "travel") return <svg {...p}><path d="M3 17 21 7M8 17l3-3M14 11l3-3" /></svg>;
  if (name === "docs") return <svg {...p}><path d="M7 4h7l5 5v11H7z" /><path d="M14 4v5h5" /></svg>;
  return <svg {...p}><circle cx="8" cy="10" r="2.4" /><circle cx="16" cy="10" r="2.4" /><path d="M4.5 18c.8-2.4 2.5-3.6 4.5-3.6s3.7 1.2 4.5 3.6M13.5 18c.4-1.2 1.2-2 2.5-2.4" /></svg>;
}

export default function Tour2Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/tour2";
  const router = useRouter();
  const t = useT();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<PlannerProfile | null>(null);
  const [docCount, setDocCount] = useState(0);
  const [netCount, setNetCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

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

  const badge = (key: string): number | null => {
    if (key === "docs" && docCount > 0) return docCount;
    if (key === "network" && netCount > 0) return netCount;
    return null;
  };

  const rail = (
    <>
      <Link href="/tour2" className="t2-rail-brand" onClick={() => t2markNavStart()}>
        <span className="t2-rail-mark" aria-hidden>M</span>
        <span className="t2-rail-word">MATCHUP TOUR</span>
      </Link>
      <nav className="t2-rail-nav" aria-label="Tour">
        {AREA.map((a) => {
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
              <Icon name={a.key} />
              <span className="t2-rail-label">{t(`tour.${a.label}`)}</span>
              {n != null && <span className="t2-rail-badge">{n}</span>}
            </Link>
          );
        })}
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
              <span className="block truncate text-[12px] font-semibold leading-tight">{name || "—"}</span>
              <span className="mt-0.5 block truncate text-[10px] opacity-80">
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
          <Link href="/tour2/profile" className="t2-rail-tool" aria-label={t("tour.t2navProfile")} title={t("tour.t2navProfile")}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
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
        </div>
      </div>
    </>
  );

  return (
    <div className="t2-root t2-shell">
      <aside className="t2-rail t2-rail-desk">{rail}</aside>
      {menuOpen && (
        <div className="t2-rail-scrim md:hidden" onClick={() => setMenuOpen(false)}>
          <aside className="t2-rail t2-rail-drawer" onClick={(e) => e.stopPropagation()}>{rail}</aside>
        </div>
      )}
      <div className="t2-workspace">
        <button type="button" className="t2-rail-open md:hidden" aria-label={t("tour.t2ovMenu")} onClick={() => setMenuOpen(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
        <main className={bleed ? "t2-workspace-main is-bleed" : "t2-workspace-main"}>{children}</main>
      </div>
    </div>
  );
}
