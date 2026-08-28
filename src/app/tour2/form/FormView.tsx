"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { loadPerformance } from "@/lib/tourPerformance";
import { loadPointsData } from "@/lib/tourPoints";
import { scorePoints } from "@/domain/tour/points";
import {
  winRates,
  seasonBalances,
  tournamentBalances,
  pointsBySurface,
  type WinRates,
  type SeasonBalance,
  type TournamentBalance,
  type PointsBySurface,
  type Tally,
} from "@/domain/tour/performance";

const KNOWN_SURFACES = new Set(["hard", "clay", "grass", "carpet", "unknown"]);

/**
 * Leistungsauswertung: Siegquoten (gesamt, nach Belag, nach Kategorie), Bilanz je Saison und
 * Turnier, zählende Punkte je Belag. Die Rechnung liegt in der reinen Domain (performance.ts);
 * diese Komponente lädt, kombiniert für „Punkte je Belag" und zeigt zu JEDER Quote die
 * Grundlage (Anzahl entschiedener Matches). Was mangels Feld nicht geht — Gegnerstärke —
 * ist benannt, nicht geschätzt (MU-039).
 */
export default function FormView() {
  const { user, loading: authLoading } = useAuth();
  const t = useT();
  const [nowMs] = useState(() => Date.now());

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [rates, setRates] = useState<WinRates | null>(null);
  const [seasons, setSeasons] = useState<SeasonBalance[]>([]);
  const [tournaments, setTournaments] = useState<TournamentBalance[]>([]);
  const [ptsSurface, setPtsSurface] = useState<PointsBySurface[]>([]);
  const [matchCount, setMatchCount] = useState(0);

  const reload = useCallback(async () => {
    if (!user) return;
    const [perf, pts] = await Promise.all([loadPerformance(user.id), loadPointsData(user.id)]);
    setMatchCount(perf.matches.length);
    setRates(winRates(perf.matches));
    setSeasons(seasonBalances(perf.matches));
    setTournaments(tournamentBalances(perf.matches));

    // Punkte je Belag: die bewerteten Ergebnisse (in Eingabereihenfolge) mit ihrem Belag paaren.
    const asOf = new Date(nowMs).toISOString().slice(0, 10);
    const scored = scorePoints(pts.rows.map((r) => r.result), asOf);
    const entries = scored.results.map((s, i) => ({
      surface: perf.surfaceByTournament.get(pts.rows[i]?.tournamentId ?? "") ?? null,
      points: s.points,
      counts: s.counts,
    }));
    setPtsSurface(pointsBySurface(entries));
  }, [user, nowMs]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    reload().then(() => { if (alive) setStatus("ready"); }).catch(() => { if (alive) setStatus("error"); });
    return () => { alive = false; };
  }, [user, reload]);

  const surfaceLabel = (key: string) => (KNOWN_SURFACES.has(key) ? t(`tour.surface_${key}`) : key);
  const pct = (rate: number | null) => (rate == null ? "—" : `${Math.round(rate * 100)} %`);
  // Grundlage IMMER nennen: „5 entschieden" bzw. „keine Basis".
  const basis = (tl: Tally) => (tl.decided === 0 ? t("tour.formNoBasis") : t("tour.formBasis", { n: tl.decided }));

  if (authLoading) return <p className="mt-6 t2-fs-body text-[var(--t2-muted)]">{t("tour.loading")}</p>;
  if (!user) {
    return (
      <div className="mt-8 t2-panel bg-[var(--t2-surface)] p-6 text-center">
        <p className="t2-fs-body text-[var(--t2-muted)]">{t("tour.loginRequiredText")}</p>
        <Link href="/app" className="mt-3 t2-cta">{t("tour.loginCta")}</Link>
      </div>
    );
  }
  if (status === "loading") return <p className="mt-6 t2-fs-body text-[var(--t2-muted)]">{t("tour.loading")}</p>;
  if (status === "error") return <p className="mt-6 t2-fs-body text-[var(--t2-muted)]">{t("tour.loadError")}</p>;

  const r = rates!;
  const hasUnknownSurface = r.bySurface.some((b) => b.key === "unknown");
  const tile = "border-t border-[var(--t2-line)] py-4";
  const label = "t2-label";
  const sectionH = "t2-section-title";

  // Leerstand (heute der Live-Fall: tour_events ist leer) — mit klarem Grund + Weg.
  if (matchCount === 0) {
    return (
      <div className="mt-8 space-y-3">
        <p className="rounded-xl bg-[var(--t2-surface)] px-4 py-4 t2-fs-body text-[var(--t2-muted)]">{t("tour.formEmpty")}</p>
        <p className="rounded-xl bg-[var(--t2-surface)] px-4 py-3 t2-fs-body-sm text-[var(--t2-muted)]">{t("tour.formOpponentUnavailable")}</p>
      </div>
    );
  }

  /** Eine Quoten-Zeile mit Balken + Grundlage. */
  const rateRow = (key: string, name: string, tl: Tally) => (
    <div key={key} className="py-2">
      <div className="flex items-center justify-between gap-3 t2-fs-body-sm">
        <span className="min-w-0 truncate font-semibold text-[var(--t2-ink)]">{name}</span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="tabular-nums font-bold text-[var(--t2-ink)]">{pct(tl.rate)}</span>
          <span className="tabular-nums t2-fs-meta text-[var(--t2-faint)]">{basis(tl)}{tl.open > 0 ? ` · ${t("tour.formOpenCount", { n: tl.open })}` : ""}</span>
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--t2-surface)]">
        <div className="h-full rounded-full bg-[var(--t2-accent)]" style={{ width: tl.rate == null ? "0%" : `${Math.round(tl.rate * 100)}%` }} />
      </div>
    </div>
  );

  return (
    <div className="mt-8 space-y-8">
      {/* ── Gesamt ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <div className={tile}>
          <p className={label}>{t("tour.formOverall")}</p>
          <p className="mt-1 t2-fs-h2 font-extrabold tabular-nums text-[var(--t2-ink)]">{pct(r.overall.rate)}</p>
          <p className="mt-1 t2-fs-meta text-[var(--t2-faint)]">{r.overall.wins}–{r.overall.losses} · {basis(r.overall)}{r.overall.open > 0 ? ` · ${t("tour.formOpenCount", { n: r.overall.open })}` : ""}</p>
        </div>
        <div className={`${tile} col-span-1`}>
          <p className={label}>{t("tour.formMatchesLabel")}</p>
          <p className="mt-1 t2-fs-h2 font-extrabold tabular-nums text-[var(--t2-ink)]">{r.overall.total}</p>
          <p className="mt-1 t2-fs-meta text-[var(--t2-faint)]">{t("tour.formBasis", { n: r.overall.decided })}</p>
        </div>
      </div>

      {/* ── Nach Belag ─────────────────────────────────────────────────────── */}
      <section>
        <h2 className={sectionH}>{t("tour.formBySurface")}</h2>
        <div className="mt-2 divide-y divide-[var(--t2-line)]">
          {r.bySurface.map((b) => rateRow(b.key, surfaceLabel(b.key), b.tally))}
        </div>
        {hasUnknownSurface && <p className="mt-2 t2-fs-meta leading-relaxed text-[var(--t2-faint)]">{t("tour.formSurfaceGapNote")}</p>}
      </section>

      {/* ── Nach Kategorie ─────────────────────────────────────────────────── */}
      <section>
        <h2 className={sectionH}>{t("tour.formByCategory")}</h2>
        <div className="mt-2 divide-y divide-[var(--t2-line)]">
          {r.byCategory.map((b) => rateRow(b.key, b.key === "unknown" ? t("tour.formCategoryUnknown") : b.key, b.tally))}
        </div>
      </section>

      {/* ── Punkte je Belag ────────────────────────────────────────────────── */}
      {ptsSurface.length > 0 && (
        <section>
          <h2 className={sectionH}>{t("tour.formPointsBySurface")}</h2>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ptsSurface.map((p) => (
              <div key={p.surface} className={tile}>
                <p className={label}>{surfaceLabel(p.surface)}</p>
                <p className="mt-1 t2-fs-h3 font-extrabold tabular-nums text-[var(--t2-ink)]">{p.points}</p>
                <p className="mt-1 t2-fs-meta text-[var(--t2-faint)]">{t("tour.formPointsN", { n: p.n })}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Bilanz je Saison ───────────────────────────────────────────────── */}
      <section>
        <h2 className={sectionH}>{t("tour.formSeasonBalance")}</h2>
        <ul className="mt-2 divide-y divide-[var(--t2-line)]">
          {seasons.map((s) => (
            <li key={String(s.season)} className="flex items-center justify-between py-2 t2-fs-body-sm">
              <span className="font-semibold text-[var(--t2-ink)]">{s.season ?? t("tour.formSeasonUnknown")}</span>
              <span className="tabular-nums text-[var(--t2-muted)]">{s.wins}–{s.losses}{s.open > 0 ? ` · ${t("tour.formOpenCount", { n: s.open })}` : ""}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Bilanz je Turnier ──────────────────────────────────────────────── */}
      <section>
        <h2 className={sectionH}>{t("tour.formTournamentBalance")}</h2>
        <ul className="mt-2 divide-y divide-[var(--t2-line)]">
          {tournaments.map((tb) => (
            <li key={tb.tournamentId} className="flex items-center justify-between gap-3 py-2 t2-fs-body-sm">
              <span className="min-w-0 truncate font-semibold text-[var(--t2-ink)]">{tb.tournamentName}</span>
              <span className="shrink-0 tabular-nums text-[var(--t2-muted)]">{tb.wins}–{tb.losses}{tb.open > 0 ? ` · ${t("tour.formOpenCount", { n: tb.open })}` : ""}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Was nicht geht: Gegnerstärke (kein Rang-Feld, MU-039) ──────────── */}
      <p className="rounded-xl bg-[var(--t2-surface)] px-4 py-3 t2-fs-micro leading-relaxed text-[var(--t2-muted)]">{t("tour.formOpponentUnavailable")}</p>
    </div>
  );
}
