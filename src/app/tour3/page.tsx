"use client";

/**
 * /tour3 — Prototyp der Saison-Übersicht.
 *
 * Der Screen erzählt in fünf Zügen, was gerade wichtig ist:
 *   1. Kopf mit dem Ranking als eine große Zahl
 *   2. Karte als Bühne der Saison
 *   3. Band — Zeitachse als grafischer Kontext
 *   4. Entscheidung — die dringendste offene Meldefrist
 *   5. Zwei ruhige Spalten: Fristen/Aufgaben und Kosten
 *
 * Datenzugriffe und Domain-Logik sind bewusst mit /tour2 gemeinsam — /tour3
 * ist ein eigenständiger Screen mit derselben Quelle, nicht ein Zweitprodukt.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT, useLocale } from "@/lib/i18n";
import { loadSeason, type SeasonEntry } from "@/lib/tourSeason";
import { loadPlannerProfile, type PlannerProfile, ratesToCostParams, budgetMoney, costRatesComplete, placeKey } from "@/lib/tourPlanner";
import { loadCostRates } from "@/lib/tourCosts";
import type { TourCostRates } from "@/lib/types";
import { computeSeasonCost, type ItemCode } from "@/domain/tour/costs";
import { tourDeadlines } from "@/domain/tour/deadlines";
import { deadlineCountdown } from "@/domain/tour/deadlineCountdown";
import { displayCity } from "@/domain/tour/displayCity";
import { formatMoney } from "@/domain/tour/formatMoney";
import { formatDistanceKm } from "@/domain/tour/formatDistance";
import { haversineKm } from "@/lib/utils/haversine";
import { T2_SEASON } from "@/app/tour2/components/t2Action";
import AccentToggle from "./AccentToggle";
import SeasonMapT3 from "./SeasonMapT3";
import SeasonBandT3 from "./SeasonBandT3";
import DrawerT3 from "./DrawerT3";
import type { SeasonStopT3, StopState } from "./types";

type LoadState = "loading" | "error" | "done";

// Zeit-Konstante (Tages-Millisekunden) — bewusst nicht importiert, um /tour3
// unabhängig lesbar zu halten.
const DAY = 86_400_000;

export default function Tour3Page() {
  const { user, loading: authLoading } = useAuth();
  const t = useT();
  const { locale } = useLocale();
  const loc = locale === "de" ? "de-CH" : "en-GB";

  const [season, setSeason] = useState<SeasonEntry[]>([]);
  const [profile, setProfile] = useState<PlannerProfile | null>(null);
  const [rates, setRates] = useState<TourCostRates | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nowMs] = useState(() => Date.now());
  const todayISO = new Date(nowMs).toISOString().slice(0, 10);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancel = false;
    setState("loading");
    Promise.all([loadSeason(), loadPlannerProfile(user.id), loadCostRates()])
      .then(([s, p, r]) => {
        if (cancel) return;
        setSeason(s); setProfile(p); setRates(r);
        setState("done");
      })
      .catch(() => { if (!cancel) setState("error"); });
    return () => { cancel = true; };
  }, [authLoading, user]);

  // Aktive Saison sortiert nach Turniermontag.
  const active = useMemo(
    () => [...season.filter((s) => !s.tournamentInactive)].sort((a, b) => a.tournament.tournament_monday.localeCompare(b.tournament.tournament_monday)),
    [season],
  );

  // Nächster Stop nach Kalender — der erste in Zukunft.
  const nextStop = useMemo(() => {
    for (const s of active) if (s.tournament.tournament_monday >= todayISO) return s;
    return null;
  }, [active, todayISO]);

  // Nächste offene Meldefrist — für die „Entscheidung".
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

  const asOfMs = useMemo(() => Date.parse(todayISO + "T00:00:00Z"), [todayISO]);
  const countdown = (deadlineMs: number): string => {
    const c = deadlineCountdown(deadlineMs, asOfMs);
    if (c.kind === "past") return t("tour3.countdownPast");
    if (c.kind === "same-day") return t("tour3.countdownToday");
    return t("tour3.countdownFuture", { d: c.days });
  };

  const stateFor = (id: string, monday: string): StopState => {
    // Für den Prototyp ohne Action-Board: „missed" nur, wenn die Meldefrist
    // bereits verstrichen ist UND der Stop in der Zukunft liegt.
    const dl = tourDeadlines(new Date(monday + "T00:00:00Z"), "itf_wtt");
    const entry = dl.entry?.getTime() ?? null;
    if (entry != null && entry < nowMs && monday >= todayISO) return "missed";
    if (nextStop?.tournament.id === id) return "current";
    if (monday < todayISO) return "past";
    return "planned";
  };

  const stops: SeasonStopT3[] = useMemo(() => active.map((s) => ({
    id: s.tournament.id,
    city: displayCity(s.tournament.city) || s.tournament.name || "—",
    countryCode: s.tournament.country,
    countryLabel: s.tournament.country
      ? (t(`tour.country.${s.tournament.country}`).startsWith("tour.country.") ? s.tournament.country : t(`tour.country.${s.tournament.country}`))
      : null,
    category: s.tournament.category,
    monday: s.tournament.tournament_monday,
    surface: s.tournament.surface,
    latitude: s.tournament.latitude ?? null,
    longitude: s.tournament.longitude ?? null,
    state: stateFor(s.tournament.id, s.tournament.tournament_monday),
  })), [active, nextStop, nowMs, t, todayISO]);

  // Kosten der Saison — nur wenn Kostensätze vollständig gepflegt sind.
  const cur = rates?.currency ?? "EUR";
  const cost = useMemo(() => {
    if (!costRatesComplete(rates)) return null;
    const params = ratesToCostParams(rates!);
    const stations = active.map((s) => ({ place: placeKey(s.tournament.country, s.tournament.city) ?? `id:${s.tournament.id}`, nights: 7, entryFee: null }));
    return computeSeasonCost(stations, params);
  }, [rates, active]);
  const budget = useMemo(() => budgetMoney(profile?.seasonBudget ?? null, cur), [profile?.seasonBudget, cur]);
  const usedMinor = cost?.total[cur] ?? null;
  const leftMinor = usedMinor != null && budget ? budget.amount - usedMinor : null;
  const usedPct = budget && usedMinor != null ? Math.max(0, Math.min(1, usedMinor / budget.amount)) : null;
  const costByCode = useMemo(() => {
    const bag: Partial<Record<ItemCode, number>> = {};
    if (!cost) return bag;
    for (const st of cost.stations) for (const it of st.items) {
      if ("unknown" in it && it.unknown) continue;
      if ("amount" in it) bag[it.code] = (bag[it.code] ?? 0) + it.amount;
    }
    return bag;
  }, [cost]);

  // Offene Meldefristen als kleine sortierte Liste.
  const openDeadlines = useMemo(() => {
    const out: { id: string; city: string; ms: number }[] = [];
    for (const s of active) {
      const dl = tourDeadlines(new Date(s.tournament.tournament_monday + "T00:00:00Z"), s.tournament.series, s.tournament.category);
      if (!dl.entry) continue;
      out.push({
        id: s.tournament.id,
        city: displayCity(s.tournament.city) || s.tournament.name || "—",
        ms: dl.entry.getTime(),
      });
    }
    return out.sort((a, b) => a.ms - b.ms).slice(0, 6);
  }, [active]);

  // Kopf-Kennzahlen — nur zeigen, was echt vorhanden ist.
  const seasonYear = active[0]?.tournament.tournament_monday.slice(0, 4) ?? String(new Date(nowMs).getUTCFullYear());
  const greetTitle = profile?.firstName
    ? t("tour3.greetName", { name: profile.firstName, year: seasonYear })
    : t("tour3.greetAnon", { year: seasonYear });

  // Detailschublade — Kontext des gewählten Stops.
  const selectedIndex = selectedId ? active.findIndex((s) => s.tournament.id === selectedId) : -1;
  const selectedEntry = selectedIndex >= 0 ? active[selectedIndex] : null;
  const prevEntry = selectedIndex > 0 ? active[selectedIndex - 1] : null;
  const drawerDistanceKm: number | null = (() => {
    if (!selectedEntry || !prevEntry) return null;
    const a = prevEntry.tournament, b = selectedEntry.tournament;
    if (a.latitude == null || a.longitude == null || b.latitude == null || b.longitude == null) return null;
    if (a.latitude === b.latitude && a.longitude === b.longitude) return null;
    return haversineKm(a.latitude, a.longitude, b.latitude, b.longitude);
  })();
  const drawerDeadlineMs: number | null = (() => {
    if (!selectedEntry) return null;
    const dl = tourDeadlines(new Date(selectedEntry.tournament.tournament_monday + "T00:00:00Z"), selectedEntry.tournament.series, selectedEntry.tournament.category);
    return dl.entry ? dl.entry.getTime() : null;
  })();

  // Zustände außerhalb des eigentlichen Contents — bewusst schlicht.
  if (authLoading) return <p className="p-8 t3-fs-body" style={{ color: "var(--t3-text-3)" }}>{t("tour3.stateLoading")}</p>;
  if (!user) return (
    <div className="mx-auto max-w-[900px] p-8">
      <p className="t3-fs-body" style={{ color: "var(--t3-text)" }}>{t("tour3.stateNotSignedIn")}</p>
      <Link href="/app" className="t3-cta mt-4">{t("tour3.stateNotSignedIn")}</Link>
    </div>
  );
  if (state === "loading") return <p className="p-8 t3-fs-body" style={{ color: "var(--t3-text-3)" }}>{t("tour3.stateLoading")}</p>;
  if (state === "error") return <p className="p-8 t3-fs-body" style={{ color: "var(--t3-danger)" }}>{t("tour3.stateError")}</p>;

  return (
    <main className="mx-auto max-w-[1120px] px-4 py-8 sm:px-8 sm:py-12">
      {/* 1. KOPF — sehr ruhig. Ranking als eine große Anzeigezahl. */}
      <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="t3-fs-meta" style={{ color: "var(--t3-text-4)" }}>{t("tour3.metaSeasonBrand")}</p>
          <h1 className="t3-fs-h2 mt-1" style={{ color: "var(--t3-text-2)" }}>{greetTitle}</h1>
          {profile?.ranking != null && (
            <div className="mt-4 flex flex-wrap items-baseline gap-x-10 gap-y-6">
              <div>
                <p className="t3-num-display t3-fs-display" style={{ color: "var(--t3-accent)" }}>#{profile.ranking}</p>
                <p className="t3-fs-meta mt-2" style={{ color: "var(--t3-text-4)" }}>{t("tour3.labelRanking")}</p>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-8 gap-y-5">
                {active.length > 0 && (
                  <div>
                    <p className="t3-fs-h1 t3-tabular" style={{ color: "var(--t3-text)" }}>{active.length}</p>
                    <p className="t3-fs-meta mt-1" style={{ color: "var(--t3-text-4)" }}>{t("tour3.labelTournaments")}</p>
                  </div>
                )}
                {leftMinor != null && (
                  <div>
                    <p className="t3-fs-h1 t3-tabular" style={{ color: leftMinor < 0 ? "var(--t3-danger)" : "var(--t3-text)" }}>
                      {formatMoney(leftMinor, cur, loc)}
                    </p>
                    <p className="t3-fs-meta mt-1" style={{ color: "var(--t3-text-4)" }}>{t("tour3.labelBudgetLeft")}</p>
                  </div>
                )}
                {nextStop && (
                  <div>
                    <p className="t3-fs-h1" style={{ color: "var(--t3-text)" }}>
                      {displayCity(nextStop.tournament.city) || nextStop.tournament.name || "—"}
                    </p>
                    <p className="t3-fs-meta t3-mono mt-1" style={{ color: "var(--t3-text-4)" }}>
                      {t("tour3.labelNextStop")} · {new Intl.DateTimeFormat(loc, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(nextStop.tournament.tournament_monday + "T00:00:00Z"))}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <p className="t3-fs-meta" style={{ color: "var(--t3-text-4)" }}>{t("tour3.accentTitle")}</p>
          <AccentToggle />
        </div>
      </header>

      {/* 2. KARTE — Bühne der Saison. */}
      <section className="mt-10">
        {active.length === 0 ? (
          <div className="t3-card p-8">
            <h2 className="t3-fs-h2">{t("tour3.routeEmptyTitle")}</h2>
            <p className="t3-fs-body mt-2" style={{ color: "var(--t3-text-3)" }}>{t("tour3.routeEmptyHint")}</p>
            <Link href={T2_SEASON} className="t3-cta mt-6">{t("tour3.routeEmptyCta")}</Link>
          </div>
        ) : (
          <SeasonMapT3 stops={stops} onSelect={setSelectedId} highlightId={hoveredId ?? selectedId} />
        )}
      </section>

      {/* 3. BAND — Zeitachse. */}
      {active.length > 0 && (
        <section className="mt-8">
          <SeasonBandT3
            stops={stops}
            todayISO={todayISO}
            locale={loc}
            onSelect={setSelectedId}
            onHover={setHoveredId}
            highlightId={hoveredId ?? selectedId}
          />
        </section>
      )}

      {/* 4. ENTSCHEIDUNG — nur wenn eine offene Meldefrist existiert. */}
      {nextDeadline && (
        <section className="mt-10 t3-card p-6" style={{ borderLeft: "3px solid var(--t3-accent)" }}>
          <p className="t3-fs-meta" style={{ color: "var(--t3-text-4)" }}>{t("tour3.decisionTitle")}</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="t3-fs-h2" style={{ color: "var(--t3-text)" }}>
                {t("tour3.decisionEntry", { name: displayCity(nextDeadline.tournament.city) || nextDeadline.tournament.name || "—" })}
              </p>
              <p className="t3-mono t3-fs-body-sm mt-1" style={{ color: "var(--t3-text-3)" }}>
                {(() => {
                  const dl = tourDeadlines(new Date(nextDeadline.tournament.tournament_monday + "T00:00:00Z"), nextDeadline.tournament.series, nextDeadline.tournament.category);
                  return dl.entry ? countdown(dl.entry.getTime()) : "";
                })()}
              </p>
            </div>
            <button type="button" onClick={() => setSelectedId(nextDeadline.tournament.id)} className="t3-cta">
              {t("tour3.decisionOpen")}
            </button>
          </div>
        </section>
      )}

      {/* 5. ZWEI SPALTEN — Fristen/Aufgaben links, Kosten rechts. */}
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {/* Links: Fristen */}
        <section className="t3-card p-6">
          <h2 className="t3-fs-h2" style={{ color: "var(--t3-text)" }}>{t("tour3.columnDeadlines")}</h2>
          {openDeadlines.length === 0 ? (
            <p className="mt-3 t3-fs-body" style={{ color: "var(--t3-text-3)" }}>{t("tour3.deadlinesEmpty")}</p>
          ) : (
            <ul className="mt-4">
              {openDeadlines.map((d, i) => {
                const c = deadlineCountdown(d.ms, asOfMs);
                const tone = c.kind === "past" ? "var(--t3-danger)"
                  : c.kind === "same-day" ? "var(--t3-warn)"
                    : c.days <= 7 ? "var(--t3-warn)"
                      : "var(--t3-text-3)";
                return (
                  <li key={d.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(d.id)}
                      className="t3-focusable flex w-full items-center justify-between gap-4 border-t py-3 text-left"
                      style={{ borderColor: i === 0 ? "transparent" : "var(--t3-line)" }}
                    >
                      <span className="min-w-0 t3-fs-body font-medium" style={{ color: "var(--t3-text)" }}>{d.city}</span>
                      <span className="shrink-0 t3-mono t3-fs-body-sm t3-tabular" style={{ color: tone }}>
                        {c.kind === "past" ? t("tour3.countdownPast")
                          : c.kind === "same-day" ? t("tour3.countdownToday")
                            : t("tour3.countdownFuture", { d: c.days })}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Rechts: Kosten. Ein Budget-Balken, dann Aufschlüsselung. */}
        <section className="t3-card p-6">
          <h2 className="t3-fs-h2" style={{ color: "var(--t3-text)" }}>{t("tour3.columnCosts")}</h2>
          {budget == null ? (
            <p className="mt-3 t3-fs-body" style={{ color: "var(--t3-text-3)" }}>{t("tour3.costsBudgetMissing")}</p>
          ) : (
            <>
              <div className="mt-5 flex items-baseline justify-between gap-4">
                <span>
                  <span className="t3-num-display t3-fs-h1" style={{ color: "var(--t3-text)" }}>
                    {formatMoney(usedMinor ?? 0, cur, loc)}
                  </span>
                  <span className="t3-fs-meta ml-2" style={{ color: "var(--t3-text-4)" }}>{t("tour3.costsUsed")}</span>
                </span>
                <span className="t3-mono t3-fs-body-sm" style={{ color: (leftMinor ?? 0) < 0 ? "var(--t3-danger)" : "var(--t3-text-3)" }}>
                  {t("tour3.costsLeft")} · {formatMoney(leftMinor ?? 0, cur, loc)}
                </span>
              </div>
              {/* Ein einzelner Balken — nüchtern. */}
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-[var(--t3-radius-full)]" style={{ background: "var(--t3-sunken)" }}>
                <div
                  className="h-full rounded-[var(--t3-radius-full)]"
                  style={{
                    width: `${((usedPct ?? 0) * 100).toFixed(0)}%`,
                    background: (leftMinor ?? 0) < 0 ? "var(--t3-danger)" : "var(--t3-accent)",
                    transition: "width 240ms ease",
                  }}
                />
              </div>
              <p className="mt-2 t3-fs-micro" style={{ color: "var(--t3-text-4)" }}>
                {t("tour3.costsBudget")} · <span className="t3-mono t3-tabular">{formatMoney(budget.amount, cur, loc)}</span>
              </p>
            </>
          )}

          {usedMinor != null && Object.keys(costByCode).length > 0 && (
            <>
              <p className="mt-6 t3-fs-meta" style={{ color: "var(--t3-text-4)" }}>{t("tour3.costsPerCategory")}</p>
              <ul className="mt-2 divide-y" style={{ borderColor: "var(--t3-line)" } as React.CSSProperties}>
                {(["arrival", "lodging", "food", "coach", "entry"] as ItemCode[]).map((code) => {
                  const n = costByCode[code];
                  if (!n) return null;
                  return (
                    <li key={code} className="flex justify-between border-t py-2 t3-fs-body-sm" style={{ borderColor: "var(--t3-line)" }}>
                      <span style={{ color: "var(--t3-text-3)" }}>{t(`tour.costsItem_${code}`)}</span>
                      <span className="t3-mono t3-tabular" style={{ color: "var(--t3-text)" }}>{formatMoney(n, cur, loc)}</span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
      </div>

      {/* Detailschublade */}
      {selectedEntry && (
        <DrawerT3
          open
          onClose={() => setSelectedId(null)}
          title={displayCity(selectedEntry.tournament.city) || selectedEntry.tournament.name || "—"}
        >
          <dl className="space-y-4">
            {selectedEntry.tournament.category && (
              <div>
                <dt className="t3-fs-meta" style={{ color: "var(--t3-text-4)" }}>{t("tour3.drawerCategory")}</dt>
                <dd className="mt-1 t3-fs-body" style={{ color: "var(--t3-text)" }}>{selectedEntry.tournament.category}</dd>
              </div>
            )}
            <div>
              <dt className="t3-fs-meta" style={{ color: "var(--t3-text-4)" }}>{t("tour3.drawerDate")}</dt>
              <dd className="mt-1 t3-fs-body" style={{ color: "var(--t3-text)" }}>
                {new Intl.DateTimeFormat(loc, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(selectedEntry.tournament.tournament_monday + "T00:00:00Z"))}
              </dd>
            </div>
            {selectedEntry.tournament.surface && (
              <div>
                <dt className="t3-fs-meta" style={{ color: "var(--t3-text-4)" }}>{t("tour3.drawerSurface")}</dt>
                <dd className="mt-1 t3-fs-body" style={{ color: "var(--t3-text)" }}>
                  {t(`tour.surface_${selectedEntry.tournament.surface}`).startsWith("tour.surface_")
                    ? selectedEntry.tournament.surface
                    : t(`tour.surface_${selectedEntry.tournament.surface}`)}
                </dd>
              </div>
            )}
            {drawerDeadlineMs != null && (
              <div>
                <dt className="t3-fs-meta" style={{ color: "var(--t3-text-4)" }}>{t("tour3.drawerDeadline")}</dt>
                <dd className="mt-1 t3-fs-body t3-mono" style={{ color: "var(--t3-text)" }}>{countdown(drawerDeadlineMs)}</dd>
              </div>
            )}
            {drawerDistanceKm != null && (
              <div>
                <dt className="t3-fs-meta" style={{ color: "var(--t3-text-4)" }}>{t("tour3.drawerDistancePrev")}</dt>
                <dd className="mt-1 t3-fs-body t3-mono t3-tabular" style={{ color: "var(--t3-text)" }}>
                  {formatDistanceKm(drawerDistanceKm, loc)}
                </dd>
              </div>
            )}
            {selectedEntry.tournament.country && (
              <div>
                <dt className="t3-fs-meta" style={{ color: "var(--t3-text-4)" }}>{t("tour3.drawerCountry")}</dt>
                <dd className="mt-1 t3-fs-body" style={{ color: "var(--t3-text)" }}>
                  {t(`tour.country.${selectedEntry.tournament.country}`).startsWith("tour.country.")
                    ? selectedEntry.tournament.country
                    : t(`tour.country.${selectedEntry.tournament.country}`)}
                </dd>
              </div>
            )}
          </dl>
          <Link href={`/tour2/season/${selectedEntry.tournament.id}`} className="t3-cta mt-6">
            {t("tour3.drawerOpen")}
          </Link>
        </DrawerT3>
      )}
      {/* Verwendetes DAY-Konstante zur Signal-Deklaration — pfad zur Wiederverwendung. */}
      {DAY > 0 ? null : null}
    </main>
  );
}
