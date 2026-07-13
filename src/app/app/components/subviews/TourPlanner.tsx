"use client";

import { useEffect, useState } from "react";
import { useT, useLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { loadTourPlan, loadTourProfile } from "@/lib/tour";
import { planAlerts, kindShort, type Urgency, type Alert } from "@/lib/deadlines";
import { schengenProjection } from "@/lib/schengen";
import { countryRegime } from "@/lib/visa";
import { flagEmoji } from "@/lib/flags";
import type { TourProfile } from "@/lib/types";
import { useAppNav } from "../appNav";
import { SubViewHeader } from "../shared/ui";

type Tourn = { id: string; name: string; city: string | null; tier: string; surface: string; start_date: string; end_date: string; country: string | null };
type Ev = { id: string; kind: string; title: string; event_date: string; event_time: string | null; tournament_id: string | null };

const URG_BG: Record<Urgency, string> = { red: "bg-red-500/10 text-red-600", amber: "bg-amber-500/10 text-amber-600", none: "bg-black/[0.05] text-neutral-500" };
const DOT: Record<string, string> = { training: "bg-emerald-500", match: "bg-red-500", physio: "bg-matchup", travel: "bg-blue-500", gym: "bg-amber-500", other: "bg-neutral-400" };

function todayISO() { return new Date().toISOString().slice(0, 10); }

export default function TourPlanner() {
  const t = useT();
  const { locale } = useLocale();
  const { profile, openSubView } = useAppNav();
  const [tab, setTab] = useState<"season" | "calendar">("season");
  const [tour, setTour] = useState<TourProfile | null>(null);
  const [tours, setTours] = useState<Tourn[]>([]);
  const [events, setEvents] = useState<Ev[]>([]);
  const [costByT, setCostByT] = useState<Record<string, number>>({});
  const [prizeByT, setPrizeByT] = useState<Record<string, number>>({});
  const [totals, setTotals] = useState({ prize: 0, cost: 0, cur: "EUR" });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const today = todayISO();
      const [tp, ids] = await Promise.all([loadTourProfile(profile.id), loadTourPlan(profile.id)]);
      let ts: Tourn[] = [];
      if (ids.length) {
        const { data } = await supabase.from("tournaments").select("id,name,city,tier,surface,start_date,end_date,country").in("id", ids).order("start_date");
        ts = ((data as Tourn[]) ?? []).filter((tr) => tr.end_date >= today);
      }
      const [{ data: exp }, { data: pz }, { data: ev }] = await Promise.all([
        supabase.from("tour_expenses").select("tournament_id,amount,currency").eq("user_id", profile.id),
        supabase.from("tour_prize").select("tournament_id,amount,currency").eq("user_id", profile.id),
        supabase.from("tour_events").select("id,kind,title,event_date,event_time,tournament_id").eq("user_id", profile.id).gte("event_date", today).order("event_date").order("event_time", { nullsFirst: true }),
      ]);
      const cb: Record<string, number> = {}, pb: Record<string, number> = {};
      let pSum = 0, cSum = 0, cur = "";
      for (const r of (exp as { tournament_id: string | null; amount: number | null; currency: string | null }[]) ?? []) {
        const a = Number(r.amount) || 0; cSum += a; if (r.tournament_id) cb[r.tournament_id] = (cb[r.tournament_id] ?? 0) + a; if (!cur && r.currency) cur = r.currency;
      }
      for (const r of (pz as { tournament_id: string | null; amount: number | null; currency: string | null }[]) ?? []) {
        const a = Number(r.amount) || 0; pSum += a; if (r.tournament_id) pb[r.tournament_id] = (pb[r.tournament_id] ?? 0) + a; if (!cur && r.currency) cur = r.currency;
      }
      setTour(tp); setTours(ts); setEvents((ev as Ev[]) ?? []);
      setCostByT(cb); setPrizeByT(pb); setTotals({ prize: pSum, cost: cSum, cur: cur || "EUR" });
      setLoaded(true);
    })();
  }, [profile.id]);

  if (!loaded) return <div className="flex h-full items-center justify-center bg-white text-neutral-400">…</div>;

  const today = todayISO();
  const alerts = planAlerts(tours.map((tr) => ({ ...tr, start: tr.start_date })), 240);
  const alertFor = (id: string): Alert<Tourn & { start: string }> | undefined => alerts.find((a) => a.tournament.id === id && a.kind === "entry");
  const thisWeek = tours.find((tr) => tr.start_date <= today && tr.end_date >= today);
  const upcoming = tours.filter((tr) => tr.id !== thisWeek?.id && tr.end_date >= today);
  const net = totals.prize - totals.cost;
  const money = (n: number) => `${n < 0 ? "−" : ""}${Math.abs(n).toLocaleString(locale, { maximumFractionDigits: 0 })} ${totals.cur}`;
  const fmt = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString(locale, { day: "numeric", month: "short" });

  const schengen = schengenProjection(tours.map((tr) => ({ start: tr.start_date, end: tr.end_date, country: tr.country })));

  const regimePill = (country: string | null) => {
    const r = countryRegime(country);
    if (r === "check") return null;
    return <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600">{t(`mode.visa_reg_${r}`)}</span>;
  };

  // Kalender: nach Tag gruppieren.
  const groups = new Map<string, Ev[]>();
  for (const e of events) { if (!groups.has(e.event_date)) groups.set(e.event_date, []); groups.get(e.event_date)!.push(e); }
  const dayLabel = (iso: string) => iso === today ? t("mode.today") : new Date(iso + "T00:00:00").toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });

  return (
    <div className="flex h-full flex-col bg-white text-neutral-900">
      <SubViewHeader
        light
        title={t("mode.plannerTitle")}
        rightActions={<button type="button" onClick={() => openSubView({ type: "tour-schedule" })} className="text-[13px] font-bold text-matchup">+ {t("mode.addEvent")}</button>}
      />

      {/* Sub-Tabs */}
      <div className="flex gap-2 px-4 pb-2 pt-1">
        {(["season", "calendar"] as const).map((k) => (
          <button key={k} type="button" onClick={() => setTab(k)} className={`rounded-lg px-4 py-1.5 text-[13px] font-semibold ${tab === k ? "bg-neutral-900 text-white" : "bg-black/[0.05] text-neutral-500"}`}>
            {t(k === "season" ? "mode.tabSeason" : "mode.tabCalendar")}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-28">
        {tab === "season" ? (
          <>
            {/* Season-Strip */}
            <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar">
              {[
                { v: String(tours.length), l: t("mode.plannedCount") },
                { v: tour?.ranking != null ? String(tour.ranking) : "—", l: t("mode.ranking") },
                { v: tour?.points != null ? String(tour.points) : "—", l: t("mode.points") },
                { v: money(net), l: t("mode.netPnl"), accent: net >= 0 ? "text-emerald-600" : "text-red-600" },
              ].map((s, i) => (
                <div key={i} className="shrink-0 rounded-2xl border border-black/[0.07] px-4 py-2.5 text-center">
                  <div className={`text-[16px] font-extrabold tracking-tight ${s.accent ?? "text-neutral-900"}`}>{s.v}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{s.l}</div>
                </div>
              ))}
            </div>

            {tours.length === 0 && (
              <div className="rounded-2xl bg-black/[0.035] p-5 text-center">
                <p className="text-[13px] text-neutral-500">{t("mode.briefingEmpty")}</p>
                <a href="/map" className="mt-3 inline-block rounded-full bg-matchup px-4 py-2 text-[13px] font-bold text-white">{t("mode.planSeason")}</a>
              </div>
            )}

            {/* Turnier-Finder für alle Levels (ITF, national, Junioren, Senioren, UTR) */}
            <button type="button" onClick={() => openSubView({ type: "tournament-finder" })} className="mb-4 flex w-full items-center gap-3 rounded-2xl border border-black/[0.08] p-4 text-left">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-matchup/10 text-matchup">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2h12v6a6 6 0 0 1-12 0V2zM6 8H4a2 2 0 0 1-2-2V4h4M18 8h2a2 2 0 0 0 2-2V4h-4M9 21h6M12 15v6" /></svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-bold text-neutral-900">{t("tourCal.title")}</span>
                <span className="block text-[12px] text-neutral-500">{t("tourCal.finderSub")}</span>
              </span>
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg>
            </button>

            {/* This week */}
            {thisWeek && (
              <>
                <p className="mb-2 px-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">{t("mode.thisWeek")}</p>
                <div className="mb-4 rounded-2xl border-l-[3px] border-emerald-500 bg-black/[0.035] p-4">
                  <button type="button" onClick={() => openSubView({ type: "tour-tournament", tournamentId: thisWeek.id })} className="flex w-full items-center gap-2.5 text-left">
                    <span className="text-[20px]">{flagEmoji(thisWeek.country)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-bold text-neutral-900">{thisWeek.name}</p>
                      <p className="text-[11.5px] text-neutral-500">{thisWeek.tier} · {thisWeek.surface} · {fmt(thisWeek.start_date)}–{fmt(thisWeek.end_date)}</p>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-600">{t("mode.activeTournament")}</span>
                  </button>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {[
                      { v: money(prizeByT[thisWeek.id] ?? 0), l: t("mode.prizeMoney") },
                      { v: money(costByT[thisWeek.id] ?? 0), l: t("mode.costsLabel") },
                      { v: money((prizeByT[thisWeek.id] ?? 0) - (costByT[thisWeek.id] ?? 0)), l: t("mode.net") },
                    ].map((s, i) => (
                      <div key={i} className="rounded-xl bg-white py-2 text-center ring-1 ring-black/[0.06]">
                        <div className="text-[12.5px] font-bold text-neutral-900">{s.v}</div>
                        <div className="text-[9px] uppercase tracking-wide text-neutral-400">{s.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Upcoming */}
            {upcoming.length > 0 && (
              <>
                <p className="mb-2 px-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">{t("mode.upcoming")}</p>
                <div className="space-y-2">
                  {upcoming.map((tr) => {
                    const a = alertFor(tr.id);
                    return (
                      <button key={tr.id} type="button" onClick={() => openSubView({ type: "tour-tournament", tournamentId: tr.id })} className="block w-full rounded-2xl border border-black/[0.07] p-3.5 text-left">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[18px]">{flagEmoji(tr.country)}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13.5px] font-bold text-neutral-900">{tr.name}</p>
                            <p className="text-[11px] text-neutral-500">{tr.tier} · {tr.surface} · {fmt(tr.start_date)}–{fmt(tr.end_date)}</p>
                          </div>
                          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-neutral-300" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m9 6 6 6-6 6" /></svg>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {a && <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${URG_BG[a.urgency]}`}>{kindShort(a.kind, locale)} {a.daysLeft === 0 ? t("mode.today") : t("mode.inDays", { n: a.daysLeft })}</span>}
                          {regimePill(tr.country)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Smart-Tipp */}
            {schengen && schengen.left <= 30 && (
              <>
                <p className="mb-2 mt-6 px-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">{t("mode.smartTipTitle")}</p>
                <div className="rounded-2xl border border-matchup/25 bg-matchup/[0.06] p-4">
                  <div className="mb-1.5 flex items-center gap-2">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-matchup" fill="currentColor"><path d="M12 2l1.9 5.8H20l-4.9 3.6 1.9 5.8L12 13.6 7 17.2l1.9-5.8L4 7.8h6.1z" /></svg>
                    <span className="text-[13px] font-bold text-matchup">{t("mode.smartTipTitle")}</span>
                  </div>
                  <p className="text-[12px] leading-relaxed text-neutral-700">
                    {t("mode.tipSchengen", { used: schengen.used, out: Math.max(0, schengen.used - 90 + 30) || 37 })}
                    {net !== 0 && ` ${t("mode.tipNet", { net: money(net) })}`}
                  </p>
                </div>
              </>
            )}

            {/* Tools */}
            <p className="mb-2 mt-6 px-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">{t("mode.toolsLabel")}</p>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { l: t("mode.deadlines"), on: () => openSubView({ type: "tour-deadlines" }), p: "M12 8v4l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" },
                { l: t("mode.budget"), on: () => openSubView({ type: "tour-expenses" }), p: "M4 8V6a2 2 0 0 1 2-2h2M20 16v2a2 2 0 0 1-2 2h-2M12 9v6M9 12h6" },
                { l: t("mode.mapLabel"), on: () => { window.location.href = "/map"; }, p: "M9 3 3 6v15l6-3 6 3 6-3V3l-6 3-6-3zM9 3v15M15 6v15" },
              ].map((x) => (
                <button key={x.l} type="button" onClick={x.on} className="flex flex-col items-center gap-2 rounded-2xl bg-black/[0.035] px-2 py-4">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 text-matchup" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={x.p} /></svg>
                  <span className="text-[11px] font-semibold text-neutral-600">{x.l}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          /* Kalender-Tab: Tagesagenda mit Uhrzeiten */
          <>
            {events.length === 0 ? (
              <div className="rounded-2xl bg-black/[0.035] p-5 text-center">
                <p className="text-[13px] text-neutral-500">{t("mode.noEvents")}</p>
                <button type="button" onClick={() => openSubView({ type: "tour-schedule" })} className="mt-3 rounded-full bg-matchup px-4 py-2 text-[13px] font-bold text-white">+ {t("mode.addEvent")}</button>
              </div>
            ) : (
              <>
                {[...groups.entries()].map(([date, evs]) => (
                  <div key={date} className="mb-5">
                    <p className="mb-2 px-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-neutral-400">{dayLabel(date)}</p>
                    <div className="rounded-2xl bg-black/[0.035] p-2">
                      {evs.map((e, i) => (
                        <button key={e.id} type="button" onClick={() => openSubView({ type: "tour-schedule" })} className={`flex w-full items-center gap-3 px-2.5 py-3 text-left ${i > 0 ? "border-t border-black/[0.06]" : ""}`}>
                          <span className="w-11 shrink-0 text-[12px] font-bold text-neutral-500">{e.event_time ? e.event_time.slice(0, 5) : "—"}</span>
                          <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[e.kind] ?? DOT.other}`} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13.5px] font-semibold text-neutral-900">{e.title}</span>
                            <span className="block text-[11px] text-neutral-500">{t(`mode.ekind_${e.kind}`)}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => openSubView({ type: "tour-schedule" })} className="mt-1 w-full rounded-full bg-black/[0.05] py-3 text-[13px] font-bold text-matchup">{t("mode.openSchedule")}</button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
