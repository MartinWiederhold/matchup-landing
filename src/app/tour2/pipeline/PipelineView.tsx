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
    const cls = s === "main_draw" || s === "entered" || s === "qualifying" || s === "confirmed" ? "bg-[var(--t2-success-surface)] text-[var(--t2-success)]"
      : s === "alternate" ? "bg-[var(--t2-warn-surface)] text-[var(--t2-warn)]"
      : s === "withdrawn" || s === "cancelled" ? "bg-[var(--t2-surface)] text-[var(--t2-muted)] line-through"
      : "bg-[var(--t2-surface)] text-[var(--t2-muted)]";
    const word = `${t(`tour.status_${s}`)}${s === "alternate" && pos != null ? ` #${pos}` : ""}`;
    const events = eventsByPlan.get(plan.id) ?? [];
    const trend = s === "alternate" ? alternateTrend(events.map((e) => ({ observedAt: e.observed_at, alternatePosition: e.alternate_position })), asOfDate) : { kind: "none" as const };
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className={`rounded-full px-2 py-0.5 t2-fs-meta font-bold ${cls}`}>{word}</span>
        {trend.kind === "up" && <span className="t2-fs-meta font-bold text-[var(--t2-success)]" title={t("tour.wsTrendUp", { n: trend.delta })}>↑</span>}
        {trend.kind === "down" && <span className="t2-fs-meta font-bold text-[var(--t2-warn)]" title={t("tour.wsTrendDown", { n: -trend.delta })}>↓</span>}
        {trend.kind === "flat" && <span className="t2-fs-meta text-[var(--t2-text-soft)]" title={t("tour.wsTrendFlat")}>•</span>}
        {trend.kind === "stale" && <span className="t2-fs-meta text-[var(--t2-text-soft)]">{t("tour.wsEntryAsOf", { date: fmtDay(trend.observedAt) })}</span>}
      </span>
    );
  };

  const decisionSelect = (plan: TourSeasonPlanEntry) => (
    <select value={plan.decision} onChange={(e) => changeDecision(plan.id, e.target.value as TourDecision)} aria-label={t("tour.pipeColDecision")}
      className="rounded-full border border-[var(--t2-line-strong)] bg-[var(--t2-paper)] px-2.5 py-1 t2-fs-micro font-semibold text-[var(--t2-ink)] transition-colors hover:border-[var(--t2-ink)] focus:outline-none">
      {DECISIONS.map((d) => <option key={d} value={d}>{t(`tour.decision_${d}`)}</option>)}
    </select>
  );

  // ── Auth-/Ladegate ─────────────────────────────────────────────────────────
  if (authLoading) return <p className="mt-6 t2-fs-body text-[var(--t2-muted)]">{t("tour.loading")}</p>;
  if (!user) {
    return (
      <div className="mt-8 t2-panel bg-[var(--t2-surface)] p-6 text-center">
        <p className="t2-fs-body text-[var(--t2-muted)]">{t("tour.loginRequiredText")}</p>
        <Link href="/app" className="mt-3 t2-cta">{t("tour.loginCta")}</Link>
      </div>
    );
  }
  if (status === "loading") return <p className="mt-6 t2-fs-body text-[var(--t2-muted)]">{t("tour.loading")}</p>;
  if (status === "error") return <p className="mt-6 t2-fs-body text-[var(--t2-muted)]">{t("tour.loadError")}</p>;
  if (weeks.length === 0) return <p className="mt-8 rounded-xl bg-[var(--t2-surface)] px-4 py-4 t2-fs-body text-[var(--t2-muted)]">{t("tour.pipeEmpty")}</p>;

  return (
    <div className="mt-8">
      {/* Breit: echte Tabelle */}
      <div className="hidden overflow-hidden rounded-xl border border-[var(--t2-line)] md:block">
        <table className="w-full border-collapse text-left t2-fs-body-sm">
          <thead>
            <tr className="bg-[var(--t2-surface)] t2-fs-meta font-bold uppercase tracking-[0.1em] text-[var(--t2-faint)]">
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
              <tr key={w.monday} className="border-t border-[var(--t2-line)]">
                <td className="whitespace-nowrap px-4 py-2.5"><span className="font-semibold text-[var(--t2-muted)]">{t("tour.pipeKw", { n: w.isoWeek })}</span><span className="ml-2 t2-fs-meta text-[var(--t2-faint)]">{fmtRange(w.monday)}</span></td>
                <td className="px-4 py-2.5 t2-fs-micro italic text-[var(--t2-faint)]" colSpan={5}>{t("tour.pipeGap")}</td>
              </tr>
            ) : w.items.map((it, idx) => (
              <tr key={it.plan.id} className="border-t border-[var(--t2-line)] align-top">
                <td className="whitespace-nowrap px-4 py-3">{idx === 0 && (<><span className="font-semibold text-[var(--t2-ink)]">{t("tour.pipeKw", { n: w.isoWeek })}</span><span className="ml-2 t2-fs-meta text-[var(--t2-faint)]">{fmtRange(w.monday)}</span></>)}</td>
                <td className="px-4 py-3"><span className="font-semibold text-[var(--t2-ink)]">{it.tour.city || t("tour.fieldMissing")}</span><span className="text-[var(--t2-faint)]">, {catName(it.tour.country)}</span><span className="ml-1.5 inline-block rounded-full bg-[var(--t2-surface)] px-2 py-0.5 t2-fs-meta font-semibold text-[var(--t2-muted)]">{it.tour.category || "—"}</span></td>
                <td className="px-4 py-3">{pill(it.plan)}</td>
                <td className="px-4 py-3"><DeadlineCountdown tournament={it.tour} now={nowMs} /></td>
                <td className="whitespace-nowrap px-4 py-3 text-[var(--t2-ink)]">{weekCostMinor != null ? money(weekCostMinor) : "—"}</td>
                <td className="px-4 py-3">{decisionSelect(it.plan)}</td>
              </tr>
            ))))}
          </tbody>
        </table>
      </div>

      {/* Schmal: Karten statt Zeilen (kein Querscrollen) */}
      <div className="space-y-2.5 md:hidden">
        {weeks.map((w) => (
          <div key={w.monday} className={`rounded-xl p-3 ${w.isGap ? "border border-dashed border-[var(--t2-line-strong)]" : "border border-[var(--t2-line)]"}`}>
            <div className="flex items-baseline justify-between">
              <span className={`t2-fs-micro font-bold ${w.isGap ? "text-[var(--t2-faint)]" : "text-[var(--t2-ink)]"}`}>{t("tour.pipeKw", { n: w.isoWeek })}</span>
              <span className="t2-fs-meta text-[var(--t2-faint)]">{fmtRange(w.monday)}</span>
            </div>
            {w.isGap ? (
              <p className="mt-1 t2-fs-micro italic text-[var(--t2-faint)]">{t("tour.pipeGap")}</p>
            ) : w.items.map((it) => (
              <div key={it.plan.id} className="mt-2 border-t border-[var(--t2-line)] pt-2 [&:nth-child(2)]:mt-1.5 [&:nth-child(2)]:border-0 [&:nth-child(2)]:pt-0">
                <p className="t2-fs-body font-semibold text-[var(--t2-ink)]">{it.tour.city || t("tour.fieldMissing")}<span className="text-[var(--t2-faint)]">, {catName(it.tour.country)}</span></p>
                <p className="t2-fs-meta text-[var(--t2-muted)]">{it.tour.category || "—"}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  {pill(it.plan)}
                  <DeadlineCountdown tournament={it.tour} now={nowMs} />
                  {weekCostMinor != null && <span className="t2-fs-micro text-[var(--t2-muted)]">{money(weekCostMinor)}</span>}
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
