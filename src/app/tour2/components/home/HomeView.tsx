"use client";

/**
 * /tour2 Home (Etappe 1) — Einstiegspunkt statt Karte. Drei Karten (Nächstes ·
 * Handlungsbedarf · Saison) + die nächsten acht Wochen. Nutzt vorhandene Domain-Module
 * wieder (buildActionBoard, buildPipeline, computeSeasonCost, expectedPoints, tourDeadlines) —
 * nichts neu gebaut. Ehrliche Leerstellen: Akzeptanzwahrscheinlichkeit, Cut-off, Reisezeit
 * (inkl. „Departure recommended") gibt es nicht → weggelassen, nicht erfunden.
 *
 * Home: nächstes Turnier, Kennzahlen, Handlungsbedarf, nächste acht Wochen.
 * Datenbeschaffung schlank. Schwere Board-Eingaben folgen in späteren Etappen.
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
  const dm = (iso: string) => {
    const x = new Date(iso + "T00:00:00Z");
    return { dd: String(x.getUTCDate()).padStart(2, "0"), mm: String(x.getUTCMonth() + 1).padStart(2, "0") };
  };

  if (authLoading || state === "loading") return <p className="p-6 text-sm text-[var(--t2-muted)]">{t("tour.loading")}</p>;
  if (!user) {
    return (
      <div className="mx-auto mt-16 max-w-sm px-6 py-10 text-center">
        <p className="t2-kicker">Matchup Tour</p>
        <h2 className="mt-3 text-[1.75rem] font-bold tracking-tight">{t("tour.loginRequiredTitle")}</h2>
        <p className="mt-3 text-sm text-[var(--t2-muted)]">{t("tour.loginRequiredText")}</p>
        <Link href="/app" className="t2-cta mt-6">{t("tour.loginCta")}</Link>
      </div>
    );
  }
  if (state === "error") return <p className="p-6 text-sm text-[var(--t2-muted)]">{t("tour.loadError")}</p>;

  const nextCity = next ? (next.tournament.city || next.tournament.name || t("tour.fieldMissing")) : null;
  const nextDm = next ? dm(next.tournament.tournament_monday) : null;

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 sm:py-10">
      {next && nextDm ? (
        <section>
          <p className="t2-kicker">{t("tour.t2next")}</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <h1 className="min-w-0 text-[1.75rem] font-bold tracking-tight sm:text-[2.15rem]">{nextCity}</h1>
            <p className="t2-date shrink-0" aria-hidden>
              <span>{nextDm.dd}</span>
              <span className="t2-date-dot">.</span>
              <span>{nextDm.mm}</span>
            </p>
          </div>
          <p className="mt-2 text-[14px] text-[var(--t2-muted)]">
            {next.tournament.country ? `${countryName(next.tournament.country)} · ` : ""}
            {next.tournament.category || "—"}
            {profile?.firstName ? ` · ${profile.firstName}` : ""}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="t2-chip is-on">{daysBadge(next.tournament.tournament_monday)}</span>
            <span className="t2-chip">{t(`tour.status_${next.status}`)}</span>
            {(() => {
              const d = deadlineText(next);
              return <span className={`t2-chip ${d.urgent ? "is-on" : ""}`}>{d.text}</span>;
            })()}
            <Link href="/tour2/planner" className="t2-ghost ml-auto">{t("tour.t2navSeason")} →</Link>
          </div>
        </section>
      ) : (
        <section>
          <p className="t2-kicker">{t("tour.t2next")}</p>
          <h1 className="mt-2 text-[1.75rem] font-bold tracking-tight sm:text-[2.15rem]">{t("tour.t2noNext")}</h1>
          <Link href="/tour2/planner" className="t2-cta mt-6">{t("tour.wsFill")}</Link>
        </section>
      )}

      <dl className="t2-telem mt-10">
        <div>
          <dt>{t("tour.t2budget")}</dt>
          <dd className={overMinor != null && overMinor > 0 ? "text-red-700" : ""}>
            {usedMinor != null && budget ? t("tour.t2budgetOf", { used: money(usedMinor), total: money(budget.amount) }) : t("tour.t2budgetNoData")}
          </dd>
        </div>
        <div>
          <dt>{t("tour.t2expPoints")} · {t("tour.t2pointsAssume", { round: t("tour.round_R16") })}</dt>
          <dd>{expPointsSum}</dd>
        </div>
        <div>
          <dt>{t("tour.t2count")}</dt>
          <dd>{active.length}</dd>
        </div>
      </dl>

      <section className="mt-10">
        <h2 className="t2-kicker">{t("tour.t2action")}</h2>
        {board.actions.length === 0 ? (
          <p className="mt-3 text-[14px] font-semibold">{t("tour.boardClear")}</p>
        ) : (
          <ul className="mt-2">
            {board.actions.slice(0, 5).map((a, i) => (
              <li key={i} className="t2-row text-[13px] leading-snug">
                <span className="flex items-start gap-2">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 ${a.severity === "red" ? "bg-red-600" : "bg-matchup"}`} />
                  {actionText(a)}
                </span>
              </li>
            ))}
            {board.actions.length > 5 && <li className="pt-2 text-[11px] text-[var(--t2-muted)]">+{board.actions.length - 5}</li>}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="t2-kicker">{t("tour.t2next8")}</h2>
        {weeks.length === 0 ? (
          <p className="mt-3 text-[13px] text-[var(--t2-muted)]">{t("tour.t2noSeason")}</p>
        ) : (
          <div className="mt-1">
            {weeks.map((w) => {
              const it = w.items[0];
              const d = dm(w.monday);
              return (
                <Link key={w.monday} href="/tour2/planner" className="t2-row">
                  <span className="flex min-w-0 items-baseline gap-4">
                    <span className="w-14 shrink-0 font-semibold tabular-nums text-[var(--t2-muted)]">{d.dd}.{d.mm}</span>
                    {it ? (
                      <span className="min-w-0">
                        <span className="t2-row-city block truncate text-[15px] font-semibold">{it.city || t("tour.fieldMissing")}</span>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-matchup">{it.category || "—"}</span>
                      </span>
                    ) : (
                      <span className="text-[14px] text-[var(--t2-muted)]">{t("tour.t2weekGap")}</span>
                    )}
                  </span>
                  <span className="shrink-0 text-matchup">→</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
