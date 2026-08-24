"use client";

/**
 * /tour2 Kalender — Wochenraster (Manageko-Qualität): Mo–So, Zeiten links,
 * Termine als Pastellblöcke, Turnier der Woche ganztägig oben.
 * Daten nur Saison + loadEvents. Keine Flugzeiten, keine Ampeln.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT, useLocale } from "@/lib/i18n";
import TourLoginCard from "@/app/tour2/components/TourLoginCard";
import { loadEvents, type TourEvent, type EventKind } from "@/lib/tourEvents";
import { loadSeason, type SeasonEntry } from "@/lib/tourSeason";
import { hhmmToMin, minToHHMM, blockGeom, layoutOverlaps, type DayItem } from "@/domain/tour/calendarGrid";
import { isoWeekNumber } from "@/domain/tour/seasonWeeks";
import EventForm from "@/app/tour2/timeline/components/EventForm";

type LoadState = "loading" | "error" | "done";
type CalView = "day" | "week" | "month";
type CalFilter = "all" | "tournaments" | "events";

const HOUR_H = 56;
const PXMIN = HOUR_H / 60;
const DEFAULT_DUR = 60;
const GUTTER = 52;

const KIND_PASTEL: Record<string, { wrap: string; head: string; body: string }> = {
  training: { wrap: "bg-emerald-50", head: "bg-emerald-100/90 text-emerald-800", body: "text-emerald-950" },
  match: { wrap: "bg-violet-50", head: "bg-violet-100/90 text-violet-800", body: "text-violet-950" },
  physio: { wrap: "bg-rose-50", head: "bg-rose-100/90 text-rose-800", body: "text-rose-950" },
  travel: { wrap: "bg-sky-50", head: "bg-sky-100/90 text-sky-800", body: "text-sky-950" },
  gym: { wrap: "bg-amber-50", head: "bg-amber-100/90 text-amber-800", body: "text-amber-950" },
  other: { wrap: "bg-neutral-100", head: "bg-neutral-200/80 text-neutral-600", body: "text-neutral-900" },
};
const pastel = (k: string) => KIND_PASTEL[k] ?? KIND_PASTEL.other;

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
  const gridRef = useRef<HTMLDivElement | null>(null);
  const scrolled = useRef(false);

  const reload = useCallback(async (uid: string) => {
    const ev = await loadEvents(uid);
    setEvents(ev.rows);
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancel = false;
    setState("loading");
    Promise.all([loadEvents(user.id), loadSeason()])
      .then(([ev, s]) => { if (!cancel) { setEvents(ev.rows); setSeason(s); setState("done"); } })
      .catch(() => { if (!cancel) setState("error"); });
    return () => { cancel = true; };
  }, [authLoading, user]);

  useEffect(() => {
    if (state !== "done" || scrolled.current || view === "month") return;
    scrolled.current = true;
    if (gridRef.current) gridRef.current.scrollTop = 7 * HOUR_H;
  }, [state, view]);

  const todayISO = dateToISO(new Date());
  const weekStart = mondayISO(anchor);
  const days = useMemo(() => {
    if (view === "day") return [anchor];
    return Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i));
  }, [anchor, view, weekStart]);
  const rangeStart = days[0];
  const rangeEnd = days[days.length - 1];
  const activeSeason = useMemo(() => season.filter((s) => !s.tournamentInactive), [season]);
  const showTours = filter !== "events";
  const showEvents = filter !== "tournaments";

  const fmtDayHead = (iso: string) => {
    const dt = isoToDate(iso);
    return { wd: new Intl.DateTimeFormat(loc, { weekday: "short" }).format(dt), d: dt.getDate() };
  };
  const shiftBy = view === "day" ? 1 : view === "month" ? 0 : 7;
  const nowMin = (() => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); })();

  const openCreate = (dayISO: string, minute?: number) => {
    if (minute == null) { setForm({ event: null, date: dayISO }); return; }
    const snapped = Math.max(0, Math.min(23 * 60 + 45, Math.round(minute / 15) * 15));
    setForm({ event: null, date: dayISO, time: minToHHMM(snapped) });
  };

  const goToday = () => { setAnchor(todayISO); scrolled.current = false; };
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

  if (authLoading) return <p className="p-6 text-sm text-[var(--t2-muted)]">{t("tour.loading")}</p>;
  if (!user) return <TourLoginCard />;
  if (state === "loading") return <p className="p-6 text-sm text-[var(--t2-muted)]">{t("tour.loading")}</p>;
  if (state === "error") return <p className="p-6 text-sm text-[var(--t2-muted)]">{t("tour.loadError")}</p>;

  const monthTitle = new Intl.DateTimeFormat(loc, { month: "long", year: "numeric" }).format(isoToDate(anchor));
  const rangeLabel = view === "day"
    ? new Intl.DateTimeFormat(loc, { weekday: "long", day: "numeric", month: "short" }).format(isoToDate(anchor))
    : view === "month"
      ? monthTitle
      : `${new Intl.DateTimeFormat(loc, { day: "numeric", month: "short" }).format(isoToDate(rangeStart))} – ${new Intl.DateTimeFormat(loc, { day: "numeric", month: "short" }).format(isoToDate(rangeEnd))}`;

  const tourBars = showTours ? activeSeason.map((s) => {
    const tt = s.tournament;
    const startIso = tt.tournament_monday;
    const endIso = addDaysISO(startIso, 6);
    if (view === "month") return { tt, startIso, endIso, from: 0, to: 0 };
    if (endIso < rangeStart || startIso > rangeEnd) return null;
    const from = Math.max(0, days.indexOf(startIso) >= 0 ? days.indexOf(startIso) : 0);
    const toIdx = days.indexOf(endIso) >= 0 ? days.indexOf(endIso) : days.length - 1;
    return { tt, startIso, endIso, from, to: toIdx };
  }).filter(Boolean) as { tt: SeasonEntry["tournament"]; startIso: string; endIso: string; from: number; to: number }[] : [];

  const timedOnDay = (iso: string) => showEvents ? events.filter((e) => e.event_date === iso && e.event_time) : [];
  const allDayOnDay = (iso: string) => showEvents ? events.filter((e) => e.event_date === iso && !e.event_time) : [];

  const formModal = form && (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setForm(null)}>
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-1 shadow-2xl" onClick={(e) => e.stopPropagation()}>
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

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-6 pb-28 sm:px-6 md:pb-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.75rem] font-bold tracking-tight text-[var(--t2-ink)] sm:text-[2rem]">{t("tour.calTitle")}</h1>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-[var(--t2-muted)]">{t("tour.calSubtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => setForm({ event: null, date: view === "day" ? anchor : weekStart })}
          className="rounded-lg bg-[var(--t2-ink)] px-4 py-2 text-[13px] font-semibold text-white hover:bg-black"
        >
          + {t("tour.calAdd")}
        </button>
      </header>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {(["all", "tournaments", "events"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                filter === f ? "bg-white text-[var(--t2-ink)] shadow-sm ring-1 ring-black/[0.08]" : "text-[var(--t2-muted)] hover:text-[var(--t2-ink)]"
              }`}
            >
              {t(f === "all" ? "tour.calFilterAll" : f === "tournaments" ? "tour.calFilterTournaments" : "tour.calFilterEvents")}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-0.5 rounded-full bg-black/[0.05] p-0.5">
          {(["day", "week", "month"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => { setView(v); scrolled.current = false; }}
              className={`rounded-full px-3 py-1 text-[12px] font-semibold transition-colors ${
                view === v ? "bg-white text-[var(--t2-ink)] shadow-sm" : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              {t(v === "week" ? "tour.calViewWeek" : v === "day" ? "tour.calViewDay" : "tour.calViewMonth")}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <button type="button" onClick={goPrev} aria-label={t("tour.calPrev")} className="flex h-8 w-8 items-center justify-center rounded-full text-[16px] text-[var(--t2-ink)] ring-1 ring-black/10 hover:bg-white">‹</button>
        <button type="button" onClick={goToday} className="rounded-full px-3 py-1.5 text-[13px] font-semibold ring-1 ring-black/10 hover:bg-white">{t("tour.calGoToday")}</button>
        <button type="button" onClick={goNext} aria-label={t("tour.calNext")} className="flex h-8 w-8 items-center justify-center rounded-full text-[16px] text-[var(--t2-ink)] ring-1 ring-black/10 hover:bg-white">›</button>
        <div className="ml-2">
          <p className="text-[15px] font-bold capitalize text-[var(--t2-ink)]">{monthTitle}</p>
          {view !== "month" && <p className="text-[12px] text-[var(--t2-muted)]">{rangeLabel}{view === "week" ? ` · ${t("tour.t2calWeek", { n: isoWeekNumber(weekStart) })}` : ""}</p>}
        </div>
      </div>

      {view === "month" ? (
        <MonthGrid
          cells={monthCells(anchor)}
          anchor={anchor}
          todayISO={todayISO}
          events={showEvents ? events : []}
          tours={tourBars.map((x) => x.tt)}
          t={t}
          onDay={(iso) => { setAnchor(iso); setView("week"); }}
          onCreate={(iso) => openCreate(iso)}
          onEvent={(e) => setForm({ event: e })}
        />
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-[0_1px_2px_rgba(20,17,14,0.04)] ring-1 ring-black/[0.06]">
          <div className={view === "week" ? "min-w-[640px]" : ""}>
            <div className="flex border-b border-black/[0.06]">
              <div className="shrink-0 border-r border-black/[0.05]" style={{ width: GUTTER }} />
              {days.map((iso) => {
                const h = fmtDayHead(iso);
                const isToday = iso === todayISO;
                return (
                  <div key={iso} className="flex-1 border-r border-black/[0.04] px-2 py-3 text-center last:border-r-0">
                    <div className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${isToday ? "text-[var(--t2-ink)]" : "text-neutral-400"}`}>{h.wd}</div>
                    <div className="relative mx-auto mt-1 w-fit">
                      <span className={`text-[18px] font-semibold tabular-nums ${isToday ? "text-[var(--t2-ink)]" : "text-neutral-700"}`}>{h.d}</span>
                      {isToday && <span className="absolute -bottom-1 left-1/2 h-[2px] w-5 -translate-x-1/2 rounded-full bg-matchup" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex border-b border-black/[0.06] bg-[#faf8f4]">
              <div className="flex shrink-0 items-start justify-end border-r border-black/[0.05] pr-2 pt-2 text-[9px] font-semibold uppercase tracking-wide text-neutral-400" style={{ width: GUTTER }}>{t("tour.calAllDay")}</div>
              <div className="relative min-h-[40px] flex-1 py-1.5">
                {tourBars.length > 0 && (
                  <div className="mb-1 grid gap-y-1 px-1" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0,1fr))` }}>
                    {tourBars.map(({ tt, from, to }) => (
                      <Link
                        key={tt.id}
                        href="/tour2/planner"
                        className="flex h-7 items-center truncate rounded-lg bg-violet-100 px-2.5 text-[11px] font-semibold text-violet-900 hover:bg-violet-200/80"
                        style={{ gridColumn: `${from + 1} / ${to + 2}` }}
                        title={`${tt.city ?? ""}${tt.category ? " · " + tt.category : ""}`}
                      >
                        <span className="truncate">{tt.city || tt.name}{tt.category ? ` · ${tt.category}` : ""}</span>
                      </Link>
                    ))}
                  </div>
                )}
                <div className="grid" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0,1fr))` }}>
                  {days.map((iso) => (
                    <div key={iso} className="min-h-[8px] space-y-1 border-r border-black/[0.04] px-1 last:border-r-0">
                      {allDayOnDay(iso).map((e) => {
                        const ks = pastel(e.kind);
                        return (
                          <button key={e.id} type="button" onClick={() => setForm({ event: e })} className={`w-full truncate rounded-lg px-2 py-1 text-left text-[11px] font-semibold ${ks.wrap} ${ks.body}`}>
                            {e.title || t(`tour.calKind_${e.kind}`)}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div ref={gridRef} className="max-h-[min(68vh,720px)] overflow-y-auto">
              <div className="flex" style={{ height: 24 * HOUR_H }}>
                <div className="relative shrink-0 border-r border-black/[0.05]" style={{ width: GUTTER }}>
                  {Array.from({ length: 24 }, (_, h) => (
                    <div key={h} className="absolute right-2 -translate-y-1/2 text-[10px] font-medium tabular-nums text-neutral-400" style={{ top: h * HOUR_H }}>
                      {h > 0 ? `${pad(h)}:00` : ""}
                    </div>
                  ))}
                </div>
                {days.map((iso) => {
                  const dayEvents = timedOnDay(iso);
                  const layout = layoutOverlaps(dayEvents.map((e): DayItem => ({ id: e.id, startMin: hhmmToMin(e.event_time) ?? 0, endMin: hhmmToMin(e.end_time) })), DEFAULT_DUR);
                  const isToday = iso === todayISO;
                  return (
                    <div
                      key={iso}
                      className="relative flex-1 border-r border-black/[0.04] last:border-r-0"
                      style={{ backgroundImage: `repeating-linear-gradient(to bottom, rgba(20,17,14,0.06) 0, rgba(20,17,14,0.06) 1px, transparent 1px, transparent ${HOUR_H}px)` }}
                    >
                      <button type="button" aria-label={t("tour.calAdd")} onClick={(e) => { const y = e.nativeEvent.offsetY; openCreate(iso, y / PXMIN); }} className="absolute inset-0 z-0 cursor-cell" />
                      {isToday && (
                        <div className="pointer-events-none absolute inset-x-0 z-20" style={{ top: nowMin * PXMIN }}>
                          <div className="h-px bg-matchup"><span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-matchup" /></div>
                        </div>
                      )}
                      {dayEvents.map((e) => {
                        const sMin = hhmmToMin(e.event_time) ?? 0;
                        const g = blockGeom(sMin, hhmmToMin(e.end_time), PXMIN, DEFAULT_DUR);
                        const lay = layout.get(e.id) ?? { col: 0, cols: 1 };
                        const ks = pastel(e.kind);
                        const short = g.height < 40;
                        const timeStr = `${hhmm(e.event_time)}${e.end_time ? ` – ${hhmm(e.end_time)}` : ""}`;
                        const style = { top: g.top + 2, height: g.height - 4, left: `calc(${(lay.col / lay.cols) * 100}% + 3px)`, width: `calc(${(1 / lay.cols) * 100}% - 6px)` };
                        return (
                          <button
                            key={e.id}
                            type="button"
                            onClick={() => setForm({ event: e })}
                            className={`absolute z-10 overflow-hidden rounded-xl text-left ${ks.wrap} hover:z-30`}
                            style={style}
                            title={`${e.title} · ${timeStr}`}
                          >
                            {!short && <span className={`block truncate px-2 py-0.5 text-[10px] font-semibold ${ks.head}`}>{timeStr}</span>}
                            <span className={`block truncate px-2 ${short ? "py-0.5" : "pb-1.5 pt-0.5"} text-[11px] font-semibold leading-tight ${ks.body}`}>
                              {e.title || t(`tour.calKind_${e.kind}`)}
                            </span>
                            {short && <span className={`block truncate px-2 pb-0.5 text-[9px] ${ks.body} opacity-70`}>{timeStr}</span>}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="mt-3 text-[11px] text-[var(--t2-muted)]">{t("tour.calGridHint")}</p>
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
    <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(20,17,14,0.04)] ring-1 ring-black/[0.06]">
      <div className="grid grid-cols-7 border-b border-black/[0.06]">
        {dow.map((k) => (
          <div key={k} className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-400">{t(`tour.${k}`)}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((iso) => {
          const inMonth = isoToDate(iso).getMonth() === month;
          const isToday = iso === todayISO;
          const dayEvents = events.filter((e) => e.event_date === iso).slice(0, 3);
          const extra = events.filter((e) => e.event_date === iso).length - dayEvents.length;
          const tour = tours.find((tt) => iso >= tt.tournament_monday && iso <= addDaysISO(tt.tournament_monday, 6));
          return (
            <div key={iso} className={`min-h-[5.5rem] border-b border-r border-black/[0.05] p-1.5 [&:nth-child(7n)]:border-r-0 ${inMonth ? "bg-white" : "bg-[#faf8f4]"}`}>
              <button type="button" onClick={() => onDay(iso)} className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold tabular-nums ${isToday ? "bg-matchup text-white" : inMonth ? "text-neutral-800" : "text-neutral-400"}`}>
                {isoToDate(iso).getDate()}
              </button>
              {tour && inMonth && (
                <Link href="/tour2/planner" className="mb-0.5 block truncate rounded-md bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-900">
                  {tour.city || tour.name}
                </Link>
              )}
              {dayEvents.map((e) => {
                const ks = pastel(e.kind);
                return (
                  <button key={e.id} type="button" onClick={() => onEvent(e)} className={`mb-0.5 block w-full truncate rounded-md px-1.5 py-0.5 text-left text-[10px] font-semibold ${ks.wrap} ${ks.body}`}>
                    {e.event_time ? `${hhmm(e.event_time)} ` : ""}{e.title || t(`tour.calKind_${e.kind}`)}
                  </button>
                );
              })}
              {extra > 0 && <p className="px-1 text-[10px] text-neutral-400">+{extra}</p>}
              {inMonth && dayEvents.length === 0 && !tour && (
                <button type="button" aria-label={t("tour.calAdd")} onClick={() => onCreate(iso)} className="mt-1 h-6 w-full rounded-md hover:bg-black/[0.03]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
