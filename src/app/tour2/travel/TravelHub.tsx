"use client";

/**
 * Fläche Reise: geplante Kosten (Sätze × Kette) und erfasste Ausgaben getrennt.
 * Keine Reisezeit, kein CO₂, kein Vorsaison-Vergleich.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT, useLocale } from "@/lib/i18n";
import { computeSeasonCost } from "@/domain/tour/costs";
import { seasonMetrics, type Money } from "@/domain/tour/finance";
import { schengenUsage, isSchengenCode, type Stay } from "@/domain/tour/schengen";
import { haversineKm } from "@/lib/utils/haversine";
import { loadSeason, type SeasonEntry } from "@/lib/tourSeason";
import { loadCostRates } from "@/lib/tourCosts";
import { loadExpenses, amountToMinor, type TourExpense } from "@/lib/tourExpenses";
import { loadPlannerProfile, type PlannerProfile, ratesToCostParams, costRatesComplete, placeKey } from "@/lib/tourPlanner";
import { loadStays } from "@/lib/tourStays";
import { hasSchengenPassport } from "@/lib/visa";
import TourLoginCard from "@/app/tour2/components/TourLoginCard";
import Tour2Area, { T2Kpi, T2AsideBlock } from "@/app/tour2/components/Tour2Area";
import PlannerMap from "@/app/tour2/components/planner/PlannerMap";
import { t2markArea } from "@/app/tour2/t2mark";
import { tour2PlannerTournamentHref } from "@/app/tour2/components/t2Action";
import type { TourCostRates } from "@/lib/types";

const NIGHTS_KEY = "mu_tour_nights";
const DAY = 86_400_000;

export default function TravelHub() {
  const { user, loading: authLoading } = useAuth();
  const t = useT();
  const { locale } = useLocale();
  const loc = locale === "en" ? "en-GB" : "de-DE";

  const [state, setState] = useState<"loading" | "error" | "done">("loading");
  const [season, setSeason] = useState<SeasonEntry[]>([]);
  const [rates, setRates] = useState<TourCostRates | null>(null);
  const [expenses, setExpenses] = useState<TourExpense[]>([]);
  const [profile, setProfile] = useState<PlannerProfile | null>(null);
  const [stays, setStays] = useState<Stay[]>([]);
  const [nowMs] = useState(() => Date.now());

  const nights = useMemo(() => {
    try {
      const n = parseInt(localStorage.getItem(NIGHTS_KEY) ?? "", 10);
      return Number.isFinite(n) && n >= 0 ? n : 7;
    } catch {
      return 7;
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    let alive = true;
    Promise.all([loadSeason(), loadCostRates(), loadExpenses(user.id), loadPlannerProfile(user.id), loadStays(user.id)])
      .then(([s, r, exp, p, stayRows]) => {
        if (!alive) return;
        setSeason(s);
        setRates(r);
        setExpenses(exp.rows);
        setProfile(p);
        setStays(stayRows.filter((x) => x.confirmed).map((x) => ({ country: x.country, entry: x.entry_date, exit: x.exit_date })));
        setState("done");
        t2markArea("travel");
      })
      .catch(() => { if (alive) setState("error"); });
    return () => { alive = false; };
  }, [authLoading, user]);

  const active = useMemo(
    () => [...season.filter((s) => !s.tournamentInactive)].sort((a, b) => a.tournament.tournament_monday.localeCompare(b.tournament.tournament_monday)),
    [season],
  );
  const cur = rates?.currency ?? "EUR";
  const money = useCallback(
    (minor: number, c = cur) => new Intl.NumberFormat(loc, { style: "currency", currency: c, maximumFractionDigits: 0 }).format(minor / 100),
    [loc, cur],
  );
  const fmtBag = (m: Money) => {
    const es = Object.entries(m);
    return es.length ? es.map(([c, v]) => money(v, c)).join(" · ") : "—";
  };
  const fmtDate = (iso: string) => new Intl.DateTimeFormat(loc, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z"));

  const planned = useMemo(() => {
    if (!costRatesComplete(rates)) return null;
    const stations = active.map((s) => ({
      place: placeKey(s.tournament.country, s.tournament.city) ?? `id:${s.tournament.id}`,
      nights,
      entryFee: null,
    }));
    return computeSeasonCost(stations, ratesToCostParams(rates!));
  }, [rates, active, nights]);

  const recorded = useMemo(() => {
    const mondayByTournament: Record<string, string> = {};
    for (const s of season) mondayByTournament[s.tournament.id] = s.tournament.tournament_monday;
    return seasonMetrics({
      expenses: expenses.map((e) => ({
        tournamentId: e.tournament_id,
        amountMinor: amountToMinor(e.amount == null ? null : String(e.amount)),
        currency: e.currency ?? cur,
        category: e.category ?? "other",
      })),
      prizes: [],
      income: [],
      mondayByTournament,
      points: 0,
      hasResults: false,
    });
  }, [expenses, season, cur]);

  const kmTotal = useMemo(() => {
    let sum = 0;
    let unknown = false;
    for (let i = 1; i < active.length; i++) {
      const a = active[i - 1].tournament;
      const b = active[i].tournament;
      const same = placeKey(a.country, a.city) != null && placeKey(a.country, a.city) === placeKey(b.country, b.city);
      if (same) continue;
      if (a.latitude == null || a.longitude == null || b.latitude == null || b.longitude == null) { unknown = true; continue; }
      sum += haversineKm(a.latitude, a.longitude, b.latitude, b.longitude);
    }
    return { sum, unknown };
  }, [active]);

  const plannedByCode = useMemo(() => {
    const bag: Record<string, Money> = {};
    if (!planned) return bag;
    for (const st of planned.stations) {
      for (const it of st.items) {
        if ("unknown" in it && it.unknown) continue;
        const code = it.code;
        const curCode = "currency" in it ? it.currency : cur;
        const amt = "amount" in it ? it.amount : 0;
        bag[code] = bag[code] ?? {};
        bag[code][curCode] = (bag[code][curCode] ?? 0) + amt;
      }
    }
    return bag;
  }, [planned, cur]);

  const recordedByCat = useMemo(() => {
    const bag: Record<string, Money> = {};
    for (const e of expenses) {
      const cat = e.category ?? "other";
      const c = (e.currency ?? cur).toUpperCase();
      bag[cat] = bag[cat] ?? {};
      bag[cat][c] = (bag[cat][c] ?? 0) + amountToMinor(e.amount == null ? null : String(e.amount));
    }
    return bag;
  }, [expenses, cur]);

  const todayISO = new Date(nowMs).toISOString().slice(0, 10);
  const schengenApplies = !!profile && profile.passports.length > 0 && !hasSchengenPassport(profile.passports);
  const schengen = useMemo(() => {
    if (!schengenApplies) return null;
    const seasonStays: Stay[] = active
      .filter((s) => s.tournament.country && isSchengenCode(s.tournament.country))
      .map((s) => {
        const entry = s.tournament.tournament_monday;
        const exit = new Date(Date.parse(entry + "T00:00:00Z") + nights * DAY).toISOString().slice(0, 10);
        return { country: s.tournament.country as string, entry, exit };
      });
    return schengenUsage([...stays, ...seasonStays], todayISO);
  }, [schengenApplies, active, stays, nights, todayISO]);

  const mapPlan = useMemo(
    () =>
      active
        .filter((s) => s.tournament.latitude != null && s.tournament.longitude != null)
        .map((s, i) => ({ id: s.tournament.id, lat: s.tournament.latitude as number, lng: s.tournament.longitude as number, order: i + 1 })),
    [active],
  );
  const mapStart = profile?.lat != null && profile.lng != null ? { lat: profile.lat, lng: profile.lng } : null;

  const recordedByTour = useMemo(() => {
    const m = new Map<string, Money>();
    for (const e of expenses) {
      if (!e.tournament_id) continue;
      const c = (e.currency ?? cur).toUpperCase();
      const prev = m.get(e.tournament_id) ?? {};
      prev[c] = (prev[c] ?? 0) + amountToMinor(e.amount == null ? null : String(e.amount));
      m.set(e.tournament_id, prev);
    }
    return m;
  }, [expenses, cur]);

  if (authLoading || (user && state === "loading")) {
    return <p className="px-4 py-16 text-sm text-[var(--t2-muted)]">{t("tour.loading")}</p>;
  }
  if (!user) return <TourLoginCard />;
  if (state === "error") return <p className="px-4 py-16 text-sm text-[var(--t2-muted)]">{t("tour.loadError")}</p>;

  const kpis = (
    <>
      <T2Kpi label={t("tour.t2trPlanned")} note={planned ? t("tour.t2trPlannedHint") : t("tour.t2trRatesNeed")}>
        {planned ? fmtBag(planned.total) : "—"}
      </T2Kpi>
      <T2Kpi label={t("tour.t2trRecorded")} note={t("tour.t2trRecordedHint")}>
        {fmtBag(recorded.expensesTotal)}
      </T2Kpi>
      <T2Kpi label={t("tour.t2trKm")} note={kmTotal.unknown ? t("tour.t2ovLegUnknownKm") : undefined}>
        {active.length === 0 ? "—" : t("tour.t2legKm", { n: Math.round(kmTotal.sum) })}
      </T2Kpi>
      <T2Kpi label={t("tour.t2trPerTour")} note={t("tour.t2trPerTourHint")}>
        {recorded.tournamentsWithExpenses ? fmtBag(recorded.costPerTournament) : "—"}
      </T2Kpi>
    </>
  );

  const aside = (
    <>
      <T2AsideBlock title={t("tour.t2trSplit")}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--t2-faint)]">{t("tour.t2trSplitPlanned")}</p>
        <ul className="mt-1 space-y-1 text-[var(--t2-muted)]">
          {Object.keys(plannedByCode).length === 0 ? (
            <li>—</li>
          ) : (
            Object.entries(plannedByCode).map(([code, bag]) => (
              <li key={code}>{t(`tour.costsItem_${code}`)} · {fmtBag(bag)}</li>
            ))
          )}
        </ul>
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--t2-faint)]">{t("tour.t2trSplitRecorded")}</p>
        <ul className="mt-1 space-y-1 text-[var(--t2-muted)]">
          {Object.keys(recordedByCat).length === 0 ? (
            <li>—</li>
          ) : (
            Object.entries(recordedByCat).map(([cat, bag]) => (
              <li key={cat}>{t(`tour.expCat_${cat}`)} · {fmtBag(bag)}</li>
            ))
          )}
        </ul>
      </T2AsideBlock>
      {schengenApplies && schengen && (
        <T2AsideBlock title={t("tour.schengenTitle")}>
          <p className="text-[var(--t2-muted)]">{t("tour.t2ovSchengen", { used: schengen.used, left: schengen.left })}</p>
          <Link href="/tour2/schengen" className="mt-2 inline-block font-semibold text-matchup">{t("tour.schengenTitle")} →</Link>
        </T2AsideBlock>
      )}
      <T2AsideBlock title={t("tour.t2navTravel")}>
        <ul className="space-y-2">
          <li><Link href="/tour2/costs" className="font-semibold text-matchup">{t("tour.costsTitle")} →</Link></li>
          <li><Link href="/tour2/expenses" className="font-semibold text-matchup">{t("tour.expTitle")} →</Link></li>
        </ul>
      </T2AsideBlock>
    </>
  );

  return (
    <Tour2Area title={t("tour.t2navTravel")} lead={t("tour.t2travelLead")} kpis={kpis} aside={aside}>
      {mapPlan.length > 0 && (
        <div className="mb-4 h-64 overflow-hidden rounded-[12px] border border-[var(--t2-line)] bg-[var(--t2-card)]">
          <PlannerMap start={mapStart} plan={mapPlan} candidates={[]} />
        </div>
      )}
      <section className="t2-dash-card">
        <h2 className="t2-kicker">{t("tour.t2trPlan")}</h2>
        {active.length === 0 ? (
          <p className="mt-4 text-[14px] text-[var(--t2-muted)]">{t("tour.t2ovRouteEmpty")}</p>
        ) : (
          <ol className="mt-4 border-t border-[var(--t2-line)]">
            {active.map((s, i) => {
              const prev = i > 0 ? active[i - 1] : null;
              const place = placeKey(s.tournament.country, s.tournament.city);
              const prevPlace = prev ? placeKey(prev.tournament.country, prev.tournament.city) : null;
              const same = prev != null && place != null && place === prevPlace;
              let km: number | null = null;
              if (prev && !same && prev.tournament.latitude != null && prev.tournament.longitude != null && s.tournament.latitude != null && s.tournament.longitude != null) {
                km = haversineKm(prev.tournament.latitude, prev.tournament.longitude, s.tournament.latitude, s.tournament.longitude);
              }
              const arrival = rates && costRatesComplete(rates) ? ratesToCostParams(rates).arrival : null;
              const rec = recordedByTour.get(s.tournament.id);
              return (
                <li key={s.tournament.id}>
                  {prev && (
                    <p className="px-1 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--t2-faint)]">
                      {same
                        ? t("tour.t2legCluster")
                        : [km != null ? t("tour.t2legKm", { n: Math.round(km) }) : t("tour.t2ovLegUnknownKm"), arrival ? t("tour.t2legArrival", { amount: money(arrival.amount) }) : null].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <Link href={tour2PlannerTournamentHref(s.tournament.id)} className="t2-row group">
                    <span>
                      <span className="t2-row-city block text-[15px] font-semibold">{s.tournament.city || s.tournament.name}</span>
                      <span className="mt-0.5 block text-[12px] text-[var(--t2-muted)]">
                        {fmtDate(s.tournament.tournament_monday)} · {t(`tour.status_${s.status}`)}
                      </span>
                    </span>
                    <span className="text-right text-[12px] text-[var(--t2-muted)]">
                      <span className="block">{rec ? fmtBag(rec) : t("tour.t2trLodgingUnknown")}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </Tour2Area>
  );
}
