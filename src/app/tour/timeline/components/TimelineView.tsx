"use client";

/**
 * Saison-Zeitstrahl (/tour/timeline) als Spur-Gantt: links eine feste Spurenspalte,
 * rechts eine durchgehende Tagesachse. Spuren: „Turniere" (Mo–So-Balken, read-only) +
 * je eine Spur pro Termin-Art (Training/Match/Physio/Reise/Gym/Sonstiges). Termine lassen
 * sich DIREKT in der Spur anlegen (Klick auf einen Tag) und bearbeiten (Klick auf einen
 * Termin). Meldefristen als prominente Pins in drei Zuständen; knappe Anreise (MU-057) als
 * ⚠; Heute-Linie. Helle Matchup-Formensprache (Standard-Gantt-Muster, keine Fremdmarke).
 *
 * Öffnet auf dem RELEVANTEN Bereich (nächstes Turnier), nicht auf „heute". Reine
 * Zeit→Pixel-/Fokus-/Fristen-Logik liegt getestet in domain/tour/timeline.
 *
 * Handy: der Gantt passt nicht auf ein Telefon → derselbe Verlauf VERTIKAL, je Woche ein
 * Abschnitt, mit „+ Termin".
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT, useLocale } from "@/lib/i18n";
import { loadSeason, type SeasonEntry } from "@/lib/tourSeason";
import { loadEvents, type TourEvent, EVENT_KINDS, type EventKind } from "@/lib/tourEvents";
import { placeKey, loadPlannerProfile, type PlannerProfile } from "@/lib/tourPlanner";
import { tourDeadlines } from "@/domain/tour/deadlines";
import { tightArrivals } from "@/domain/tour/travelBuffer";
import { DAY, mondayOfMs, seasonBounds, xForMs, weekBar, totalWidth, initialFocusMs, classifyDeadline, type DeadlineKind } from "@/domain/tour/timeline";
import EventForm from "./EventForm";

type LoadState = "loading" | "error" | "done";
type Zoom = "season" | "month" | "week";
const PX_PER_DAY: Record<Exclude<Zoom, "season">, number> = { month: 14, week: 42 };
const BP_MOBILE = 720;
const BUFFER_KEY = "mu_tour_buffer_days";
function readBufferDays(): number {
  try { const n = parseInt(localStorage.getItem(BUFFER_KEY) ?? "", 10); return Number.isFinite(n) && n >= 0 ? n : 2; } catch { return 2; }
}
const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

// Serie → helle Matchup-Farbwelt.
const SERIES_STYLE: Record<string, { bar: string; text: string; dot: string }> = {
  itf_wtt: { bar: "bg-matchup/[0.12] ring-matchup/30", text: "text-matchup", dot: "bg-matchup" },
  itf_juniors: { bar: "bg-emerald-500/[0.12] ring-emerald-500/30", text: "text-emerald-700", dot: "bg-emerald-500" },
  challenger: { bar: "bg-amber-500/[0.14] ring-amber-500/30", text: "text-amber-700", dot: "bg-amber-500" },
  wta: { bar: "bg-rose-500/[0.12] ring-rose-500/30", text: "text-rose-700", dot: "bg-rose-500" },
};
const styleFor = (s: string) => SERIES_STYLE[s] ?? SERIES_STYLE.itf_wtt;

// Serie → getönte Icon-Kachel (Turnier-Logo links auf dem Balken).
const SERIES_BADGE: Record<string, string> = {
  itf_wtt: "text-matchup bg-matchup/10",
  itf_juniors: "text-emerald-600 bg-emerald-500/10",
  challenger: "text-amber-600 bg-amber-500/10",
  wta: "text-rose-600 bg-rose-500/10",
};
// Termin-Art → getönte Icon-Kachel.
const KIND_BADGE: Record<string, string> = {
  training: "text-emerald-600 bg-emerald-500/10",
  match: "text-violet-600 bg-violet-500/10",
  physio: "text-rose-600 bg-rose-500/10",
  travel: "text-sky-600 bg-sky-500/10",
  gym: "text-amber-600 bg-amber-500/10",
  other: "text-neutral-500 bg-black/[0.05]",
};

// Eigene, generische Glyphen (keine Fremdlogos): Turnier = Tennisball, sonst je Art.
function Glyph({ k }: { k: string }) {
  const c = "h-[13px] w-[13px]";
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (k) {
    case "tournaments": return <svg viewBox="0 0 24 24" className={c} {...p}><circle cx="12" cy="12" r="9" /><path d="M4.5 7.5a11 11 0 0 1 0 9M19.5 7.5a11 11 0 0 0 0 9" /></svg>; // Tennisball
    case "training": return <svg viewBox="0 0 24 24" className={c} {...p}><ellipse cx="9.5" cy="8.5" rx="5.5" ry="6" /><path d="M13 13l6 8" /></svg>; // Schläger
    case "match": return <svg viewBox="0 0 24 24" className={c} {...p}><path d="M8 21h8M12 17v4M6 4h12v3a6 6 0 0 1-12 0zM6 5H3v2a3 3 0 0 0 3 3M18 5h3v2a3 3 0 0 1-3 3" /></svg>; // Pokal
    case "physio": return <svg viewBox="0 0 24 24" className={c} {...p}><path d="M12 20s-6.5-4.3-6.5-9A3.5 3.5 0 0 1 12 8a3.5 3.5 0 0 1 6.5 3c0 4.7-6.5 9-6.5 9z" /><path d="M12 11v3M10.5 12.5h3" /></svg>; // Herz+
    case "travel": return <svg viewBox="0 0 24 24" className={c} {...p}><path d="M10 13L3 15l1.5-3L3 9l7 1 4-6 2 1-2 6 6 2-1 2-6-1-3 5-1-5z" /></svg>; // Flieger
    case "gym": return <svg viewBox="0 0 24 24" className={c} {...p}><path d="M6 8v8M4 10v4M18 8v8M20 10v4M6 12h12" /></svg>; // Hantel
    default: return <svg viewBox="0 0 24 24" className={c} {...p}><path d="M12 4l1.5 4.5L18 10l-4.5 1.5L12 16l-1.5-4.5L6 10l4.5-1.5z" /></svg>; // Funke
  }
}
function IconBadge({ k, tone }: { k: string; tone: string }) {
  return <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${tone}`}><Glyph k={k} /></span>;
}
// Avatar = EIGENES Profilbild (echt/zugestimmt), sonst Initiale. Keine fremden/erfundenen Gesichter.
function Face({ src, name }: { src: string | null; name: string | null }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" loading="lazy" className="h-6 w-6 shrink-0 rounded-full object-cover ring-2 ring-white" />;
  }
  return <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-matchup/15 text-[10px] font-bold text-matchup ring-2 ring-white">{(name?.[0] ?? "·").toUpperCase()}</span>;
}

// Spuren: Turniere zuerst, dann je Termin-Art eine Spur.
const LANE_TOUR_H = 60, LANE_EV_H = 40, AXIS_H = 56, LEFT_W = 172;
const LANES: { key: "tournaments" | EventKind; h: number }[] = [
  { key: "tournaments", h: LANE_TOUR_H },
  ...EVENT_KINDS.map((k) => ({ key: k, h: LANE_EV_H })),
];
function laneTop(i: number): number {
  let y = AXIS_H;
  for (let j = 0; j < i; j++) y += LANES[j].h;
  return y;
}
const INNER_H = AXIS_H + LANES.reduce((s, l) => s + l.h, 0);

export default function TimelineView() {
  const { user, loading: authLoading } = useAuth();
  const t = useT();
  const { locale } = useLocale();
  const loc = locale === "de" ? "de-CH" : "en-GB";

  const [season, setSeason] = useState<SeasonEntry[]>([]);
  const [events, setEvents] = useState<TourEvent[]>([]);
  const [profile, setProfile] = useState<PlannerProfile | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [zoom, setZoom] = useState<Zoom>("season");
  const [selected, setSelected] = useState<string | null>(null);
  const [form, setForm] = useState<{ event: TourEvent | null; kind?: EventKind; date?: string } | null>(null);
  const [viewW, setViewW] = useState(1000);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const didInitialScroll = useRef(false);

  const nowMs = Date.now();
  const isMobile = viewW < BP_MOBILE;

  const reload = useCallback(async (uid: string) => { const ev = await loadEvents(uid); setEvents(ev.rows); }, []);
  useEffect(() => {
    if (authLoading || !user) return;
    let cancel = false;
    setState("loading");
    Promise.all([loadSeason(), loadEvents(user.id), loadPlannerProfile(user.id)])
      .then(([s, ev, p]) => { if (!cancel) { setSeason(s); setEvents(ev.rows); setProfile(p); setState("done"); } })
      .catch(() => { if (!cancel) setState("error"); });
    return () => { cancel = true; };
  }, [authLoading, user]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => setViewW(el.clientWidth || 1000);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [state]);

  const activeSeason = useMemo(() => season.filter((s) => !s.tournamentInactive), [season]);
  const tMondays = useMemo(() => activeSeason.map((s) => Date.parse(s.tournament.tournament_monday + "T00:00:00Z")), [activeSeason]);
  const eventMs = useMemo(() => events.map((e) => Date.parse(e.event_date + "T00:00:00Z")), [events]);
  const bounds = useMemo(() => seasonBounds(tMondays, eventMs, nowMs), [tMondays, eventMs, nowMs]);
  const totalDays = Math.max(1, Math.round((bounds.endMs - bounds.startMs) / DAY));
  const pxPerDay = zoom === "season" ? Math.min(42, Math.max(4, viewW / totalDays)) : PX_PER_DAY[zoom];
  const width = totalWidth(bounds.startMs, bounds.endMs, pxPerDay);
  const pxPerWeek = pxPerDay * 7;

  const tight = useMemo(
    () => tightArrivals(activeSeason.map((s) => ({ id: s.tournament.id, place: placeKey(s.tournament.country, s.tournament.city), mondayMs: Date.parse(s.tournament.tournament_monday + "T00:00:00Z") })), readBufferDays()),
    [activeSeason],
  );
  const deadlines = useMemo(() => activeSeason.map((s) => {
    const dl = tourDeadlines(new Date(s.tournament.tournament_monday + "T00:00:00Z"), s.tournament.series, s.tournament.category);
    const entryMs = dl.entry ? dl.entry.getTime() : null;
    return { id: s.tournament.id, mondayMs: Date.parse(s.tournament.tournament_monday + "T00:00:00Z"), entryMs, kind: classifyDeadline(dl.known, entryMs, nowMs) as DeadlineKind };
  }), [activeSeason, nowMs]);

  const focusMs = useMemo(() => initialFocusMs(nowMs, tMondays), [nowMs, tMondays]);
  const scrollToFocus = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = Math.max(0, xForMs(focusMs, bounds.startMs, pxPerDay) - 24);
  }, [focusMs, bounds.startMs, pxPerDay]);
  useEffect(() => {
    if (state !== "done" || isMobile || didInitialScroll.current) return;
    didInitialScroll.current = true;
    scrollToFocus();
  }, [state, isMobile, scrollToFocus]);

  const fmtShort = (ms: number) => new Intl.DateTimeFormat(loc, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(ms));
  const fmtMonth = (ms: number) => new Intl.DateTimeFormat(loc, { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(ms));
  const wdLetter = (ms: number) => new Intl.DateTimeFormat(loc, { weekday: "narrow", timeZone: "UTC" }).format(new Date(ms));
  const kindLabel = (k: string) => { const v = t(`tour.calKind_${k}`); return v === `tour.calKind_${k}` ? k : v; };
  const laneLabel = (key: string) => (key === "tournaments" ? t("tour.tlLaneTournaments") : kindLabel(key));

  const eventsByKind = useMemo(() => {
    const m = new Map<string, TourEvent[]>();
    for (const e of events) { const a = m.get(e.kind) ?? m.set(e.kind, []).get(e.kind)!; a.push(e); }
    return m;
  }, [events]);

  // ── Auth-/Ladezustände ────────────────────────────────────────────────────
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

  const weeks: number[] = [];
  for (let m = bounds.startMs; m < bounds.endMs; m += 7 * DAY) weeks.push(m);
  const days: number[] = [];
  for (let m = bounds.startMs; m < bounds.endMs; m += DAY) days.push(m);
  const axisMode: "day" | "week" | "month" = pxPerDay >= 26 ? "day" : pxPerWeek >= 46 ? "week" : "month";

  const selectedTt = activeSeason.find((s) => s.tournament.id === selected)?.tournament ?? null;
  const selDl = selected ? deadlines.find((d) => d.id === selected) ?? null : null;

  const eventForm = form && (
    <div className="mt-4"><EventForm event={form.event} season={season} userId={user.id} defaultDate={form.date ?? isoDay(nowMs)} defaultKind={form.kind} onDone={() => { setForm(null); void reload(user.id); }} /></div>
  );

  const controls = (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
      {!isMobile && (
        <div className="flex items-center gap-0.5 rounded-full bg-black/[0.05] p-0.5">
          {(["season", "month", "week"] as Zoom[]).map((z) => (
            <button key={z} type="button" onClick={() => { setZoom(z); didInitialScroll.current = false; }} className={`rounded-full px-3 py-1 text-[12px] font-semibold transition-colors ${zoom === z ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-800"}`}>
              {t(z === "season" ? "tour.tlZoomSeason" : z === "month" ? "tour.tlZoomMonth" : "tour.tlZoomWeek")}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        {isMobile && <button type="button" onClick={() => setForm({ event: null })} className="rounded-full bg-neutral-900 px-3.5 py-1.5 text-[12px] font-bold text-white hover:bg-neutral-700">+ {t("tour.calAdd")}</button>}
        {tMondays.length > 0 && !isMobile && (
          <button type="button" onClick={scrollToFocus} className="rounded-full bg-matchup/[0.08] px-3.5 py-1.5 text-[12px] font-bold text-matchup ring-1 ring-matchup/20 hover:bg-matchup/[0.14]">{t("tour.tlJumpNext")} →</button>
        )}
      </div>
    </div>
  );

  // ── Mobil: vertikaler Verlauf ──────────────────────────────────────────────
  if (isMobile) {
    if (activeSeason.length === 0 && events.length === 0) return <div>{controls}{eventForm}<p className="mt-6 rounded-2xl bg-black/[0.035] px-5 py-8 text-center text-sm text-neutral-500">{t("tour.wsSeasonEmpty")}</p></div>;
    const eventsByWeek = new Map<number, TourEvent[]>();
    for (const e of events) { const wk = mondayOfMs(Date.parse(e.event_date + "T00:00:00Z")); (eventsByWeek.get(wk) ?? eventsByWeek.set(wk, []).get(wk)!).push(e); }
    return (
      <div className="w-full">{controls}{eventForm}
        <ol className="mt-5 space-y-2 border-l-2 border-black/[0.08] pl-4">
          {weeks.map((wk) => {
            const tt = activeSeason.find((s) => Date.parse(s.tournament.tournament_monday + "T00:00:00Z") === wk)?.tournament;
            const evs = eventsByWeek.get(wk) ?? [];
            const isNow = nowMs >= wk && nowMs < wk + 7 * DAY;
            if (!tt && evs.length === 0 && !isNow) return null;
            const dl = tt ? deadlines.find((d) => d.id === tt.id) : null;
            return (
              <li key={wk} className="relative">
                <span className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full ring-2 ring-white ${isNow ? "bg-matchup" : "bg-neutral-300"}`} />
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">{fmtShort(wk)} – {fmtShort(wk + 6 * DAY)}{isNow ? ` · ${t("tour.tlToday")}` : ""}</p>
                {tt && (
                  <button type="button" onClick={() => setSelected(tt.id)} className="mt-1 block w-full rounded-xl bg-white px-3 py-2 text-left shadow-sm ring-1 ring-black/[0.08]">
                    <span className="flex items-center gap-2 text-[13px] font-semibold text-neutral-900"><IconBadge k="tournaments" tone={SERIES_BADGE[tt.series] ?? SERIES_BADGE.itf_wtt} />{tt.city || tt.name || t("tour.fieldMissing")}{tt.category ? <span className="text-neutral-500"> · {tt.category}</span> : null}<span className="ml-auto"><Face src={profile?.profileImage ?? null} name={profile?.firstName ?? null} /></span></span>
                    <span className="mt-1 flex flex-wrap items-center gap-2"><DeadlineChip kind={dl?.kind ?? "unknown"} entryMs={dl?.entryMs ?? null} nowMs={nowMs} t={t} />{tight.has(tt.id) && <span className="text-[11px] font-semibold text-amber-700">⚠ {t("tour.calTightArrival", { n: tight.get(tt.id)! })}</span>}</span>
                  </button>
                )}
                {evs.length > 0 && (
                  <p className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-neutral-500">
                    {evs.map((e) => <button key={e.id} type="button" onClick={() => setForm({ event: e })} className="rounded bg-black/[0.05] px-1.5 py-0.5 hover:bg-black/[0.09]">{kindLabel(e.kind)}{e.event_time ? ` ${e.event_time.slice(0, 5)}` : ""}</button>)}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
        {selectedTt && <DetailCard tt={selectedTt} dl={selDl} nowMs={nowMs} tightDays={tight.get(selectedTt.id) ?? null} onClose={() => setSelected(null)} t={t} fmtShort={fmtShort} />}
      </div>
    );
  }

  // ── Desktop: Spur-Gantt ────────────────────────────────────────────────────
  return (
    <div>
      {controls}
      {eventForm}
      <div className="mt-4 flex overflow-hidden rounded-2xl ring-1 ring-black/[0.08]">
        {/* Linke, feste Spurenspalte */}
        <div className="shrink-0 border-r border-black/[0.08] bg-white" style={{ width: LEFT_W }}>
          <div style={{ height: AXIS_H }} className="border-b border-black/[0.06]" />
          {LANES.map((lane, i) => {
            const count = lane.key === "tournaments" ? activeSeason.length : (eventsByKind.get(lane.key)?.length ?? 0);
            return (
              <div key={lane.key} className="flex flex-col justify-center border-b border-black/[0.04] px-4" style={{ height: lane.h }}>
                <span className="text-[13px] font-bold text-neutral-800">{laneLabel(lane.key)}</span>
                {count > 0 && <span className="text-[11px] text-neutral-400">{count}</span>}
              </div>
            );
          })}
        </div>

        {/* Rechte, scrollbare Zeitfläche */}
        <div ref={scrollRef} className="min-w-0 flex-1 overflow-x-auto">
          <div className="relative" style={{ width, height: INNER_H, backgroundImage: `repeating-linear-gradient(to right, rgba(0,0,0,0.05) 0, rgba(0,0,0,0.05) 1px, transparent 1px, transparent ${pxPerWeek}px)` }}>
            {/* Spur-Trennlinien */}
            {LANES.map((lane, i) => <div key={"sep" + lane.key} className="absolute left-0 right-0 border-b border-black/[0.04]" style={{ top: laneTop(i) + lane.h }} />)}

            {/* Achse */}
            <div className="absolute inset-x-0 top-0 border-b border-black/[0.06]" style={{ height: AXIS_H }} />
            {axisMode === "day" && days.map((ms) => {
              const isToday = ms === mondayOfMs(nowMs) + ((new Date(nowMs).getUTCDay() === 0 ? 6 : new Date(nowMs).getUTCDay() - 1) * DAY);
              const today = isoDay(ms) === isoDay(nowMs);
              return (
                <div key={"ax" + ms} className="absolute top-2 flex flex-col items-center" style={{ left: xForMs(ms, bounds.startMs, pxPerDay), width: pxPerDay }}>
                  <span className="text-[9px] font-semibold uppercase text-neutral-400">{wdLetter(ms)}</span>
                  <span className={`mt-0.5 text-[11px] font-bold ${today ? "flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-white" : "text-neutral-600"}`}>{new Date(ms).getUTCDate()}</span>
                </div>
              );
            })}
            {axisMode !== "day" && (axisMode === "week" ? weeks : weeks.filter((_, i) => i % 4 === 0)).map((wk) => (
              <div key={"ax" + wk} className="absolute top-4 text-[10px] font-semibold text-neutral-400" style={{ left: xForMs(wk, bounds.startMs, pxPerDay) + 3 }}>{axisMode === "week" ? fmtShort(wk) : fmtMonth(wk)}</div>
            ))}

            {/* Heute-Linie (nur wenn im Bereich) */}
            {nowMs >= bounds.startMs && nowMs < bounds.endMs && (
              <div className="absolute z-10 w-px bg-neutral-900/80" style={{ left: xForMs(nowMs, bounds.startMs, pxPerDay), top: AXIS_H, height: INNER_H - AXIS_H }} />
            )}

            {/* Fristen-Pills auf der Achse */}
            {deadlines.map((d) => {
              const x0 = xForMs(d.mondayMs, bounds.startMs, pxPerDay);
              if (d.kind === "unknown") return <div key={"dl" + d.id} className="absolute z-20 -translate-x-1/2 rounded-full border border-dashed border-neutral-400 bg-white px-1.5 py-0.5 text-[9px] font-bold text-neutral-400" style={{ left: x0 + pxPerDay * 3.5, top: AXIS_H - 16 }} title={t("tour.entryUnknownShort")}>?</div>;
              if (d.entryMs == null) return null;
              const x = xForMs(d.entryMs, bounds.startMs, pxPerDay);
              if (d.kind === "passed") return <div key={"dl" + d.id} className="absolute z-20 h-2 w-2 -translate-x-1/2 rounded-full bg-neutral-300 ring-1 ring-white" style={{ left: x, top: AXIS_H - 12 }} title={t("tour.entryExpired")} />;
              const daysLeft = Math.ceil((d.entryMs - nowMs) / DAY);
              const urgent = daysLeft <= 7;
              return (
                <button key={"dl" + d.id} type="button" onClick={() => setSelected(d.id)} className={`absolute z-20 -translate-x-1/2 rounded-full px-1.5 py-0.5 text-[9px] font-extrabold text-white shadow-sm ${urgent ? "bg-amber-600" : "bg-neutral-900"}`} style={{ left: x, top: AXIS_H - 18 }} title={t("tour.entryCountdown", { n: daysLeft })}>{t("tour.tlDeadlinePin", { n: daysLeft })}</button>
              );
            })}

            {/* Termin-Spuren: klickbarer Hintergrund zum Anlegen + Termin-Pillen */}
            {LANES.map((lane, i) => lane.key === "tournaments" ? null : (
              <div key={"lane" + lane.key} className="absolute left-0 cursor-copy" style={{ top: laneTop(i), height: lane.h, width }}
                onClick={(e) => { const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); const off = e.clientX - rect.left; const ms = bounds.startMs + Math.floor(off / pxPerDay) * DAY; setForm({ event: null, kind: lane.key as EventKind, date: isoDay(ms) }); }}
                title={t("tour.tlAddInLane", { lane: laneLabel(lane.key) })}
              >
                {(eventsByKind.get(lane.key) ?? []).map((ev) => {
                  const x = xForMs(Date.parse(ev.event_date + "T00:00:00Z"), bounds.startMs, pxPerDay);
                  return (
                    <button key={ev.id} type="button" onClick={(e) => { e.stopPropagation(); setForm({ event: ev }); }} className="absolute top-1 flex max-w-[190px] items-center gap-1.5 rounded-full bg-white py-1 pl-1 pr-2 text-[11px] font-semibold text-neutral-700 shadow-sm ring-1 ring-black/[0.08] hover:ring-matchup/40" style={{ left: x + 2 }} title={`${ev.title}${ev.event_time ? " · " + ev.event_time.slice(0, 5) : ""}`}>
                      <IconBadge k={ev.kind} tone={KIND_BADGE[ev.kind] ?? KIND_BADGE.other} />
                      {ev.event_time && <span className="shrink-0 text-neutral-400">{ev.event_time.slice(0, 5)}</span>}
                      <span className="truncate">{ev.title || kindLabel(ev.kind)}</span>
                      <Face src={profile?.profileImage ?? null} name={profile?.firstName ?? null} />
                    </button>
                  );
                })}
              </div>
            ))}

            {/* Turnier-Spur (read-only) */}
            {activeSeason.map((s) => {
              const tt = s.tournament;
              const wk = Date.parse(tt.tournament_monday + "T00:00:00Z");
              const b = weekBar(wk, bounds.startMs, pxPerDay);
              const st = styleFor(tt.series);
              const compact = b.width < 96;
              return (
                <button key={tt.id} type="button" onClick={() => setSelected(tt.id)}
                  className={`absolute flex items-center gap-2 overflow-hidden rounded-full bg-white py-1 pl-1 pr-2 text-left shadow-sm ring-1 ring-black/[0.08] transition hover:ring-matchup/50 ${selected === tt.id ? "ring-2 ring-matchup" : ""}`}
                  style={{ left: b.left + 2, width: b.width - 4, top: laneTop(0) + (LANE_TOUR_H - 40) / 2, height: 40 }}
                  title={`${tt.city ?? ""}${tt.category ? " · " + tt.category : ""}`}>
                  <IconBadge k="tournaments" tone={SERIES_BADGE[tt.series] ?? SERIES_BADGE.itf_wtt} />
                  {!compact && <span className="min-w-0 flex-1"><span className="block truncate text-[12px] font-semibold leading-tight text-neutral-900">{tt.city || tt.name || t("tour.fieldMissing")}</span><span className={`block truncate text-[11px] leading-tight ${st.text}`}>{tt.category || "—"}</span></span>}
                  {!compact && <Face src={profile?.profileImage ?? null} name={profile?.firstName ?? null} />}
                  {tight.has(tt.id) && <span className="absolute right-0.5 top-0 text-[11px] text-amber-700" title={t("tour.calTightArrival", { n: tight.get(tt.id)! })}>⚠</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legende */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-neutral-400">
        {(["itf_wtt", "challenger", "wta", "itf_juniors"] as const).map((s) => (
          <span key={s} className="flex items-center gap-1"><span className={`h-2 w-2 rounded-full ${styleFor(s).dot}`} />{t(s === "itf_wtt" ? "tour.seriesItf" : s === "challenger" ? "tour.seriesChallenger" : s === "wta" ? "tour.seriesWta" : "tour.seriesJuniors")}</span>
        ))}
        <span className="flex items-center gap-1"><span className="rounded-full bg-neutral-900 px-1 text-[8px] font-bold text-white">N</span>{t("tour.tlLegendDeadline")}</span>
        <span className="flex items-center gap-1"><span className="text-amber-700">⚠</span>{t("tour.tlLegendTight")}</span>
        <span>{t("tour.tlAddHint")}</span>
      </div>

      {selectedTt && <DetailCard tt={selectedTt} dl={selDl} nowMs={nowMs} tightDays={tight.get(selectedTt.id) ?? null} onClose={() => setSelected(null)} t={t} fmtShort={fmtShort} />}
    </div>
  );
}

function DeadlineChip({ kind, entryMs, nowMs, t }: { kind: DeadlineKind; entryMs: number | null; nowMs: number; t: ReturnType<typeof useT> }) {
  if (kind === "unknown") return <span className="rounded-full border border-dashed border-neutral-300 px-2 py-0.5 text-[11px] font-semibold text-neutral-400">{t("tour.entryUnknownShort")}</span>;
  if (kind === "passed" || entryMs == null) return <span className="text-[11px] font-semibold text-neutral-400">{t("tour.entryExpired")}</span>;
  const daysLeft = Math.ceil((entryMs - nowMs) / DAY);
  const urgent = daysLeft <= 7;
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold text-white ${urgent ? "bg-amber-600" : "bg-matchup"}`}>{t("tour.entryCountdown", { n: daysLeft })}</span>;
}

function DetailCard({ tt, dl, nowMs, tightDays, onClose, t, fmtShort }: {
  tt: import("@/lib/types").TourTournament;
  dl: { kind: DeadlineKind; entryMs: number | null } | null;
  nowMs: number; tightDays: number | null; onClose: () => void;
  t: ReturnType<typeof useT>; fmtShort: (ms: number) => string;
}) {
  const wk = Date.parse(tt.tournament_monday + "T00:00:00Z");
  return (
    <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[0.08]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold text-neutral-900">{tt.city || tt.name || t("tour.fieldMissing")}{tt.country ? <span className="text-neutral-400">, {tt.country}</span> : null}</h3>
          <p className="mt-0.5 text-[12px] text-neutral-500">{fmtShort(wk)} – {fmtShort(wk + 6 * DAY)}{tt.category ? ` · ${tt.category}` : ""}</p>
        </div>
        <button type="button" onClick={onClose} className="shrink-0 text-[12px] font-semibold text-neutral-400 hover:text-neutral-800">{t("common.close")}</button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <DeadlineChip kind={dl?.kind ?? "unknown"} entryMs={dl?.entryMs ?? null} nowMs={nowMs} t={t} />
        {tightDays != null && <span className="text-[11px] font-semibold text-amber-700">⚠ {t("tour.calTightArrival", { n: tightDays })}</span>}
      </div>
      <Link href="/tour" className="mt-3 inline-flex text-[12px] font-bold text-matchup hover:underline">{t("tour.tlOpenInPlanner")} →</Link>
    </div>
  );
}
