"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { useT, useLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { loadTourPlan } from "@/lib/tour";
import { TIER_META, type Tier } from "@/lib/tournaments";
import { flagEmoji } from "@/lib/flags";
import { useAppNav } from "../appNav";

type TRow = { id: string; name: string; city: string | null; country: string | null; tier: string; surface: string | null; start_date: string; end_date: string; lat: number | null; lng: number | null };

/**
 * Compete-Tab 3 (Mitte, „Saison") — Kernfeature-Einstieg zur Weltkarten-Planung.
 * Zeigt die geplante Saison als Karten-Hero (geplante Turniere als Punkte) und
 * führt für die volle interaktive Planung zur /map-Route (MapLibre). „Saison
 * planen" öffnet zusätzlich das In-App-Cockpit (tour-planner).
 */
export default function CompeteMap() {
  const t = useT();
  const { locale } = useLocale();
  const { profile, openSubView } = useAppNav();
  const [rows, setRows] = useState<TRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const ids = await loadTourPlan(profile.id);
      let list: TRow[] = [];
      if (ids.length) {
        const { data } = await supabase
          .from("tournaments")
          .select("id,name,city,country,tier,surface,start_date,end_date,lat,lng")
          .in("id", ids)
          .order("start_date");
        list = (data as TRow[]) ?? [];
      }
      setRows(list);
      setLoaded(true);
    })();
  }, [profile.id]);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = rows.filter((r) => r.end_date >= today);
  const fmt = (s: string, e: string) => {
    const o: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
    return `${new Date(s + "T00:00:00").toLocaleDateString(locale, o)} – ${new Date(e + "T00:00:00").toLocaleDateString(locale, o)}`;
  };

  // Lat/Lng → Pixel-Position auf der Equirectangular-Weltkarte (0..100 %).
  const pin = (lat: number | null, lng: number | null) =>
    lat == null || lng == null ? null : { left: ((lng + 180) / 360) * 100, top: ((90 - lat) / 180) * 100 };

  return (
    <div className="px-4 pt-[max(12px,env(safe-area-inset-top))]">
      <h1 className="text-[26px] font-extrabold tracking-tight text-neutral-900">{t("mode.mapTabTitle")}</h1>
      <p className="mt-1 text-[13.5px] text-neutral-500">{t("mode.mapTabSub")}</p>

      {/* Karten-Hero mit geplanten Turnieren als Punkte */}
      <a href="/map?tab=season" className="mt-4 block overflow-hidden rounded-[24px] ring-1 ring-black/[0.06]">
        <div className="relative aspect-[16/10] w-full bg-neutral-900">
          <img src="/compete/world-map.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/25" />

          {loaded && upcoming.map((r) => {
            const pos = pin(r.lat, r.lng);
            if (!pos) return null;
            const color = TIER_META[r.tier as Tier]?.color ?? "#4b3bf3";
            return (
              <span key={r.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${pos.left}%`, top: `${pos.top}%` }}>
                <span className="absolute inset-0 -m-1.5 animate-ping rounded-full" style={{ boxShadow: `0 0 0 1.5px ${color}66` }} />
                <span className="block h-2.5 w-2.5 rounded-full ring-2 ring-white" style={{ background: color }} />
              </span>
            );
          })}

          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">{t("mode.mapOpenFull")}</p>
              <p className="text-[15px] font-extrabold text-white">
                {loaded ? t("mode.mapPlannedCount", { count: upcoming.length }) : "…"}
              </p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-neutral-900">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </span>
          </div>
        </div>
      </a>

      {/* Planen-CTA */}
      <button
        type="button"
        onClick={() => openSubView({ type: "tour-planner" })}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-matchup py-3.5 text-[14px] font-bold text-white transition-transform active:scale-[0.98]"
      >
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
        {t("mode.planSeason")}
      </button>

      {/* Geplante Turniere */}
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between px-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">{t("mode.plannedTournaments")}</p>
          <a href="/map?tab=season" className="text-[11px] font-bold text-matchup">{t("mode.mapOpenFull")}</a>
        </div>

        {!loaded ? (
          <p className="rounded-2xl bg-black/[0.035] p-5 text-center text-[13px] text-neutral-400">…</p>
        ) : upcoming.length === 0 ? (
          <div className="rounded-[24px] bg-black/[0.035] p-6 text-center">
            <p className="text-[14px] font-semibold text-neutral-900">{t("mode.mapEmptyTitle")}</p>
            <p className="mx-auto mt-1 max-w-[280px] text-[13px] text-neutral-500">{t("mode.mapEmptySub")}</p>
            <a href="/map?tab=season" className="mt-4 inline-block rounded-full bg-matchup px-5 py-2.5 text-[13.5px] font-bold text-white">{t("mode.planSeason")}</a>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((r) => {
              const meta = TIER_META[r.tier as Tier];
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => openSubView({ type: "tour-tournament", tournamentId: r.id })}
                  className="flex w-full items-center gap-3 rounded-2xl bg-black/[0.035] p-3.5 text-left transition-transform active:scale-[0.99]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[15px]" style={{ background: `${meta?.color ?? "#4b3bf3"}1a` }}>
                    {flagEmoji(r.country)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-bold text-neutral-900">{r.name}</p>
                    <p className="truncate text-[11px] text-neutral-500">{[r.city, meta?.label, fmt(r.start_date, r.end_date)].filter(Boolean).join(" · ")}</p>
                  </div>
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-neutral-300" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
