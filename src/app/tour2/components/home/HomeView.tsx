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
import { deadlineCountdown } from "@/domain/tour/deadlineCountdown";
import { displayCity } from "@/domain/tour/displayCity";
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
        <div className={compact ? "min-w-0 flex-1" : "t2-fs-display font-semibold tracking-[-0.03em] tabular-nums"}>{children}</div>
        {extra}
      </div>
      {note && <div className="mt-1.5 t2-fs-micro leading-relaxed text-[var(--t2-muted)]">{note}</div>}
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
          <div className="flex justify-between t2-fs-micro font-semibold">
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

  // Zone A: nächster kalendarischer Turnierstopp (nicht der nächste Deadline —
  // das ist Zone C). Erstes aktives Turnier ab heute in der bereits nach Montag
  // sortierten Liste.
  const nextStop = useMemo(() => {
    for (const s of active) if (s.tournament.tournament_monday >= todayISO) return s;
    return null;
  }, [active, todayISO]);

  // Zone C: Restzeit bis zur dringendsten Meldefrist (ms), oder null falls keine.
  const nextEntryDeadlineMs = useMemo(() => {
    if (!nextDeadline) return null;
    const dl = tourDeadlines(new Date(nextDeadline.tournament.tournament_monday + "T00:00:00Z"), nextDeadline.tournament.series, nextDeadline.tournament.category);
    return dl.entry ? dl.entry.getTime() : null;
  }, [nextDeadline]);

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

  // Gemeinsame Zeit-Basis für den Fristen-Countdown: Mitternacht UTC des heutigen
  // Tages — dieselbe Bezugsgröße, gegen die das Action-Board rechnet. Damit stimmen
  // Zone C und die Aktionsliste zwangsläufig überein.
  const asOfMs = useMemo(() => Date.parse(todayISO + "T00:00:00Z"), [todayISO]);
  const countdown = (deadlineMs: number): string => {
    const c = deadlineCountdown(deadlineMs, asOfMs);
    if (c.kind === "past") return t("tour.deadlinePast");
    if (c.kind === "same-day") return t("tour.deadlineSameDay");
    return t("tour.deadlineFuture", { d: c.days });
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
  // Turniere, deren Meldefrist bereits verstrichen ist — kommt direkt aus dem
  // Action-Board (kein zweiter Rechenweg). Sichtbar in Zone B als Warnmarker.
  const missedEntryIds = useMemo(() => {
    const ids = new Set<string>();
    for (const a of board.actions) {
      if (a.kind === "entry_missed" && a.target.type === "tournament") ids.add(a.target.id);
    }
    return ids;
  }, [board.actions]);
  const cpp = finance.costPerPoint?.[cur];

  if (authLoading) return <p className="p-6 t2-fs-body text-[var(--t2-muted)]">{t("tour.t2authChecking")}</p>;
  if (!user) return <TourLoginCard />;
  if (state === "loading") return <p className="p-6 t2-fs-body text-[var(--t2-muted)]">{t("tour.t2dataLoading")}</p>;
  if (state === "error") return <p className="p-6 t2-fs-body text-[var(--t2-muted)]">{t("tour.loadError")}</p>;

  const needsOnboarding = !!setup && !setup.complete && active.length === 0 && !forceHome;
  if (needsOnboarding) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-10 sm:px-8">
        <p className={`t2-eyebrow ${homeRise ? "t2-rise t2-rise-1" : ""}`}>Matchup Tour</p>
        <h1 className={`t2-display ${homeRise ? "t2-rise t2-rise-2" : ""} mt-3 t2-fs-display`}>{t("tour.t2onbHello")}</h1>
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
    color: ["var(--t2-accent)", "var(--t2-text)", "#a8a29e", "#78716c"][i] ?? "#d6d3d1",
  }));

  const insights: ReactNode[] = [];
  if (cpp != null && finance.points > 0) {
    insights.push(
      <div key="cpp">
        <p className="t2-kicker">{t("tour.t2ovCostPerPoint")}</p>
        <p className="mt-2 t2-fs-h3 font-semibold tabular-nums">{money(cpp)}</p>
        <p className="mt-1 t2-fs-micro text-[var(--t2-muted)]">{t("tour.t2ovCostPerPointBasis", { n: finance.tournamentsWithExpenses })}</p>
      </div>,
    );
  }
  for (const c of clusters) {
    if (c.savedMinor == null) continue;
    insights.push(
      <div key={`cl-${c.city}`}>
        <p className="t2-fs-body font-semibold">{t("tour.t2ovCluster", { n: c.n, city: c.city, amount: money(c.savedMinor) })}</p>
      </div>,
    );
  }
  if (visaLead.length > 0) {
    const v = visaLead[0];
    insights.push(
      <div key="visa" className="t2-fs-body">
        {t("tour.t2ovVisaRisk", { city: v.city || countryName(v.dest), lead: v.leadWeeks, weeks: v.weeksUntil })}
      </div>,
    );
  }

  const deltaArrow = pointsDelta == null || pointsDelta === 0 ? "→" : pointsDelta > 0 ? "↑" : "↓";

  // ── Zone A: Kopfzeilen-Kennzahlen ────────────────────────────────────────
  // Nur Werte, die die Datenlage liefert. Fehlende Felder werden komplett
  // weggelassen, kein Platzhalter, kein „—". Ranking ist Hero, die übrigen
  // Kennzahlen sind untergeordnete Titelgrößen.
  type HeaderStat = { key: string; value: ReactNode; label: string; hero?: boolean };
  const headerStats: HeaderStat[] = [];
  if (profile?.ranking != null) {
    // Ranking mit „#" prefixieren — signalisiert visuell einen Rangplatz statt einer Menge.
    headerStats.push({ key: "rank", value: `#${profile.ranking}`, label: t("tour.t2ovGreetRanking"), hero: true });
  }
  if (active.length > 0) {
    headerStats.push({ key: "count", value: active.length, label: t("tour.t2ovGreetTournaments") });
  }
  if (leftMinor != null) {
    headerStats.push({ key: "budget", value: money(leftMinor), label: t("tour.t2ovGreetBudgetLeft") });
  }
  if (nextStop) {
    headerStats.push({
      key: "next",
      value: displayCity(nextStop.tournament.city) || t("tour.fieldMissing"),
      label: t("tour.t2ovGreetNextStop", { date: fmtDate(nextStop.tournament.tournament_monday) }),
    });
  }
  const greetTitle = profile?.firstName
    ? t("tour.t2ovGreetName", { name: profile.firstName, year: seasonYear })
    : t("tour.t2ovGreetAnon", { year: seasonYear });

  return (
    <div className="t2-overview">
      {/* ZONE A — Kopfzeile: Vorname + Saisonjahr, Kennzahlen-Reihe */}
      <header>
        <h1 className="t2-display t2-fs-display tracking-[-0.02em]">{greetTitle}</h1>
        {headerStats.length > 0 && (
          // Mobil (<768px) stapeln die Kennzahlen einspaltig, ab md nebeneinander
          // mit dezenten vertikalen Trennern zwischen den Items.
          <dl className="mt-6 flex flex-col gap-y-5 md:flex-row md:flex-wrap md:items-baseline md:gap-y-4">
            {headerStats.map((s, i) => (
              <div
                key={s.key}
                className={`flex flex-col ${i === 0 ? "md:pr-8" : "md:border-l md:border-[var(--t2-line)] md:px-8"}`}
              >
                <dd
                  className={
                    s.hero
                      ? "t2-fs-display font-semibold tabular-nums tracking-[-0.04em]"
                      : "max-w-[16rem] truncate t2-fs-display font-semibold tabular-nums tracking-[-0.02em]"
                  }
                >
                  {s.value}
                </dd>
                <dt className="mt-1 t2-fs-meta font-semibold uppercase tracking-[0.16em] text-[var(--t2-faint)]">
                  {s.label}
                </dt>
              </div>
            ))}
          </dl>
        )}
      </header>

      {/* ZONE B — Saison-Route: dominante Fläche, volle Breite, Höhe */}
      <section className="t2-dash-card mt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="t2-fs-body font-medium text-[var(--t2-ink)]">{t("tour.t2ovRoute")}</h2>
        </div>
        {active.length === 0 ? (
          <div className="mt-6 flex min-h-[30vh] flex-col items-start justify-center">
            <p className="t2-fs-body text-[var(--t2-muted)]">{t("tour.t2ovRouteEmpty")}</p>
            <Link href={T2_SEASON} className="t2-cta mt-6">{t("tour.wsFill")}<span aria-hidden>→</span></Link>
          </div>
        ) : (
          <div className="t2-route-scroll mt-5 min-h-[36vh]">
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
                // Kommender Stopp: erster Stopp mit Montag ≥ heute wird hervorgehoben,
                // vergangene Stopps werden gedämpft dargestellt (spec Zone B).
                const isPast = s.tournament.tournament_monday < todayISO;
                const isNext = nextStop?.tournament.id === s.tournament.id;
                // Meldefrist verpasst → wird in Zone B sichtbar markiert, damit
                // der Widerspruch zur Action-Liste verschwindet. Zustand kommt
                // aus dem Action-Board (missedEntryIds), keine Zweitberechnung.
                const missed = missedEntryIds.has(s.tournament.id);
                return (
                  <div key={s.tournament.id} className="flex items-stretch">
                    {prev && (
                      <div className="t2-route-leg">
                        {same
                          ? t("tour.t2legCluster")
                          // Nur die berechnete Distanz ausweisen — die Anreise-Pauschale
                          // (bisher „Arrival €120" auf JEDEM Leg) war ein Konfig-Wert
                          // ohne Bezug zur konkreten Etappe und wurde daher entfernt.
                          : (km != null ? t("tour.t2legKm", { n: km }) : t("tour.t2ovLegUnknownKm"))}
                      </div>
                    )}
                    <div className={`${isPast ? "opacity-40" : ""} ${missed && !isPast ? "opacity-60" : ""}`}>
                      {showMonth && (
                        <p className="mb-1 t2-fs-meta font-semibold uppercase tracking-[0.14em] text-[var(--t2-faint)]">{fmtMonth(s.tournament.tournament_monday)}</p>
                      )}
                      <Link
                        href={tour2PlannerTournamentHref(s.tournament.id)}
                        title={missed ? t("tour.t2routeMissed") : undefined}
                        className={`t2-route-card relative ${clustered ? "is-cluster" : ""} ${isNext ? "ring-2 ring-[var(--t2-accent)] ring-offset-2 ring-offset-[var(--t2-card)]" : ""} ${missed ? "border-[var(--t2-state-deadline-missed)]" : ""}`}
                      >
                        {missed && (
                          <span
                            aria-label={t("tour.t2routeMissed")}
                            className="absolute right-1.5 top-1.5 inline-flex h-2 w-2 rounded-full bg-[var(--t2-state-deadline-missed)]"
                          />
                        )}
                        <p className="t2-fs-meta font-semibold tabular-nums text-[var(--t2-muted)]">{fmtDate(s.tournament.tournament_monday)}</p>
                        <p className="mt-1 t2-fs-meta font-semibold uppercase tracking-[0.12em] text-[var(--t2-faint)]">{s.tournament.category || "—"}</p>
                        <p className="mt-1 truncate t2-fs-body font-semibold">{displayCity(s.tournament.city) || t("tour.fieldMissing")}</p>
                        <p className="mt-0.5 truncate t2-fs-micro text-[var(--t2-muted)]">
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

      {/* ZONE C — Nächste Aktion (nur wenn eine offene Meldefrist existiert) */}
      {nextDeadline && (
        <section
          className="t2-dash-card mt-6 border-l-[3px]"
          style={{ borderLeftColor: "var(--t2-accent)" }}
        >
          <p className="t2-fs-body font-medium text-[var(--t2-ink)]">{t("tour.t2ovActionTitle")}</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="t2-fs-display font-semibold tracking-[-0.02em]">
                {t("tour.t2ovActionEntry", { name: displayCity(nextDeadline.tournament.city) || t("tour.fieldMissing") })}
              </p>
              {nextEntryDeadlineMs != null && (
                <p className="mt-1 t2-fs-body-sm text-[var(--t2-muted)]">{countdown(nextEntryDeadlineMs)}</p>
              )}
            </div>
            <Link href={tour2PlannerTournamentHref(nextDeadline.tournament.id)} className="t2-cta">
              {t("tour.t2ovActionCTA")}<span aria-hidden>→</span>
            </Link>
          </div>
        </section>
      )}

      {/* ZONE D — Zwei Nebenblöcke: Punkte/Ranking · Finanzen/Budget */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {/* Links: Punkte & Ranking */}
        <section className="t2-dash-card">
          <h2 className="t2-fs-body font-medium text-[var(--t2-ink)]">{t("tour.t2ovBucketPoints")}</h2>
          {resultHistory.length === 0 ? (
            // Ruhiger Leerzustand: kein hero-großes „keine Ergebnisse erfasst",
            // stattdessen eine erklärende Zeile + bestehender Erfassungs-Link.
            <>
              <p className="mt-3 t2-fs-body-sm leading-relaxed text-[var(--t2-muted)]">{t("tour.t2ovPointsHollow")}</p>
              <Link href={T2_RANKING} className="mt-3 inline-block t2-fs-body-sm font-semibold text-[var(--t2-accent)]">
                {t("tour.t2ovPointsEmptyHint")} →
              </Link>
            </>
          ) : (
            <>
              <div className="mt-3 flex items-baseline justify-between gap-4">
                <div className="t2-fs-display font-semibold tabular-nums tracking-[-0.03em]">
                  {pointsNow.countingTotal}
                </div>
                {pointsDelta != null && (
                  <span className={`t2-fs-body-sm font-semibold tabular-nums ${pointsDelta > 0 ? "text-[var(--t2-success)]" : pointsDelta < 0 ? "text-[var(--t2-danger)]" : "text-[var(--t2-muted)]"}`}>
                    {deltaArrow} {pointsDelta > 0 ? `+${pointsDelta}` : pointsDelta}
                  </span>
                )}
              </div>
              <p className="mt-1 t2-fs-meta font-semibold uppercase tracking-[0.16em] text-[var(--t2-faint)]">{t("tour.t2ovPoints")}</p>
              <div className="mt-5">
                <p className="t2-fs-body-sm font-medium text-[var(--t2-muted)]">{t("tour.t2ovHorizon")}</p>
                <ul className="mt-2 divide-y divide-[var(--t2-line)] t2-fs-body-sm">
                  {[4, 8, 12].map((w) => (
                    <li key={w} className="flex justify-between py-1.5">
                      <span className="text-[var(--t2-muted)]">{t("tour.t2ovHorizonW", { n: w })}</span>
                      <span className="tabular-nums font-semibold">{step(w)?.total ?? "—"}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {nextDrop && (
                <div className="mt-5">
                  <p className="t2-fs-body-sm font-medium text-[var(--t2-muted)]">{t("tour.t2ovDropping")}</p>
                  <p className="mt-1 t2-fs-body">
                    <span className="font-semibold tabular-nums">{nextDrop.points}</span>
                    <span className="ml-2 text-[var(--t2-muted)]">{t("tour.t2ovOn", { date: fmtDate(nextDrop.expiresOn) })}</span>
                  </p>
                </div>
              )}
            </>
          )}
          {board.actions.length > (nextDeadline ? 1 : 0) && (
            <div className="mt-5 border-t border-[var(--t2-line)] pt-4">
              <p className="t2-fs-body-sm font-medium text-[var(--t2-muted)]">{t("tour.t2action")}</p>
              <div className="mt-2">
                <Tour2ActionList
                  actions={nextDeadline ? board.actions.slice(1) : board.actions}
                  countryName={countryName}
                  fmtDate={fmtDate}
                  money={(minor) => money(minor)}
                />
              </div>
            </div>
          )}
        </section>

        {/* Rechts: Finanzen & Budget */}
        <section className="t2-dash-card">
          <h2 className="t2-fs-body font-medium text-[var(--t2-ink)]">{t("tour.t2ovBucketFinance")}</h2>
          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              {budget ? (
                <>
                  <div className="t2-fs-display font-semibold tabular-nums tracking-[-0.03em]">
                    {money(budget.amount)}
                  </div>
                  <p className="mt-1 t2-fs-meta font-semibold uppercase tracking-[0.16em] text-[var(--t2-faint)]">{t("tour.t2ovBudgetTotal")}</p>
                </>
              ) : (
                // Kein Budget gepflegt → kein Platzhalter, nur die Erklärung.
                <p className="t2-fs-body-sm text-[var(--t2-muted)]">{t("tour.t2budgetNoData")}</p>
              )}
              {budget && usedMinor == null && <p className="mt-2 t2-fs-body-sm text-[var(--t2-muted)]">{t("tour.t2ovBudgetRatesMissing")}</p>}
              {leftMinor != null && (
                <p className={`mt-2 t2-fs-body-sm ${leftMinor < 0 ? "text-[var(--t2-danger)]" : "text-[var(--t2-muted)]"}`}>
                  {t("tour.t2ovBudgetLeft", { n: money(leftMinor) })}
                </p>
              )}
            </div>
            {budget && usedMinor != null && <Donut parts={budgetRing} />}
          </div>
          {usedMinor != null && (
            <ul className="mt-5 divide-y divide-[var(--t2-line)] t2-fs-body-sm">
              {(["arrival", "lodging", "food", "coach", "entry"] as ItemCode[]).map((code) => {
                const n = costByCode[code];
                if (!n) return null;
                return (
                  <li key={code} className="flex justify-between py-1.5">
                    <span className="text-[var(--t2-muted)]">{t(`tour.costsItem_${code}`)}</span>
                    <span className="tabular-nums font-semibold">{money(n)}</span>
                  </li>
                );
              })}
            </ul>
          )}
          {insights.length > 0 && (
            <div className="mt-5 space-y-3 border-t border-[var(--t2-line)] pt-4">{insights}</div>
          )}
        </section>
      </div>
    </div>
  );
}
