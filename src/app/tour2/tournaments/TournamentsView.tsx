"use client";

/**
 * /tour2/finder: Liste + geparkte Karte. Filter aus Katalogfeldern,
 * Schnellchips inkl. Route/Cluster (Koordinaten), kein Match-Score, keine Eligibility.
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

const chip = (on: boolean) => `t2-chip ${on ? "is-on" : ""}`;

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

  const handleSelect = useCallback((id: string) => { setSelectedId(id); setMapOpen(true); }, []);
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

  if (authLoading) return <div className="flex h-[100dvh] items-center justify-center text-sm text-[var(--t2-muted)] max-md:h-[calc(100dvh-3.5rem)]">{t("tour.t2authChecking")}</div>;
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
    <button key={code} type="button" onClick={() => toggleSet(countries, code, setCountries)} className={chip(countries.has(code))}>
      {catName(code)}
      <span className={`ml-1 font-normal ${countries.has(code) ? "opacity-70" : "text-[var(--t2-faint)]"}`}>{countByCountry.get(code) ?? 0}</span>
    </button>
  );

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-[var(--t2-paper)] text-[var(--t2-ink)] max-md:h-[calc(100dvh-3.5rem)]">
      <div className="shrink-0 space-y-3 border-b border-[var(--t2-line)] px-4 py-3 sm:px-6">
        <p className="text-[13px] leading-relaxed text-[var(--t2-muted)]">{t("tour.t2findLead")}</p>
        <div className="flex items-center gap-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("tour.t2search")} className="t2-input min-w-0 flex-1" />
          <button type="button" onClick={() => setMapOpen((o) => !o)} className="t2-ghost md:hidden">{mapOpen ? t("tour.t2mapHide") : t("tour.t2mapShow")}</button>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-[11px] text-[var(--t2-muted)]">
            {t("tour.t2findDateFrom")}
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="t2-input mt-0.5 block" />
          </label>
          <label className="text-[11px] text-[var(--t2-muted)]">
            {t("tour.t2findDateTo")}
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="t2-input mt-0.5 block" />
          </label>
        </div>
        <div className="no-scrollbar flex flex-wrap gap-1.5 overflow-x-auto">
          <button type="button" onClick={() => setNext4((v) => !v)} className={chip(next4)}>{t("tour.t2findNext4")}</button>
          <button type="button" onClick={() => setOnRoute((v) => !v)} className={chip(onRoute)}>{t("tour.t2findOnRoute")}</button>
          <button type="button" onClick={() => setCluster((v) => !v)} className={chip(cluster)}>{t("tour.t2findCluster")}</button>
          <button type="button" onClick={() => setLowCost((v) => !v)} className={chip(lowCost)}>{t("tour.t2findLowCost")}</button>
          <button type="button" onClick={() => setDeadlineOpen((v) => !v)} className={chip(deadlineOpen)}>{t("tour.t2findDeadlineOpen")}</button>
          <button type="button" onClick={() => setEuropeOnly((v) => !v)} className={chip(europeOnly)}>{t("tour.plRegionEurope")}</button>
        </div>
        <div className="no-scrollbar flex flex-wrap gap-1.5 overflow-x-auto">
          {CIRCUITS.map((c) => (
            <button key={c} type="button" onClick={() => toggleSet(circuits, c, setCircuits)} className={chip(circuits.has(c))}>{circuitLabel(c)}</button>
          ))}
        </div>
        <div className="no-scrollbar flex flex-wrap gap-1.5 overflow-x-auto">
          {SURFACES.map((s) => (
            <button key={s} type="button" onClick={() => toggleSet(surfaces, s, setSurfaces)} className={chip(surfaces.has(s))}>{t(`tour.surface_${s}`)}</button>
          ))}
          {hasPassports ? (
            <>
              <button type="button" onClick={() => setVisaMode((v) => v === "free" ? "all" : "free")} className={chip(visaMode === "free")}>{t("tour.t2findVisaFree")}</button>
              <button type="button" onClick={() => setVisaMode((v) => v === "need" ? "all" : "need")} className={chip(visaMode === "need")}>{t("tour.t2findVisaNeed")}</button>
            </>
          ) : (
            <span className="self-center text-[11px] text-[var(--t2-faint)]">{t("tour.t2findVisaNeedPass")}</span>
          )}
        </div>
        {categoryOpts.length > 0 && (
          <div className="no-scrollbar flex max-h-20 flex-wrap gap-1.5 overflow-y-auto">
            {categoryOpts.slice(0, 32).map((c) => (
              <button key={c} type="button" onClick={() => toggleSet(categories, c, setCategories)} className={chip(categories.has(c))}>{c}</button>
            ))}
          </div>
        )}
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--t2-faint)]">{t("tour.filterCountry")}</p>
          <div className="no-scrollbar flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
            {regionCountries.map(countryChip)}
            {restSelected.map(countryChip)}
            {showRest && restCollapsible.map(countryChip)}
          </div>
          {restCollapsible.length > 0 && (
            <button type="button" onClick={() => setShowRest((v) => !v)} className="mt-1 text-[12px] font-semibold text-matchup">
              {showRest ? t("tour.filterCountriesFewer") : t("tour.filterCountriesMore", { n: restCollapsible.length })}
            </button>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden px-3 py-3 pb-24 md:w-[60%] md:flex-none md:pb-4">
          {status === "loading" && <p className="text-sm text-[var(--t2-muted)]">{t("tour.t2catalogLoading")}</p>}
          {status === "error" && <p className="text-sm text-[var(--t2-muted)]">{t("tour.loadError")}</p>}
          {status === "ready" && (
            <div className="flex h-full min-h-0 flex-col">
              <p className="mb-2 shrink-0 px-1 text-[12px] font-medium text-[var(--t2-muted)]">{t("tour.resultCount", { n: filtered.length })}</p>
              {filtered.length === 0 ? (
                <p className="border border-[var(--t2-line)] px-4 py-8 text-center text-sm text-[var(--t2-muted)]">{t("tour.empty")}</p>
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
              <p className="mt-2 shrink-0 px-1 text-[11px] leading-relaxed text-[var(--t2-faint)]">{t("tour.t2findIpinFooter")}</p>
            </div>
          )}
        </div>
        <div className={`${mapOpen ? "order-first h-[40vh] shrink-0 md:order-none md:h-auto" : "hidden"} min-h-0 md:block md:w-[40%]`}>{mapPane}</div>
      </div>

      {detailEl && (
        <>
          <div className="absolute inset-0 z-[75] bg-black/40" onClick={() => setSelectedId(null)} />
          <aside className="absolute right-0 top-0 z-[76] flex h-full w-full max-w-[720px] flex-col bg-[var(--t2-paper)] shadow-2xl">{detailEl}</aside>
        </>
      )}
    </div>
  );
}
