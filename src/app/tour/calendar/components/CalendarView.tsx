"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT, useLocale } from "@/lib/i18n";
import { loadEvents, removeEvent, type TourEvent } from "@/lib/tourEvents";
import { loadSeason, type SeasonEntry } from "@/lib/tourSeason";
import { isTourTournamentId } from "@/lib/tourExpenses";
import EventForm from "./EventForm";

type LoadState = "loading" | "error" | "done";
const DAY = 86_400_000;

// ── UTC-Datumshilfen (keine Zeitzonen-Drift bei der Wochengruppierung) ──────
function addDaysISO(iso: string, n: number): string {
  return new Date(Date.parse(iso + "T00:00:00Z") + n * DAY).toISOString().slice(0, 10);
}
function mondayOfWeek(iso: string): string {
  const dow = new Date(iso + "T00:00:00Z").getUTCDay(); // 0=So … 6=Sa
  return addDaysISO(iso, dow === 0 ? -6 : 1 - dow);
}
function fmtDay(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "de" ? "de-CH" : "en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z"));
}
function fmtShort(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "de" ? "de-CH" : "en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z"));
}

export default function CalendarView() {
  const { user, loading: authLoading } = useAuth();
  const t = useT();
  const { locale } = useLocale();

  const [events, setEvents] = useState<TourEvent[]>([]);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [season, setSeason] = useState<SeasonEntry[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [weekOffset, setWeekOffset] = useState(0);
  const [form, setForm] = useState<{ event: TourEvent | null } | null>(null);
  const [actionError, setActionError] = useState(false);

  const reload = useCallback(async (userId: string) => {
    const { rows, names: n } = await loadEvents(userId);
    setEvents(rows);
    setNames(n);
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancel = false;
    setState("loading");
    Promise.all([loadEvents(user.id), loadSeason()])
      .then(([ev, s]) => { if (!cancel) { setEvents(ev.rows); setNames(ev.names); setSeason(s); setState("done"); } })
      .catch(() => { if (!cancel) setState("error"); });
    return () => { cancel = true; };
  }, [authLoading, user]);

  const handleRemove = useCallback(async (id: string) => {
    if (!user) return;
    setActionError(false);
    try { await removeEvent(id); await reload(user.id); } catch { setActionError(true); }
  }, [user, reload]);

  // ── Auth-Gate (wie SeasonView) ───────────────────────────────────────────
  if (authLoading) return <p className="mt-10 text-sm text-neutral-500">{t("tour.loading")}</p>;
  if (!user) {
    return (
      <div className="mt-10 rounded-2xl border border-black/[0.08] bg-black/[0.02] px-6 py-10 text-center">
        <h2 className="text-lg font-bold text-neutral-900">{t("tour.loginRequiredTitle")}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">{t("tour.loginRequiredText")}</p>
        <Link href="/app" className="mt-6 inline-flex rounded-full bg-neutral-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-neutral-700">{t("tour.loginCta")}</Link>
      </div>
    );
  }
  if (state === "loading") return <p className="mt-8 text-sm text-neutral-500">{t("tour.loading")}</p>;
  if (state === "error") return <p className="mt-8 text-sm text-neutral-500">{t("tour.loadError")}</p>;

  // Stichtag entsteht HIER (Client), nicht in einer Domain-Funktion.
  const todayISO = new Date().toISOString().slice(0, 10);
  const weekStart = addDaysISO(mondayOfWeek(todayISO), weekOffset * 7);
  const weekEnd = addDaysISO(weekStart, 6);
  const weekEvents = events.filter((e) => e.event_date >= weekStart && e.event_date <= weekEnd);

  // Nach Tag gruppieren (chronologisch; Events sind bereits sortiert geladen).
  const byDay = new Map<string, TourEvent[]>();
  for (const e of weekEvents) {
    if (!byDay.has(e.event_date)) byDay.set(e.event_date, []);
    byDay.get(e.event_date)!.push(e);
  }
  const days = [...byDay.keys()].sort();

  const defaultDate = todayISO >= weekStart && todayISO <= weekEnd ? todayISO : weekStart;

  // Art als dezentes, neutrales Label (keine Ampelfarben).
  const kindLabel = (k: string) => {
    const key = `tour.calKind_${k}`;
    const v = t(key);
    return v === key ? k : v;
  };
  const wonLabel = (w: boolean | null) => (w === true ? t("tour.calWon") : w === false ? t("tour.calLost") : "");
  const tournName = (id: string | null) => (isTourTournamentId(id) ? names.get(id!) : null);

  return (
    <div className="mt-8 space-y-5">
      {/* Wochen-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" aria-label={t("tour.calPrev")} onClick={() => setWeekOffset((o) => o - 1)} className="rounded-full border border-black/15 px-3 py-1.5 text-[13px] font-semibold text-neutral-600 hover:border-black/30">‹</button>
          <span className="text-[14px] font-bold text-neutral-900">
            {fmtShort(weekStart, locale)} – {fmtShort(weekEnd, locale)}
          </span>
          <button type="button" aria-label={t("tour.calNext")} onClick={() => setWeekOffset((o) => o + 1)} className="rounded-full border border-black/15 px-3 py-1.5 text-[13px] font-semibold text-neutral-600 hover:border-black/30">›</button>
          {weekOffset !== 0 && (
            <button type="button" onClick={() => setWeekOffset(0)} className="text-[12px] font-semibold text-matchup hover:underline">{t("tour.calThisWeek")}</button>
          )}
        </div>
        {!form && (
          <button type="button" onClick={() => setForm({ event: null })} className="rounded-full bg-neutral-900 px-4 py-2 text-[13px] font-bold text-white hover:bg-neutral-700">+ {t("tour.calAdd")}</button>
        )}
      </div>

      {form && (
        <EventForm event={form.event} season={season} userId={user.id} defaultDate={defaultDate} onDone={() => { setForm(null); void reload(user.id); }} />
      )}

      {actionError && <p className="text-[12px] text-neutral-500">{t("tour.calSaveError")}</p>}

      {/* Wochenansicht: Termine nach Tag; leere Woche → freundlicher Hinweis */}
      {weekEvents.length === 0 ? (
        <p className="rounded-2xl bg-black/[0.035] px-5 py-8 text-center text-sm text-neutral-500">{t("tour.calEmpty")}</p>
      ) : (
        <div className="space-y-4">
          {days.map((date) => (
            <div key={date}>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">{fmtDay(date, locale)}</p>
              <div className="divide-y divide-black/[0.06] rounded-2xl border border-black/[0.08] bg-white">
                {byDay.get(date)!.map((e) => (
                  <div key={e.id} className="flex items-start gap-3 p-4">
                    <span className="w-14 shrink-0 pt-0.5 text-[12px] font-semibold text-neutral-500">
                      {e.event_time ? e.event_time.slice(0, 5) : t("tour.calAllDay")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-[14px] font-semibold text-neutral-900">
                        <span className="rounded bg-black/[0.05] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">{kindLabel(e.kind)}</span>
                        {e.title}
                      </p>
                      <p className="mt-0.5 text-[12px] text-neutral-500">
                        {tournName(e.tournament_id) ? tournName(e.tournament_id) : ""}
                        {e.note ? `${tournName(e.tournament_id) ? " · " : ""}${e.note}` : ""}
                      </p>
                      {e.kind === "match" && (e.round || e.opponent || e.score || e.won != null) && (
                        <p className="mt-1 text-[12px] text-neutral-600">
                          {[e.round, e.opponent].filter(Boolean).join(" · ")}
                          {e.score ? `${e.round || e.opponent ? " — " : ""}${e.score}` : ""}
                          {e.won != null ? ` (${wonLabel(e.won)})` : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <button type="button" onClick={() => setForm({ event: e })} className="text-[12px] font-semibold text-neutral-500 hover:text-neutral-800">{t("tour.calEdit")}</button>
                      <button type="button" onClick={() => handleRemove(e.id)} className="text-[12px] font-semibold text-neutral-400 hover:text-neutral-700">{t("tour.calDelete")}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
