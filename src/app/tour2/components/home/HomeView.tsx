"use client";

/**
 * /tour2 Home — Einstieg: nächstes Turnier (Kalender-Day-Typo), Handlungsbedarf
 * als klickbare Textliste, nächste acht Wochen. Action Board mit denselben Quellen
 * wie der Planer (Dokumente, Schengen, Punkte, Wildcards, Visa-Vorlauf, Sperren).
 * Domain-Routen /tour/* werden hier auf /tour2/* gemappt.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
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
import type { TourCostRates, TourEntryEvent, TourTravelDocument } from "@/lib/types";
import { computeSeasonCost } from "@/domain/tour/costs";
import { expectedPoints } from "@/domain/tour/points";
import { tourDeadlines } from "@/domain/tour/deadlines";
import { documentWarnings } from "@/domain/tour/documentWarnings";
import { visaLeadWarnings } from "@/domain/tour/visaLeadWarnings";
import { pointsForecast } from "@/domain/tour/pointsForecast";
import { schengenUsage, isSchengenCode, type Stay } from "@/domain/tour/schengen";
import { buildActionBoard, type BoardTournament } from "@/domain/tour/actionBoard";
import { buildPipeline } from "@/domain/tour/pipeline";
import { tour2PlannerTournamentHref } from "@/app/tour2/components/t2Action";
import { loadSetupState, type SetupState } from "@/lib/tourSetup";
import { SETUP_SKIP_KEY } from "@/lib/tourOptPrefs";
import SetupPanel from "@/app/tour2/components/setup/SetupPanel";
import Tour2ActionList from "@/app/tour2/components/Tour2ActionList";

const DAY = 86_400_000;
const NIGHTS_KEY = "mu_tour_nights";
type LoadState = "loading" | "error" | "done";

function groupEventsByPlan(evs: TourEntryEvent[]): Map<string, TourEntryEvent[]> {
  const m = new Map<string, TourEntryEvent[]>();
  for (const e of evs) { const a = m.get(e.plan_id); if (a) a.push(e); else m.set(e.plan_id, [e]); }
  return m;
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
  const [setup, setSetup] = useState<SetupState | null>(null);
  const [forceHome, setForceHome] = useState(() => {
    try { return localStorage.getItem(SETUP_SKIP_KEY) === "1"; } catch { return false; }
  });
  const [banned, setBanned] = useState<Set<string>>(new Set());
  const [stays, setStays] = useState<Stay[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [nowMs] = useState(() => Date.now());

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
    ])
      .then(([s, p, r, evs, pdocs, rhist, wcs, tdocs, st]) => {
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
        setState("done");
      })
      .catch(() => { if (!cancel) setState("error"); });
    return () => { cancel = true; };
  }, [authLoading, user]);

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

  const active = useMemo(() => season.filter((s) => !s.tournamentInactive), [season]);
  const cur = rates?.currency ?? "EUR";
  const money = useCallback((minor: number) => new Intl.NumberFormat(loc, { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(minor / 100), [loc, cur]);
  const countryName = useCallback((c: string | null) => (c && !t(`tour.country.${c}`).startsWith("tour.country.") ? t(`tour.country.${c}`) : (c ?? "")), [t]);
  const mondayMs = (iso: string) => Date.parse(iso + "T00:00:00Z");
  const fmtDate = (iso: string) => new Intl.DateTimeFormat(loc, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z"));

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

  const next = useMemo(() => {
    const withMs = active.map((s) => ({ s, ms: mondayMs(s.tournament.tournament_monday) })).sort((a, b) => a.ms - b.ms);
    return withMs.find((x) => x.ms + 6 * DAY >= nowMs)?.s ?? null;
  }, [active, nowMs]);

  // Nächste noch offene Meldefrist — speist die Pass-Faustregel (wie Planer).
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
    const f = pointsForecast(toMatchResults(resultHistory), todayISO);
    const soon4 = f.steps.find((x) => x.weeks === 4)?.expiring[0] ?? null;
    const points = resultHistory.length
      ? {
          total: f.currentTotal,
          nextExpiry: f.schedule[0] ? { date: f.schedule[0].expiresOn, points: f.schedule[0].points } : null,
          expiringSoon: soon4 ? { date: soon4.expiresOn, points: soon4.points } : null,
        }
      : null;
    const visaLead = visaLeadWarnings({
      asOf: todayISO,
      tournaments: season.map((s) => ({ id: s.tournament.id, city: s.tournament.city, country: s.tournament.country, monday: s.tournament.tournament_monday })),
      docs: travelDocs.map((d) => ({ scope: d.scope, status: d.status, valid_until: d.valid_until, lead_weeks: d.lead_weeks })),
    });
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
  }, [season, eventsByPlan, resultHistory, todayISO, travelDocs, banned, docWarnings, schengen, wildcards, overMinor, cur]);

  const weeks = useMemo(() => buildPipeline(active.map((s) => ({ id: s.tournament.id, city: s.tournament.city, country: s.tournament.country, category: s.tournament.category, monday: s.tournament.tournament_monday })), new Date(nowMs)).slice(0, 8), [active, nowMs]);

  const deadlineText = (s: SeasonEntry): string | null => {
    const dl = tourDeadlines(new Date(s.tournament.tournament_monday + "T00:00:00Z"), s.tournament.series, s.tournament.category);
    if (!dl.known || !dl.entry) return t("tour.entryUnknownShort");
    const ms = dl.entry.getTime();
    if (ms <= nowMs) return t("tour.entryExpired");
    const d = Math.ceil((ms - nowMs) / DAY);
    return t("tour.entryCountdown", { n: d });
  };

  const dm = (iso: string) => {
    const x = new Date(iso + "T00:00:00Z");
    return { dd: String(x.getUTCDate()).padStart(2, "0"), mm: String(x.getUTCMonth() + 1).padStart(2, "0") };
  };

  if (authLoading || state === "loading") return <p className="p-6 text-sm text-[var(--t2-muted)]">{t("tour.loading")}</p>;
  if (!user) return <TourLoginCard />;
  if (state === "error") return <p className="p-6 text-sm text-[var(--t2-muted)]">{t("tour.loadError")}</p>;

  const needsOnboarding = !!setup && !setup.complete && active.length === 0 && !forceHome;
  if (needsOnboarding) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-8 pb-28 sm:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-matchup">Matchup Tour</p>
        <h1 className="mt-2 text-[clamp(1.8rem,5vw,2.6rem)] font-black uppercase leading-[0.9] tracking-[-0.04em]">{t("tour.t2onbHello")}</h1>
        <SetupPanel onExit={() => setForceHome(true)} />
      </div>
    );
  }

  const nextCity = next ? (next.tournament.city || next.tournament.name || t("tour.fieldMissing")) : null;
  const nextDm = next ? dm(next.tournament.tournament_monday) : null;
  const nextMeta = next
    ? [
        next.tournament.country ? countryName(next.tournament.country) : null,
        next.tournament.category || null,
        t(`tour.status_${next.status}`),
        deadlineText(next),
      ].filter(Boolean).join(" · ")
    : "";

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 pb-28 sm:px-8 md:pb-12">
      {next && nextDm ? (
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-matchup">{t("tour.t2next")}</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
            <h1 className="min-w-0 text-[clamp(2.4rem,8vw,5rem)] font-black uppercase leading-[0.88] tracking-[-0.04em]">{nextCity}</h1>
            <p className="shrink-0 text-[clamp(2.4rem,8vw,5rem)] font-black leading-none tracking-[-0.05em] tabular-nums" aria-hidden>
              {nextDm.dd}<span className="text-matchup">.</span>{nextDm.mm}
            </p>
          </div>
          <p className="mt-3 text-[14px] text-[var(--t2-muted)]">{nextMeta}</p>
          <Link href={tour2PlannerTournamentHref(next.tournament.id)} className="mt-6 inline-block text-[12px] font-semibold uppercase tracking-[0.16em] text-matchup">{t("tour.t2navSeason")} →</Link>
        </section>
      ) : (
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-matchup">{t("tour.t2next")}</p>
          <h1 className="mt-3 text-[clamp(2.4rem,8vw,5rem)] font-black uppercase leading-[0.88] tracking-[-0.04em]">{t("tour.t2noNext")}</h1>
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
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-matchup">{t("tour.t2action")}</h2>
        <Tour2ActionList
          actions={board.actions}
          countryName={countryName}
          fmtDate={fmtDate}
          money={(minor) => money(minor)}
        />
      </section>

      <section className="mt-10">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-matchup">{t("tour.t2next8")}</h2>
        {weeks.length === 0 ? (
          <p className="mt-4 text-[14px] text-[var(--t2-muted)]">{t("tour.t2noSeason")}</p>
        ) : (
          <div className="mt-4 divide-y divide-black/10 border-y border-black/10">
            {weeks.map((w) => {
              const it = w.items[0];
              const d = dm(w.monday);
              return (
                <Link key={w.monday} href={it ? tour2PlannerTournamentHref(it.id) : "/tour2/planner"} className="flex items-baseline justify-between gap-4 py-4 hover:text-matchup">
                  <span className="flex min-w-0 items-baseline gap-4">
                    <span className="w-14 shrink-0 font-semibold tabular-nums text-[var(--t2-muted)]">{d.dd}.{d.mm}</span>
                    {it ? (
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] font-semibold tracking-tight">{it.city || t("tour.fieldMissing")}</span>
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
