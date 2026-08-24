"use client";

/**
 * /tour2 Kalender (Etappe 4): Saisonband aus Turnierwochen, kein Stundenraster.
 * Einheit = Mo–So. Offene Wochen bleiben sichtbar (als Rest-Streifen, wenn leer).
 * Etappen dazwischen nur mit belegten Größen. Termine über EventForm.
 */

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT, useLocale } from "@/lib/i18n";
import TourLoginCard from "@/app/tour2/components/TourLoginCard";
import { loadEvents, type TourEvent, type EventKind } from "@/lib/tourEvents";
import { loadSeason, type SeasonEntry } from "@/lib/tourSeason";
import { tourDeadlines } from "@/domain/tour/deadlines";
import { expectedPoints } from "@/domain/tour/points";
import { buildSeasonWeeks, groupTapeWeeks, isoWeekNumber, type SeasonWeek } from "@/domain/tour/seasonWeeks";
import { haversineKm } from "@/lib/utils/haversine";
import EventForm from "@/app/tour2/timeline/components/EventForm";

const BUFFER_KEY = "mu_tour_buffer_days";
const DAY = 86_400_000;
const DOW = ["day_mon", "day_tue", "day_wed", "day_thu", "day_fri", "day_sat", "day_sun"] as const;
type LoadState = "loading" | "error" | "done";

function readBuffer(): number {
  try { const n = parseInt(localStorage.getItem(BUFFER_KEY) ?? "", 10); return Number.isFinite(n) && n >= 0 ? n : 2; } catch { return 2; }
}

function addDaysISO(monday: string, n: number): string {
  return new Date(Date.parse(monday + "T00:00:00Z") + n * DAY).toISOString().slice(0, 10);
}

function sundayISO(monday: string): string {
  return addDaysISO(monday, 6);
}

const KIND_DOT: Record<string, string> = {
  training: "bg-emerald-400",
  match: "bg-violet-400",
  physio: "bg-rose-400",
  travel: "bg-sky-400",
  gym: "bg-amber-400",
  other: "bg-neutral-400",
};

function statusTone(status: string): string {
  if (status === "confirmed" || status === "main_draw" || status === "entered" || status === "qualifying") return "bg-emerald-50 text-emerald-800";
  if (status === "alternate") return "bg-amber-50 text-amber-800";
  if (status === "withdrawn" || status === "cancelled") return "bg-neutral-100 text-neutral-500 line-through";
  return "bg-sky-50 text-sky-800";
}

function DayStrip({
  monday,
  events,
  isCurrent,
  nowMs,
  tourFill,
  t,
}: {
  monday: string;
  events: { date: string; kind: string }[];
  isCurrent: boolean;
  nowMs: number;
  tourFill: boolean;
  t: (k: string) => string;
}) {
  const today = new Date(nowMs).toISOString().slice(0, 10);
  return (
    <div className="mt-3 grid grid-cols-7 gap-1">
      {DOW.map((key, i) => {
        const date = addDaysISO(monday, i);
        const hits = events.filter((e) => e.date === date);
        const on = isCurrent && date === today;
        return (
          <div
            key={key}
            className={`border px-0.5 py-1.5 text-center ${tourFill ? "border-black/20" : "border-black/10"} ${on ? "border-matchup" : ""}`}
          >
            <p className={`text-[9px] font-bold uppercase tracking-wide ${on ? "text-neutral-900" : "text-neutral-500"}`}>{t(`tour.${key}`)}</p>
            <div className="mt-1.5 flex h-1.5 items-center justify-center gap-0.5">
              {hits.length > 0 ? hits.slice(0, 3).map((e, idx) => (
                <span key={idx} className={`h-1.5 w-1.5 rounded-full ${KIND_DOT[e.kind] ?? KIND_DOT.other}`} />
              )) : (
                <span className={`h-1 w-1 rounded-full ${tourFill ? "bg-black/20" : "bg-black/10"}`} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function CalendarTape() {
  const { user, loading: authLoading } = useAuth();
  const t = useT();
  const { locale } = useLocale();
  const loc = locale === "de" ? "de-CH" : "en-GB";

  const [events, setEvents] = useState<TourEvent[]>([]);
  const [season, setSeason] = useState<SeasonEntry[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [nowMs] = useState(() => Date.now());
  const [openForm, setOpenForm] = useState<{ event: TourEvent | null; date: string; kind?: EventKind } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [openedRest, setOpenedRest] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const jumped = useRef(false);

  const reload = useCallback(async () => {
    if (!user) return;
    const [ev, s] = await Promise.all([loadEvents(user.id), loadSeason()]);
    setEvents(ev.rows);
    setSeason(s);
  }, [user]);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancel = false;
    setState("loading");
    Promise.all([loadEvents(user.id), loadSeason()])
      .then(([ev, s]) => { if (!cancel) { setEvents(ev.rows); setSeason(s); setState("done"); } })
      .catch(() => { if (!cancel) setState("error"); });
    return () => { cancel = true; };
  }, [authLoading, user]);

  const active = useMemo(() => season.filter((s) => !s.tournamentInactive), [season]);
  const catName = useCallback((c: string | null) => (c ? (t(`tour.country.${c}`).startsWith("tour.country.") ? c : t(`tour.country.${c}`)) : "—"), [t]);
  const fmtRange = (monday: string, endMonday?: string) => {
    const a = new Date(monday + "T00:00:00Z");
    const b = new Date(sundayISO(endMonday ?? monday) + "T00:00:00Z");
    const da = new Intl.DateTimeFormat(loc, { day: "numeric", month: "short", timeZone: "UTC" }).format(a);
    const db = new Intl.DateTimeFormat(loc, { day: "numeric", month: "short", timeZone: "UTC" }).format(b);
    return `${da} – ${db}`;
  };
  const monthOf = (monday: string) => new Intl.DateTimeFormat(loc, { month: "long", timeZone: "UTC" }).format(new Date(monday + "T00:00:00Z"));

  const weeks = useMemo(() => {
    const tournaments = active.map((s) => {
      const dl = tourDeadlines(new Date(s.tournament.tournament_monday + "T00:00:00Z"), s.tournament.series, s.tournament.category);
      return {
        id: s.tournament.id,
        monday: s.tournament.tournament_monday,
        city: s.tournament.city,
        country: s.tournament.country,
        category: s.tournament.category,
        series: s.tournament.series,
        status: s.status,
        deadlineKnown: dl.known,
        deadlineMs: dl.entry ? dl.entry.getTime() : null,
      };
    });
    return buildSeasonWeeks({
      nowMs,
      tournaments,
      events: events.map((e) => ({ id: e.id, kind: e.kind, title: e.title, date: e.event_date, time: e.event_time })),
      bufferDays: readBuffer(),
    });
  }, [active, events, nowMs]);

  const blocks = useMemo(() => groupTapeWeeks(weeks), [weeks]);
  const byId = useMemo(() => new Map(active.map((s) => [s.tournament.id, s])), [active]);

  const inboundKm = (week: SeasonWeek): number | null => {
    if (!week.inbound) return null;
    const a = byId.get(week.inbound.fromId)?.tournament;
    const b = byId.get(week.inbound.toId)?.tournament;
    if (!a || !b || a.latitude == null || a.longitude == null || b.latitude == null || b.longitude == null) return null;
    if (week.inbound.cluster) return 0;
    return haversineKm(a.latitude, a.longitude, b.latitude, b.longitude);
  };

  useEffect(() => {
    if (state !== "done" || jumped.current || !scroller.current) return;
    const el = scroller.current.querySelector("[data-current='1']") ?? scroller.current.querySelector("[data-has-tour='1']");
    el?.scrollIntoView({ block: "center" });
    jumped.current = true;
  }, [state, weeks]);

  if (authLoading) return <div className="flex h-[calc(100dvh-3.5rem)] items-center justify-center text-sm text-neutral-400">{t("tour.loading")}</div>;
  if (!user) return <TourLoginCard />;
  if (state === "loading") return <p className="p-6 text-sm text-neutral-400">{t("tour.loading")}</p>;
  if (state === "error") return <p className="p-6 text-sm text-neutral-400">{t("tour.loadError")}</p>;

  const hero = weeks.find((w) => w.isCurrent && w.tournaments.length > 0)
    ?? weeks.find((w) => w.tournaments.length > 0 && Date.parse(w.monday + "T00:00:00Z") + 6 * DAY >= nowMs)
    ?? weeks.find((w) => w.isCurrent)
    ?? weeks[0];
  const heroTour = hero?.tournaments[0];
  const heroPts = heroTour ? expectedPoints(heroTour.category, "R16", heroTour.monday).points : 0;
  const dlDays = heroTour?.deadlineKind === "upcoming" && heroTour.deadlineMs != null
    ? Math.ceil((heroTour.deadlineMs - nowMs) / DAY)
    : null;

  const deadlineText = (kind: string, ms: number | null) => {
    if (kind === "unknown" || ms == null) return t("tour.t2calDeadlineUnknown");
    if (kind === "passed") return t("tour.t2calDeadlinePassed");
    const d = Math.ceil((ms - nowMs) / DAY);
    if (d <= 0) return t("tour.t2calDeadlineToday");
    return t("tour.t2calDeadlineIn", { n: d });
  };

  const weekActions = (w: SeasonWeek) => (
    <div className="mt-2 flex flex-wrap gap-2 px-1">
      <button type="button" onClick={() => setOpenForm({ event: null, date: w.monday, kind: "training" })} className="rounded-full border border-black/15 bg-white px-3.5 py-1.5 text-[12px] font-bold text-neutral-900">
        + {t("tour.t2calAdd")}
      </button>
      {w.events.map((e) => {
        const full = events.find((x) => x.id === e.id);
        if (!full) return null;
        return (
          <button key={e.id} type="button" onClick={() => setOpenForm({ event: full, date: e.date })} className="rounded-full border border-black/10 bg-neutral-50 px-3 py-1.5 text-[12px] font-semibold text-neutral-800">
            {e.title}
          </button>
        );
      })}
      {w.tournaments[0] && (
        <Link href="/tour2/planner" className="rounded-full px-3 py-1.5 text-[12px] font-semibold text-matchup">{t("tour.t2navSeason")} →</Link>
      )}
    </div>
  );

  const renderWeekCard = (w: SeasonWeek) => {
    const tours = w.tournaments;
    const tour = tours[0];
    const km = inboundKm(w);
    const open = tours.length === 0;
    return (
      <li key={w.monday} data-monday={w.monday} data-current={w.isCurrent ? "1" : undefined} data-has-tour={tour ? "1" : undefined}>
        {w.inbound && (
          <div className={`ml-6 border-l-2 py-3 pl-5 text-[11px] leading-snug ${w.inbound.tight ? "border-amber-600 text-amber-800" : "border-black/15 text-neutral-500"}`}>
            {w.inbound.cluster ? t("tour.t2legCluster") : (
              <>
                {km != null && km > 0 ? `${t("tour.t2legKm", { n: Math.round(km) })} · ` : ""}
                {w.inbound.tight ? t("tour.t2legTight", { n: w.inbound.restDays }) : t("tour.t2legRest", { n: w.inbound.restDays })}
              </>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={() => setExpanded((x) => x === w.monday ? null : w.monday)}
          className={`w-full border p-4 text-left transition-colors ${
            w.isCurrent ? "border-neutral-900 bg-neutral-50" : open ? "border-black/10 bg-white" : "border-matchup bg-white"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-500">
                {t("tour.t2calWeek", { n: isoWeekNumber(w.monday) })}
                {w.isCurrent ? ` · ${t("tour.t2calNow")}` : ""}
              </p>
              {tour ? (
                <>
                  <p className="mt-1 truncate t2-display text-[1.4rem] normal-case tracking-[-0.03em]">{tour.city || t("tour.fieldMissing")}</p>
                  <p className="text-[12px] text-neutral-500">{fmtRange(w.monday)} · {catName(tour.country)} · {tour.category || "—"}</p>
                  {tours.slice(1).map((x) => (
                    <p key={x.id} className="text-[12px] text-neutral-500">{x.city || t("tour.fieldMissing")} · {x.category || "—"}</p>
                  ))}
                  <p className={`mt-2 text-[12px] font-semibold ${tour.deadlineKind === "upcoming" ? "text-amber-800" : "text-neutral-500"}`}>
                    {deadlineText(tour.deadlineKind, tour.deadlineMs)}
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-1 text-[16px] font-bold text-neutral-500">{t("tour.t2calOpen")}</p>
                  <p className="text-[12px] text-neutral-500">{fmtRange(w.monday)} · {t("tour.t2calRecovery")}</p>
                </>
              )}
            </div>
            {tour && (
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${statusTone(tour.status)}`}>
                {t(`tour.status_${tour.status}`)}
              </span>
            )}
          </div>
          <DayStrip monday={w.monday} events={w.events} isCurrent={w.isCurrent} nowMs={nowMs} tourFill={!open} t={t} />
          {w.events.length > 0 && (
            <ul className="mt-3 space-y-1">
              {w.events.slice(0, expanded === w.monday ? 99 : 3).map((e) => (
                <li key={e.id} className="flex items-center gap-2 text-[12px] text-neutral-600">
                  <span className={`h-1.5 w-1.5 rounded-full ${KIND_DOT[e.kind] ?? KIND_DOT.other}`} />
                  <span className="truncate">{e.time ? `${String(e.time).slice(0, 5)} · ` : ""}{e.title}</span>
                </li>
              ))}
            </ul>
          )}
        </button>
        {expanded === w.monday && weekActions(w)}
      </li>
    );
  };

  let lastMonth = "";

  return (
    <div className="relative flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden bg-[var(--t2-paper)] text-[var(--t2-ink)]">
      {hero && (
        <header className="relative shrink-0 border-b border-[var(--t2-line)] px-4 py-5 sm:px-6">
          <div className="relative flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="t2-kicker">
                {heroTour && !hero.isCurrent ? t("tour.t2calHeroNext") : hero.isCurrent ? t("tour.t2thisWeek") : t("tour.t2calWeek", { n: isoWeekNumber(hero.monday) })}
              </p>
              {heroTour ? (
                <>
                  <h1 className="t2-display mt-2 truncate text-[clamp(2.2rem,6vw,4.2rem)]">
                    {heroTour.city || t("tour.fieldMissing")}
                  </h1>
                  <p className="mt-2 text-[14px] text-[var(--t2-muted)]">
                    {catName(heroTour.country)} · {fmtRange(hero.monday)} · {heroTour.category || "—"}
                    {heroPts > 0 ? ` · ${t("tour.t2ptsAssume", { n: heroPts })}` : ""}
                  </p>
                </>
              ) : (
                <>
                  <h1 className="t2-display mt-2 text-[clamp(2.2rem,6vw,4.2rem)]">{t("tour.t2calOpen")}</h1>
                  <p className="mt-2 text-[14px] text-[var(--t2-muted)]">{fmtRange(hero.monday)} · {t("tour.t2calRecovery")}</p>
                </>
              )}
            </div>
            {dlDays != null && dlDays > 0 && (
              <div className="shrink-0 text-right">
                <p className="t2-display text-[2.6rem] leading-none sm:text-[3.2rem]">{dlDays}</p>
                <p className="t2-kicker mt-2 max-w-[7rem] leading-tight">
                  {dlDays === 1 ? t("tour.t2calDlDay") : t("tour.t2calDlDays")}
                </p>
              </div>
            )}
          </div>
          {hero && (
            <DayStrip monday={hero.monday} events={hero.events} isCurrent={hero.isCurrent} nowMs={nowMs} tourFill={!!heroTour} t={t} />
          )}
        </header>
      )}

      <div className="no-scrollbar shrink-0 overflow-x-auto border-b border-black/10 px-3 py-2">
        <div className="flex gap-1">
          {weeks.map((w) => {
            const on = w.isCurrent;
            const filled = w.tournaments.length > 0;
            const city = w.tournaments[0]?.city;
            return (
              <button
                key={w.monday}
                type="button"
                onClick={() => document.querySelector(`[data-monday="${w.monday}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" })}
                className={`flex min-w-[3.4rem] flex-col items-center border px-2 py-1.5 ${on ? "border-matchup bg-matchup text-white" : filled ? "border-matchup text-[var(--t2-ink)]" : "border-[var(--t2-line)] text-[var(--t2-muted)]"}`}
              >
                <span className="text-[10px] font-bold">{t("tour.t2calWeek", { n: isoWeekNumber(w.monday) })}</span>
                {filled && city ? (
                  <span className={`mt-0.5 max-w-[3rem] truncate text-[8px] font-semibold ${on ? "text-white/80" : "text-matchup"}`}>{city}</span>
                ) : filled ? (
                  <span className="mt-0.5 h-1 w-1 rounded-full bg-matchup" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 pb-28 sm:px-6">
        {weeks.length === 1 && weeks[0].tournaments.length === 0 && weeks[0].events.length === 0 && (
          <p className="mb-6 border border-black/10 px-4 py-5 text-[13px] leading-relaxed text-neutral-500">{t("tour.t2calEmpty")}</p>
        )}

        <ol className="space-y-0">
          {blocks.map((block) => {
            if (block.kind === "rest") {
              const first = block.weeks[0];
              const last = block.weeks[block.weeks.length - 1];
              const open = openedRest === first.monday;
              const label = block.weeks.length === 1 ? t("tour.t2calRestWeek") : t("tour.t2calRestWeeks", { n: block.weeks.length });
              const month = monthOf(first.monday);
              const showMonth = month !== lastMonth;
              lastMonth = monthOf(last.monday);
              return (
                <li key={`rest-${first.monday}`}>
                  {block.weeks.map((w) => (
                    <div key={w.monday} data-monday={w.monday} className="h-0 overflow-hidden" />
                  ))}
                  {showMonth && <p className="mb-2 mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-500 first:mt-0">{month}</p>}
                  <button
                    type="button"
                    onClick={() => setOpenedRest((x) => x === first.monday ? null : first.monday)}
                    className="flex w-full items-center justify-between border border-black/10 bg-white px-4 py-3 text-left"
                  >
                    <span className="text-[13px] font-semibold text-neutral-400">{label}</span>
                    <span className="text-[11px] text-neutral-500">{fmtRange(first.monday, last.monday)}</span>
                  </button>
                  {open && (
                    <ul className="mt-2 space-y-2">
                      {block.weeks.map((w) => renderWeekCard(w))}
                    </ul>
                  )}
                </li>
              );
            }
            const month = monthOf(block.week.monday);
            const showMonth = month !== lastMonth;
            lastMonth = month;
            return (
              <Fragment key={`wrap-${block.week.monday}`}>
                {showMonth && (
                  <li className="mb-2 mt-5 list-none">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-500">{month}</p>
                  </li>
                )}
                {renderWeekCard(block.week)}
              </Fragment>
            );
          })}
        </ol>

        <p className="mt-8 text-center">
          <Link href="/tour2/timeline" className="text-[12px] font-semibold text-neutral-500 hover:text-neutral-300">{t("tour.t2calTracks")} →</Link>
        </p>
      </div>

      {openForm && user && (
        <div className="absolute inset-0 z-[80] flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={() => setOpenForm(null)}>
          <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <EventForm
              event={openForm.event}
              season={season}
              userId={user.id}
              defaultDate={openForm.date}
              defaultKind={openForm.kind}
              onDone={() => { setOpenForm(null); void reload().then(() => setState("done")); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
