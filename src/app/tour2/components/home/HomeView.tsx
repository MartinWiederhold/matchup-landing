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
import SeasonMap, { type SeasonStop, type SeasonStopState } from "@/app/tour2/components/home/SeasonMap";
import SeasonTimeline from "@/app/tour2/components/home/SeasonTimeline";
import { RouteStop, Drawer, EmptyState } from "@/app/tour2/components/ui";
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
      <p className="t2-label">{label}</p>
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
  // Zone-B-Interaktion: hoveredStopId verbindet die Zeitachse mit der Karte,
  // selectedStopId öffnet die Detailschublade für einen Turnierstop.
  const [hoveredStopId, setHoveredStopId] = useState<string | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
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
        tournamentName: displayCity(byId.get(wc.tournament_id)?.tournament.city) || "—",
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
      out.push({ id: s.tournament.id, city: displayCity(s.tournament.city) || s.tournament.name || "—", ms, known: true });
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
          city: displayCity(active[i].tournament.city) || "—",
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

  // Zustands-Bestimmung je Stop — dieselbe Logik für Karte, Zeitachse und
  // RouteStop-Karten. Priorität: missed > current > past > planned.
  const stateForStop = (id: string, monday: string): SeasonStopState => {
    if (missedEntryIds.has(id)) return "missed";
    if (nextStop?.tournament.id === id) return "current";
    if (monday < todayISO) return "past";
    return "planned";
  };

  // Karte: nur Stops mit Koordinaten (Marker brauchen lat/lng).
  const mapStops: SeasonStop[] = useMemo(() => active
    .filter((s) => s.tournament.latitude != null && s.tournament.longitude != null)
    .map((s) => ({
      id: s.tournament.id,
      city: displayCity(s.tournament.city) || s.tournament.name || "—",
      countryCode: s.tournament.country,
      category: s.tournament.category,
      monday: s.tournament.tournament_monday,
      latitude: s.tournament.latitude as number,
      longitude: s.tournament.longitude as number,
      state: stateForStop(s.tournament.id, s.tournament.tournament_monday),
    })), [active, missedEntryIds, nextStop?.tournament.id, todayISO]);

  // Zeitachse und Stop-Karten dürfen auch Stops ohne Koordinaten enthalten
  // (nur die Karte braucht sie zwingend). Reiht sich in dieselbe SeasonStop-
  // Form ein — lat/lng werden dort ignoriert.
  const timelineStops: SeasonStop[] = useMemo(() => active.map((s) => ({
    id: s.tournament.id,
    city: displayCity(s.tournament.city) || s.tournament.name || "—",
    countryCode: s.tournament.country,
    category: s.tournament.category,
    monday: s.tournament.tournament_monday,
    latitude: (s.tournament.latitude as number) ?? 0,
    longitude: (s.tournament.longitude as number) ?? 0,
    state: stateForStop(s.tournament.id, s.tournament.tournament_monday),
  })), [active, missedEntryIds, nextStop?.tournament.id, todayISO]);

  // Für die Detailschublade: das ausgewählte Turnier und sein Vorgänger.
  const selectedIndex = selectedStopId ? active.findIndex((s) => s.tournament.id === selectedStopId) : -1;
  const selectedEntry = selectedIndex >= 0 ? active[selectedIndex] : null;
  const prevEntry = selectedIndex > 0 ? active[selectedIndex - 1] : null;

  // Distanz zum vorherigen Stop, wenn beide Koordinaten haben — sonst weglassen.
  const drawerDistanceKm: number | null = (() => {
    if (!selectedEntry || !prevEntry) return null;
    const a = prevEntry.tournament, b = selectedEntry.tournament;
    if (a.latitude == null || a.longitude == null || b.latitude == null || b.longitude == null) return null;
    if (a.latitude === b.latitude && a.longitude === b.longitude) return null;
    return haversineKm(a.latitude, a.longitude, b.latitude, b.longitude);
  })();

  // Meldefrist-Countdown für die Detailschublade (nutzt die vorhandene
  // deadlineCountdown-Funktion — dieselbe Rechnung wie Zone C und Action-Liste).
  const drawerDeadlineMs: number | null = (() => {
    if (!selectedEntry) return null;
    const dl = tourDeadlines(new Date(selectedEntry.tournament.tournament_monday + "T00:00:00Z"), selectedEntry.tournament.series, selectedEntry.tournament.category);
    return dl.entry ? dl.entry.getTime() : null;
  })();

  // Beschriftungen für RouteStop-Karten (Baukasten-Baustein braucht die
  // vier Zustandstexte als Prop, damit er selbst keinen Text festhält).
  const routeStopLabels = {
    past: t("tour.t2ovStopPast"),
    current: t("tour.t2ovStopCurrent"),
    planned: t("tour.t2ovStopPlanned"),
    missed: t("tour.t2ovStopMissed"),
  };

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
    { n: Math.max(0, leftMinor ?? 0), color: "var(--t2-chart-5)" },
  ];
  // Diagramm-Palette aus Etappe 2a: fünf abgestimmte Töne, letzter (chart-5)
  // dient als Rest/Untergrund. Belag-Verteilung durchläuft chart-1..chart-4.
  const surfRing = dists.surfItems.map((x, i) => ({
    n: x.n,
    color: ["var(--t2-chart-1)", "var(--t2-chart-2)", "var(--t2-chart-3)", "var(--t2-chart-4)"][i] ?? "var(--t2-chart-5)",
  }));

  const insights: ReactNode[] = [];
  if (cpp != null && finance.points > 0) {
    insights.push(
      <div key="cpp">
        <p className="t2-label">{t("tour.t2ovCostPerPoint")}</p>
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

  // ── Cockpit-Redesign: Overview als dunkler, hoch-hierarchischer Screen. ──
  // Struktur: Kopf → EINE nächste Aufgabe (leuchtend) → Karte → Zeitachse →
  // Zahlen-Reihe → zwei Spalten unten. Kindfreundliche, direkte Überschriften.
  const nextActionCity = nextDeadline
    ? (displayCity(nextDeadline.tournament.city) || nextDeadline.tournament.name || t("tour.fieldMissing"))
    : null;

  return (
    <div className="t2-dark">
      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-8 sm:py-12">
        {/* ── 1. KOPF ──────────────────────────────────────────────── */}
        <header>
          <p className="t2-fs-meta font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--t2-text-faint)" }}>
            {t("tour.t2cpSeasonLabel")} · {seasonYear}
          </p>
          <h1 className="mt-2 t2-fs-h1 font-medium tracking-[-0.01em]" style={{ color: "var(--t2-text)" }}>
            {profile?.firstName ? `${t("tour.t2cpHello")}, ${profile.firstName}.` : t("tour.t2cpHello") + "."}
          </h1>
          {profile?.ranking != null && (
            <div className="mt-6 flex items-baseline gap-4">
              <p
                className="t2-cockpit-hero t2-fs-display font-semibold tabular-nums tracking-[-0.04em]"
                style={{ color: "var(--t2-accent)" }}
              >
                #{profile.ranking}
              </p>
              <p className="t2-fs-meta font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--t2-text-faint)" }}>
                {t("tour.t2ovGreetRanking")}
              </p>
            </div>
          )}
        </header>

        {/* ── 2. WAS DU ALS NÄCHSTES TUN MUSST — glühender Slot ────── */}
        {nextDeadline && nextActionCity && (
          <section className="t2-cockpit-cta mt-10 rounded-[var(--t2-radius-md)] p-6 sm:p-8">
            <p className="t2-fs-meta font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--t2-text-faint)" }}>
              {t("tour.t2cpNextAction")}
            </p>
            <div className="mt-3 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="t2-fs-h1 font-medium tracking-[-0.02em]" style={{ color: "var(--t2-text)" }}>
                  {t("tour.t2cpNextActionEntry", { name: nextActionCity })}
                </p>
                {nextEntryDeadlineMs != null && (
                  <p className="mt-2 t2-fs-body-sm" style={{ color: "var(--t2-text-soft)" }}>
                    {countdown(nextEntryDeadlineMs)}
                  </p>
                )}
              </div>
              <Link href={tour2PlannerTournamentHref(nextDeadline.tournament.id)} className="t2-cta shrink-0">
                {t("tour.t2cpNextActionCTA", { name: nextActionCity })}<span aria-hidden>→</span>
              </Link>
            </div>
          </section>
        )}
        {!nextDeadline && active.length > 0 && (
          <section className="mt-10 rounded-[var(--t2-radius-md)] border p-6" style={{ borderColor: "var(--t2-line)", background: "var(--t2-surface)" }}>
            <p className="t2-fs-h3 font-medium" style={{ color: "var(--t2-text)" }}>{t("tour.t2cpNoAction")}</p>
            <p className="mt-2 t2-fs-body-sm" style={{ color: "var(--t2-text-soft)" }}>{t("tour.t2cpNoActionHint")}</p>
          </section>
        )}

        {/* ── 3. KARTE — die Saison als Bühne ─────────────────────── */}
        <section className="mt-10">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="t2-fs-h2 font-medium tracking-[-0.01em]" style={{ color: "var(--t2-text)" }}>
              {t("tour.t2cpMapTitle")}
            </h2>
            {active.length > 0 && (
              <p className="t2-fs-body-sm" style={{ color: "var(--t2-text-soft)" }}>{t("tour.t2cpMapHint")}</p>
            )}
          </div>
          {active.length === 0 ? (
            <div className="mt-4 rounded-[var(--t2-radius-md)] border p-8" style={{ borderColor: "var(--t2-line)", background: "var(--t2-surface)" }}>
              <p className="t2-fs-h3 font-medium" style={{ color: "var(--t2-text)" }}>{t("tour.t2cpEmptyRouteTitle")}</p>
              <p className="mt-2 t2-fs-body-sm" style={{ color: "var(--t2-text-soft)" }}>{t("tour.t2cpEmptyRouteHint")}</p>
              <Link href={T2_SEASON} className="t2-cta mt-6">
                {t("tour.t2cpEmptyRouteCTA")}<span aria-hidden>→</span>
              </Link>
            </div>
          ) : (
            <div className="mt-4">
              <SeasonMap
                stops={mapStops}
                variant="dark"
                heightClass="min-h-[40vh] md:min-h-[55vh]"
                onMarkerClick={setSelectedStopId}
                highlightId={hoveredStopId ?? selectedStopId}
              />
            </div>
          )}
        </section>

        {/* ── 4. ZEITACHSE ────────────────────────────────────────── */}
        {active.length > 0 && (
          <section className="mt-10">
            <h2 className="t2-fs-h2 font-medium tracking-[-0.01em]" style={{ color: "var(--t2-text)" }}>
              {t("tour.t2cpTimelineTitle")}
            </h2>
            <div className="mt-4">
              <SeasonTimeline
                stops={timelineStops}
                todayISO={todayISO}
                locale={loc}
                onSelect={setSelectedStopId}
                onHover={setHoveredStopId}
                highlightId={hoveredStopId ?? selectedStopId}
              />
            </div>
          </section>
        )}

        {/* ── 5. ZAHLEN AUF EINEN BLICK ───────────────────────────── */}
        {headerStats.length > 0 && (
          <section className="mt-10">
            <h2 className="t2-fs-h2 font-medium tracking-[-0.01em]" style={{ color: "var(--t2-text)" }}>
              {t("tour.t2cpStatsTitle")}
            </h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {headerStats.map((s) => (
                <div key={s.key} className="rounded-[var(--t2-radius-md)] border p-4"
                  style={{ borderColor: "var(--t2-line)", background: "var(--t2-surface)" }}>
                  <dt className="t2-fs-meta font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--t2-text-faint)" }}>
                    {s.label}
                  </dt>
                  <dd className="mt-2 truncate t2-fs-h1 font-semibold tabular-nums tracking-[-0.02em]" style={{ color: "var(--t2-text)" }}>
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* ── 6. ZWEI SPALTEN — Fristen · Ausgaben ────────────────── */}
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {/* Fristen */}
          <section className="rounded-[var(--t2-radius-md)] border p-6"
            style={{ borderColor: "var(--t2-line)", background: "var(--t2-surface)" }}>
            <h2 className="t2-fs-h2 font-medium tracking-[-0.01em]" style={{ color: "var(--t2-text)" }}>
              {t("tour.t2cpDeadlinesTitle")}
            </h2>
            {board.actions.length === 0 ? (
              <p className="mt-4 t2-fs-body" style={{ color: "var(--t2-text-soft)" }}>{t("tour.t2cpDeadlinesEmpty")}</p>
            ) : (
              <div className="mt-4">
                <Tour2ActionList
                  actions={board.actions}
                  countryName={countryName}
                  fmtDate={fmtDate}
                  money={(minor) => money(minor)}
                />
              </div>
            )}
          </section>

          {/* Ausgaben — Budget-Balken + Aufschlüsselung */}
          <section className="rounded-[var(--t2-radius-md)] border p-6"
            style={{ borderColor: "var(--t2-line)", background: "var(--t2-surface)" }}>
            <h2 className="t2-fs-h2 font-medium tracking-[-0.01em]" style={{ color: "var(--t2-text)" }}>
              {t("tour.t2cpCostsTitle")}
            </h2>
            {!budget ? (
              <>
                <p className="mt-4 t2-fs-body" style={{ color: "var(--t2-text-soft)" }}>
                  {t("tour.t2cpCostsNoBudget")}
                </p>
                <Link href="/tour2/costs" className="mt-4 inline-flex t2-fs-body-sm font-semibold" style={{ color: "var(--t2-accent)" }}>
                  {t("tour.t2cpCostsSetBudget")} →
                </Link>
              </>
            ) : (
              <>
                <p className="mt-2 t2-fs-body-sm" style={{ color: "var(--t2-text-soft)" }}>{t("tour.t2cpCostsHint")}</p>
                {/* Kernzeile: verplant vs Restbudget */}
                <div className="mt-5 flex items-baseline justify-between gap-4">
                  <div>
                    <p className="t2-fs-h1 font-semibold tabular-nums tracking-[-0.02em]" style={{ color: "var(--t2-text)" }}>
                      {usedMinor != null ? money(usedMinor) : money(0)}
                    </p>
                    <p className="mt-1 t2-fs-meta font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--t2-text-faint)" }}>
                      {t("tour.t2ovBudgetPlanned", { n: "" }).replace(/{n}/g, "").trim() || "verplant"}
                    </p>
                  </div>
                  {leftMinor != null && (
                    <div className="text-right">
                      <p
                        className="t2-fs-h3 font-semibold tabular-nums"
                        style={{ color: leftMinor < 0 ? "var(--t2-danger)" : "var(--t2-text)" }}
                      >
                        {money(leftMinor)}
                      </p>
                      <p className="mt-1 t2-fs-meta font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--t2-text-faint)" }}>
                        {t("tour.t2ovBudgetLeft", { n: "" }).replace(/{n}/g, "").trim() || "übrig"}
                      </p>
                    </div>
                  )}
                </div>
                {/* Ein Balken — dezent leuchtend im Akzent, danger wenn überzogen */}
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--t2-surface-muted)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(0, Math.min(1, (usedMinor ?? 0) / budget.amount)) * 100}%`,
                      background: (leftMinor ?? 0) < 0 ? "var(--t2-danger)" : "var(--t2-accent)",
                      boxShadow: (leftMinor ?? 0) < 0 ? "none" : "var(--t2-accent-glow-sm)",
                      transition: "width 240ms ease",
                    }}
                  />
                </div>
                <p className="mt-2 t2-fs-micro" style={{ color: "var(--t2-text-faint)" }}>
                  {t("tour.t2ovBudgetTotal")} · <span className="tabular-nums">{money(budget.amount)}</span>
                </p>
                {/* Aufschlüsselung */}
                {usedMinor != null && Object.keys(costByCode).length > 0 && (
                  <ul className="mt-5 divide-y t2-fs-body-sm" style={{ borderColor: "var(--t2-line)" } as React.CSSProperties}>
                    {(["arrival", "lodging", "food", "coach", "entry"] as ItemCode[]).map((code) => {
                      const n = costByCode[code];
                      if (!n) return null;
                      return (
                        <li key={code} className="flex justify-between border-t py-2" style={{ borderColor: "var(--t2-line)" }}>
                          <span style={{ color: "var(--t2-text-soft)" }}>{t(`tour.costsItem_${code}`)}</span>
                          <span className="tabular-nums font-semibold" style={{ color: "var(--t2-text)" }}>{money(n)}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {insights.length > 0 && (
                  <div className="mt-5 space-y-3 border-t pt-4" style={{ borderColor: "var(--t2-line)" }}>{insights}</div>
                )}
              </>
            )}
          </section>
        </div>

        {/* Detailschublade — geöffnet von Kartenmarker oder Zeitachse. */}
        {selectedEntry && (
          <Drawer
            open
            onClose={() => setSelectedStopId(null)}
            title={displayCity(selectedEntry.tournament.city) || selectedEntry.tournament.name || t("tour.fieldMissing")}
          >
            <dl className="space-y-4">
              {selectedEntry.tournament.category && (
                <div>
                  <dt className="t2-label">{t("tour.t2ovDrawerCategory")}</dt>
                  <dd className="mt-1 t2-fs-body" style={{ color: "var(--t2-text)" }}>{selectedEntry.tournament.category}</dd>
                </div>
              )}
              <div>
                <dt className="t2-label">{t("tour.t2ovDrawerDate")}</dt>
                <dd className="mt-1 t2-fs-body" style={{ color: "var(--t2-text)" }}>
                  {new Intl.DateTimeFormat(loc, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(selectedEntry.tournament.tournament_monday + "T00:00:00Z"))}
                </dd>
              </div>
              {selectedEntry.tournament.surface && (
                <div>
                  <dt className="t2-label">{t("tour.t2ovDrawerSurface")}</dt>
                  <dd className="mt-1 t2-fs-body" style={{ color: "var(--t2-text)" }}>
                    {t(`tour.surface_${selectedEntry.tournament.surface}`).startsWith("tour.surface_")
                      ? selectedEntry.tournament.surface
                      : t(`tour.surface_${selectedEntry.tournament.surface}`)}
                  </dd>
                </div>
              )}
              {drawerDeadlineMs != null && (
                <div>
                  <dt className="t2-label">{t("tour.t2ovDrawerDeadline")}</dt>
                  <dd className="mt-1 t2-fs-body" style={{ color: "var(--t2-text)" }}>{countdown(drawerDeadlineMs)}</dd>
                </div>
              )}
              {drawerDistanceKm != null && (
                <div>
                  <dt className="t2-label">{t("tour.t2ovDrawerDistancePrev")}</dt>
                  <dd className="mt-1 t2-fs-body tabular-nums" style={{ color: "var(--t2-text)" }}>
                    {t("tour.t2legKm", { n: Math.round(drawerDistanceKm) })}
                  </dd>
                </div>
              )}
              {selectedEntry.tournament.country && (
                <div>
                  <dt className="t2-label">{t("tour.t2ovDrawerCountry")}</dt>
                  <dd className="mt-1 t2-fs-body" style={{ color: "var(--t2-text)" }}>{countryName(selectedEntry.tournament.country)}</dd>
                </div>
              )}
            </dl>
            <Link href={tour2PlannerTournamentHref(selectedEntry.tournament.id)} className="t2-cta mt-6">
              {t("tour.t2cpDrawerOpen", { name: displayCity(selectedEntry.tournament.city) || selectedEntry.tournament.name || "" })}<span aria-hidden>→</span>
            </Link>
          </Drawer>
        )}
      </div>
    </div>
  );
}
