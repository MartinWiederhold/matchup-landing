"use client";

import { useEffect, useState } from "react";
import { useT, useLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { loadTourPlan, loadTourProfile } from "@/lib/tour";
import type { TourProfile } from "@/lib/types";
import {
  TIER_META, expectedPointsForWinRate, projectSeasonPoints, pointsToRank, prizeFor,
  type Tournament, type Tier,
} from "@/lib/tournaments";
import { flagEmoji } from "@/lib/flags";
import { useAppNav } from "../appNav";

type TRow = { id: string; name: string; city: string | null; country: string | null; tier: string; surface: string | null; start_date: string; end_date: string };

/**
 * Compete-Tab 4 („Trophy") — Ranking & Meldechancen.
 * Zeigt Live-Ranking + Punkte, eine anpassbare Saison-Projektion (Siegquote →
 * projizierter Rang) und die Punkte-Potenziale der geplanten Turniere.
 */
export default function CompeteRanking() {
  const t = useT();
  const { locale } = useLocale();
  const { profile, openSubView } = useAppNav();
  const [tour, setTour] = useState<TourProfile | null>(null);
  const [plan, setPlan] = useState<Tournament[]>([]);
  const [winRate, setWinRate] = useState(50);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const [tp, ids] = await Promise.all([loadTourProfile(profile.id), loadTourPlan(profile.id)]);
      let rows: TRow[] = [];
      if (ids.length) {
        const { data } = await supabase
          .from("tournaments")
          .select("id,name,city,country,tier,surface,start_date,end_date")
          .in("id", ids)
          .order("start_date");
        rows = (data as TRow[]) ?? [];
      }
      // Auf das interne Tournament-Shape mappen (nur was die Rechner brauchen).
      const mapped = rows
        .filter((r) => TIER_META[r.tier as Tier])
        .map((r) => ({ id: r.id, name: r.name, city: r.city ?? "", country: r.country ?? "", tier: r.tier as Tier, surface: (r.surface ?? "Hartplatz") as Tournament["surface"], start: r.start_date, end: r.end_date, lat: 0, lng: 0 })) as unknown as Tournament[];
      // Echte Siegquote aus entschiedenen Matches, sonst 50 %.
      const { data: ev } = await supabase
        .from("tour_events").select("won").eq("user_id", profile.id).eq("kind", "match").not("won", "is", null);
      const decided = (ev as { won: boolean }[]) ?? [];
      const w = decided.filter((m) => m.won).length;
      setWinRate(decided.length >= 3 ? Math.round((w / decided.length) * 100) : 50);
      setTour(tp); setPlan(mapped); setLoaded(true);
    })();
  }, [profile.id]);

  if (!loaded) return <div className="flex h-[60vh] items-center justify-center text-neutral-400">…</div>;

  const gender: "m" | "w" = profile.gender === "female" ? "w" : "m";
  const curRank = tour?.ranking ?? null;
  const curPoints = tour?.points ?? null;

  const projPoints = plan.length ? projectSeasonPoints(plan, winRate / 100) : 0;
  const basePoints = curPoints ?? 0;
  const totalProjected = basePoints + projPoints;
  const projRank = plan.length ? pointsToRank(totalProjected, gender) : (curRank ?? null);
  const rankDelta = curRank != null && projRank != null ? curRank - projRank : null;

  // Punkte-Potenzial je geplantem Turnier (bei aktueller Siegquote), absteigend.
  const perEvent = plan
    .map((tr) => ({ tr, pts: expectedPointsForWinRate(tr.tier, winRate / 100) }))
    .sort((a, b) => b.pts - a.pts);

  const num = (n: number) => n.toLocaleString(locale);
  const fmtRange = (s: string, e: string) => {
    const o: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
    return `${new Date(s + "T00:00:00").toLocaleDateString(locale, o)} – ${new Date(e + "T00:00:00").toLocaleDateString(locale, o)}`;
  };

  return (
    <div className="px-4 pt-[max(12px,env(safe-area-inset-top))]">
      <h1 className="text-[26px] font-extrabold tracking-tight text-neutral-900">{t("mode.rankingTabTitle")}</h1>
      <p className="mt-1 text-[13.5px] text-neutral-500">{t("mode.rankingTabSub")}</p>

      {/* Hero: aktuelles Ranking */}
      <div className="mt-4 flex items-center gap-4 rounded-[24px] bg-gradient-to-br from-matchup to-indigo-600 p-5 text-white shadow-sm">
        <div className="flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">{t("mode.currentRanking")}</p>
          <p className="mt-1 text-[40px] font-extrabold leading-none tracking-tight">{curRank != null ? `#${num(curRank)}` : "—"}</p>
          <p className="mt-1.5 text-[13px] font-semibold text-white/80">{curPoints != null ? `${num(curPoints)} ${t("mode.points")}` : t("mode.rankingSetup")}</p>
        </div>
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12v5a6 6 0 0 1-12 0V3zM6 5H3v1a3 3 0 0 0 3 3M18 5h3v1a3 3 0 0 0-3 3M9 21h6M12 14v7" /></svg>
        </span>
      </div>

      {plan.length === 0 ? (
        <div className="mt-4 rounded-[24px] bg-black/[0.035] p-6 text-center">
          <p className="text-[14px] font-semibold text-neutral-900">{t("mode.rankingNoPlanTitle")}</p>
          <p className="mx-auto mt-1 max-w-[280px] text-[13px] text-neutral-500">{t("mode.rankingNoPlanSub")}</p>
          <button type="button" onClick={() => openSubView({ type: "tour-planner" })} className="mt-4 rounded-full bg-matchup px-5 py-2.5 text-[13.5px] font-bold text-white transition-transform active:scale-95">
            {t("mode.planSeason")}
          </button>
        </div>
      ) : (
        <>
          {/* Projektion */}
          <div className="mt-4 rounded-[24px] bg-black/[0.035] p-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("mode.projectedRanking")}</p>
                <p className="mt-1 flex items-baseline gap-2">
                  <span className="text-[32px] font-extrabold leading-none tracking-tight text-neutral-900">{projRank != null ? `#${num(projRank)}` : "—"}</span>
                  {rankDelta != null && rankDelta !== 0 && (
                    <span className={`text-[13px] font-bold ${rankDelta > 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {rankDelta > 0 ? "▲" : "▼"} {num(Math.abs(rankDelta))}
                    </span>
                  )}
                </p>
              </div>
              <p className="text-right text-[13px] font-semibold text-neutral-500">
                +{num(projPoints)} <span className="text-neutral-400">{t("mode.points")}</span>
              </p>
            </div>

            {/* Siegquote-Regler */}
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-[12px] font-semibold">
                <span className="text-neutral-500">{t("mode.assumedWinRate")}</span>
                <span className="text-matchup">{winRate}%</span>
              </div>
              <input
                type="range" min={0} max={100} step={5} value={winRate}
                onChange={(e) => setWinRate(Number(e.target.value))}
                className="h-6 w-full cursor-pointer appearance-none rounded-full bg-transparent
                  [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-black/10
                  [&::-webkit-slider-thumb]:mt-[-7px] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-matchup [&::-webkit-slider-thumb]:shadow" />
            </div>
            <p className="mt-1 text-[11px] text-neutral-400">{t("mode.rankingEstimateNote")}</p>
          </div>

          {/* Punkte-Potenzial je Turnier */}
          <div className="mt-5">
            <p className="mb-2 px-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">{t("mode.pointPotential")}</p>
            <div className="space-y-2">
              {perEvent.map(({ tr, pts }) => {
                const meta = TIER_META[tr.tier];
                return (
                  <button
                    key={tr.id}
                    type="button"
                    onClick={() => openSubView({ type: "tour-tournament", tournamentId: tr.id })}
                    className="flex w-full items-center gap-3 rounded-2xl bg-black/[0.035] p-3.5 text-left transition-transform active:scale-[0.99]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[15px]" style={{ background: `${meta.color}1a` }}>
                      {flagEmoji(tr.country)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-bold text-neutral-900">{tr.name}</p>
                      <p className="truncate text-[11px] text-neutral-500">{meta.label} · {fmtRange(tr.start, tr.end)}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[15px] font-extrabold text-neutral-900">+{num(Math.round(pts))}</p>
                      <p className="text-[10px] text-neutral-400">{prizeFor(tr) ? `${num(Math.round(prizeFor(tr) / 1000))}k ${t("mode.prizePool")}` : ""}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
