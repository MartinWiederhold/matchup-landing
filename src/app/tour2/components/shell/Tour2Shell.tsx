"use client";

/**
 * /tour2 Shell: horizontale Leiste wie Cadillac/Day One, kein Icon-Rail.
 * Aktiver Punkt: Matchup-Unterstrich.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { loadPlannerProfile, type PlannerProfile } from "@/lib/tourPlanner";
import { T2_CANVAS } from "../t2ui";

type AreaKey = "home" | "tournaments" | "season" | "calendar" | "profile";

const HOME = (p: string) => p === "/tour2";
const AREA: { key: AreaKey; href: string; label: keyof typeof LABELS; match: (p: string) => boolean }[] = [
  { key: "home", href: "/tour2", label: "home", match: HOME },
  { key: "tournaments", href: "/tour2/browse", label: "tournaments", match: (p) => p.startsWith("/tour2/browse") || p.startsWith("/tour2/map") },
  { key: "season", href: "/tour2/planner", label: "season", match: (p) => ["/tour2/planner", "/tour2/season", "/tour2/pipeline", "/tour2/finance", "/tour2/expenses", "/tour2/costs", "/tour2/schengen", "/tour2/points", "/tour2/form", "/tour2/wildcards"].some((r) => p.startsWith(r)) },
  { key: "calendar", href: "/tour2/calendar", label: "calendar", match: (p) => p.startsWith("/tour2/calendar") || p.startsWith("/tour2/timeline") },
  { key: "profile", href: "/tour2/setup", label: "profile", match: (p) => p.startsWith("/tour2/setup") },
];
const LABELS = { home: "tour.t2navHome", tournaments: "tour.t2navTournaments", season: "tour.t2navSeason", calendar: "tour.t2navCalendar", profile: "tour.t2navProfile" } as const;

function Icon({ k, className }: { k: AreaKey; className?: string }) {
  const p = { className: className ?? "h-5 w-5", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, viewBox: "0 0 24 24" };
  switch (k) {
    case "home": return <svg {...p}><path d="M3 11l9-7 9 7M5 10v10h14V10" /></svg>;
    case "tournaments": return <svg {...p}><path d="M8 21h8M12 17v4M6 4h12v3a6 6 0 0 1-12 0zM6 5H3v2a3 3 0 0 0 3 3M18 5h3v2a3 3 0 0 1-3 3" /></svg>;
    case "season": return <svg {...p}><path d="M4 6h16M4 12h16M4 18h10" /><circle cx="18" cy="18" r="2.4" /></svg>;
    case "calendar": return <svg {...p}><path d="M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" /></svg>;
    case "profile": return <svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
  }
}

export default function Tour2Shell({ children }: { children: React.ReactNode }) {
  const t = useT();
  const pathname = usePathname() || "/tour2";
  const { user } = useAuth();
  const [profile, setProfile] = useState<PlannerProfile | null>(null);
  useEffect(() => {
    if (!user) return;
    let alive = true;
    loadPlannerProfile(user.id).then((p) => { if (alive) setProfile(p); }).catch(() => {});
    return () => { alive = false; };
  }, [user]);

  const activeKey = (AREA.find((a) => a.match(pathname)) ?? AREA[0]).key;
  const initial = (profile?.firstName?.[0] ?? "?").toUpperCase();
  const seasonDesk = pathname.startsWith("/tour2/planner");
  const tournDesk = pathname.startsWith("/tour2/browse");
  const calDesk = pathname.startsWith("/tour2/calendar");

  return (
    <div className={`t2-root min-h-[100dvh] ${T2_CANVAS}`}>
      <header className="sticky top-0 z-40 flex h-14 items-center gap-6 border-b border-[var(--t2-line)] bg-[var(--t2-paper)] px-4 sm:px-6">
        <Link href="/tour2" className="flex shrink-0 items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center bg-matchup text-[13px] font-black text-white">M</span>
          <span className="hidden text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--t2-ink)] sm:inline">Matchup Tour</span>
        </Link>
        <nav className="hidden min-w-0 flex-1 items-center gap-5 md:flex">
          {AREA.map((a) => {
            const active = a.key === activeKey;
            return (
              <Link
                key={a.key}
                href={a.href}
                className={`relative py-4 text-[12px] font-semibold lowercase tracking-[0.04em] ${active ? "text-[var(--t2-ink)]" : "text-[var(--t2-muted)] hover:text-[var(--t2-ink)]"}`}
              >
                {t(LABELS[a.label])}
                {active && <span className="absolute inset-x-0 bottom-0 h-[2px] bg-matchup" />}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {profile?.ranking != null && (
            <span className="hidden border border-[var(--t2-line)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] tabular-nums text-[var(--t2-ink)] sm:inline" title={t("tour.t2rank")}>#{profile.ranking}</span>
          )}
          <Link href="/tour2/setup" aria-label={t("tour.t2navProfile")}>
            {profile?.profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.profileImage} alt="" className="h-8 w-8 object-cover" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center border border-[var(--t2-line)] text-[12px] font-semibold">{initial}</span>
            )}
          </Link>
        </div>
      </header>

      <main className={seasonDesk || tournDesk || calDesk ? "" : "pb-24 md:pb-0"}>{children}</main>

      <nav className="fixed bottom-0 left-0 z-40 grid w-full grid-cols-5 border-t border-[var(--t2-line)] bg-[var(--t2-paper)] pb-[env(safe-area-inset-bottom)] md:hidden">
        {AREA.map((a) => {
          const active = a.key === activeKey;
          return (
            <Link key={a.key} href={a.href} className={`relative flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold ${active ? "text-[var(--t2-ink)]" : "text-[var(--t2-muted)]"}`}>
              {active && <span className="absolute top-0 h-0.5 w-8 bg-matchup" />}
              <Icon k={a.key} className="h-5 w-5" />
              {t(LABELS[a.label])}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
