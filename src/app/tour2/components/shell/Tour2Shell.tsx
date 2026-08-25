"use client";

/**
 * /tour2 Shell: linke Icon-Rail (Desktop) + untere Leiste (Handy).
 * Keine obere Text-Tab-Leiste. Kalender-Inhalt bleibt unberührt.
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
  { key: "tournaments", href: "/tour2/tournaments", label: "tournaments", match: (p) => p.startsWith("/tour2/browse") || p.startsWith("/tour2/tournaments") || p.startsWith("/tour2/map") },
  { key: "season", href: "/tour2/planner", label: "season", match: (p) => ["/tour2/planner", "/tour2/season", "/tour2/pipeline", "/tour2/finance", "/tour2/expenses", "/tour2/costs", "/tour2/schengen", "/tour2/points", "/tour2/form", "/tour2/wildcards"].some((r) => p.startsWith(r)) },
  { key: "calendar", href: "/tour2/calendar", label: "calendar", match: (p) => p.startsWith("/tour2/calendar") || p.startsWith("/tour2/timeline") },
  { key: "profile", href: "/tour2/profile", label: "profile", match: (p) => p.startsWith("/tour2/setup") || p.startsWith("/tour2/profile") },
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
  const tournDesk = pathname.startsWith("/tour2/browse") || pathname.startsWith("/tour2/tournaments");

  const item = (a: (typeof AREA)[number], compact: boolean) => {
    const active = a.key === activeKey;
    return (
      <Link
        key={a.key}
        href={a.href}
        className={compact
          ? `relative flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold ${active ? "text-[var(--t2-ink)]" : "text-[var(--t2-muted)]"}`
          : `flex w-[60px] flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-semibold ${active ? "bg-matchup/10 text-matchup" : "text-[var(--t2-muted)] hover:bg-black/[0.04] hover:text-[var(--t2-ink)]"}`}
      >
        {compact && active && <span className="absolute top-0 h-0.5 w-8 bg-matchup" />}
        <Icon k={a.key} />
        {t(LABELS[a.label])}
      </Link>
    );
  };

  return (
    <div className={`t2-root min-h-[100dvh] ${T2_CANVAS}`}>
      <nav className="fixed left-0 top-0 z-40 hidden h-[100dvh] w-[76px] flex-col items-center border-r border-[var(--t2-line)] bg-[var(--t2-paper)] py-3 md:flex">
        <Link href="/tour2" aria-label="Matchup Tour" className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-matchup text-[15px] font-black text-white">M</Link>
        <div className="flex flex-1 flex-col gap-1">
          {AREA.map((a) => item(a, false))}
        </div>
        <div className="flex flex-col items-center gap-2 pb-1">
          {profile?.ranking != null && (
            <span className="text-[11px] font-semibold tabular-nums text-[var(--t2-muted)]" title={t("tour.t2rank")}>#{profile.ranking}</span>
          )}
          <Link href="/tour2/profile" aria-label={t("tour.t2navProfile")}>
            {profile?.profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.profileImage} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[12px] font-semibold ring-1 ring-black/10">{initial}</span>
            )}
          </Link>
        </div>
      </nav>

      <div className="md:pl-[76px]">
        <main className={seasonDesk || tournDesk ? "" : "pb-24 md:pb-0"}>{children}</main>
      </div>

      <nav className="fixed bottom-0 left-0 z-40 grid w-full grid-cols-5 border-t border-[var(--t2-line)] bg-[var(--t2-paper)] pb-[env(safe-area-inset-bottom)] md:hidden">
        {AREA.map((a) => item(a, true))}
      </nav>
    </div>
  );
}
