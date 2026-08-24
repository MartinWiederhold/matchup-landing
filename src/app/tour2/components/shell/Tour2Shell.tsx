"use client";

/**
 * /tour2 Navigations-Gerüst (Etappe 1). Fünf Bereiche als schmale linke Rail (Desktop) und
 * untere Leiste (Handy); oben rechts der Konto-Cluster (Benachrichtigungen · Ranking · Avatar).
 * Dunkles Tool-Mode (tiefes Slate, nicht reinschwarz) — /tour ist ohnehin ein eigener
 * Vollbild-Modus, der Bruch sitzt sauber an der /tour2-Grenze. Karte ist KEIN Bereich mehr;
 * die Ziele sind für Etappe 1 auf die vorhandenen (kopierten) Routen gelegt und werden in
 * späteren Etappen zusammengeführt.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { loadPlannerProfile, type PlannerProfile } from "@/lib/tourPlanner";

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
  const p = { className: className ?? "h-5 w-5", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, viewBox: "0 0 24 24" };
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
    <div className="min-h-[100dvh] bg-[#0b0e14] text-neutral-100">
      {/* Desktop: schmale linke Rail */}
      <nav className="fixed left-0 top-0 z-40 hidden h-[100dvh] w-[76px] flex-col items-center border-r border-white/10 bg-[#0d1117] py-3 md:flex">
        <Link href="/app" aria-label="Matchup" className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-matchup text-[15px] font-black text-white">M</Link>
        <div className="mt-1 flex flex-1 flex-col gap-1">
          {AREA.map((a) => {
            const active = a.key === activeKey;
            return (
              <Link key={a.key} href={a.href} className={`flex w-[60px] flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-semibold transition-colors ${active ? "bg-white/10 text-white" : "text-neutral-400 hover:bg-white/[0.05] hover:text-neutral-200"}`}>
                <Icon k={a.key} />
                {t(LABELS[a.label])}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Inhaltsspalte */}
      <div className="md:pl-[76px]">
        {/* Kopf: Konto-Cluster rechts */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-end gap-2 border-b border-white/10 bg-[#0b0e14]/85 px-4 backdrop-blur">
          <button type="button" aria-label="Benachrichtigungen" className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 ring-1 ring-white/10 hover:text-neutral-200">
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" /></svg>
          </button>
          {profile?.ranking != null && (
            <span className="rounded-full bg-white/5 px-2.5 py-1 text-[12px] font-bold text-neutral-200 ring-1 ring-white/10" title={t("tour.t2rank")}>#{profile.ranking}</span>
          )}
          <Link href="/tour2/setup" aria-label={t("tour.t2navProfile")} className="ml-1">
            {profile?.profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.profileImage} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-white/15" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-matchup/20 text-[13px] font-bold text-matchup ring-2 ring-white/15">{initial}</span>
            )}
          </Link>
        </header>

        <main className={seasonDesk || tournDesk || calDesk ? "" : "pb-24 md:pb-0"}>{children}</main>
      </div>

      {/* Handy: untere Leiste */}
      <nav className="fixed bottom-0 left-0 z-40 grid w-full grid-cols-5 border-t border-white/10 bg-[#0d1117] pb-[env(safe-area-inset-bottom)] md:hidden">
        {AREA.map((a) => {
          const active = a.key === activeKey;
          return (
            <Link key={a.key} href={a.href} className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold ${active ? "text-white" : "text-neutral-500"}`}>
              <Icon k={a.key} className="h-5 w-5" />
              {t(LABELS[a.label])}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
