"use client";

/**
 * /tour2 Shell: Top-Bar + Pill-Navigation. Sieben Flächen aus den Entwürfen,
 * Gestaltung bleibt editorial (Papier, Dock). Profil sitzt als Avatar oben —
 * nicht als achter Dock-Punkt.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { loadPlannerProfile, type PlannerProfile } from "@/lib/tourPlanner";
import { T2_CANVAS } from "../t2ui";
import { t2markNavStart } from "../../t2mark";

type AreaKey = "home" | "tournaments" | "season" | "ranking" | "travel" | "documents" | "network";

const HOME = (p: string) => p === "/tour2" || p.startsWith("/tour2/calendar") || p.startsWith("/tour2/timeline");
const AREA: { key: AreaKey; href: string; label: keyof typeof LABELS; match: (p: string) => boolean }[] = [
  { key: "home", href: "/tour2", label: "home", match: HOME },
  { key: "tournaments", href: "/tour2/finder", label: "tournaments", match: (p) => ["/tour2/finder", "/tour2/browse", "/tour2/tournaments", "/tour2/map"].some((r) => p.startsWith(r)) },
  { key: "season", href: "/tour2/season", label: "season", match: (p) => ["/tour2/season", "/tour2/planner", "/tour2/pipeline"].some((r) => p.startsWith(r)) },
  { key: "ranking", href: "/tour2/ranking", label: "ranking", match: (p) => ["/tour2/ranking", "/tour2/points", "/tour2/form"].some((r) => p.startsWith(r)) },
  { key: "travel", href: "/tour2/travel", label: "travel", match: (p) => ["/tour2/travel", "/tour2/finance", "/tour2/costs", "/tour2/expenses", "/tour2/schengen"].some((r) => p.startsWith(r)) },
  { key: "documents", href: "/tour2/documents", label: "documents", match: (p) => p.startsWith("/tour2/documents") },
  { key: "network", href: "/tour2/network", label: "network", match: (p) => p.startsWith("/tour2/network") || p.startsWith("/tour2/wildcards") },
];
const LABELS = {
  home: "tour.t2navOverview",
  tournaments: "tour.t2navFinder",
  season: "tour.t2navPlanner",
  ranking: "tour.t2navRanking",
  travel: "tour.t2navTravel",
  documents: "tour.t2navDocs",
  network: "tour.t2navNetwork",
} as const;

function Icon({ k, className }: { k: AreaKey; className?: string }) {
  const p = { className: className ?? "h-[18px] w-[18px]", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, viewBox: "0 0 24 24" };
  switch (k) {
    case "home": return <svg {...p}><path d="M3 11l9-7 9 7M5 10v10h14V10" /></svg>;
    case "tournaments": return <svg {...p}><path d="M8 21h8M12 17v4M6 4h12v3a6 6 0 0 1-12 0zM6 5H3v2a3 3 0 0 0 3 3M18 5h3v2a3 3 0 0 1-3 3" /></svg>;
    case "season": return <svg {...p}><path d="M4 6h16M4 12h16M4 18h10" /><circle cx="18" cy="18" r="2.4" /></svg>;
    case "ranking": return <svg {...p}><path d="M4 19V10M12 19V5M20 19v-7" /></svg>;
    case "travel": return <svg {...p}><path d="M3 11h18M5 11V8l7-5 7 5v3M7 11v8h10v-8" /></svg>;
    case "documents": return <svg {...p}><path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v5h5" /></svg>;
    case "network": return <svg {...p}><circle cx="8" cy="8" r="2.4" /><circle cx="16" cy="8" r="2.4" /><circle cx="12" cy="16" r="2.4" /><path d="M9.8 9.5l1.4 5M14.2 9.5l-1.4 5" /></svg>;
  }
}

export default function Tour2Shell({ children }: { children: React.ReactNode }) {
  const t = useT();
  const pathname = usePathname() || "/tour2";
  const { user } = useAuth();
  const [profile, setProfile] = useState<PlannerProfile | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    loadPlannerProfile(user.id).then((p) => { if (alive) setProfile(p); }).catch(() => {});
    return () => { alive = false; };
  }, [user]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const activeKey = (AREA.find((a) => a.match(pathname)) ?? AREA[0]).key;
  const initial = (profile?.firstName?.[0] ?? "?").toUpperCase();

  return (
    <div className={`t2-root min-h-[100dvh] ${T2_CANVAS}`}>
      <header className="t2-topbar">
        <Link href="/tour2" aria-label="Matchup Tour" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-matchup text-[15px] font-bold text-white">M</span>
          <span className="text-[13px] font-semibold tracking-[-0.02em]">
            Matchup <span className="text-[var(--t2-faint)]">Tour</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {profile?.ranking != null && (
            <span className="hidden text-[12px] font-semibold tabular-nums text-[var(--t2-muted)] sm:inline" title={t("tour.t2rank")}>#{profile.ranking}</span>
          )}
          <Link href="/tour2/profile" aria-label={t("tour.t2navProfile")} className="transition-transform hover:-translate-y-0.5">
            {profile?.profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.profileImage} alt="" className="h-8 w-8 rounded-full object-cover ring-1 ring-black/10" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--t2-surface)] text-[12px] font-semibold ring-1 ring-black/10">{initial}</span>
            )}
          </Link>
        </div>
      </header>

      <main className="pb-28 md:pb-32">{children}</main>

      <button
        type="button"
        aria-label={t("tour.t2navOverview")}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="t2-fab"
        style={{ opacity: scrolled ? 1 : 0, pointerEvents: scrolled ? "auto" : "none", transition: "opacity 0.3s ease, transform 0.35s cubic-bezier(0.19,1,0.22,1)" }}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
      </button>

      <nav className="t2-dock" aria-label="Tour">
        <Link href="/tour2" aria-label="Matchup Tour" className="t2-dock-brand">M</Link>
        <span className="t2-dock-sep" aria-hidden />
        {AREA.map((a) => {
          const active = a.key === activeKey;
          return (
            <Link key={a.key} href={a.href} className={`t2-dock-item ${active ? "is-on" : ""}`} aria-current={active ? "page" : undefined} onClick={() => t2markNavStart()}>
              <Icon k={a.key} className="h-[17px] w-[17px]" />
              <span className="t2-dock-label">{t(LABELS[a.label])}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
