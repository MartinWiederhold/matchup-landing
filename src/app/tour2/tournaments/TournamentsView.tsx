"use client";

/**
 * /tour2/finder: schmale Filterzeile, Blatt, Liste + Karte.
 * Filterlogik unverändert; kein Match-Score, keine Eligibility.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useT, useLocale } from "@/lib/i18n";
import TourLoginCard from "@/app/tour2/components/TourLoginCard";
import { loadPlannerProfile, type PlannerProfile, costRatesComplete } from "@/lib/tourPlanner";
import { getTourCatalog } from "@/lib/tourCatalogCache";
import { loadSeasonTournamentIds, addToSeason, removeFromSeason, loadSeasonPlanRows, loadAllEntryEvents } from "@/lib/tourSeason";
import { loadCostRates } from "@/lib/tourCosts";
import { loadEffectiveVisa, type NatVisaInfo } from "@/lib/tourVisaRequirements";
import { isTargetRegion } from "@/domain/tour/region";
import { expectedPoints } from "@/domain/tour/points";
import {
  finderCircuit, isNextNWeeks, isOnMyRoute, isLowTravelCost, venueCounts, isClusterVenue,
  isDeadlineOpen, entryDeadlineMs, addUtcDays, type FinderCircuit,
} from "@/domain/tour/finderQuick";
import type { TourTournament, TourCostRates, TourSeasonPlanEntry, TourEntryEvent, VisaRequirementClass } from "@/lib/types";
import PlannerMap, { type CandPoint } from "../components/planner/PlannerMap";
import TournamentDetail from "../components/planner/TournamentDetail";
import TournamentRow from "./TournamentRow";
import WindowedList from "../components/WindowedList";
import { t2markArea } from "../t2mark";

const NIGHTS_KEY = "mu_tour_nights";
const SURFACES = ["clay", "hard", "grass", "carpet"] as const;
const CIRCUITS: FinderCircuit[] = ["itf_m", "itf_w", "juniors", "challenger", "wta"];
const ROW_H = 88;
const DAY = 86_400_000;

function groupEventsByPlan(evs: TourEntryEvent[]): Map<string, TourEntryEvent[]> {
  const m = new Map<string, TourEntryEvent[]>();
  for (const e of evs) { const a = m.get(e.plan_id); if (a) a.push(e); else m.set(e.plan_id, [e]); }
  return m;
}

function visaNeed(c: VisaRequirementClass | undefined): boolean | null {
  if (!c) return null;
  if (c === "visa_free") return false;
  if (c === "admission_refused") return true;
  return true;
}

export default function TournamentsView() {
  const { user, loading: authLoading } = useAuth();
  const t = useT();
  const { locale } = useLocale();
  const intl = locale === "de" ? "de-CH" : "en-GB";

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [tours, setTours] = useState<TourTournament[]>([]);
  const [seasonIds, setSeasonIds] = useState<Set<string>>(new Set());
  const [profile, setProfile] = useState<PlannerProfile | null>(null);
  const [rates, setRates] = useState<TourCostRates | null>(null);
  const [planByTour, setPlanByTour] = useState<Map<string, TourSeasonPlanEntry>>(new Map());
  const [eventsByPlan, setEventsByPlan] = useState<Map<string, TourEntryEvent[]>>(new Map());
  const [visaByDest, setVisaByDest] = useState<Map<string, NatVisaInfo>>(new Map());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [europeOnly, setEuropeOnly] = useState(true);
  const [surfaces, setSurfaces] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<Set<string>>(new Set());
  const [countries, setCountries] = useState<Set<string>>(new Set());
  const [circuits, setCircuits] = useState<Set<FinderCircuit>>(new Set());
  const [showRest, setShowRest] = useState(false);
  const [next4, setNext4] = useState(false);
  const [onRoute, setOnRoute] = useState(false);
  const [cluster, setCluster] = useState(false);
  const [lowCost, setLowCost] = useState(false);
  const [deadlineOpen, setDeadlineOpen] = useState(false);
  const [visaMode, setVisaMode] = useState<"all" | "free" | "need">("all");
  const [nowMs] = useState(() => Date.now());

  const reloadEntries = useCallback(async () => {
    if (!user) return;
    try {
      const [rows, evs, ids] = await Promise.all([loadSeasonPlanRows(), loadAllEntryEvents(), loadSeasonTournamentIds()]);
      setPlanByTour(new Map(rows.map((r) => [r.tournament_id, r])));
      setEventsByPlan(groupEventsByPlan(evs));
      setSeasonIds(ids);
    } catch { /* egal */ }
  }, [user]);

  useEffect(() => {
    if (authLoading || !user) return;
    let alive = true;
    setStatus("loading");
    Promise.all([getTourCatalog(), loadPlannerProfile(user.id), loadCostRates(), loadSeasonTournamentIds(), loadSeasonPlanRows(), loadAllEntryEvents()])
      .then(([ts, p, r, ids, planRows, evs]) => {
        if (!alive) return;
        setTours(ts);
        setProfile(p);
        setRates(r);
        setSeasonIds(ids);
        setPlanByTour(new Map(planRows.map((x) => [x.tournament_id, x])));
        setEventsByPlan(groupEventsByPlan(evs));
        setStatus("ready");
        t2markArea("finder");
      })
      .catch(() => { if (alive) setStatus("error"); });
    return () => { alive = false; };
  }, [authLoading, user]);

  useEffect(() => {
    const ps = profile?.passports ?? [];
    if (ps.length === 0) { setVisaByDest(new Map()); return; }
    let alive = true;
    loadEffectiveVisa(ps).then((m) => { if (alive) setVisaByDest(m); }).catch(() => { /* egal */ });
    return () => { alive = false; };
  }, [profile]);

  const catName = useCallback((c: string | null) => (c ? (t(`tour.country.${c}`).startsWith("tour.country.") ? c : t(`tour.country.${c}`)) : "—"), [t]);
  const today = new Date(nowMs).toISOString().slice(0, 10);

  const upcoming = useMemo(() => tours.filter((x) => x.tournament_monday >= today), [tours, today]);
  const seasonTours = useMemo(() => tours.filter((x) => seasonIds.has(x.id)), [tours, seasonIds]);
  const clusters = useMemo(() => venueCounts(upcoming), [upcoming]);

  const categoryOpts = useMemo(
    () => [...new Set(upcoming.map((x) => x.category).filter((c): c is string => !!c))].sort((a, b) => a.localeCompare(b)),
    [upcoming],
  );
  const countryOpts = useMemo(
    () => [...new Set(upcoming.map((x) => x.country).filter((c): c is string => !!c))]
      .sort((a, b) => catName(a).localeCompare(catName(b), locale)),
    [upcoming, catName, locale],
  );

  const ratesDone = costRatesComplete(rates);
  const nightsNum = useMemo(() => { try { const n = parseInt(localStorage.getItem(NIGHTS_KEY) ?? "", 10); return Number.isFinite(n) && n >= 0 ? n : 7; } catch { return 7; } }, []);
  const weekCostMinor = ratesDone
    ? (rates!.arrival_minor ?? 0) + (rates!.per_night_minor ?? 0) * nightsNum + (rates!.food_per_day_minor ?? 0) * nightsNum + (rates!.coach_per_week_minor ?? 0)
    : null;
  const money = (minor: number) => new Intl.NumberFormat(intl, { style: "currency", currency: rates!.currency ?? "EUR", maximumFractionDigits: 0 }).format(minor / 100);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const from = dateFrom || today;
    const to = dateTo || "9999-12-31";
    return upcoming.filter((x) => {
      if (x.tournament_monday < from || x.tournament_monday > to) return false;
      if (europeOnly && !(x.country && isTargetRegion(x.country))) return false;
      if (surfaces.size > 0 && !(x.surface && surfaces.has(x.surface))) return false;
      if (categories.size > 0 && !(x.category && categories.has(x.category))) return false;
      if (countries.size > 0 && !(x.country && countries.has(x.country))) return false;
      if (circuits.size > 0) {
        const c = finderCircuit(x);
        if (!c || !circuits.has(c)) return false;
      }
      if (next4 && !isNextNWeeks(x.tournament_monday, today, 4)) return false;
      if (onRoute && !isOnMyRoute(x, seasonTours)) return false;
      if (cluster && !isClusterVenue(x, clusters)) return false;
      if (lowCost && !isLowTravelCost(x, seasonTours)) return false;
      if (deadlineOpen && !isDeadlineOpen(x, nowMs)) return false;
      if (visaMode !== "all") {
        if (!x.country) return false;
        const need = visaNeed(visaByDest.get(x.country)?.requirementClass);
        if (need == null) return false;
        if (visaMode === "free" && need) return false;
        if (visaMode === "need" && !need) return false;
      }
      if (needle) {
        const hay = `${x.city ?? ""} ${x.name ?? ""} ${x.category ?? ""} ${catName(x.country)}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [upcoming, dateFrom, dateTo, today, europeOnly, surfaces, categories, countries, circuits, next4, onRoute, cluster, lowCost, deadlineOpen, visaMode, visaByDest, seasonTours, clusters, nowMs, q, catName]);

  const countByCountry = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of upcoming) {
      if (r.country == null) continue;
      if (categories.size > 0 && !(r.category && categories.has(r.category))) continue;
      m.set(r.country, (m.get(r.country) ?? 0) + 1);
    }
    return m;
  }, [upcoming, categories]);

  const regionCountries = useMemo(() => countryOpts.filter((c) => isTargetRegion(c)), [countryOpts]);
  const restAll = useMemo(() => countryOpts.filter((c) => !isTargetRegion(c)), [countryOpts]);
  const restSelected = useMemo(() => restAll.filter((c) => countries.has(c)), [restAll, countries]);
  const restCollapsible = useMemo(() => restAll.filter((c) => !countries.has(c)), [restAll, countries]);

  const byId = useMemo(() => new Map(tours.map((x) => [x.id, x])), [tours]);
  const candidateStops: CandPoint[] = useMemo(
    () => filtered.filter((x) => x.latitude != null && x.longitude != null)
      .map((x) => ({ id: x.id, lat: x.latitude as number, lng: x.longitude as number })),
    [filtered],
  );

  const toggle = useCallback((id: string) => {
    if (!user) return;
    const inSeason = seasonIds.has(id);
    const next = new Set(seasonIds);
    if (inSeason) next.delete(id); else next.add(id);
    setSeasonIds(next);
    (inSeason ? removeFromSeason(id) : addToSeason(user.id, id))
      .then(() => reloadEntries())
      .catch(() => setSeasonIds((cur) => { const rb = new Set(cur); if (inSeason) rb.add(id); else rb.delete(id); return rb; }));
  }, [user, seasonIds, reloadEntries]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setMapOpen(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const handleSelect = useCallback((id: string) => { setSelectedId(id); }, []);
  const rowKey = useCallback((tt: { id: string }) => tt.id, []);
  const bufferDays = useMemo(() => { try { const n = parseInt(localStorage.getItem("mu_tour_buffer_days") ?? "", 10); return Number.isFinite(n) && n >= 0 ? n : 2; } catch { return 2; } }, []);
  const seasonStops = useMemo(
    () => seasonTours.sort((a, b) => a.tournament_monday.localeCompare(b.tournament_monday))
      .map((x) => ({ id: x.id, city: x.city || "", monday: x.tournament_monday, country: x.country })),
    [seasonTours],
  );
  const startName = profile?.city ?? null;

  const toggleSet = <T,>(set: Set<T>, v: T, setter: (s: Set<T>) => void) => {
    const n = new Set(set);
    if (n.has(v)) n.delete(v); else n.add(v);
    setter(n);
  };

  const circuitLabel = (c: FinderCircuit) =>
    c === "itf_m" ? t("tour.t2findItfM") : c === "itf_w" ? t("tour.t2findItfW") : c === "juniors" ? t("tour.seriesJuniors") : c === "wta" ? t("tour.seriesWta") : t("tour.seriesChallenger");

  const fmtPrize = (x: TourTournament): string | null => {
    if (x.prize_money == null || x.prize_money === "") return null;
    const n = Number(x.prize_money);
    if (!Number.isFinite(n)) return null;
    const num = n.toLocaleString(intl);
    return x.prize_currency ? `${num} ${x.prize_currency}` : num;
  };

  const fmtDeadline = (x: TourTournament): string => {
    const ms = entryDeadlineMs(x);
    if (ms == null) return t("tour.t2findDlUnknown");
    const left = ms - nowMs;
    if (left <= 0) return t("tour.entryExpired");
    const d = Math.floor(left / DAY);
    const h = Math.floor((left % DAY) / 3_600_000);
    return t("tour.t2ovCountdown", { d, h });
  };

  const hasPassports = (profile?.passports ?? []).length > 0;

  if (authLoading) return <div className="flex h-full items-center justify-center text-sm text-[var(--t2-muted)]">{t("tour.t2authChecking")}</div>;
  if (!user) return <TourLoginCard />;

  const selectedTt = selectedId ? byId.get(selectedId) : undefined;
  const detailEl = selectedTt ? (
    <TournamentDetail
      key={selectedTt.id}
      tt={selectedTt}
      countryName={catName(selectedTt.country)}
      inSeason={seasonIds.has(selectedTt.id)}
      onToggle={() => toggle(selectedTt.id)}
      onClose={() => setSelectedId(null)}
      originCity={startName}
      originLabel={startName}
      nights={nightsNum}
      rates={rates}
      nowMs={nowMs}
      viewerId={user.id}
      viewerName={profile?.firstName ?? null}
      viewerRank={profile?.ranking != null ? `#${profile.ranking}` : null}
      viewerNationality={profile?.passports[0] ?? profile?.country ?? null}
      viewerPassports={profile?.passports ?? []}
      planId={planByTour.get(selectedTt.id)?.id ?? null}
      entryStatus={planByTour.get(selectedTt.id)?.status ?? "planned"}
      alternatePosition={planByTour.get(selectedTt.id)?.alternate_position ?? null}
      feePaid={planByTour.get(selectedTt.id)?.fee_paid ?? false}
      entryEvents={eventsByPlan.get(planByTour.get(selectedTt.id)?.id ?? "") ?? []}
      onEntryChanged={reloadEntries}
      seasonStops={seasonStops}
      bufferDays={bufferDays}
    />
  ) : null;

  const mapPane = (
    <div className="relative h-full min-h-[220px] w-full bg-[var(--t2-paper)]">
      <PlannerMap start={null} plan={[]} candidates={candidateStops} selectedId={selectedId} onSelect={handleSelect} />
    </div>
  );

  const countryChip = (code: string) => (
    <button
      key={code}
      type="button"
      onClick={() => toggleSet(countries, code, setCountries)}
      className={`mr-1 mb-1 text-[13px] ${countries.has(code) ? "font-semibold text-[var(--t2-ink)]" : "font-medium text-[var(--t2-muted)] hover:text-[var(--t2-ink)]"}`}
    >
      {catName(code)}
      <span className="ml-1 tabular-nums text-[11px] font-normal text-[var(--t2-faint)]">{countByCountry.get(code) ?? 0}</span>
    </button>
  );

  const fmtChipDate = (iso: string) => new Intl.DateTimeFormat(intl, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z"));
  const activeChips: { key: string; label: string; onRemove: () => void }[] = [
    ...[...circuits].map((c) => ({ key: `c-${c}`, label: circuitLabel(c), onRemove: () => toggleSet(circuits, c, setCircuits) })),
    ...[...surfaces].map((s) => ({ key: `s-${s}`, label: t(`tour.surface_${s}`), onRemove: () => toggleSet(surfaces, s, setSurfaces) })),
    ...(countries.size === 1
      ? [{ key: "land", label: catName([...countries][0]), onRemove: () => setCountries(new Set()) }]
      : countries.size > 1
        ? [{ key: "lands", label: t("tour.wsCountriesN", { n: countries.size }), onRemove: () => setCountries(new Set()) }]
        : []),
    ...[...categories].slice(0, 8).map((c) => ({ key: `lv-${c}`, label: c, onRemove: () => toggleSet(categories, c, setCategories) })),
    ...(next4 ? [{ key: "n4", label: t("tour.t2findNext4"), onRemove: () => setNext4(false) }] : []),
    ...(onRoute ? [{ key: "rt", label: t("tour.t2findOnRoute"), onRemove: () => setOnRoute(false) }] : []),
    ...(cluster ? [{ key: "cl", label: t("tour.t2findCluster"), onRemove: () => setCluster(false) }] : []),
    ...(lowCost ? [{ key: "lc", label: t("tour.t2findLowCost"), onRemove: () => setLowCost(false) }] : []),
    ...(deadlineOpen ? [{ key: "dl", label: t("tour.t2findDeadlineOpen"), onRemove: () => setDeadlineOpen(false) }] : []),
    ...(!europeOnly ? [{ key: "eu", label: t("tour.plRegionAll"), onRemove: () => setEuropeOnly(true) }] : []),
    ...(visaMode === "free" ? [{ key: "vf", label: t("tour.t2findVisaFree"), onRemove: () => setVisaMode("all") }] : []),
    ...(visaMode === "need" ? [{ key: "vn", label: t("tour.t2findVisaNeed"), onRemove: () => setVisaMode("all") }] : []),
    ...(dateFrom ? [{ key: "from", label: t("tour.wsChipFrom", { date: fmtChipDate(dateFrom) }), onRemove: () => setDateFrom("") }] : []),
    ...(dateTo ? [{ key: "to", label: t("tour.wsChipUntil", { date: fmtChipDate(dateTo) }), onRemove: () => setDateTo("") }] : []),
  ];
  const activeFilterN =
    circuits.size + surfaces.size + countries.size + categories.size
    + (next4 ? 1 : 0) + (onRoute ? 1 : 0) + (cluster ? 1 : 0) + (lowCost ? 1 : 0) + (deadlineOpen ? 1 : 0)
    + (europeOnly ? 0 : 1) + (visaMode === "all" ? 0 : 1) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  const resetFilters = () => {
    setCircuits(new Set()); setSurfaces(new Set()); setCountries(new Set()); setCategories(new Set());
    setNext4(false); setOnRoute(false); setCluster(false); setLowCost(false); setDeadlineOpen(false);
    setEuropeOnly(true); setVisaMode("all"); setDateFrom(""); setDateTo("");
  };

  const optBtn = (on: boolean) => `text-left text-[13px] leading-snug ${on ? "font-semibold text-[var(--t2-ink)]" : "font-medium text-[var(--t2-muted)] hover:text-[var(--t2-ink)]"}`;

  const filterSheet = (
    <div className="flex h-full flex-col bg-[var(--t2-paper)]">
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <p className="t2-kicker">{t("tour.wsFilters")}{activeFilterN > 0 ? ` · ${activeFilterN}` : ""}</p>
        <div className="flex items-center gap-3">
          {activeFilterN > 0 && (
            <button type="button" onClick={resetFilters} className="text-[12px] font-semibold text-[var(--t2-muted)] hover:text-[var(--t2-ink)]">{t("tour.wsFiltersReset")}</button>
          )}
          <button type="button" onClick={() => setFiltersOpen(false)} className="text-[18px] text-[var(--t2-faint)] hover:text-[var(--t2-ink)]" aria-label={t("common.close")}>✕</button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-10">
        <section className="pt-6">
          <p className="t2-kicker">{t("tour.t2findQuick")}</p>
          <div className="mt-3 flex flex-col items-start gap-2.5">
            <button type="button" className={optBtn(next4)} onClick={() => setNext4((v) => !v)}>{t("tour.t2findNext4")}</button>
            <button type="button" className={optBtn(onRoute)} onClick={() => setOnRoute((v) => !v)}>{t("tour.t2findOnRoute")}</button>
            <button type="button" className={optBtn(cluster)} onClick={() => setCluster((v) => !v)}>{t("tour.t2findCluster")}</button>
            <button type="button" className={optBtn(lowCost)} onClick={() => setLowCost((v) => !v)}>{t("tour.t2findLowCost")}</button>
            <button type="button" className={optBtn(deadlineOpen)} onClick={() => setDeadlineOpen((v) => !v)}>{t("tour.t2findDeadlineOpen")}</button>
            <button type="button" className={optBtn(europeOnly)} onClick={() => setEuropeOnly(true)}>{t("tour.plRegionEurope")}</button>
            <button type="button" className={optBtn(!europeOnly)} onClick={() => setEuropeOnly(false)}>{t("tour.plRegionAll")}</button>
            {hasPassports ? (
              <>
                <button type="button" className={optBtn(visaMode === "free")} onClick={() => setVisaMode((v) => v === "free" ? "all" : "free")}>{t("tour.t2findVisaFree")}</button>
                <button type="button" className={optBtn(visaMode === "need")} onClick={() => setVisaMode((v) => v === "need" ? "all" : "need")}>{t("tour.t2findVisaNeed")}</button>
              </>
            ) : (
              <p className="text-[12px] text-[var(--t2-faint)]">{t("tour.t2findVisaNeedPass")}</p>
            )}
          </div>
        </section>
        <section className="pt-10">
          <p className="t2-kicker">{t("tour.t2findSerie")}</p>
          <div className="mt-3 flex flex-col items-start gap-2.5">
            {CIRCUITS.map((c) => (
              <button key={c} type="button" className={optBtn(circuits.has(c))} onClick={() => toggleSet(circuits, c, setCircuits)}>{circuitLabel(c)}</button>
            ))}
          </div>
        </section>
        <section className="pt-10">
          <p className="t2-kicker">{t("tour.t2findSurface")}</p>
          <div className="mt-3 flex flex-col items-start gap-2.5">
            {SURFACES.map((s) => (
              <button key={s} type="button" className={optBtn(surfaces.has(s))} onClick={() => toggleSet(surfaces, s, setSurfaces)}>{t(`tour.surface_${s}`)}</button>
            ))}
          </div>
        </section>
        <section className="pt-10">
          <p className="t2-kicker">{t("tour.t2findLevel")}</p>
          <div className="mt-3 flex max-h-48 flex-col items-start gap-2 overflow-y-auto">
            {categoryOpts.map((c) => (
              <button key={c} type="button" className={optBtn(categories.has(c))} onClick={() => toggleSet(categories, c, setCategories)}>{c}</button>
            ))}
          </div>
        </section>
        <section className="pt-10">
          <p className="t2-kicker">{t("tour.filterCountry")}</p>
          <div className="mt-3">
            {regionCountries.map(countryChip)}
            {restSelected.map(countryChip)}
            {showRest && restCollapsible.map(countryChip)}
          </div>
          {restCollapsible.length > 0 && (
            <button type="button" onClick={() => setShowRest((v) => !v)} className="mt-3 text-[12px] font-semibold text-[var(--t2-ink)]">
              {showRest ? t("tour.filterCountriesFewer") : t("tour.filterCountriesMore", { n: restCollapsible.length })}
            </button>
          )}
        </section>
      </div>
    </div>
  );

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[var(--t2-paper)] text-[var(--t2-ink)]">
      <div className="shrink-0 px-4 pt-3 sm:px-6">
        <div className="flex flex-wrap items-end gap-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("tour.t2search")} className="t2-input min-w-[10rem] flex-1" />
          <label className="block">
            <span className="t2-kicker">{t("tour.t2findDateFrom")}</span>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="t2-input mt-1 block w-[9.5rem]" />
          </label>
          <label className="block">
            <span className="t2-kicker">{t("tour.t2findDateTo")}</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="t2-input mt-1 block w-[9.5rem]" />
          </label>
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            className="relative flex shrink-0 items-center gap-2 py-2 text-[13px] font-semibold"
          >
            {t("tour.wsFilters")}
            {activeFilterN > 0 && <span className="tabular-nums text-[13px] font-semibold text-[var(--t2-accent)]">{activeFilterN}</span>}
          </button>
          <div className="flex shrink-0 items-baseline gap-3 pb-2">
            <button type="button" onClick={() => setMapOpen(false)} className={`text-[13px] ${!mapOpen ? "font-semibold text-[var(--t2-ink)]" : "font-medium text-[var(--t2-faint)]"}`}>{t("tour.t2findList")}</button>
            <button type="button" onClick={() => setMapOpen(true)} className={`text-[13px] ${mapOpen ? "font-semibold text-[var(--t2-ink)]" : "font-medium text-[var(--t2-faint)]"}`}>{t("tour.t2findMap")}</button>
          </div>
        </div>
        {activeChips.length > 0 && (
          <div className="no-scrollbar mt-2 flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-1">
            {activeChips.map((c) => (
              <span key={c.key} className="inline-flex shrink-0 items-center gap-1 py-1 pl-0.5 pr-1 text-[12px] font-medium text-[var(--t2-muted)]">
                <span className="max-w-[10rem] truncate">{c.label}</span>
                <button type="button" onClick={c.onRemove} aria-label={t("tour.wsChipRemove", { label: c.label })} className="text-[11px] text-[var(--t2-faint)] hover:text-[var(--t2-ink)]">✕</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className={`min-h-0 min-w-0 flex-1 overflow-hidden px-4 py-4 pb-24 sm:px-6 md:pb-4 ${mapOpen ? "md:w-[60%] md:flex-none" : ""}`}>
          {status === "loading" && <p className="text-sm text-[var(--t2-muted)]">{t("tour.t2catalogLoading")}</p>}
          {status === "error" && <p className="text-sm text-[var(--t2-muted)]">{t("tour.loadError")}</p>}
          {status === "ready" && (
            <div className="flex h-full min-h-0 flex-col">
              <p className="mb-3 flex shrink-0 items-baseline gap-2">
                <span className="text-[clamp(1.75rem,3vw,2.25rem)] font-semibold leading-none tracking-[-0.04em] tabular-nums">{filtered.length}</span>
                <span className="t2-kicker">{t("tour.t2findHits")}</span>
              </p>
              {filtered.length === 0 ? (
                <p className="py-8 text-sm text-[var(--t2-muted)]">{t("tour.empty")}</p>
              ) : (
                <WindowedList
                  items={filtered}
                  rowHeight={ROW_H}
                  getKey={rowKey}
                  scrollToKey={selectedId}
                  className="min-h-0 flex-1 overflow-y-auto"
                >
                  {(tt) => (
                    <TournamentRow
                      tt={tt}
                      countryName={catName(tt.country)}
                      selected={selectedId === tt.id}
                      inSeason={seasonIds.has(tt.id)}
                      weekEnd={addUtcDays(tt.tournament_monday, 6)}
                      prize={fmtPrize(tt)}
                      deadline={fmtDeadline(tt)}
                      cost={weekCostMinor != null ? money(isLowTravelCost(tt, seasonTours) ? weekCostMinor - (rates!.arrival_minor ?? 0) : weekCostMinor) : t("tour.t2findCostUnknown")}
                      pts={expectedPoints(tt.category, "R16", tt.tournament_monday).points}
                      onSelect={() => setSelectedId(tt.id)}
                      onToggle={() => toggle(tt.id)}
                    />
                  )}
                </WindowedList>
              )}
              <p className="mt-2 shrink-0 text-[11px] leading-relaxed text-[var(--t2-faint)]">{t("tour.t2findIpinFooter")}</p>
            </div>
          )}
        </div>
        <div className={`${mapOpen ? "order-first h-[36vh] shrink-0 md:order-none md:h-auto md:w-[40%]" : "hidden"} min-h-0`}>{mapPane}</div>
      </div>

      {filtersOpen && (
        <div className="absolute inset-0 z-[80] flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
          <aside className="relative z-[81] ml-auto flex h-full w-full max-w-[360px] flex-col shadow-2xl">{filterSheet}</aside>
        </div>
      )}

      {detailEl && (
        <>
          <div className="absolute inset-0 z-[75] bg-black/40" onClick={() => setSelectedId(null)} />
          <aside className="absolute right-0 top-0 z-[76] flex h-full w-full max-w-[720px] flex-col bg-[var(--t2-paper)] shadow-2xl">{detailEl}</aside>
        </>
      )}
    </div>
  );
}
