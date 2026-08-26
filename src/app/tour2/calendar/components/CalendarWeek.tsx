"use client";

/**
 * /tour2 Kalender — Day One / Nike: Agenda, keine leere Stundentafel, keine Pastellblöcke.
 * Daten nur Saison + loadEvents.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT, useLocale } from "@/lib/i18n";
import TourLoginCard from "@/app/tour2/components/TourLoginCard";
import { loadEvents, type TourEvent, type EventKind } from "@/lib/tourEvents";
import { loadSeason, type SeasonEntry } from "@/lib/tourSeason";
import { isoWeekNumber } from "@/domain/tour/seasonWeeks";
import EventForm from "@/app/tour2/timeline/components/EventForm";
import { t2markArea } from "@/app/tour2/t2mark";

type LoadState = "loading" | "error" | "done";
type CalView = "day" | "week" | "month";
type CalFilter = "all" | "tournaments" | "events";

const pad = (n: number) => String(n).padStart(2, "0");
const isoToDate = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
const dateToISO = (dt: Date) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
const addDaysISO = (iso: string, n: number) => { const dt = isoToDate(iso); dt.setDate(dt.getDate() + n); return dateToISO(dt); };
const mondayISO = (iso: string) => { const dt = isoToDate(iso); const dow = (dt.getDay() + 6) % 7; dt.setDate(dt.getDate() - dow); return dateToISO(dt); };
const hhmm = (s: string | null | undefined) => (s ? s.slice(0, 5) : "");

function monthCells(anchor: string): string[] {
  const dt = isoToDate(anchor);
  const first = dateToISO(new Date(dt.getFullYear(), dt.getMonth(), 1));
  const last = dateToISO(new Date(dt.getFullYear(), dt.getMonth() + 1, 0));
  const start = mondayISO(first);
  const end = addDaysISO(mondayISO(last), 6);
  const out: string[] = [];
  for (let d = start; d <= end; d = addDaysISO(d, 1)) out.push(d);
  return out;
}

function coversDay(monday: string, iso: string) {
  return iso >= monday && iso <= addDaysISO(monday, 6);
}

export default function CalendarWeek() {
  const { user, loading: authLoading } = useAuth();
  const t = useT();
  const { locale } = useLocale();
  const loc = locale === "de" ? "de-CH" : "en-GB";

  const [events, setEvents] = useState<TourEvent[]>([]);
  const [season, setSeason] = useState<SeasonEntry[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [anchor, setAnchor] = useState<string>(dateToISO(new Date()));
  const [view, setView] = useState<CalView>("week");
  const [filter, setFilter] = useState<CalFilter>("all");
  const [form, setForm] = useState<{ event: TourEvent | null; kind?: EventKind; date?: string; time?: string } | null>(null);

  const reload = useCallback(async (uid: string) => {
    const ev = await loadEvents(uid);
    setEvents(ev.rows);
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancel = false;
    setState("loading");
    Promise.all([loadEvents(user.id), loadSeason()])
      .then(([ev, s]) => { if (!cancel) { setEvents(ev.rows); setSeason(s); setState("done"); t2markArea("calendar"); } })
      .catch(() => { if (!cancel) setState("error"); });
    return () => { cancel = true; };
  }, [authLoading, user]);

  const todayISO = dateToISO(new Date());
  const weekStart = mondayISO(anchor);
  const days = useMemo(() => {
    if (view === "day") return [anchor];
    return Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i));
  }, [anchor, view, weekStart]);

  const activeSeason = useMemo(() => season.filter((s) => !s.tournamentInactive), [season]);
  const showTours = filter !== "events";
  const showEvents = filter !== "tournaments";

  const toursOn = (iso: string) => showTours ? activeSeason.filter((s) => coversDay(s.tournament.tournament_monday, iso)).map((s) => s.tournament) : [];
  const eventsOn = (iso: string) => {
    if (!showEvents) return [];
    return events
      .filter((e) => e.event_date === iso)
      .sort((a, b) => (a.event_time ?? "").localeCompare(b.event_time ?? ""));
  };

  const shiftBy = view === "day" ? 1 : view === "month" ? 0 : 7;
  const goToday = () => setAnchor(todayISO);
  const goPrev = () => {
    if (view === "month") {
      const d = isoToDate(anchor);
      setAnchor(dateToISO(new Date(d.getFullYear(), d.getMonth() - 1, 1)));
      return;
    }
    setAnchor(addDaysISO(anchor, -shiftBy));
  };
  const goNext = () => {
    if (view === "month") {
      const d = isoToDate(anchor);
      setAnchor(dateToISO(new Date(d.getFullYear(), d.getMonth() + 1, 1)));
      return;
    }
    setAnchor(addDaysISO(anchor, shiftBy));
  };

  if (authLoading) return <p className="p-6 text-sm text-[var(--t2-muted)]">{t("tour.t2authChecking")}</p>;
  if (!user) return <TourLoginCard />;
  if (state === "loading") return <p className="p-6 text-sm text-[var(--t2-muted)]">{t("tour.t2dataLoading")}</p>;
  if (state === "error") return <p className="p-6 text-sm text-[var(--t2-muted)]">{t("tour.loadError")}</p>;

  const monthTitle = new Intl.DateTimeFormat(loc, { month: "long", year: "numeric" }).format(isoToDate(anchor));
  const rangeStart = days[0];
  const rangeEnd = days[days.length - 1];
  const rangeLabel = view === "day"
    ? new Intl.DateTimeFormat(loc, { weekday: "long", day: "numeric", month: "short" }).format(isoToDate(anchor))
    : view === "month"
      ? monthTitle
      : `${new Intl.DateTimeFormat(loc, { day: "numeric", month: "short" }).format(isoToDate(rangeStart))} – ${new Intl.DateTimeFormat(loc, { day: "numeric", month: "short" }).format(isoToDate(rangeEnd))}`;

  const formModal = form && (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={() => setForm(null)}>
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto bg-white p-1 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <EventForm
          event={form.event}
          season={season}
          userId={user.id}
          defaultDate={form.date ?? todayISO}
          defaultKind={form.kind}
          defaultTime={form.time}
          onDone={() => { setForm(null); void reload(user.id); }}
        />
      </div>
    </div>
  );

  const dayHero = view === "day" ? (() => {
    const tours = toursOn(anchor);
    const evs = eventsOn(anchor);
    const dt = isoToDate(anchor);
    const dd = pad(dt.getDate());
    const mm = pad(dt.getMonth() + 1);
    const city = tours[0]?.city || tours[0]?.name;
    return (
      <section className="mt-8">
        <p className="t2-eyebrow">
          {anchor === todayISO ? t("tour.calGoToday") : rangeLabel}
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
          <h2 className="t2-display min-w-0 text-[clamp(2.4rem,8vw,5rem)] leading-[0.88]">
            {city || t("tour.calNoTournament")}
          </h2>
          <p className="t2-display shrink-0 text-[clamp(2.4rem,8vw,5rem)] leading-none tabular-nums">
            {dd}<span className="text-[var(--t2-accent)]">.</span>{mm}
          </p>
        </div>
        {tours[0] && (
          <p className="mt-3 text-[14px] text-[var(--t2-muted)]">
            {[tours[0].category, tours.slice(1).map((x) => x.city).filter(Boolean).join(" · ")].filter(Boolean).join(" · ")}
          </p>
        )}
        <ul className="mt-8 divide-y divide-[var(--t2-line)] border-y border-[var(--t2-line)]">
          {evs.length === 0 ? (
            <li className="flex items-center justify-between py-5">
              <p className="text-[14px] text-[var(--t2-muted)]">{t("tour.calNoEvents")}</p>
              <button type="button" onClick={() => setForm({ event: null, date: anchor })} className="t2-eyebrow">{t("tour.calAdd")}</button>
            </li>
          ) : evs.map((e) => (
            <li key={e.id}>
              <button type="button" onClick={() => setForm({ event: e })} className="flex w-full items-baseline gap-6 py-4 text-left hover:text-[var(--t2-accent)]">
                <span className="w-16 shrink-0 text-[13px] font-semibold tabular-nums text-[var(--t2-muted)]">{e.event_time ? hhmm(e.event_time) : "—"}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[17px] font-semibold tracking-tight">{e.title || t(`tour.calKind_${e.kind}`)}</span>
                  <span className="mt-0.5 block t2-kicker">{t(`tour.calKind_${e.kind}`)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <Link href="/tour2/season" className="mt-6 inline-block text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--t2-accent)]">{t("tour.t2navSeason")} →</Link>
      </section>
    );
  })() : null;

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 pb-28 sm:px-8 md:pb-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="t2-eyebrow">{t("tour.t2navCalendar")}</p>
          <h1 className="t2-display mt-2 text-[clamp(2rem,5vw,3.25rem)] leading-[0.9]">{monthTitle}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/tour2/timeline" title={t("tour.calGanttHint")} className="px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.14em] ring-1 ring-[var(--t2-line-strong)] hover:bg-[var(--t2-ink)] hover:text-white">
            {t("tour.calGantt")}
          </Link>
          <button type="button" onClick={goToday} className="px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.14em] ring-1 ring-[var(--t2-line-strong)] hover:bg-[var(--t2-ink)] hover:text-white">{t("tour.calGoToday")}</button>
          <button type="button" onClick={goPrev} aria-label={t("tour.calPrev")} className="flex h-10 w-10 items-center justify-center ring-1 ring-[var(--t2-line-strong)] hover:bg-[var(--t2-ink)] hover:text-white">‹</button>
          <button type="button" onClick={goNext} aria-label={t("tour.calNext")} className="flex h-10 w-10 items-center justify-center ring-1 ring-[var(--t2-line-strong)] hover:bg-[var(--t2-ink)] hover:text-white">›</button>
          <button type="button" onClick={() => setForm({ event: null, date: view === "day" ? anchor : weekStart })} className="bg-[var(--t2-ink)] px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-white hover:bg-[var(--t2-accent)]">
            {t("tour.calAdd")}
          </button>
        </div>
      </header>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--t2-line)]">
        <div className="flex">
          {(["all", "tournaments", "events"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`-mb-px border-b-2 px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] ${
                filter === f ? "border-[var(--t2-ink)] text-[var(--t2-ink)]" : "border-transparent text-[var(--t2-muted)] hover:text-[var(--t2-ink)]"
              }`}
            >
              {t(f === "all" ? "tour.calFilterAll" : f === "tournaments" ? "tour.calFilterTournaments" : "tour.calFilterEvents")}
            </button>
          ))}
        </div>
        <div className="flex pb-px">
          {(["week", "day", "month"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`px-3 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] ${
                view === v ? "text-[var(--t2-ink)]" : "text-[var(--t2-muted)] hover:text-[var(--t2-ink)]"
              }`}
            >
              {t(v === "week" ? "tour.calViewWeek" : v === "day" ? "tour.calViewDay" : "tour.calViewMonth")}
            </button>
          ))}
        </div>
      </div>

      {view === "week" && (
        <p className="mt-3 text-[12px] font-medium uppercase tracking-[0.16em] text-[var(--t2-muted)]">
          {rangeLabel} · {t("tour.t2calWeek", { n: isoWeekNumber(weekStart) })}
        </p>
      )}

      {view === "month" ? (
        <MonthGrid
          cells={monthCells(anchor)}
          anchor={anchor}
          todayISO={todayISO}
          events={showEvents ? events : []}
          tours={showTours ? activeSeason.map((s) => s.tournament) : []}
          t={t}
          onDay={(iso) => { setAnchor(iso); setView("day"); }}
          onCreate={(iso) => setForm({ event: null, date: iso })}
          onEvent={(e) => setForm({ event: e })}
        />
      ) : view === "day" ? dayHero : (
        <div className="mt-6 overflow-x-auto">
          <div className="grid min-w-[860px] grid-cols-7 border-t border-[var(--t2-line-strong)]">
            {days.map((iso) => {
              const dt = isoToDate(iso);
              const isToday = iso === todayISO;
              const tours = toursOn(iso);
              const evs = eventsOn(iso);
              const wd = new Intl.DateTimeFormat(loc, { weekday: "short" }).format(dt);
              return (
                <div key={iso} className={`min-h-[22rem] border-b border-r border-[var(--t2-line)] last:border-r-0 ${isToday ? "bg-[var(--t2-ink)] text-white" : ""}`}>
                  <button type="button" onClick={() => { setAnchor(iso); setView("day"); }} className="flex w-full flex-col items-start px-3 pb-3 pt-4 text-left">
                    <span className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${isToday ? "text-white/70" : "text-[var(--t2-muted)]"}`}>{wd}</span>
                    <span className="t2-display mt-1 text-[2rem] leading-none tabular-nums">{dt.getDate()}</span>
                  </button>
                  <div className="space-y-px px-2 pb-4">
                    {tours.map((tt) => (
                      <Link
                        key={tt.id}
                        href="/tour2/season"
                        className={`block px-2 py-2 text-[12px] font-semibold leading-snug ${isToday ? "bg-[var(--t2-paper)] text-[var(--t2-ink)]" : "bg-[var(--t2-ink)] text-white"}`}
                      >
                        {tt.city || tt.name}
                        {tt.category ? <span className={`mt-0.5 block text-[10px] font-medium uppercase tracking-wide ${isToday ? "text-[var(--t2-muted)]" : "text-white/60"}`}>{tt.category}</span> : null}
                      </Link>
                    ))}
                    {evs.map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setForm({ event: e })}
                        className={`block w-full px-2 py-2 text-left text-[12px] leading-snug ${isToday ? "text-white" : "text-[var(--t2-ink)]"} hover:text-[var(--t2-accent)]`}
                      >
                        <span className={`block text-[10px] font-semibold tabular-nums ${isToday ? "text-white/50" : "text-[var(--t2-muted)]"}`}>{e.event_time ? hhmm(e.event_time) : t("tour.calAllDay")}</span>
                        {e.title || t(`tour.calKind_${e.kind}`)}
                      </button>
                    ))}
                    {tours.length === 0 && evs.length === 0 && (
                      <button type="button" onClick={() => setForm({ event: null, date: iso })} className={`w-full px-2 py-6 text-left text-[11px] uppercase tracking-[0.12em] ${isToday ? "text-white/40" : "text-[var(--t2-faint)]"} hover:text-[var(--t2-accent)]`}>
                        {t("tour.calAdd")}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {formModal}
    </div>
  );
}

function MonthGrid({
  cells, anchor, todayISO, events, tours, t, onDay, onCreate, onEvent,
}: {
  cells: string[];
  anchor: string;
  todayISO: string;
  events: TourEvent[];
  tours: SeasonEntry["tournament"][];
  t: (k: string) => string;
  onDay: (iso: string) => void;
  onCreate: (iso: string) => void;
  onEvent: (e: TourEvent) => void;
}) {
  const month = isoToDate(anchor).getMonth();
  const dow = ["day_mon", "day_tue", "day_wed", "day_thu", "day_fri", "day_sat", "day_sun"] as const;
  return (
    <div className="mt-6 border-t border-[var(--t2-line-strong)]">
      <div className="grid grid-cols-7 border-b border-[var(--t2-line)]">
        {dow.map((k) => (
          <div key={k} className="px-2 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--t2-muted)]">{t(`tour.${k}`)}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((iso) => {
          const inMonth = isoToDate(iso).getMonth() === month;
          const isToday = iso === todayISO;
          const dayEvents = events.filter((e) => e.event_date === iso).slice(0, 3);
          const extra = events.filter((e) => e.event_date === iso).length - dayEvents.length;
          const tour = tours.find((tt) => coversDay(tt.tournament_monday, iso));
          return (
            <div key={iso} className={`min-h-[7rem] border-b border-r border-[var(--t2-line)] p-2 [&:nth-child(7n)]:border-r-0 ${inMonth ? "" : "opacity-35"}`}>
              <button type="button" onClick={() => onDay(iso)} className={`text-[13px] font-black tabular-nums ${isToday ? "text-[var(--t2-accent)]" : ""}`}>
                {isoToDate(iso).getDate()}
              </button>
              {tour && inMonth && (
                <Link href="/tour2/season" className="mt-1 block truncate bg-[var(--t2-ink)] px-1.5 py-1 text-[10px] font-semibold text-white">
                  {tour.city || tour.name}
                </Link>
              )}
              {dayEvents.map((e) => (
                <button key={e.id} type="button" onClick={() => onEvent(e)} className="mt-0.5 block w-full truncate text-left text-[11px] hover:text-[var(--t2-accent)]">
                  {e.event_time ? `${hhmm(e.event_time)} ` : ""}{e.title || t(`tour.calKind_${e.kind}`)}
                </button>
              ))}
              {extra > 0 && <p className="text-[10px] text-[var(--t2-faint)]">+{extra}</p>}
              {inMonth && dayEvents.length === 0 && !tour && (
                <button type="button" aria-label={t("tour.calAdd")} onClick={() => onCreate(iso)} className="mt-2 h-8 w-full" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
