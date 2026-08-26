"use client";

/**
 * /tour2 Overview — Stand, Route, belegte Erkenntnisse. Kein Katalog.
 */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT, useLocale } from "@/lib/i18n";
import TourLoginCard from "@/app/tour2/components/TourLoginCard";
import { loadSeason, loadAllEntryEvents, type SeasonEntry } from "@/lib/tourSeason";
import { loadPlannerProfile, type PlannerProfile, ratesToCostParams, budgetMoney, costRatesComplete, placeKey } from "@/lib/tourPlanner";
import { loadCostRates } from "@/lib/tourCosts";
import { loadStays } from "@/lib/tourStays";
import { hasSchengenPassport } from "@/lib/visa";
import { bannedDestinations } from "@/lib/tourVisaRequirements";
import { loadTravelDocuments } from "@/lib/tourTravelDocuments";
import { loadPlayerDocs, type PlayerDocs } from "@/lib/tourPlayerMaster";
import { loadResultHistory, toMatchResults, type ResultHistoryRow } from "@/lib/tourResultHistory";
import { loadWildcardContacts, type TourWildcardContact } from "@/lib/tourWildcards";
import { loadExpenses, amountToMinor, type TourExpense } from "@/lib/tourExpenses";
import type { TourCostRates, TourEntryEvent, TourTravelDocument } from "@/lib/types";
import { computeSeasonCost } from "@/domain/tour/costs";
import { scorePoints } from "@/domain/tour/points";
import { tourDeadlines } from "@/domain/tour/deadlines";
import { documentWarnings } from "@/domain/tour/documentWarnings";
import { visaLeadWarnings } from "@/domain/tour/visaLeadWarnings";
import { pointsForecast } from "@/domain/tour/pointsForecast";
import { schengenUsage, isSchengenCode, type Stay } from "@/domain/tour/schengen";
import { buildActionBoard, type BoardTournament } from "@/domain/tour/actionBoard";
import { seasonMetrics } from "@/domain/tour/finance";
import { haversineKm } from "@/lib/utils/haversine";
import { tour2PlannerTournamentHref, T2_SEASON, T2_RANKING } from "@/app/tour2/components/t2Action";
import { loadSetupState, type SetupState } from "@/lib/tourSetup";
import { SETUP_SKIP_KEY } from "@/lib/tourOptPrefs";
import SetupPanel from "@/app/tour2/components/setup/SetupPanel";
import Tour2ActionList from "@/app/tour2/components/Tour2ActionList";
import DayGlance from "@/app/tour2/components/home/DayGlance";
import { t2markArea } from "@/app/tour2/t2mark";
import { loadEvents, type TourEvent } from "@/lib/tourEvents";
import { loadSlotsOnDates, loadSlotPeople } from "@/lib/tourTrainingSlots";
import { acceptedMeetingsForViewer, addIsoDays, buildDayGlance, type GlanceMeeting } from "@/domain/tour/dayGlance";
import { getTourCatalog } from "@/lib/tourCatalogCache";
import type { ItemCode } from "@/domain/tour/costs";

const DAY = 86_400_000;
const NIGHTS_KEY = "mu_tour_nights";
type LoadState = "loading" | "error" | "done";

function isoAddDays(iso: string, n: number): string {
  const ms = Date.parse(iso + "T00:00:00Z");
  if (Number.isNaN(ms)) return iso;
  return new Date(ms + n * DAY).toISOString().slice(0, 10);
}

function groupEventsByPlan(evs: TourEntryEvent[]): Map<string, TourEntryEvent[]> {
  const m = new Map<string, TourEntryEvent[]>();
  for (const e of evs) { const a = m.get(e.plan_id); if (a) a.push(e); else m.set(e.plan_id, [e]); }
  return m;
}

function Kpi({ label, children, note, extra, compact }: { label: string; children: ReactNode; note?: ReactNode; extra?: ReactNode; compact?: boolean }) {
  return (
    <div className="t2-dash-card">
      <p className="t2-kicker">{label}</p>
      <div className="mt-2 flex items-start justify-between gap-3">
        <div className={compact ? "min-w-0 flex-1" : "text-[clamp(1.45rem,3vw,1.95rem)] font-semibold tracking-[-0.03em] tabular-nums"}>{children}</div>
        {extra}
      </div>
      {note && <div className="mt-1.5 text-[12px] leading-relaxed text-[var(--t2-muted)]">{note}</div>}
    </div>
  );
}

function flagEmoji(cc: string): string {
  const u = cc.toUpperCase();
  if (!/^[A-Z]{2}$/.test(u)) return "";
  return String.fromCodePoint(...[...u].map((c) => 127397 + c.charCodeAt(0)));
}

function Donut({ parts }: { parts: { n: number; color: string }[] }) {
  const total = parts.reduce((s, p) => s + p.n, 0);
  if (total <= 0) return <div className="h-12 w-12 rounded-full border border-[var(--t2-line)]" />;
  let acc = 0;
  const stops = parts.filter((p) => p.n > 0).map((p) => {
    const a = (acc / total) * 100;
    acc += p.n;
    const b = (acc / total) * 100;
    return `${p.color} ${a}% ${b}%`;
  });
  return (
    <div className="relative h-12 w-12 shrink-0" aria-hidden>
      <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${stops.join(",")})` }} />
      <div className="absolute inset-[3.5px] rounded-full bg-[var(--t2-card)]" />
    </div>
  );
}

function DistBars({ items }: { items: { key: string; n: number; label: string }[] }) {
  const max = Math.max(1, ...items.map((x) => x.n));
  return (
    <ul className="mt-3 space-y-2">
      {items.map((x) => (
        <li key={x.key}>
          <div className="flex justify-between text-[12px] font-semibold">
            <span>{x.label}</span>
            <span className="tabular-nums text-[var(--t2-muted)]">{x.n}</span>
          </div>
          <div className="mt-1 h-1 bg-[var(--t2-surface)]">
            <div className="h-1 bg-[var(--t2-ink)]" style={{ width: `${(x.n / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function HomeView() {
  const { user, loading: authLoading } = useAuth();
  const t = useT();
  const { locale } = useLocale();
  const loc = locale === "de" ? "de-CH" : "en-GB";

  const [season, setSeason] = useState<SeasonEntry[]>([]);
  const [profile, setProfile] = useState<PlannerProfile | null>(null);
  const [rates, setRates] = useState<TourCostRates | null>(null);
  const [eventsByPlan, setEventsByPlan] = useState<Map<string, TourEntryEvent[]>>(new Map());
  const [docs, setDocs] = useState<PlayerDocs | null>(null);
  const [resultHistory, setResultHistory] = useState<ResultHistoryRow[]>([]);
  const [wildcards, setWildcards] = useState<TourWildcardContact[]>([]);
  const [travelDocs, setTravelDocs] = useState<TourTravelDocument[]>([]);
  const [expenses, setExpenses] = useState<TourExpense[]>([]);
  const [setup, setSetup] = useState<SetupState | null>(null);
  const [forceHome, setForceHome] = useState(() => {
    try { return localStorage.getItem(SETUP_SKIP_KEY) === "1"; } catch { return false; }
  });
  const [banned, setBanned] = useState<Set<string>>(new Set());
  const [stays, setStays] = useState<Stay[]>([]);
  const [tourEvents, setTourEvents] = useState<TourEvent[]>([]);
  const [slotMeetings, setSlotMeetings] = useState<GlanceMeeting[]>([]);
  const [catalogN, setCatalogN] = useState<number | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [nowMs] = useState(() => Date.now());
  const [homeRise] = useState(() => {
    try { return typeof window !== "undefined" && sessionStorage.getItem("mu_t2_home_rise") !== "1"; } catch { return false; }
  });
  useEffect(() => {
    if (state !== "done") return;
    try { sessionStorage.setItem("mu_t2_home_rise", "1"); } catch { /* egal */ }
  }, [state]);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancel = false;
    setState("loading");
    Promise.all([
      loadSeason(),
      loadPlannerProfile(user.id),
      loadCostRates(),
      loadAllEntryEvents(),
      loadPlayerDocs(user.id),
      loadResultHistory(user.id),
      loadWildcardContacts(user.id),
      loadTravelDocuments(user.id),
      loadSetupState(user.id),
      loadExpenses(user.id),
      loadEvents(user.id),
    ])
      .then(([s, p, r, evs, pdocs, rhist, wcs, tdocs, st, exp, tev]) => {
        if (cancel) return;
        setSeason(s);
        setProfile(p);
        setRates(r);
        setEventsByPlan(groupEventsByPlan(evs));
        setDocs(pdocs);
        setResultHistory(rhist);
        setWildcards(wcs);
        setTravelDocs(tdocs);
        setSetup(st);
        setExpenses(exp.rows);
        setTourEvents(tev.rows);
        setState("done");
        t2markArea("home");
      })
      .catch(() => { if (!cancel) setState("error"); });
    return () => { cancel = true; };
  }, [authLoading, user]);

  useEffect(() => {
    if (state !== "done") return;
    let stop = false;
    getTourCatalog()
      .then((rows) => { if (!stop) setCatalogN(rows.length); })
      .catch(() => { /* Zähler optional */ });
    return () => { stop = true; };
  }, [state]);

  const nights = useMemo(() => { try { const n = parseInt(localStorage.getItem(NIGHTS_KEY) ?? "", 10); return Number.isFinite(n) && n >= 0 ? n : 7; } catch { return 7; } }, []);
  const todayISO = new Date(nowMs).toISOString().slice(0, 10);

  const schengenApplies = useMemo(() => !!profile && profile.passports.length > 0 && !hasSchengenPassport(profile.passports), [profile]);
  const passportsKey = (profile?.passports ?? []).join(",");

  useEffect(() => {
    if (!user) return;
    let alive = true;
    const ps = passportsKey ? passportsKey.split(",") : [];
    bannedDestinations(ps).then((b) => { if (alive) setBanned(b); }).catch(() => { /* egal */ });
    return () => { alive = false; };
  }, [user, passportsKey]);

  useEffect(() => {
    if (!user || !schengenApplies) return;
    let alive = true;
    loadStays(user.id).then((rows) => {
      if (alive) setStays(rows.filter((s) => s.confirmed).map((s) => ({ country: s.country, entry: s.entry_date, exit: s.exit_date })));
    }).catch(() => { /* egal */ });
    return () => { alive = false; };
  }, [user, schengenApplies]);

  const active = useMemo(() => {
    return [...season.filter((s) => !s.tournamentInactive)].sort((a, b) => a.tournament.tournament_monday.localeCompare(b.tournament.tournament_monday));
  }, [season]);

  useEffect(() => {
    if (!user) return;
    const ids = season.map((s) => s.tournament.id);
    const dates = [todayISO, addIsoDays(todayISO, 1)];
    let alive = true;
    loadSlotsOnDates(ids, dates)
      .then(async ({ slots, responses }) => {
        const raw = acceptedMeetingsForViewer(user.id, slots, responses);
        const people = await loadSlotPeople(raw.map((x) => x.partnerId));
        if (!alive) return;
        setSlotMeetings(raw.map((x) => {
          const p = people.get(x.partnerId);
          const name = (p?.display_name || p?.first_name || "").trim();
          return { id: `${x.slotId}-${x.partnerId}`, date: x.date, block: x.block, partnerName: name || null, tournamentId: x.tournamentId };
        }));
      })
      .catch(() => { if (alive) setSlotMeetings([]); });
    return () => { alive = false; };
  }, [user, season, todayISO]);

  const glance = useMemo(() => buildDayGlance({
    todayISO,
    events: tourEvents,
    tournaments: active.map((s) => ({ id: s.tournament.id, monday: s.tournament.tournament_monday, city: s.tournament.city })),
    meetings: slotMeetings,
  }), [todayISO, tourEvents, active, slotMeetings]);
  const cur = rates?.currency ?? "EUR";
  const money = useCallback((minor: number) => new Intl.NumberFormat(loc, { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(minor / 100), [loc, cur]);
  const countryName = useCallback((c: string | null) => (c && !t(`tour.country.${c}`).startsWith("tour.country.") ? t(`tour.country.${c}`) : (c ?? "")), [t]);
  const fmtDate = (iso: string) => new Intl.DateTimeFormat(loc, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z"));
  const fmtMonth = (iso: string) => new Intl.DateTimeFormat(loc, { month: "short", timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z"));

  const cost = useMemo(() => {
    if (!costRatesComplete(rates)) return null;
    const params = ratesToCostParams(rates!);
    const stations = active.map((s) => ({ place: placeKey(s.tournament.country, s.tournament.city) ?? `id:${s.tournament.id}`, nights, entryFee: null }));
    return computeSeasonCost(stations, params);
  }, [rates, active, nights]);
  const budget = useMemo(() => budgetMoney(profile?.seasonBudget ?? null, cur), [profile?.seasonBudget, cur]);
  const usedMinor = cost?.total[cur] ?? null;
  const overMinor = usedMinor != null && budget ? usedMinor - budget.amount : null;
  const leftMinor = usedMinor != null && budget ? budget.amount - usedMinor : null;
  const costByCode = useMemo(() => {
    const bag: Partial<Record<ItemCode, number>> = {};
    if (!cost) return bag;
    for (const st of cost.stations) {
      for (const it of st.items) {
        if ("unknown" in it && it.unknown) continue;
        if ("amount" in it) bag[it.code] = (bag[it.code] ?? 0) + it.amount;
      }
    }
    return bag;
  }, [cost]);

  const matchResults = useMemo(() => toMatchResults(resultHistory), [resultHistory]);
  const pointsNow = useMemo(() => scorePoints(matchResults, todayISO), [matchResults, todayISO]);
  const pointsWeekAgo = useMemo(() => scorePoints(matchResults, isoAddDays(todayISO, -7)), [matchResults, todayISO]);
  const pointsDelta = resultHistory.length ? pointsNow.countingTotal - pointsWeekAgo.countingTotal : null;
  const forecast = useMemo(() => pointsForecast(matchResults, todayISO), [matchResults, todayISO]);
  const nextDrop = forecast.schedule[0] ?? null;

  const nextDeadline = useMemo(() => {
    let best: { s: SeasonEntry; ms: number } | null = null;
    for (const s of active) {
      const dl = tourDeadlines(new Date(s.tournament.tournament_monday + "T00:00:00Z"), s.tournament.series, s.tournament.category);
      const ms = dl.entry ? dl.entry.getTime() : null;
      if (ms == null || ms < nowMs) continue;
      if (!best || ms < best.ms) best = { s, ms };
    }
    return best?.s ?? null;
  }, [active, nowMs]);

  const docWarnings = useMemo(() => {
    if (!docs) return [];
    const nextTrip = nextDeadline ? { destination: nextDeadline.tournament.country, entryDate: nextDeadline.tournament.tournament_monday } : null;
    return documentWarnings({
      passports: [
        { country: docs.passport_country, expiry: docs.passport_expiry },
        { country: docs.passport2_country, expiry: docs.passport2_expiry },
      ],
      insurance: { expiry: docs.insurance_expiry, international: docs.insurance_international },
      nextTrip,
      asOf: todayISO,
    });
  }, [docs, nextDeadline, todayISO]);

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

  const visaLead = useMemo(() => visaLeadWarnings({
    asOf: todayISO,
    tournaments: season.map((s) => ({ id: s.tournament.id, city: s.tournament.city, country: s.tournament.country, monday: s.tournament.tournament_monday })),
    docs: travelDocs.map((d) => ({ scope: d.scope, status: d.status, valid_until: d.valid_until, lead_weeks: d.lead_weeks })),
  }), [todayISO, season, travelDocs]);

  const board = useMemo(() => {
    const byId = new Map(season.map((s) => [s.tournament.id, s]));
    const tournaments: BoardTournament[] = season.map((s) => {
      const events = eventsByPlan.get(s.planId) ?? [];
      return {
        id: s.tournament.id,
        city: s.tournament.city,
        country: s.tournament.country,
        monday: s.tournament.tournament_monday,
        series: s.tournament.series,
        status: s.status,
        alternatePosition: s.alternatePosition,
        feePaid: s.feePaid,
        decision: s.decision,
        inactive: s.tournamentInactive,
        alternateObs: events.map((e) => ({ observedAt: e.observed_at, alternatePosition: e.alternate_position })),
      };
    });
    const soon4 = forecast.steps.find((x) => x.weeks === 4)?.expiring[0] ?? null;
    const points = resultHistory.length
      ? {
          total: forecast.currentTotal,
          nextExpiry: forecast.schedule[0] ? { date: forecast.schedule[0].expiresOn, points: forecast.schedule[0].points } : null,
          expiringSoon: soon4 ? { date: soon4.expiresOn, points: soon4.points } : null,
        }
      : null;
    return buildActionBoard({
      asOf: todayISO,
      tournaments,
      banned: [...banned],
      docWarnings,
      schengen: schengen ? { exceeds: schengen.exceeds, used: schengen.used, left: schengen.left } : null,
      points,
      wildcards: wildcards.map((wc) => ({
        tournamentName: byId.get(wc.tournament_id)?.tournament.city ?? "—",
        tournamentId: wc.tournament_id,
        requestedOn: wc.requested_on,
        outcome: wc.outcome,
      })),
      budgetOver: overMinor != null && overMinor > 0 ? { amountMinor: overMinor, currency: cur } : null,
      visaLead,
    });
  }, [season, eventsByPlan, resultHistory, todayISO, banned, docWarnings, schengen, wildcards, overMinor, cur, forecast, visaLead]);

  const finance = useMemo(() => {
    const mondayByTournament: Record<string, string> = {};
    for (const s of season) mondayByTournament[s.tournament.id] = s.tournament.tournament_monday;
    return seasonMetrics({
      expenses: expenses.map((e) => ({
        tournamentId: e.tournament_id,
        amountMinor: amountToMinor(e.amount),
        currency: e.currency ?? cur,
        category: e.category ?? "other",
      })),
      prizes: [],
      income: [],
      mondayByTournament,
      points: pointsNow.countingTotal,
      hasResults: resultHistory.length > 0,
    });
  }, [expenses, season, cur, pointsNow.countingTotal, resultHistory.length]);

  const countdown = (ms: number): string => {
    const left = ms - nowMs;
    if (left <= 0) return t("tour.entryExpired");
    const d = Math.floor(left / DAY);
    const h = Math.floor((left % DAY) / 3_600_000);
    return t("tour.t2ovCountdown", { d, h });
  };

  const upcomingDeadlines = useMemo(() => {
    const out: { id: string; city: string; ms: number; known: boolean }[] = [];
    for (const s of active) {
      const dl = tourDeadlines(new Date(s.tournament.tournament_monday + "T00:00:00Z"), s.tournament.series, s.tournament.category);
      if (!dl.known || !dl.entry) continue;
      const ms = dl.entry.getTime();
      if (ms < nowMs) continue;
      out.push({ id: s.tournament.id, city: s.tournament.city || s.tournament.name || "—", ms, known: true });
    }
    out.sort((a, b) => a.ms - b.ms);
    return out;
  }, [active, nowMs]);

  const clusters = useMemo(() => {
    const groups: { city: string; n: number; savedMinor: number | null }[] = [];
    let i = 0;
    while (i < active.length) {
      const place = placeKey(active[i].tournament.country, active[i].tournament.city) ?? active[i].tournament.id;
      let j = i + 1;
      while (j < active.length && (placeKey(active[j].tournament.country, active[j].tournament.city) ?? active[j].tournament.id) === place) j++;
      const n = j - i;
      if (n >= 3) {
        const arrival = costRatesComplete(rates) ? ratesToCostParams(rates!).arrival : null;
        groups.push({
          city: active[i].tournament.city || "—",
          n,
          savedMinor: arrival ? (n - 1) * arrival.amount : null,
        });
      }
      i = j;
    }
    return groups;
  }, [active, rates]);

  const dists = useMemo(() => {
    const surf = new Map<string, number>();
    const cat = new Map<string, number>();
    const ctry = new Map<string, number>();
    for (const s of active) {
      const sf = s.tournament.surface || "—";
      surf.set(sf, (surf.get(sf) ?? 0) + 1);
      const c = s.tournament.category || "—";
      cat.set(c, (cat.get(c) ?? 0) + 1);
      const k = s.tournament.country || "—";
      ctry.set(k, (ctry.get(k) ?? 0) + 1);
    }
    const surfItems = [...surf.entries()].map(([key, n]) => ({
      key, n, label: key === "—" ? "—" : (t(`tour.surface_${key}`).startsWith("tour.surface_") ? key : t(`tour.surface_${key}`)),
    })).sort((a, b) => b.n - a.n);
    const catItems = [...cat.entries()].map(([key, n]) => ({ key, n, label: key })).sort((a, b) => b.n - a.n);
    const ctryItems = [...ctry.entries()].map(([key, n]) => ({
      key, n, label: key === "—" ? "—" : countryName(key),
    })).sort((a, b) => b.n - a.n);
    return { surfItems, catItems, ctryItems };
  }, [active, t, countryName]);

  const clusterIds = useMemo(() => new Set(clusters.flatMap((c) =>
    active.filter((s) => (s.tournament.city || "—") === c.city).map((s) => s.tournament.id),
  )), [clusters, active]);
  const cpp = finance.costPerPoint?.[cur];

  if (authLoading) return <p className="p-6 text-sm text-[var(--t2-muted)]">{t("tour.t2authChecking")}</p>;
  if (!user) return <TourLoginCard />;
  if (state === "loading") return <p className="p-6 text-sm text-[var(--t2-muted)]">{t("tour.t2dataLoading")}</p>;
  if (state === "error") return <p className="p-6 text-sm text-[var(--t2-muted)]">{t("tour.loadError")}</p>;

  const needsOnboarding = !!setup && !setup.complete && active.length === 0 && !forceHome;
  if (needsOnboarding) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-10 sm:px-8">
        <p className={`t2-eyebrow ${homeRise ? "t2-rise t2-rise-1" : ""}`}>Matchup Tour</p>
        <h1 className={`t2-display ${homeRise ? "t2-rise t2-rise-2" : ""} mt-3 text-[clamp(1.9rem,5.5vw,2.9rem)]`}>{t("tour.t2onbHello")}</h1>
        <SetupPanel onExit={() => setForceHome(true)} />
      </div>
    );
  }

  const step = (w: number) => forecast.steps.find((x) => x.weeks === w);
  const seasonYear = active[0]?.tournament.tournament_monday.slice(0, 4) ?? String(new Date(nowMs).getUTCFullYear());
  const arrivalAmt = rates && costRatesComplete(rates) ? ratesToCostParams(rates).arrival : null;
  const budgetRing = [
    { n: Math.max(0, usedMinor ?? 0), color: "var(--t2-accent)" },
    { n: Math.max(0, leftMinor ?? 0), color: "#e7e5e4" },
  ];
  const surfRing = dists.surfItems.map((x, i) => ({
    n: x.n,
    color: ["#4b3bf3", "#0a0a0a", "#a8a29e", "#78716c"][i] ?? "#d6d3d1",
  }));

  const insights: ReactNode[] = [];
  if (cpp != null && finance.points > 0) {
    insights.push(
      <div key="cpp">
        <p className="t2-kicker">{t("tour.t2ovCostPerPoint")}</p>
        <p className="mt-2 text-[18px] font-semibold tabular-nums">{money(cpp)}</p>
        <p className="mt-1 text-[12px] text-[var(--t2-muted)]">{t("tour.t2ovCostPerPointBasis", { n: finance.tournamentsWithExpenses })}</p>
      </div>,
    );
  }
  for (const c of clusters) {
    if (c.savedMinor == null) continue;
    insights.push(
      <div key={`cl-${c.city}`}>
        <p className="text-[14px] font-semibold">{t("tour.t2ovCluster", { n: c.n, city: c.city, amount: money(c.savedMinor) })}</p>
      </div>,
    );
  }
  if (visaLead.length > 0) {
    const v = visaLead[0];
    insights.push(
      <div key="visa" className="text-[14px]">
        {t("tour.t2ovVisaRisk", { city: v.city || countryName(v.dest), lead: v.leadWeeks, weeks: v.weeksUntil })}
      </div>,
    );
  }

  const deltaArrow = pointsDelta == null || pointsDelta === 0 ? "→" : pointsDelta > 0 ? "↑" : "↓";

  const kpis = (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label={t("tour.t2ovPoints")}
          extra={
            resultHistory.length > 0 && pointsDelta != null ? (
              <span className={`mt-1 text-[13px] font-semibold tabular-nums ${pointsDelta > 0 ? "text-emerald-700" : pointsDelta < 0 ? "text-red-700" : "text-[var(--t2-muted)]"}`}>
                {deltaArrow} {pointsDelta > 0 ? `+${pointsDelta}` : pointsDelta}
              </span>
            ) : null
          }
          note={
            resultHistory.length === 0 ? (
              <Link href={T2_RANKING} className="font-semibold text-matchup">{t("tour.t2ovPointsEmptyHint")} →</Link>
            ) : (
              <>
                <p>{t("tour.t2ovAsOfToday")}</p>
                <p className="mt-1">{t("tour.t2ovPointsDeltaNote")}</p>
              </>
            )
          }
        >
          {resultHistory.length === 0 ? t("tour.t2ovPointsEmpty") : pointsNow.countingTotal}
        </Kpi>
        <Kpi label={t("tour.t2ovHorizon")} note={t("tour.t2ovHorizonHint")} compact>
          {resultHistory.length === 0 ? "—" : (
            <ul className="space-y-1 text-[15px] font-semibold tabular-nums">
              {[4, 8, 12].map((w) => (
                <li key={w} className="flex justify-between gap-3">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--t2-faint)]">{t("tour.t2ovHorizonW", { n: w })}</span>
                  <span>{step(w)?.total ?? "—"}</span>
                </li>
              ))}
            </ul>
          )}
        </Kpi>
        <Kpi
          label={t("tour.t2ovDropping")}
          note={resultHistory.length === 0 || !nextDrop ? t("tour.t2ovDroppingEmpty") : t("tour.t2ovOn", { date: fmtDate(nextDrop.expiresOn) })}
        >
          {resultHistory.length === 0 || !nextDrop ? "—" : nextDrop.points}
        </Kpi>
        <Kpi
          label={t("tour.t2ovBudgetTotal")}
          extra={budget && usedMinor != null ? <Donut parts={budgetRing} /> : null}
          note={
            !budget ? t("tour.t2budgetNoData")
              : usedMinor == null ? t("tour.t2ovBudgetRatesMissing")
                : leftMinor != null
                  ? <p className={leftMinor < 0 ? "text-red-700" : ""}>{t("tour.t2ovBudgetLeft", { n: money(leftMinor) })}</p>
                  : null
          }
        >
          {budget ? money(budget.amount) : "—"}
        </Kpi>
      </div>
  );

  return (
    <div className="t2-overview">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="t2-display text-[clamp(1.7rem,3.4vw,2.15rem)]">{t("tour.t2navOverview")}</h1>
          <p className="t2-lead mt-1.5 max-w-xl">{t("tour.t2ovLead")}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <p className="t2-season-chip">{seasonYear}</p>
          {catalogN != null && (
            <p className="text-[12px] text-[var(--t2-muted)]">{t("tour.t2ovCatalog", { n: catalogN })}</p>
          )}
        </div>
      </header>

      <div className="mt-5">
        <DayGlance todayISO={todayISO} groups={glance} />
      </div>

      <div className="mt-5 grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0 space-y-4">
          {kpis}
          <section className="t2-dash-card">
            <h2 className="t2-kicker">{t("tour.t2ovRoute")}</h2>
            {active.length === 0 ? (
              <>
                <p className="mt-4 text-[14px] text-[var(--t2-muted)]">{t("tour.t2ovRouteEmpty")}</p>
                <Link href={T2_SEASON} className="t2-cta mt-6">{t("tour.wsFill")}<span aria-hidden>→</span></Link>
              </>
            ) : (
              <div className="t2-route-scroll mt-4">
                <div className="t2-route-track">
                  {active.map((s, i) => {
                    const prev = i > 0 ? active[i - 1] : null;
                    const place = placeKey(s.tournament.country, s.tournament.city);
                    const prevPlace = prev ? placeKey(prev.tournament.country, prev.tournament.city) : null;
                    const same = prev != null && place != null && place === prevPlace;
                    let km: number | null = null;
                    if (prev && !same && prev.tournament.latitude != null && prev.tournament.longitude != null && s.tournament.latitude != null && s.tournament.longitude != null) {
                      km = haversineKm(prev.tournament.latitude, prev.tournament.longitude, s.tournament.latitude, s.tournament.longitude);
                    }
                    const mon = s.tournament.tournament_monday.slice(0, 7);
                    const prevMon = prev?.tournament.tournament_monday.slice(0, 7);
                    const showMonth = mon !== prevMon;
                    const clustered = clusterIds.has(s.tournament.id);
                    return (
                      <div key={s.tournament.id} className="flex items-stretch">
                        {prev && (
                          <div className="t2-route-leg">
                            {same
                              ? t("tour.t2legCluster")
                              : [km != null ? t("tour.t2legKm", { n: km }) : t("tour.t2ovLegUnknownKm"), arrivalAmt ? t("tour.t2legArrival", { amount: money(arrivalAmt.amount) }) : null].filter(Boolean).join(" · ")}
                          </div>
                        )}
                        <div>
                          {showMonth && (
                            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--t2-faint)]">{fmtMonth(s.tournament.tournament_monday)}</p>
                          )}
                          <Link href={tour2PlannerTournamentHref(s.tournament.id)} className={`t2-route-card ${clustered ? "is-cluster" : ""}`}>
                            <p className="text-[11px] font-semibold tabular-nums text-[var(--t2-muted)]">{fmtDate(s.tournament.tournament_monday)}</p>
                            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--t2-faint)]">{s.tournament.category || "—"}</p>
                            <p className="mt-1 truncate text-[14px] font-semibold">{s.tournament.city || t("tour.fieldMissing")}</p>
                            <p className="mt-0.5 truncate text-[12px] text-[var(--t2-muted)]">
                              {s.tournament.country ? `${flagEmoji(s.tournament.country)} ${countryName(s.tournament.country)}` : ""}
                            </p>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {active.length > 0 && (
            <section className="grid gap-3 sm:grid-cols-3">
              <div className="t2-dash-card">
                <h2 className="t2-kicker">{t("tour.t2ovDistSurface")}</h2>
                <div className="mt-3 flex items-center gap-4">
                  <Donut parts={surfRing} />
                  <ul className="min-w-0 space-y-1 text-[12px]">
                    {dists.surfItems.map((x) => (
                      <li key={x.key} className="flex justify-between gap-3">
                        <span className="truncate">{x.label}</span>
                        <span className="tabular-nums text-[var(--t2-muted)]">{x.n}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="t2-dash-card">
                <h2 className="t2-kicker">{t("tour.t2ovDistLevel")}</h2>
                <DistBars items={dists.catItems} />
              </div>
              <div className="t2-dash-card">
                <h2 className="t2-kicker">{t("tour.t2ovDistCountry")}</h2>
                <ul className="mt-3 space-y-1.5 text-[13px]">
                  {dists.ctryItems.map((x) => (
                    <li key={x.key} className="flex justify-between gap-3">
                      <span className="truncate">{x.key !== "—" ? `${flagEmoji(x.key)} ${x.label}` : x.label}</span>
                      <span className="tabular-nums font-semibold">{x.n}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {insights.length > 0 && (
            <section className="t2-dash-card">
              <h2 className="t2-kicker">{t("tour.t2ovInsights")}</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">{insights}</div>
            </section>
          )}

          <section className="t2-dash-card" id="t2-actions">
            <h2 className="t2-kicker">{t("tour.t2action")}</h2>
            <Tour2ActionList
              actions={board.actions}
              countryName={countryName}
              fmtDate={fmtDate}
              money={(minor) => money(minor)}
            />
          </section>
        </div>

        <aside className="space-y-3">
          <section className="t2-dash-card">
            <h2 className="t2-kicker">{t("tour.t2ovAsideBudget")}</h2>
            <p className="mt-2 text-[15px] font-semibold">
              {budget && usedMinor != null ? t("tour.t2budgetOf", { used: money(usedMinor), total: money(budget.amount) }) : t("tour.t2budgetNoData")}
            </p>
            {usedMinor != null && (
              <ul className="mt-3 space-y-1.5 text-[12px] text-[var(--t2-muted)]">
                {(["arrival", "lodging", "food", "coach", "entry"] as ItemCode[]).map((code) => {
                  const n = costByCode[code];
                  if (!n) return null;
                  return (
                    <li key={code} className="flex justify-between gap-2">
                      <span>{t(`tour.costsItem_${code}`)}</span>
                      <span className="tabular-nums">{money(n)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
          <section className="t2-dash-card">
            <h2 className="t2-kicker">{t("tour.t2ovAsideOutlook")}</h2>
            {resultHistory.length === 0 ? (
              <p className="mt-2 text-[13px] text-[var(--t2-muted)]">{t("tour.t2ovPointsEmpty")}</p>
            ) : (
              <ul className="mt-2 space-y-1.5 text-[13px]">
                {[4, 8, 12].map((w) => (
                  <li key={w} className="flex justify-between gap-2">
                    <span>{t("tour.t2ovHorizonW", { n: w })}</span>
                    <span className="tabular-nums font-semibold">{step(w)?.total ?? "—"}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="t2-dash-card">
            <h2 className="t2-kicker">{t("tour.t2ovAsideDeadlines")}</h2>
            {upcomingDeadlines.length === 0 ? (
              <p className="mt-2 text-[13px] text-[var(--t2-muted)]">{t("tour.t2noSeason")}</p>
            ) : (
              <ul className="mt-2 space-y-2 text-[13px]">
                {upcomingDeadlines.slice(0, 5).map((d) => (
                  <li key={d.id} className="flex justify-between gap-2">
                    <Link href={tour2PlannerTournamentHref(d.id)} className="min-w-0 truncate font-semibold hover:underline">{d.city}</Link>
                    <span className="shrink-0 tabular-nums text-[var(--t2-muted)]">{countdown(d.ms)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="t2-dash-card">
            <h2 className="t2-kicker">{t("tour.t2ovAsideTravel")}</h2>
            <ul className="mt-2 space-y-2 text-[13px] text-[var(--t2-muted)]">
              <li>
                {docs?.passport_expiry
                  ? t("tour.t2ovPassportUntil", { date: fmtDate(docs.passport_expiry) })
                  : <Link href="/tour2/documents" className="font-semibold text-matchup">{t("tour.t2ovPassportMissing")} · {t("tour.t2ovPassportGo")} →</Link>}
              </li>
              <li>
                {schengenApplies && schengen
                  ? t("tour.t2ovSchengen", { used: schengen.used, left: schengen.left })
                  : profile && profile.passports.length > 0
                    ? t("tour.t2ovSchengenSkip")
                    : null}
              </li>
              {visaLead[0] && (
                <li>{t("tour.t2ovVisaNext", { city: visaLead[0].city || countryName(visaLead[0].dest) })}</li>
              )}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
