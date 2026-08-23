"use client";

/**
 * Wochenkalender (/tour/calendar) — echtes Stundenraster im Google-Kalender-Stil:
 * Stunden von oben nach unten, Termine als Von–bis-Zeitblöcke, ganztägige Turnierwochen
 * und zeitlose Termine in einer Kopfzeile, Klick in eine freie Stelle legt einen Termin
 * an, Klick auf einen Block bearbeitet. Woche/Tag umschaltbar. Neutrales Kalender-Design
 * mit Matchup nur als Akzent. Reine Rastermathematik (getestet) in domain/tour/calendarGrid.
 * Als „Bild" nur Emoji je Art + das EIGENE Profilbild — keine fremden Stockfotos.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT, useLocale } from "@/lib/i18n";
import { loadEvents, removeEvent, type TourEvent, type EventKind } from "@/lib/tourEvents";
import { loadSeason, type SeasonEntry } from "@/lib/tourSeason";
import { hhmmToMin, minToHHMM, blockGeom, layoutOverlaps, type DayItem } from "@/domain/tour/calendarGrid";
import EventForm from "@/app/tour/timeline/components/EventForm";

type LoadState = "loading" | "error" | "done";
const HOUR_H = 46;              // px je Stunde
const PXMIN = HOUR_H / 60;
const DEFAULT_DUR = 60;         // Minuten, wenn keine Endzeit
const GUTTER = 56;             // Stundenspalte links
const BP_MOBILE = 720;

const KIND_STYLE: Record<string, { bg: string; bar: string; text: string }> = {
  training: { bg: "bg-emerald-50 ring-emerald-200", bar: "bg-emerald-400", text: "text-emerald-900" },
  match: { bg: "bg-violet-50 ring-violet-200", bar: "bg-violet-400", text: "text-violet-900" },
  physio: { bg: "bg-rose-50 ring-rose-200", bar: "bg-rose-400", text: "text-rose-900" },
  travel: { bg: "bg-sky-50 ring-sky-200", bar: "bg-sky-400", text: "text-sky-900" },
  gym: { bg: "bg-amber-50 ring-amber-200", bar: "bg-amber-400", text: "text-amber-900" },
  other: { bg: "bg-neutral-100 ring-neutral-200", bar: "bg-neutral-400", text: "text-neutral-800" },
};
const kindStyle = (k: string) => KIND_STYLE[k] ?? KIND_STYLE.other;
const KIND_EMOJI: Record<string, string> = { training: "🎾", match: "🏆", physio: "💆", travel: "✈️", gym: "🏋️", other: "📌" };
const kindEmoji = (k: string) => KIND_EMOJI[k] ?? "📌";

// ── lokale (Wanduhr-)Datumshilfen ──────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, "0");
const isoToDate = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
const dateToISO = (dt: Date) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
const addDaysISO = (iso: string, n: number) => { const dt = isoToDate(iso); dt.setDate(dt.getDate() + n); return dateToISO(dt); };
const mondayISO = (iso: string) => { const dt = isoToDate(iso); const dow = (dt.getDay() + 6) % 7; dt.setDate(dt.getDate() - dow); return dateToISO(dt); };

export default function CalendarWeek() {
  const { user, loading: authLoading } = useAuth();
  const t = useT();
  const { locale } = useLocale();
  const loc = locale === "de" ? "de-CH" : "en-GB";

  const [events, setEvents] = useState<TourEvent[]>([]);
  const [season, setSeason] = useState<SeasonEntry[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [anchor, setAnchor] = useState<string>(dateToISO(new Date()));
  const [view, setView] = useState<"week" | "day">("week");
  const [form, setForm] = useState<{ event: TourEvent | null; kind?: EventKind; date?: string; time?: string } | null>(null);
  const [winW, setWinW] = useState(1000);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const scrolled = useRef(false);

  const reload = useCallback(async (uid: string) => { const ev = await loadEvents(uid); setEvents(ev.rows); }, []);
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
    const measure = () => setWinW(window.innerWidth);
    measure(); window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  const isMobile = winW < BP_MOBILE;
  const effView: "week" | "day" = isMobile ? "day" : view;

  // Beim Öffnen zu ~7:00 scrollen.
  useEffect(() => {
    if (state !== "done" || scrolled.current) return;
    scrolled.current = true;
    if (gridRef.current) gridRef.current.scrollTop = 7 * HOUR_H;
  }, [state]);

  const todayISO = dateToISO(new Date());
  const days = useMemo(() => {
    if (effView === "day") return [anchor];
    const start = mondayISO(anchor);
    return Array.from({ length: 7 }, (_, i) => addDaysISO(start, i));
  }, [anchor, effView]);
  const rangeStart = days[0], rangeEnd = days[days.length - 1];

  const activeSeason = useMemo(() => season.filter((s) => !s.tournamentInactive), [season]);

  const fmtDayHead = (iso: string) => { const dt = isoToDate(iso); return { wd: new Intl.DateTimeFormat(loc, { weekday: "short" }).format(dt), d: dt.getDate() }; };
  const shiftBy = effView === "day" ? 1 : 7;
  const nowMin = (() => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); })();

  const openCreate = (dayISO: string, minute: number) => {
    const snapped = Math.max(0, Math.min(23 * 60 + 45, Math.round(minute / 15) * 15));
    setForm({ event: null, date: dayISO, time: minToHHMM(snapped) });
  };

  if (authLoading) return <p className="mt-10 text-sm text-neutral-500">{t("tour.loading")}</p>;
  if (!user) {
    return (
      <div className="mt-10 rounded-2xl bg-black/[0.02] px-6 py-10 text-center ring-1 ring-black/5">
        <h2 className="text-lg font-bold text-neutral-900">{t("tour.loginRequiredTitle")}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">{t("tour.loginRequiredText")}</p>
        <Link href="/app" className="mt-6 inline-flex rounded-full bg-matchup px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-matchup-hover">{t("tour.loginCta")}</Link>
      </div>
    );
  }
  if (state === "loading") return <p className="mt-8 text-sm text-neutral-500">{t("tour.loading")}</p>;
  if (state === "error") return <p className="mt-8 text-sm text-neutral-500">{t("tour.loadError")}</p>;

  const rangeLabel = effView === "day"
    ? new Intl.DateTimeFormat(loc, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(isoToDate(anchor))
    : `${new Intl.DateTimeFormat(loc, { day: "numeric", month: "short" }).format(isoToDate(rangeStart))} – ${new Intl.DateTimeFormat(loc, { day: "numeric", month: "short", year: "numeric" }).format(isoToDate(rangeEnd))}`;

  // Turnierwochen (ganztägig) im sichtbaren Bereich: Balken über die betroffenen Tage.
  const tourBars = activeSeason.map((s) => {
    const tt = s.tournament;
    const startIso = tt.tournament_monday, endIso = addDaysISO(startIso, 6);
    if (endIso < rangeStart || startIso > rangeEnd) return null;
    const from = Math.max(0, days.indexOf(startIso) >= 0 ? days.indexOf(startIso) : 0);
    const toIdx = days.indexOf(endIso) >= 0 ? days.indexOf(endIso) : days.length - 1;
    return { tt, from, to: toIdx };
  }).filter(Boolean) as { tt: SeasonEntry["tournament"]; from: number; to: number }[];

  const eventForm = form && (
    <div className="mt-4"><EventForm event={form.event} season={season} userId={user.id} defaultDate={form.date ?? todayISO} defaultKind={form.kind} defaultTime={form.time} onDone={() => { setForm(null); void reload(user.id); }} /></div>
  );

  return (
    <div>
      {/* Steuerleiste */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => setAnchor(addDaysISO(anchor, -shiftBy))} aria-label="‹" className="flex h-8 w-8 items-center justify-center rounded-full ring-1 ring-black/10 hover:bg-black/[0.03]">‹</button>
          <button type="button" onClick={() => setAnchor(todayISO)} className="rounded-full px-3 py-1.5 text-[13px] font-semibold ring-1 ring-black/10 hover:bg-black/[0.03]">{t("tour.calGoToday")}</button>
          <button type="button" onClick={() => setAnchor(addDaysISO(anchor, shiftBy))} aria-label="›" className="flex h-8 w-8 items-center justify-center rounded-full ring-1 ring-black/10 hover:bg-black/[0.03]">›</button>
          <span className="ml-2 text-[15px] font-bold text-neutral-900">{rangeLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          {!isMobile && (
            <div className="flex items-center gap-0.5 rounded-full bg-black/[0.05] p-0.5">
              {(["week", "day"] as const).map((v) => (
                <button key={v} type="button" onClick={() => setView(v)} className={`rounded-full px-3 py-1 text-[12px] font-semibold transition-colors ${view === v ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-800"}`}>{t(v === "week" ? "tour.calViewWeek" : "tour.calViewDay")}</button>
              ))}
            </div>
          )}
          <button type="button" onClick={() => setForm({ event: null, date: anchor })} className="rounded-full bg-neutral-900 px-3.5 py-1.5 text-[12px] font-bold text-white hover:bg-neutral-700">+ {t("tour.calAdd")}</button>
        </div>
      </div>

      {eventForm}

      <div className="mt-4 overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.08]">
        {/* Kopf: Wochentage */}
        <div className="flex border-b border-black/[0.06]">
          <div className="shrink-0 border-r border-black/[0.06]" style={{ width: GUTTER }} />
          {days.map((iso) => {
            const h = fmtDayHead(iso); const isToday = iso === todayISO;
            return (
              <div key={iso} className="flex-1 border-r border-black/[0.04] px-2 py-2 text-center last:border-r-0">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{h.wd}</div>
                <div className={`mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-[15px] font-bold ${isToday ? "bg-matchup text-white" : "text-neutral-800"}`}>{h.d}</div>
              </div>
            );
          })}
        </div>

        {/* Ganztägig: Turnierwochen + zeitlose Termine */}
        <div className="flex border-b border-black/[0.06] bg-black/[0.015]">
          <div className="flex shrink-0 items-center justify-end border-r border-black/[0.06] pr-1.5 text-[9px] font-semibold uppercase text-neutral-400" style={{ width: GUTTER }}>{t("tour.calAllDay")}</div>
          <div className="relative min-h-[34px] flex-1">
            {/* Spaltenraster für zeitlose Termine */}
            <div className="grid h-full" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0,1fr))` }}>
              {days.map((iso) => (
                <div key={iso} className="min-h-[34px] space-y-1 border-r border-black/[0.04] p-1 last:border-r-0">
                  {events.filter((e) => e.event_date === iso && !e.event_time).map((e) => (
                    <button key={e.id} type="button" onClick={() => setForm({ event: e })} className={`flex w-full items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-left text-[11px] font-semibold ring-1 ${kindStyle(e.kind).bg} ${kindStyle(e.kind).text}`}>
                      <span>{kindEmoji(e.kind)}</span><span className="truncate">{e.title || t(`tour.calKind_${e.kind}`)}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
            {/* Turnier-Balken quer über die Tage */}
            <div className="pointer-events-none absolute inset-x-0 top-0 space-y-0.5 p-1">
              {tourBars.map(({ tt, from, to }) => (
                <Link key={tt.id} href="/tour" className="pointer-events-auto flex items-center gap-1.5 truncate rounded-md bg-matchup/10 px-2 py-1 text-[11px] font-bold text-matchup ring-1 ring-matchup/20" style={{ marginLeft: `${(from / days.length) * 100}%`, width: `${((to - from + 1) / days.length) * 100}%` }} title={`${tt.city ?? ""}${tt.category ? " · " + tt.category : ""}`}>
                  🎾 <span className="truncate">{tt.city || tt.name}{tt.category ? ` · ${tt.category}` : ""}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Zeitraster */}
        <div ref={gridRef} className="max-h-[68vh] overflow-y-auto">
          <div className="flex" style={{ height: 24 * HOUR_H }}>
            {/* Stundenspalte */}
            <div className="relative shrink-0 border-r border-black/[0.06]" style={{ width: GUTTER }}>
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="absolute right-1.5 -translate-y-1/2 text-[10px] font-semibold text-neutral-400" style={{ top: h * HOUR_H }}>{h > 0 ? `${pad(h)}:00` : ""}</div>
              ))}
            </div>
            {/* Tagesspalten */}
            {days.map((iso) => {
              const dayEvents = events.filter((e) => e.event_date === iso && e.event_time);
              const layout = layoutOverlaps(dayEvents.map((e): DayItem => ({ id: e.id, startMin: hhmmToMin(e.event_time) ?? 0, endMin: hhmmToMin(e.end_time) })), DEFAULT_DUR);
              const isToday = iso === todayISO;
              return (
                <div key={iso} className="relative flex-1 border-r border-black/[0.04] last:border-r-0" style={{ backgroundImage: `repeating-linear-gradient(to bottom, rgba(0,0,0,0.05) 0, rgba(0,0,0,0.05) 1px, transparent 1px, transparent ${HOUR_H}px)` }}>
                  {/* Klick-Schicht zum Anlegen */}
                  <button type="button" aria-label={t("tour.calAdd")} onClick={(e) => { const y = e.nativeEvent.offsetY; openCreate(iso, y / PXMIN); }} className="absolute inset-0 z-0 cursor-copy" />
                  {/* Jetzt-Linie */}
                  {isToday && (
                    <div className="pointer-events-none absolute inset-x-0 z-20" style={{ top: nowMin * PXMIN }}>
                      <div className="h-px bg-matchup"><span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-matchup" /></div>
                    </div>
                  )}
                  {/* Termin-Blöcke */}
                  {dayEvents.map((e) => {
                    const sMin = hhmmToMin(e.event_time) ?? 0;
                    const g = blockGeom(sMin, hhmmToMin(e.end_time), PXMIN, DEFAULT_DUR);
                    const lay = layout.get(e.id) ?? { col: 0, cols: 1 };
                    const ks = kindStyle(e.kind);
                    const short = g.height < 34;
                    return (
                      <button key={e.id} type="button" onClick={() => setForm({ event: e })}
                        className={`absolute z-10 overflow-hidden rounded-lg px-1.5 py-1 text-left ring-1 shadow-sm ${ks.bg} ${ks.text} hover:z-30 hover:ring-2`}
                        style={{ top: g.top + 1, height: g.height - 2, left: `calc(${(lay.col / lay.cols) * 100}% + 2px)`, width: `calc(${(1 / lay.cols) * 100}% - 4px)` }}
                        title={`${e.title} · ${e.event_time?.slice(0, 5)}${e.end_time ? "–" + e.end_time.slice(0, 5) : ""}`}>
                        <span className={`absolute inset-y-1 left-0 w-1 rounded-full ${ks.bar}`} />
                        <span className="ml-1.5 block truncate text-[11px] font-bold leading-tight">{kindEmoji(e.kind)} {e.title || t(`tour.calKind_${e.kind}`)}</span>
                        {!short && <span className="ml-1.5 block truncate text-[10px] font-medium opacity-70">{e.event_time?.slice(0, 5)}{e.end_time ? `–${e.end_time.slice(0, 5)}` : ""}</span>}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-neutral-400">{t("tour.calGridHint")}</p>
    </div>
  );
}
