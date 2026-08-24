"use client";

/**
 * /tour2 Turniere (Etappe 3): Liste + Karte. Eine Aufgabe — welches Turnier spielen?
 * Filter und Daten wie TourBrowser (künftige Turniere, Land/Kategorie), plus Suche,
 * Dieser-Monat, Europa, Belag. Keine erfundenen Werte (keine Acceptance %, keine Flugzeit).
 * Erwartete Punkte: Annahme R16 aus points.ts. Karte = PlannerMap (Saison-Punkte nummeriert,
 * übrige als Kandidaten). Detail = vorhandenes TournamentDetail.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useT, useLocale } from "@/lib/i18n";
import TourLoginCard from "@/app/tour2/components/TourLoginCard";
import { loadPlannerProfile, loadActiveTournaments, type PlannerProfile } from "@/lib/tourPlanner";
import { loadSeasonTournamentIds, addToSeason, removeFromSeason, loadSeasonPlanRows, loadAllEntryEvents } from "@/lib/tourSeason";
import { loadCostRates } from "@/lib/tourCosts";
import { isTargetRegion } from "@/domain/tour/region";
import type { TourTournament, TourCostRates, TourSeasonPlanEntry, TourEntryEvent } from "@/lib/types";
import PlannerMap, { type CandPoint } from "../components/planner/PlannerMap";
import TournamentDetail from "../components/planner/TournamentDetail";
import TournamentRow from "./TournamentRow";

const NIGHTS_KEY = "mu_tour_nights";
const SURFACES = ["clay", "hard", "grass", "carpet"] as const;

function groupEventsByPlan(evs: TourEntryEvent[]): Map<string, TourEntryEvent[]> {
  const m = new Map<string, TourEntryEvent[]>();
  for (const e of evs) { const a = m.get(e.plan_id); if (a) a.push(e); else m.set(e.plan_id, [e]); }
  return m;
}

const chip = (on: boolean) =>
  `px-3 py-1.5 text-[12px] font-semibold border ${on ? "border-matchup bg-matchup text-white" : "border-white/10 text-neutral-300 hover:border-white/40"}`;

export default function TournamentsView() {
  const { user, loading: authLoading } = useAuth();
  const t = useT();
  const { locale } = useLocale();

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [tours, setTours] = useState<TourTournament[]>([]);
  const [seasonIds, setSeasonIds] = useState<Set<string>>(new Set());
  const [profile, setProfile] = useState<PlannerProfile | null>(null);
  const [rates, setRates] = useState<TourCostRates | null>(null);
  const [planByTour, setPlanByTour] = useState<Map<string, TourSeasonPlanEntry>>(new Map());
  const [eventsByPlan, setEventsByPlan] = useState<Map<string, TourEntryEvent[]>>(new Map());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [q, setQ] = useState("");
  const [thisMonth, setThisMonth] = useState(false);
  const [europeOnly, setEuropeOnly] = useState(true);
  const [surfaces, setSurfaces] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<Set<string>>(new Set());
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
    Promise.all([loadActiveTournaments(), loadPlannerProfile(user.id), loadCostRates(), loadSeasonTournamentIds(), loadSeasonPlanRows(), loadAllEntryEvents()])
      .then(([ts, p, r, ids, planRows, evs]) => {
        if (!alive) return;
        setTours(ts);
        setProfile(p);
        setRates(r);
        setSeasonIds(ids);
        setPlanByTour(new Map(planRows.map((x) => [x.tournament_id, x])));
        setEventsByPlan(groupEventsByPlan(evs));
        setStatus("ready");
      })
      .catch(() => { if (alive) setStatus("error"); });
    return () => { alive = false; };
  }, [authLoading, user]);

  const catName = useCallback((c: string | null) => (c ? (t(`tour.country.${c}`).startsWith("tour.country.") ? c : t(`tour.country.${c}`)) : "—"), [t]);
  const today = new Date(nowMs).toISOString().slice(0, 10);
  const monthPrefix = today.slice(0, 7);

  const upcoming = useMemo(() => tours.filter((x) => x.tournament_monday >= today), [tours, today]);

  const categoryOpts = useMemo(
    () => [...new Set(upcoming.map((x) => x.category).filter((c): c is string => !!c))].sort((a, b) => a.localeCompare(b)),
    [upcoming],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return upcoming.filter((x) => {
      if (thisMonth && !x.tournament_monday.startsWith(monthPrefix)) return false;
      if (europeOnly && !(x.country && isTargetRegion(x.country))) return false;
      if (surfaces.size > 0 && !(x.surface && surfaces.has(x.surface))) return false;
      if (categories.size > 0 && !(x.category && categories.has(x.category))) return false;
      if (needle) {
        const hay = `${x.city ?? ""} ${x.name ?? ""} ${x.category ?? ""} ${catName(x.country)}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [upcoming, thisMonth, monthPrefix, europeOnly, surfaces, categories, q, catName]);

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

  useEffect(() => {
    if (!selectedId) return;
    document.querySelector(`[data-stop="${selectedId}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedId]);

  const nightsNum = useMemo(() => { try { const n = parseInt(localStorage.getItem(NIGHTS_KEY) ?? "", 10); return Number.isFinite(n) && n >= 0 ? n : 7; } catch { return 7; } }, []);
  const startName = profile?.city ?? null;

  const toggleSet = (set: Set<string>, v: string, setter: (s: Set<string>) => void) => {
    const n = new Set(set);
    if (n.has(v)) n.delete(v); else n.add(v);
    setter(n);
  };

  if (authLoading) return <div className="flex h-[calc(100dvh-3.5rem)] items-center justify-center text-sm text-neutral-400">{t("tour.loading")}</div>;
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
    />
  ) : null;

  const mapPane = (
    <div className="relative h-full min-h-[220px] w-full bg-[#12161e]">
      <PlannerMap start={null} plan={[]} candidates={candidateStops} selectedId={selectedId} onSelect={handleSelect} />
    </div>
  );

  return (
    <div className="relative flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden bg-black text-white">
      <div className="shrink-0 space-y-2 border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("tour.t2search")} className="min-w-0 flex-1 border border-white/10 bg-black px-3 py-2 text-[13px] text-white placeholder:text-neutral-500 focus:border-white focus:outline-none" />
          <button type="button" onClick={() => setMapOpen((o) => !o)} className="rounded-full bg-white/10 px-3 py-2 text-[12px] font-bold md:hidden">{mapOpen ? t("tour.t2mapHide") : t("tour.t2mapShow")}</button>
        </div>
        <div className="no-scrollbar flex flex-wrap gap-1.5 overflow-x-auto">
          <button type="button" onClick={() => setThisMonth((v) => !v)} className={chip(thisMonth)}>{t("tour.t2thisMonth")}</button>
          <button type="button" onClick={() => setEuropeOnly((v) => !v)} className={chip(europeOnly)}>{t("tour.plRegionEurope")}</button>
          {SURFACES.map((s) => (
            <button key={s} type="button" onClick={() => toggleSet(surfaces, s, setSurfaces)} className={chip(surfaces.has(s))}>{t(`tour.surface_${s}`)}</button>
          ))}
        </div>
        {categoryOpts.length > 0 && (
          <div className="no-scrollbar flex max-h-20 flex-wrap gap-1.5 overflow-y-auto">
            {categoryOpts.slice(0, 24).map((c) => (
              <button key={c} type="button" onClick={() => toggleSet(categories, c, setCategories)} className={chip(categories.has(c))}>{c}</button>
            ))}
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {mapOpen && <div className="h-[40vh] shrink-0 md:hidden">{mapPane}</div>}
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-3 py-3 pb-24 md:w-[60%] md:flex-none md:pb-4">
          {status === "loading" && <p className="text-sm text-neutral-400">{t("tour.loading")}</p>}
          {status === "error" && <p className="text-sm text-neutral-400">{t("tour.loadError")}</p>}
          {status === "ready" && (
            <>
              <p className="mb-2 px-1 text-[12px] font-medium text-neutral-500">{t("tour.resultCount", { n: filtered.length })}</p>
              {filtered.length === 0 ? (
                <p className="border border-white/10 px-4 py-8 text-center text-sm text-neutral-500">{t("tour.empty")}</p>
              ) : (
                <ul className="space-y-0.5">
                  {filtered.map((tt) => (
                    <li key={tt.id} data-stop={tt.id}>
                      <TournamentRow
                        tt={tt}
                        countryName={catName(tt.country)}
                        selected={selectedId === tt.id}
                        inSeason={seasonIds.has(tt.id)}
                        onSelect={() => setSelectedId(tt.id)}
                        onToggle={() => toggle(tt.id)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
        <div className="hidden min-h-0 w-[40%] md:block">{mapPane}</div>
      </div>

      {detailEl && (
        <>
          <div className="absolute inset-0 z-[75] bg-black/40" onClick={() => setSelectedId(null)} />
          <aside className="absolute right-0 top-0 z-[76] flex h-full w-full max-w-[400px] flex-col bg-white shadow-2xl">{detailEl}</aside>
        </>
      )}
    </div>
  );
}
