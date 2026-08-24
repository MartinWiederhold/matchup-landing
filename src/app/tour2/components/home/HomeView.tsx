"use client";

/**
 * /tour2 Home (Etappe 1) — Einstiegspunkt statt Karte. Drei Karten (Nächstes ·
 * Handlungsbedarf · Saison) + die nächsten acht Wochen. Nutzt vorhandene Domain-Module
 * wieder (buildActionBoard, buildPipeline, computeSeasonCost, expectedPoints, tourDeadlines) —
 * nichts neu gebaut. Ehrliche Leerstellen: Akzeptanzwahrscheinlichkeit, Cut-off, Reisezeit
 * (inkl. „Departure recommended") gibt es nicht → weggelassen, nicht erfunden.
 *
 * Dunkles Tool-Mode. Datenbeschaffung schlank: Saison + Profil + Kostensätze. Schwere
 * Board-Eingaben (Visa/Doku/Schengen/Wildcards/Punkte-Verfall) folgen in späteren Etappen.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT, useLocale } from "@/lib/i18n";
import { loadSeason, type SeasonEntry } from "@/lib/tourSeason";
import { loadPlannerProfile, type PlannerProfile, ratesToCostParams, budgetMoney, costRatesComplete, placeKey } from "@/lib/tourPlanner";
import { loadCostRates } from "@/lib/tourCosts";
import type { TourCostRates } from "@/lib/types";
import { computeSeasonCost } from "@/domain/tour/costs";
import { expectedPoints } from "@/domain/tour/points";
import { tourDeadlines } from "@/domain/tour/deadlines";
import { buildActionBoard, type BoardTournament, type ActionItem } from "@/domain/tour/actionBoard";
import { buildPipeline } from "@/domain/tour/pipeline";

const DAY = 86_400_000;
const NIGHTS_KEY = "mu_tour_nights";
type LoadState = "loading" | "error" | "done";

export default function HomeView() {
  const { user, loading: authLoading } = useAuth();
  const t = useT();
  const { locale } = useLocale();
  const loc = locale === "de" ? "de-CH" : "en-GB";

  const [season, setSeason] = useState<SeasonEntry[]>([]);
  const [profile, setProfile] = useState<PlannerProfile | null>(null);
  const [rates, setRates] = useState<TourCostRates | null>(null);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    if (authLoading || !user) return;
    let cancel = false;
    setState("loading");
    Promise.all([loadSeason(), loadPlannerProfile(user.id), loadCostRates()])
      .then(([s, p, r]) => { if (!cancel) { setSeason(s); setProfile(p); setRates(r); setState("done"); } })
      .catch(() => { if (!cancel) setState("error"); });
    return () => { cancel = true; };
  }, [authLoading, user]);

  const nowMs = Date.now();
  const todayISO = new Date().toISOString().slice(0, 10);
  const nights = useMemo(() => { try { const n = parseInt(localStorage.getItem(NIGHTS_KEY) ?? "", 10); return Number.isFinite(n) && n >= 0 ? n : 7; } catch { return 7; } }, []);

  const active = useMemo(() => season.filter((s) => !s.tournamentInactive), [season]);
  const cur = rates?.currency ?? "EUR";
  const money = useCallback((minor: number) => new Intl.NumberFormat(loc, { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(minor / 100), [loc, cur]);
  const countryName = useCallback((c: string | null) => (c && !t(`tour.country.${c}`).startsWith("tour.country.") ? t(`tour.country.${c}`) : (c ?? "")), [t]);
  const mondayMs = (iso: string) => Date.parse(iso + "T00:00:00Z");
  const fmtDate = (iso: string) => new Intl.DateTimeFormat(loc, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z"));

  // Kosten (nur wenn Sätze vollständig) + Budget.
  const cost = useMemo(() => {
    if (!costRatesComplete(rates)) return null;
    const params = ratesToCostParams(rates!);
    const stations = active.map((s) => ({ place: placeKey(s.tournament.country, s.tournament.city) ?? `id:${s.tournament.id}`, nights, entryFee: null }));
    return computeSeasonCost(stations, params);
  }, [rates, active, nights]);
  const budget = useMemo(() => budgetMoney(profile?.seasonBudget ?? null, cur), [profile?.seasonBudget, cur]);
  const usedMinor = cost?.total[cur] ?? null;
  const overMinor = usedMinor != null && budget ? usedMinor - budget.amount : null;
  const expPointsSum = useMemo(() => active.reduce((sum, s) => sum + expectedPoints(s.tournament.category, "R16", s.tournament.tournament_monday).points, 0), [active]);

  // Nächstes Turnier (laufend oder anstehend): erstes, dessen Woche noch nicht vorbei ist.
  const next = useMemo(() => {
    const withMs = active.map((s) => ({ s, ms: mondayMs(s.tournament.tournament_monday) })).sort((a, b) => a.ms - b.ms);
    return withMs.find((x) => x.ms + 6 * DAY >= nowMs)?.s ?? null;
  }, [active, nowMs]);

  // Handlungsbedarf — buildActionBoard mit Kern-Eingaben (Rest in späteren Etappen).
  const board = useMemo(() => {
    const tournaments: BoardTournament[] = active.map((s) => ({
      id: s.tournament.id, city: s.tournament.city, country: s.tournament.country, monday: s.tournament.tournament_monday,
      series: s.tournament.series, status: s.status, alternatePosition: s.alternatePosition, feePaid: s.feePaid,
      decision: null, inactive: false, alternateObs: [],
    }));
    return buildActionBoard({
      asOf: todayISO, tournaments, banned: [], docWarnings: [], schengen: null, points: null, wildcards: [],
      budgetOver: overMinor != null && overMinor > 0 ? { amountMinor: overMinor, currency: cur } : null, visaLead: [],
    });
  }, [active, overMinor, cur, todayISO]);

  const weeks = useMemo(() => buildPipeline(active.map((s) => ({ id: s.tournament.id, city: s.tournament.city, country: s.tournament.country, category: s.tournament.category, monday: s.tournament.tournament_monday })), new Date()).slice(0, 8), [active]);

  // Handlungspunkt-Text — dieselben i18n-Keys wie das Morgen-Dashboard.
  const actionText = (a: ActionItem): string => {
    const p = a.params;
    if (a.kind === "doc_expired" || a.kind === "doc_expiring") return t(`tour.docWarn_${p.kind}`, { date: p.date ?? "", days: p.days ?? 0, dest: p.dest ? countryName(String(p.dest)) : "" });
    if (a.kind === "budget_over") return t("tour.action_budget_over", { amount: money(Number(p.amount)) });
    if (a.kind === "entry_banned") return t("tour.action_entry_banned", { city: p.city ?? "", dest: countryName(String(p.dest)) });
    if (a.kind === "points_expiring") return t("tour.action_points_expiring", { points: p.points ?? 0, date: fmtDate(String(p.date)) });
    if (a.kind === "visa_lead") return t("tour.action_visa_lead", { city: p.city ?? "", dest: countryName(String(p.dest)), weeks: p.weeks ?? 0, lead: p.lead ?? 0 });
    return t(`tour.action_${a.kind}`, p);
  };

  const daysBadge = (iso: string) => {
    const ms = mondayMs(iso);
    if (ms <= nowMs && nowMs <= ms + 6 * DAY) return t("tour.t2thisWeek");
    const d = Math.round((ms - nowMs) / DAY);
    if (d === 1) return t("tour.t2daysOne");
    return t("tour.t2daysUntil", { n: Math.max(0, d) });
  };
  const deadlineText = (s: SeasonEntry): { text: string; urgent: boolean } => {
    const dl = tourDeadlines(new Date(s.tournament.tournament_monday + "T00:00:00Z"), s.tournament.series, s.tournament.category);
    if (!dl.known || !dl.entry) return { text: t("tour.entryUnknownShort"), urgent: false };
    const ms = dl.entry.getTime();
    if (ms <= nowMs) return { text: t("tour.entryExpired"), urgent: false };
    const d = Math.ceil((ms - nowMs) / DAY);
    return { text: t("tour.entryCountdown", { n: d }), urgent: d <= 7 };
  };

  // ── Zustände ───────────────────────────────────────────────────────────────
  if (authLoading || state === "loading") return <p className="p-6 text-sm text-neutral-400">{t("tour.loading")}</p>;
  if (!user) {
    return (
      <div className="mx-auto mt-16 max-w-sm border border-black/10 bg-white px-6 py-10 text-center">
        <h2 className="text-lg font-bold text-neutral-900">{t("tour.loginRequiredTitle")}</h2>
        <p className="mt-2 text-sm text-neutral-500">{t("tour.loginRequiredText")}</p>
        <Link href="/app" className="mt-6 inline-flex rounded-full bg-matchup px-6 py-3 text-sm font-bold text-white">{t("tour.loginCta")}</Link>
      </div>
    );
  }
  if (state === "error") return <p className="p-6 text-sm text-neutral-400">{t("tour.loadError")}</p>;

  const card = "border border-black/10 bg-white p-4";
  const cardHead = "text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-400";

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <h1 className="text-[32px] font-semibold tracking-[-0.04em] text-neutral-900 sm:text-[40px]">{t("tour.t2navHome")}{profile?.firstName ? <span className="text-neutral-400">, {profile.firstName}</span> : null}</h1>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* NÄCHSTES */}
        <section className={card}>
          <h2 className={cardHead}>{t("tour.t2next")}</h2>
          {next ? (
            <div className="mt-2">
              <p className="text-[17px] font-bold text-neutral-900">{next.tournament.city || next.tournament.name || t("tour.fieldMissing")}<span className="text-neutral-400">{next.tournament.country ? `, ${countryName(next.tournament.country)}` : ""}</span></p>
              <p className="mt-0.5 text-[13px] text-neutral-500">{fmtDate(next.tournament.tournament_monday)} · {next.tournament.category || "—"}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="border border-matchup px-2.5 py-1 text-[12px] font-bold text-matchup">{daysBadge(next.tournament.tournament_monday)}</span>
                <span className="border border-black/10 px-2.5 py-1 text-[12px] font-semibold text-neutral-700">{t(`tour.status_${next.status}`)}</span>
                {(() => { const d = deadlineText(next); return <span className={`px-2.5 py-1 text-[12px] font-bold ${d.urgent ? "border border-neutral-900 text-neutral-900" : "border border-black/10 text-neutral-500"}`}>{d.text}</span>; })()}
              </div>
            </div>
          ) : (
            <p className="mt-3 text-[13px] text-neutral-500">{t("tour.t2noNext")}</p>
          )}
        </section>

        {/* HANDLUNGSBEDARF */}
        <section className={card}>
          <h2 className={cardHead}>{t("tour.t2action")}</h2>
          {board.actions.length === 0 ? (
            <p className="mt-3 flex items-center gap-1.5 text-[13px] font-semibold text-neutral-900"><span aria-hidden>✓</span> {t("tour.boardClear")}</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {board.actions.slice(0, 5).map((a, i) => (
                <li key={i} className={`flex items-start gap-2 px-2.5 py-1.5 text-[12.5px] leading-snug ${a.severity === "red" ? "border border-black/10 text-neutral-900" : "text-neutral-600"}`}>
                  <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${a.severity === "red" ? "bg-red-400" : "bg-amber-400"}`} />
                  <span>{actionText(a)}</span>
                </li>
              ))}
              {board.actions.length > 5 && <li className="px-2.5 text-[11px] text-neutral-500">+{board.actions.length - 5}</li>}
            </ul>
          )}
        </section>

        {/* SAISON */}
        <section className={card}>
          <h2 className={cardHead}>{t("tour.t2seasonCard")}</h2>
          {active.length === 0 ? (
            <p className="mt-3 text-[13px] text-neutral-500">{t("tour.t2noSeason")}</p>
          ) : (
            <dl className="mt-2 space-y-2.5">
              <div>
                <dt className="text-[11px] text-neutral-500">{t("tour.t2budget")}</dt>
                <dd className={`text-[15px] font-bold ${overMinor != null && overMinor > 0 ? "text-red-600" : "text-neutral-900"}`}>
                  {usedMinor != null && budget ? t("tour.t2budgetOf", { used: money(usedMinor), total: money(budget.amount) }) : <span className="text-neutral-500">{t("tour.t2budgetNoData")}</span>}
                </dd>
              </div>
              <div className="flex items-end justify-between gap-3">
                <div><dt className="text-[11px] text-neutral-500">{t("tour.t2expPoints")}</dt><dd className="text-[15px] font-bold tabular-nums text-neutral-900">{expPointsSum}</dd></div>
                <div className="text-right"><dt className="text-[11px] text-neutral-500">{t("tour.t2count")}</dt><dd className="text-[15px] font-bold tabular-nums text-neutral-900">{active.length}</dd></div>
              </div>
            </dl>
          )}
        </section>
      </div>

      {/* NÄCHSTE 8 WOCHEN */}
      <section className="mt-6">
        <h2 className={cardHead}>{t("tour.t2next8")}</h2>
        {weeks.length === 0 ? (
          <p className="mt-2 text-[13px] text-neutral-500">{t("tour.t2noSeason")}</p>
        ) : (
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
            {weeks.map((w) => {
              const it = w.items[0];
              return (
                <Link key={w.monday} href="/tour2/planner" className={`border p-2.5 transition-colors ${it ? "border-black/20 hover:border-matchup" : "border-black/10 hover:border-black/30"}`}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{fmtDate(w.monday)}</p>
                  {it ? (
                    <>
                      <p className="mt-1 truncate text-[12px] font-bold text-neutral-900">{it.city || t("tour.fieldMissing")}</p>
                      <p className="truncate text-[10px] text-matchup">{it.category || "—"}</p>
                    </>
                  ) : (
                    <p className="mt-1 text-[12px] text-neutral-600">{t("tour.t2weekGap")}</p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
