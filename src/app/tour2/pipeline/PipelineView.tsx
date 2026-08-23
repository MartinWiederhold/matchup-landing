"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT, useLocale } from "@/lib/i18n";
import { loadSeasonPlanRows, loadAllEntryEvents, loadTournamentsByIds, setDecision } from "@/lib/tourSeason";
import { loadCostRates } from "@/lib/tourCosts";
import { costRatesComplete } from "@/lib/tourPlanner";
import { alternateTrend } from "@/domain/tour/entryTrend";
import { buildPipeline } from "@/domain/tour/pipeline";
import { DeadlineCountdown } from "../components/EntryDeadline";
import type { TourSeasonPlanEntry, TourEntryEvent, TourTournament, TourDecision, TourCostRates } from "@/lib/types";

const NIGHTS_KEY = "mu_tour_nights";
const DECISIONS: TourDecision[] = ["play", "wait", "fallback", "open"];
const DAY = 86_400_000;

/**
 * Wochen-Pipeline (Kommandozentrale): je Woche eine Zeile ab der laufenden Woche —
 * Turnier · Status (+Trend) · Frist · Kosten · Entscheidung. Leere Wochen bleiben als
 * sichtbare Lücke (Erholung). Breit als Tabelle, schmal als Karten (kein Querscrollen).
 * Das Wochen-Raster kommt aus der reinen Domain-Funktion buildPipeline.
 */
export default function PipelineView() {
  const { user, loading: authLoading } = useAuth();
  const t = useT();
  const { locale } = useLocale();

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [plans, setPlans] = useState<TourSeasonPlanEntry[]>([]);
  const [tourById, setTourById] = useState<Map<string, TourTournament>>(new Map());
  const [eventsByPlan, setEventsByPlan] = useState<Map<string, TourEntryEvent[]>>(new Map());
  const [rates, setRates] = useState<TourCostRates | null>(null);
  const [nights] = useState<number>(() => { try { const n = parseInt(localStorage.getItem(NIGHTS_KEY) ?? "", 10); return Number.isFinite(n) && n >= 0 ? n : 7; } catch { return 7; } });
  const [nowMs] = useState(() => Date.now());

  const reload = useCallback(async () => {
    const [pr, evs, cr] = await Promise.all([loadSeasonPlanRows(), loadAllEntryEvents(), loadCostRates()]);
    const tours = await loadTournamentsByIds([...new Set(pr.map((p) => p.tournament_id))]);
    setPlans(pr);
    setTourById(new Map(tours.map((x) => [x.id, x])));
    const m = new Map<string, TourEntryEvent[]>();
    for (const e of evs) { const a = m.get(e.plan_id); if (a) a.push(e); else m.set(e.plan_id, [e]); }
    setEventsByPlan(m);
    setRates(cr);
  }, []);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    reload().then(() => { if (alive) setStatus("ready"); }).catch(() => { if (alive) setStatus("error"); });
    return () => { alive = false; };
  }, [user, reload]);

  // Wochen-Raster aus der Domain (chronologisch, ab laufender Woche, Lücken sichtbar).
  const weeks = useMemo(() => {
    const items: { monday: string; plan: TourSeasonPlanEntry; tour: TourTournament }[] = [];
    for (const p of plans) {
      const tour = tourById.get(p.tournament_id);
      if (tour) items.push({ monday: tour.tournament_monday, plan: p, tour });
    }
    return buildPipeline(items, new Date(nowMs));
  }, [plans, tourById, nowMs]);

  // Entscheidung ändern: optimistisch + persistieren (bei Fehler echten Stand nachladen).
  const changeDecision = useCallback((planId: string, decision: TourDecision) => {
    setPlans((cur) => cur.map((p) => (p.id === planId ? { ...p, decision } : p)));
    void setDecision(planId, decision).catch(() => reload());
  }, [reload]);

  const intl = locale === "en" ? "en-GB" : "de-DE";
  const fmtDay = (iso: string) => new Intl.DateTimeFormat(intl, { day: "2-digit", month: "short", timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z"));
  const fmtRange = (mondayIso: string) => `${fmtDay(mondayIso)}–${fmtDay(new Date(Date.parse(mondayIso + "T00:00:00Z") + 6 * DAY).toISOString().slice(0, 10))}`;
  const catName = (c: string | null) => (c ? (t(`tour.country.${c}`).startsWith("tour.country.") ? c : t(`tour.country.${c}`)) : "—");
  const money = (minor: number) => new Intl.NumberFormat(intl, { style: "currency", currency: rates?.currency ?? "EUR", maximumFractionDigits: 0 }).format(minor / 100);
  const ratesDone = costRatesComplete(rates);
  const weekCostMinor = ratesDone ? (rates!.arrival_minor ?? 0) + (rates!.per_night_minor ?? 0) * nights + (rates!.food_per_day_minor ?? 0) * nights + (rates!.coach_per_week_minor ?? 0) : null;
  const asOfDate = new Date(nowMs).toISOString().slice(0, 10);

  // Status-Pill + Trend (bei Alternate).
  const pill = (plan: TourSeasonPlanEntry) => {
    const s = plan.status;
    const pos = plan.alternate_position;
    const cls = s === "main_draw" || s === "entered" || s === "qualifying" || s === "confirmed" ? "bg-emerald-500/10 text-emerald-700"
      : s === "alternate" ? "bg-amber-500/10 text-amber-700"
      : s === "withdrawn" || s === "cancelled" ? "bg-black/[0.05] text-neutral-500 line-through"
      : "bg-black/[0.05] text-neutral-600";
    const word = `${t(`tour.status_${s}`)}${s === "alternate" && pos != null ? ` #${pos}` : ""}`;
    const events = eventsByPlan.get(plan.id) ?? [];
    const trend = s === "alternate" ? alternateTrend(events.map((e) => ({ observedAt: e.observed_at, alternatePosition: e.alternate_position })), asOfDate) : { kind: "none" as const };
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${cls}`}>{word}</span>
        {trend.kind === "up" && <span className="text-[11px] font-bold text-emerald-600" title={t("tour.wsTrendUp", { n: trend.delta })}>↑</span>}
        {trend.kind === "down" && <span className="text-[11px] font-bold text-amber-600" title={t("tour.wsTrendDown", { n: -trend.delta })}>↓</span>}
        {trend.kind === "flat" && <span className="text-[11px] text-neutral-400" title={t("tour.wsTrendFlat")}>•</span>}
        {trend.kind === "stale" && <span className="text-[10.5px] text-neutral-400">{t("tour.wsEntryAsOf", { date: fmtDay(trend.observedAt) })}</span>}
      </span>
    );
  };

  const decisionSelect = (plan: TourSeasonPlanEntry) => (
    <select value={plan.decision} onChange={(e) => changeDecision(plan.id, e.target.value as TourDecision)} aria-label={t("tour.pipeColDecision")}
      className="rounded-full border border-black/15 bg-white px-2.5 py-1 text-[12px] font-semibold text-neutral-700 transition-colors hover:border-black/30 focus:outline-none">
      {DECISIONS.map((d) => <option key={d} value={d}>{t(`tour.decision_${d}`)}</option>)}
    </select>
  );

  // ── Auth-/Ladegate ─────────────────────────────────────────────────────────
  if (authLoading) return <p className="mt-6 text-sm text-neutral-500">{t("tour.loading")}</p>;
  if (!user) {
    return (
      <div className="mt-8 rounded-2xl bg-black/[0.02] p-6 text-center">
        <p className="text-sm text-neutral-500">{t("tour.loginRequiredText")}</p>
        <Link href="/app" className="mt-3 inline-flex rounded-full bg-matchup px-6 py-3 text-sm font-bold text-white hover:bg-matchup-hover">{t("tour.loginCta")}</Link>
      </div>
    );
  }
  if (status === "loading") return <p className="mt-6 text-sm text-neutral-500">{t("tour.loading")}</p>;
  if (status === "error") return <p className="mt-6 text-sm text-neutral-500">{t("tour.loadError")}</p>;
  if (weeks.length === 0) return <p className="mt-8 rounded-xl bg-black/[0.02] px-4 py-4 text-[14px] text-neutral-500">{t("tour.pipeEmpty")}</p>;

  return (
    <div className="mt-8">
      {/* Breit: echte Tabelle */}
      <div className="hidden overflow-hidden rounded-2xl ring-1 ring-black/[0.06] md:block">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead>
            <tr className="bg-black/[0.02] text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-400">
              <th className="px-4 py-3 font-bold">{t("tour.pipeColWeek")}</th>
              <th className="px-4 py-3 font-bold">{t("tour.pipeColTournament")}</th>
              <th className="px-4 py-3 font-bold">{t("tour.pipeColStatus")}</th>
              <th className="px-4 py-3 font-bold">{t("tour.pipeColDeadline")}</th>
              <th className="px-4 py-3 font-bold">{t("tour.pipeColCost")}</th>
              <th className="px-4 py-3 font-bold">{t("tour.pipeColDecision")}</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((w) => (w.isGap ? (
              <tr key={w.monday} className="border-t border-black/[0.05]">
                <td className="whitespace-nowrap px-4 py-2.5"><span className="font-semibold text-neutral-500">{t("tour.pipeKw", { n: w.isoWeek })}</span><span className="ml-2 text-[11px] text-neutral-400">{fmtRange(w.monday)}</span></td>
                <td className="px-4 py-2.5 text-[12px] italic text-neutral-400" colSpan={5}>{t("tour.pipeGap")}</td>
              </tr>
            ) : w.items.map((it, idx) => (
              <tr key={it.plan.id} className="border-t border-black/[0.05] align-top">
                <td className="whitespace-nowrap px-4 py-3">{idx === 0 && (<><span className="font-semibold text-neutral-800">{t("tour.pipeKw", { n: w.isoWeek })}</span><span className="ml-2 text-[11px] text-neutral-400">{fmtRange(w.monday)}</span></>)}</td>
                <td className="px-4 py-3"><span className="font-semibold text-neutral-900">{it.tour.city || t("tour.fieldMissing")}</span><span className="text-neutral-400">, {catName(it.tour.country)}</span><span className="ml-1.5 inline-block rounded-full bg-black/[0.04] px-2 py-0.5 text-[10.5px] font-semibold text-neutral-500">{it.tour.category || "—"}</span></td>
                <td className="px-4 py-3">{pill(it.plan)}</td>
                <td className="px-4 py-3"><DeadlineCountdown tournament={it.tour} now={nowMs} /></td>
                <td className="whitespace-nowrap px-4 py-3 text-neutral-700">{weekCostMinor != null ? money(weekCostMinor) : "—"}</td>
                <td className="px-4 py-3">{decisionSelect(it.plan)}</td>
              </tr>
            ))))}
          </tbody>
        </table>
      </div>

      {/* Schmal: Karten statt Zeilen (kein Querscrollen) */}
      <div className="space-y-2.5 md:hidden">
        {weeks.map((w) => (
          <div key={w.monday} className={`rounded-2xl p-3 ${w.isGap ? "border border-dashed border-black/10" : "ring-1 ring-black/[0.06]"}`}>
            <div className="flex items-baseline justify-between">
              <span className={`text-[12px] font-bold ${w.isGap ? "text-neutral-400" : "text-neutral-700"}`}>{t("tour.pipeKw", { n: w.isoWeek })}</span>
              <span className="text-[11px] text-neutral-400">{fmtRange(w.monday)}</span>
            </div>
            {w.isGap ? (
              <p className="mt-1 text-[12px] italic text-neutral-400">{t("tour.pipeGap")}</p>
            ) : w.items.map((it) => (
              <div key={it.plan.id} className="mt-2 border-t border-black/[0.05] pt-2 [&:nth-child(2)]:mt-1.5 [&:nth-child(2)]:border-0 [&:nth-child(2)]:pt-0">
                <p className="text-[14px] font-semibold text-neutral-900">{it.tour.city || t("tour.fieldMissing")}<span className="text-neutral-400">, {catName(it.tour.country)}</span></p>
                <p className="text-[11px] text-neutral-500">{it.tour.category || "—"}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  {pill(it.plan)}
                  <DeadlineCountdown tournament={it.tour} now={nowMs} />
                  {weekCostMinor != null && <span className="text-[12px] text-neutral-600">{money(weekCostMinor)}</span>}
                </div>
                <div className="mt-2">{decisionSelect(it.plan)}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
