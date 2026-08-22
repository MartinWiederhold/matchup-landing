"use client";

/**
 * Saison-Zeitstrahl (/tour/timeline). Alles Zeitliche auf EINER durchgehenden Achse —
 * Turnierwochen als Balken, Termine als Spur, Meldefristen als PROMINENTE Pins, knappe
 * Anreise (MU-057) als ⚠, Schengen-Wochen als dezentes Band. Read-only + Navigation
 * (Turnierwochen liegen fest → kein Verschieben). Reine Zeit→Pixel-Mathematik +
 * Öffnungs-Fokus + Fristen-Klassifikation liegen getestet in domain/tour/timeline.
 *
 * Öffnet auf dem RELEVANTEN Bereich (nächstes Turnier), nicht auf „heute" — sonst sieht
 * man im August viel Leere vor einer Oktober-Saison.
 *
 * Handy: derselbe Strahl VERTIKAL (Zeit oben→unten, je Woche ein Abschnitt) — waagerecht
 * über zwanzig Wochen passt nicht aufs Telefon.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT, useLocale } from "@/lib/i18n";
import { loadSeason, type SeasonEntry } from "@/lib/tourSeason";
import { loadEvents, type TourEvent } from "@/lib/tourEvents";
import { placeKey } from "@/lib/tourPlanner";
import { tourDeadlines } from "@/domain/tour/deadlines";
import { isSchengenCode } from "@/domain/tour/schengen";
import { tightArrivals } from "@/domain/tour/travelBuffer";
import {
  DAY, mondayOfMs, seasonBounds, xForMs, weekBar, totalWidth, initialFocusMs, classifyDeadline, type DeadlineKind,
} from "@/domain/tour/timeline";

type LoadState = "loading" | "error" | "done";
type Zoom = "season" | "month" | "week";
const PX_PER_DAY: Record<Exclude<Zoom, "season">, number> = { month: 14, week: 40 };
const BP_MOBILE = 720; // darunter: vertikaler Zeitstrahl
const BUFFER_KEY = "mu_tour_buffer_days";
function readBufferDays(): number {
  try { const n = parseInt(localStorage.getItem(BUFFER_KEY) ?? "", 10); return Number.isFinite(n) && n >= 0 ? n : 2; } catch { return 2; }
}

// Serie → helle Matchup-Farbwelt (Balkenfüllung, Text, Punkt).
const SERIES_STYLE: Record<string, { bar: string; text: string; dot: string }> = {
  itf_wtt: { bar: "bg-matchup/[0.12] ring-matchup/30", text: "text-matchup", dot: "bg-matchup" },
  itf_juniors: { bar: "bg-emerald-500/[0.12] ring-emerald-500/30", text: "text-emerald-700", dot: "bg-emerald-500" },
  challenger: { bar: "bg-amber-500/[0.14] ring-amber-500/30", text: "text-amber-700", dot: "bg-amber-500" },
  wta: { bar: "bg-rose-500/[0.12] ring-rose-500/30", text: "text-rose-700", dot: "bg-rose-500" },
};
const styleFor = (s: string) => SERIES_STYLE[s] ?? SERIES_STYLE.itf_wtt;

const AXIS_H = 60, TOUR_TOP = AXIS_H + 6, TOUR_H = 54, EV_TOP = AXIS_H + 6 + 54 + 12, EV_H = 34;
const INNER_H = EV_TOP + EV_H + 16;

export default function TimelineView() {
  const { user, loading: authLoading } = useAuth();
  const t = useT();
  const { locale } = useLocale();
  const loc = locale === "de" ? "de-CH" : "en-GB";

  const [season, setSeason] = useState<SeasonEntry[]>([]);
  const [events, setEvents] = useState<TourEvent[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [zoom, setZoom] = useState<Zoom>("season");
  const [selected, setSelected] = useState<string | null>(null);
  const [viewW, setViewW] = useState(1200);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const didInitialScroll = useRef(false);

  const nowMs = Date.now();
  const isMobile = viewW < BP_MOBILE;

  useEffect(() => {
    if (authLoading || !user) return;
    let cancel = false;
    setState("loading");
    Promise.all([loadSeason(), loadEvents(user.id)])
      .then(([s, ev]) => { if (!cancel) { setSeason(s), setEvents(ev.rows); setState("done"); } })
      .catch(() => { if (!cancel) setState("error"); });
    return () => { cancel = true; };
  }, [authLoading, user]);

  // Sichtbare Breite messen (für die „Saison"-Zoomstufe = fit-to-season).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => setViewW(el.clientWidth || 1200);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [state]);

  // Nur aktive Turniere (soft-gelöschte raus, wie im Kalender-Marker).
  const activeSeason = useMemo(() => season.filter((s) => !s.tournamentInactive), [season]);
  const tMondays = useMemo(() => activeSeason.map((s) => Date.parse(s.tournament.tournament_monday + "T00:00:00Z")), [activeSeason]);
  const eventMs = useMemo(() => events.map((e) => Date.parse(e.event_date + "T00:00:00Z")), [events]);
  const bounds = useMemo(() => seasonBounds(tMondays, eventMs, nowMs), [tMondays, eventMs, nowMs]);
  const totalDays = Math.max(1, Math.round((bounds.endMs - bounds.startMs) / DAY));
  const pxPerDay = zoom === "season" ? Math.min(40, Math.max(4, viewW / totalDays)) : PX_PER_DAY[zoom];
  const width = totalWidth(bounds.startMs, bounds.endMs, pxPerDay);

  // Knappe Anreise (MU-057) über die ganze Saison → markiert das ankommende Turnier.
  const tight = useMemo(
    () => tightArrivals(activeSeason.map((s) => ({ id: s.tournament.id, place: placeKey(s.tournament.country, s.tournament.city), mondayMs: Date.parse(s.tournament.tournament_monday + "T00:00:00Z") })), readBufferDays()),
    [activeSeason],
  );

  // Fristen je Turnier klassifizieren (Pins).
  const deadlines = useMemo(() => activeSeason.map((s) => {
    const dl = tourDeadlines(new Date(s.tournament.tournament_monday + "T00:00:00Z"), s.tournament.series, s.tournament.category);
    const entryMs = dl.entry ? dl.entry.getTime() : null;
    return { id: s.tournament.id, mondayMs: Date.parse(s.tournament.tournament_monday + "T00:00:00Z"), entryMs, kind: classifyDeadline(dl.known, entryMs, nowMs) as DeadlineKind };
  }), [activeSeason, nowMs]);

  // Termine je Woche (Verdichtung bei kleiner Skala; einzeln erst im Woche-Zoom).
  const eventsByWeek = useMemo(() => {
    const m = new Map<number, TourEvent[]>();
    for (const e of events) { const wk = mondayOfMs(Date.parse(e.event_date + "T00:00:00Z")); (m.get(wk) ?? m.set(wk, []).get(wk)!).push(e); }
    return m;
  }, [events]);

  // Öffnungs-Fokus: zum nächsten Turnier scrollen, nicht zu heute.
  const focusMs = useMemo(() => initialFocusMs(nowMs, tMondays), [nowMs, tMondays]);
  const scrollToFocus = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = Math.max(0, xForMs(focusMs, bounds.startMs, pxPerDay) - 24);
  }, [focusMs, bounds.startMs, pxPerDay]);

  useEffect(() => {
    if (state !== "done" || isMobile || didInitialScroll.current) return;
    didInitialScroll.current = true;
    scrollToFocus();
  }, [state, isMobile, scrollToFocus]);

  const fmtShort = (ms: number) => new Intl.DateTimeFormat(loc, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(ms));
  const fmtMonth = (ms: number) => new Intl.DateTimeFormat(loc, { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(ms));
  const kindLabel = (k: string) => { const v = t(`tour.calKind_${k}`); return v === `tour.calKind_${k}` ? k : v; };

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
  if (activeSeason.length === 0 && events.length === 0) {
    return <p className="mt-8 rounded-2xl bg-black/[0.035] px-5 py-8 text-center text-sm text-neutral-500">{t("tour.wsSeasonEmpty")}</p>;
  }

  // Weeks-Raster für Achsenbeschriftung / vertikale Ansicht.
  const weeks: number[] = [];
  for (let m = bounds.startMs; m < bounds.endMs; m += 7 * DAY) weeks.push(m);
  const pxPerWeek = pxPerDay * 7;
  const labelStep = pxPerWeek >= 90 ? 1 : pxPerWeek >= 45 ? 2 : 4; // dichte an die Skala anpassen

  const selectedTt = activeSeason.find((s) => s.tournament.id === selected)?.tournament ?? null;
  const selDl = selected ? deadlines.find((d) => d.id === selected) : null;

  // ── Zoom-/Sprung-Leiste (beide Ansichten) ─────────────────────────────────
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
      {tMondays.length > 0 && (
        <button type="button" onClick={scrollToFocus} className="rounded-full bg-matchup/[0.08] px-3.5 py-1.5 text-[12px] font-bold text-matchup ring-1 ring-matchup/20 hover:bg-matchup/[0.14]">
          {t("tour.tlJumpNext")} →
        </button>
      )}
    </div>
  );

  // ── Mobil: vertikaler Zeitstrahl (Zeit oben→unten, je Woche ein Abschnitt) ──
  if (isMobile) {
    const focusWk = mondayOfMs(focusMs);
    return (
      <div ref={scrollRef} className="w-full">
        {controls}
        <ol className="mt-5 space-y-2 border-l-2 border-black/[0.08] pl-4">
          {weeks.map((wk) => {
            const tt = activeSeason.find((s) => Date.parse(s.tournament.tournament_monday + "T00:00:00Z") === wk)?.tournament;
            const evs = eventsByWeek.get(wk) ?? [];
            const isNow = nowMs >= wk && nowMs < wk + 7 * DAY;
            const isFocus = wk === focusWk;
            if (!tt && evs.length === 0 && !isNow) return null; // leere Wochen ausblenden (mobil)
            const dl = tt ? deadlines.find((d) => d.id === tt.id) : null;
            const st = tt ? styleFor(tt.series) : null;
            return (
              <li key={wk} id={isFocus ? "tl-focus" : undefined} className="relative">
                <span className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full ring-2 ring-white ${isNow ? "bg-matchup" : "bg-neutral-300"}`} />
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">{fmtShort(wk)} – {fmtShort(wk + 6 * DAY)}{isNow ? ` · ${t("tour.tlToday")}` : ""}</p>
                {tt && st && (
                  <button type="button" onClick={() => setSelected(tt.id)} className={`mt-1 block w-full rounded-xl px-3 py-2 text-left ring-1 ${st.bar}`}>
                    <span className="flex items-center gap-2 text-[13px] font-semibold text-neutral-900">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${st.dot}`} />
                      {tt.city || tt.name || t("tour.fieldMissing")}{tt.category ? <span className="text-neutral-500"> · {tt.category}</span> : null}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-2">
                      <DeadlineChip kind={dl?.kind ?? "unknown"} entryMs={dl?.entryMs ?? null} nowMs={nowMs} t={t} />
                      {tight.has(tt.id) && <span className="text-[11px] font-semibold text-amber-700">⚠ {t("tour.calTightArrival", { n: tight.get(tt.id)! })}</span>}
                    </span>
                  </button>
                )}
                {evs.length > 0 && (
                  <p className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-neutral-500">
                    {evs.map((e) => <span key={e.id} className="rounded bg-black/[0.05] px-1.5 py-0.5">{kindLabel(e.kind)}{e.event_time ? ` ${e.event_time.slice(0, 5)}` : ""}</span>)}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
        {selectedTt && <DetailCard tt={selectedTt} dl={selDl ?? null} nowMs={nowMs} tightDays={tight.get(selectedTt.id) ?? null} onClose={() => setSelected(null)} t={t} fmtShort={fmtShort} />}
      </div>
    );
  }

  // ── Desktop: horizontaler Zeitstrahl ───────────────────────────────────────
  return (
    <div>
      {controls}
      <div ref={scrollRef} className="mt-4 overflow-x-auto rounded-2xl ring-1 ring-black/[0.06]">
        <div className="relative" style={{ width, height: INNER_H, backgroundImage: "repeating-linear-gradient(to right, rgba(0,0,0,0.05) 0, rgba(0,0,0,0.05) 1px, transparent 1px, transparent " + pxPerWeek + "px)" }}>
          {/* Schengen-Wochen als dezentes Band (Turnierwochen in Schengen-Ländern). */}
          {activeSeason.map((s) => {
            if (!isSchengenCode(s.tournament.country)) return null;
            const wk = Date.parse(s.tournament.tournament_monday + "T00:00:00Z");
            const b = weekBar(wk, bounds.startMs, pxPerDay);
            return <div key={"sch" + s.tournament.id} className="absolute top-0 bg-sky-500/[0.06]" style={{ left: b.left, width: b.width, height: INNER_H }} title={t("tour.tlSchengen")} />;
          })}

          {/* Heute-Linie (nur wenn im Bereich). */}
          {nowMs >= bounds.startMs && nowMs < bounds.endMs && (
            <div className="absolute top-0 z-10 w-px bg-matchup/70" style={{ left: xForMs(nowMs, bounds.startMs, pxPerDay), height: INNER_H }}>
              <span className="absolute -top-0.5 -translate-x-1/2 rounded-full bg-matchup px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">{t("tour.tlToday")}</span>
            </div>
          )}

          {/* Achse: Monats-/Wochenbeschriftung. */}
          {weeks.map((wk, i) => (
            i % labelStep === 0 ? (
              <div key={"ax" + wk} className="absolute top-7 text-[10px] font-semibold text-neutral-400" style={{ left: xForMs(wk, bounds.startMs, pxPerDay) + 3 }}>
                {pxPerWeek >= 45 ? fmtShort(wk) : fmtMonth(wk)}
              </div>
            ) : null
          ))}

          {/* Fristen-Pins — der wertvollste Teil, deshalb prominent. */}
          {deadlines.map((d) => {
            const st = activeSeason.find((s) => s.tournament.id === d.id);
            if (!st) return null;
            if (d.kind === "unknown") {
              // Challenger: KEIN Datum-Pin, aber sichtbar als „unbekannt" (nicht als „keine Frist nötig").
              const x = xForMs(d.mondayMs, bounds.startMs, pxPerDay);
              return <div key={"dl" + d.id} className="absolute z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-dashed border-neutral-400 bg-white px-1.5 py-0.5 text-[9px] font-bold text-neutral-400" style={{ left: x + pxPerDay * 3.5, top: 2 }} title={t("tour.entryUnknownShort")}>?</div>;
            }
            if (d.entryMs == null) return null;
            const x = xForMs(d.entryMs, bounds.startMs, pxPerDay);
            const daysLeft = Math.ceil((d.entryMs - nowMs) / DAY);
            const urgent = d.kind === "upcoming" && daysLeft <= 7;
            if (d.kind === "passed") {
              return <div key={"dl" + d.id} className="absolute z-20 h-2 w-2 -translate-x-1/2 rounded-full bg-neutral-300 ring-1 ring-white" style={{ left: x, top: 8 }} title={t("tour.entryExpired")} />;
            }
            return (
              <button key={"dl" + d.id} type="button" onClick={() => setSelected(d.id)} className="absolute z-20 -translate-x-1/2" style={{ left: x, top: 2 }} title={t("tour.entryCountdown", { n: daysLeft })}>
                <span className={`block rounded-full px-1.5 py-0.5 text-[9px] font-extrabold text-white shadow-sm ${urgent ? "bg-amber-600" : "bg-matchup"}`}>{daysLeft}</span>
                <span className={`mx-auto block w-px ${urgent ? "bg-amber-500/60" : "bg-matchup/50"}`} style={{ height: TOUR_TOP - 20 }} />
              </button>
            );
          })}

          {/* Turnierwochen — Mo–So-Balken. */}
          {activeSeason.map((s) => {
            const tt = s.tournament;
            const wk = Date.parse(tt.tournament_monday + "T00:00:00Z");
            const b = weekBar(wk, bounds.startMs, pxPerDay);
            const st = styleFor(tt.series);
            const compact = b.width < 96;
            return (
              <button key={tt.id} type="button" onClick={() => setSelected(tt.id)}
                className={`absolute flex items-center gap-1.5 overflow-hidden rounded-xl px-2 text-left ring-1 transition-colors hover:brightness-95 ${st.bar} ${selected === tt.id ? "ring-2 ring-matchup" : ""}`}
                style={{ left: b.left + 2, width: b.width - 4, top: TOUR_TOP, height: TOUR_H }}
                title={`${tt.city ?? ""}${tt.category ? " · " + tt.category : ""}`}>
                <span className={`h-2 w-2 shrink-0 rounded-full ${st.dot}`} />
                {!compact && (
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-semibold text-neutral-900">{tt.city || tt.name || t("tour.fieldMissing")}</span>
                    <span className={`block truncate text-[11px] ${st.text}`}>{tt.category || "—"}</span>
                  </span>
                )}
                {tight.has(tt.id) && <span className="absolute right-1 top-1 text-[11px] text-amber-700" title={t("tour.calTightArrival", { n: tight.get(tt.id)! })}>⚠</span>}
              </button>
            );
          })}

          {/* Termine-Spur — verdichtet bei kleiner Skala, einzeln im Woche-Zoom. */}
          {weeks.map((wk) => {
            const evs = eventsByWeek.get(wk) ?? [];
            if (evs.length === 0) return null;
            const b = weekBar(wk, bounds.startMs, pxPerDay);
            if (zoom === "week") {
              return evs.map((e) => {
                const x = xForMs(Date.parse(e.event_date + "T00:00:00Z"), bounds.startMs, pxPerDay);
                return <span key={e.id} className="absolute rounded bg-black/[0.06] px-1 text-[10px] font-semibold text-neutral-500" style={{ left: x + 2, top: EV_TOP }} title={kindLabel(e.kind)}>{kindLabel(e.kind).slice(0, 3)}</span>;
              });
            }
            return <span key={"ev" + wk} className="absolute rounded-full bg-black/[0.06] px-1.5 py-0.5 text-[10px] font-semibold text-neutral-500" style={{ left: b.left + 2, top: EV_TOP }}>{t("tour.tlEventsCount", { n: evs.length })}</span>;
          })}
        </div>
      </div>

      {/* Legende + Lane-Namen */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-neutral-400">
        <span className="font-semibold text-neutral-500">{t("tour.tlLaneTournaments")}</span>
        {(["itf_wtt", "challenger", "wta", "itf_juniors"] as const).map((s) => (
          <span key={s} className="flex items-center gap-1"><span className={`h-2 w-2 rounded-full ${styleFor(s).dot}`} />{t(s === "itf_wtt" ? "tour.seriesItf" : s === "challenger" ? "tour.seriesChallenger" : s === "wta" ? "tour.seriesWta" : "tour.seriesJuniors")}</span>
        ))}
        <span className="flex items-center gap-1"><span className="rounded-full bg-matchup px-1 text-[8px] font-bold text-white">N</span>{t("tour.tlLegendDeadline")}</span>
        <span className="flex items-center gap-1"><span className="text-amber-700">⚠</span>{t("tour.tlLegendTight")}</span>
      </div>

      {selectedTt && <DetailCard tt={selectedTt} dl={selDl ?? null} nowMs={nowMs} tightDays={tight.get(selectedTt.id) ?? null} onClose={() => setSelected(null)} t={t} fmtShort={fmtShort} />}
    </div>
  );
}

// ── Fristen-Chip (Textform, für Mobil + Detailkarte) ─────────────────────────
function DeadlineChip({ kind, entryMs, nowMs, t }: { kind: DeadlineKind; entryMs: number | null; nowMs: number; t: ReturnType<typeof useT> }) {
  if (kind === "unknown") return <span className="rounded-full border border-dashed border-neutral-300 px-2 py-0.5 text-[11px] font-semibold text-neutral-400">{t("tour.entryUnknownShort")}</span>;
  if (kind === "passed" || entryMs == null) return <span className="text-[11px] font-semibold text-neutral-400">{t("tour.entryExpired")}</span>;
  const daysLeft = Math.ceil((entryMs - nowMs) / DAY);
  const urgent = daysLeft <= 7;
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold text-white ${urgent ? "bg-amber-600" : "bg-matchup"}`}>{t("tour.entryCountdown", { n: daysLeft })}</span>;
}

// ── Detailkarte des gewählten Turniers (read-only + Weg in den Planer) ────────
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
