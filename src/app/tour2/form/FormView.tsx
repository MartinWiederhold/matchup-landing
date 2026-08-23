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

  if (authLoading) return <p className="mt-6 text-sm text-neutral-500">{t("tour.loading")}</p>;
  if (!user) {
    return (
      <div className="mt-8 rounded-2xl bg-black/[0.02] p-6 text-center">
        <p className="text-sm text-neutral-500">{t("tour.loginRequiredText")}</p>
        <Link href="/app" className="mt-3 inline-flex rounded-full bg-matchup px-6 py-3 text-sm font-bold text-white hover:bg-matchup-hover">{t("tour.loginCta")}</Link>
      </div>
    );
  }
  if (status === "loading") return <p className="mt-6 text-sm text-neutral-500">{t("tour.loading")}</p>;
  if (status === "error") return <p className="mt-6 text-sm text-neutral-500">{t("tour.loadError")}</p>;

  const r = rates!;
  const hasUnknownSurface = r.bySurface.some((b) => b.key === "unknown");
  const tile = "rounded-2xl bg-black/[0.02] p-4 ring-1 ring-black/[0.05]";
  const label = "text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-400";
  const sectionH = "text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-400";

  // Leerstand (heute der Live-Fall: tour_events ist leer) — mit klarem Grund + Weg.
  if (matchCount === 0) {
    return (
      <div className="mt-8 space-y-3">
        <p className="rounded-xl bg-black/[0.02] px-4 py-4 text-[14px] text-neutral-600">{t("tour.formEmpty")}</p>
        <p className="rounded-xl bg-black/[0.02] px-4 py-3 text-[13px] text-neutral-500">{t("tour.formOpponentUnavailable")}</p>
      </div>
    );
  }

  /** Eine Quoten-Zeile mit Balken + Grundlage. */
  const rateRow = (key: string, name: string, tl: Tally) => (
    <div key={key} className="py-2">
      <div className="flex items-center justify-between gap-3 text-[13px]">
        <span className="min-w-0 truncate font-semibold text-neutral-800">{name}</span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="tabular-nums font-bold text-neutral-900">{pct(tl.rate)}</span>
          <span className="tabular-nums text-[11px] text-neutral-400">{basis(tl)}{tl.open > 0 ? ` · ${t("tour.formOpenCount", { n: tl.open })}` : ""}</span>
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
        <div className="h-full rounded-full bg-matchup" style={{ width: tl.rate == null ? "0%" : `${Math.round(tl.rate * 100)}%` }} />
      </div>
    </div>
  );

  return (
    <div className="mt-8 space-y-8">
      {/* ── Gesamt ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <div className={tile}>
          <p className={label}>{t("tour.formOverall")}</p>
          <p className="mt-1 text-[22px] font-extrabold tabular-nums text-neutral-900">{pct(r.overall.rate)}</p>
          <p className="mt-1 text-[11px] text-neutral-400">{r.overall.wins}–{r.overall.losses} · {basis(r.overall)}{r.overall.open > 0 ? ` · ${t("tour.formOpenCount", { n: r.overall.open })}` : ""}</p>
        </div>
        <div className={`${tile} col-span-1`}>
          <p className={label}>{t("tour.formMatchesLabel")}</p>
          <p className="mt-1 text-[22px] font-extrabold tabular-nums text-neutral-900">{r.overall.total}</p>
          <p className="mt-1 text-[11px] text-neutral-400">{t("tour.formBasis", { n: r.overall.decided })}</p>
        </div>
      </div>

      {/* ── Nach Belag ─────────────────────────────────────────────────────── */}
      <section>
        <h2 className={sectionH}>{t("tour.formBySurface")}</h2>
        <div className="mt-2 divide-y divide-black/[0.05]">
          {r.bySurface.map((b) => rateRow(b.key, surfaceLabel(b.key), b.tally))}
        </div>
        {hasUnknownSurface && <p className="mt-2 text-[11px] leading-relaxed text-neutral-400">{t("tour.formSurfaceGapNote")}</p>}
      </section>

      {/* ── Nach Kategorie ─────────────────────────────────────────────────── */}
      <section>
        <h2 className={sectionH}>{t("tour.formByCategory")}</h2>
        <div className="mt-2 divide-y divide-black/[0.05]">
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
                <p className="mt-1 text-[17px] font-extrabold tabular-nums text-neutral-900">{p.points}</p>
                <p className="mt-1 text-[11px] text-neutral-400">{t("tour.formPointsN", { n: p.n })}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Bilanz je Saison ───────────────────────────────────────────────── */}
      <section>
        <h2 className={sectionH}>{t("tour.formSeasonBalance")}</h2>
        <ul className="mt-2 divide-y divide-black/[0.05]">
          {seasons.map((s) => (
            <li key={String(s.season)} className="flex items-center justify-between py-2 text-[13px]">
              <span className="font-semibold text-neutral-800">{s.season ?? t("tour.formSeasonUnknown")}</span>
              <span className="tabular-nums text-neutral-500">{s.wins}–{s.losses}{s.open > 0 ? ` · ${t("tour.formOpenCount", { n: s.open })}` : ""}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Bilanz je Turnier ──────────────────────────────────────────────── */}
      <section>
        <h2 className={sectionH}>{t("tour.formTournamentBalance")}</h2>
        <ul className="mt-2 divide-y divide-black/[0.05]">
          {tournaments.map((tb) => (
            <li key={tb.tournamentId} className="flex items-center justify-between gap-3 py-2 text-[13px]">
              <span className="min-w-0 truncate font-semibold text-neutral-800">{tb.tournamentName}</span>
              <span className="shrink-0 tabular-nums text-neutral-500">{tb.wins}–{tb.losses}{tb.open > 0 ? ` · ${t("tour.formOpenCount", { n: tb.open })}` : ""}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Was nicht geht: Gegnerstärke (kein Rang-Feld, MU-039) ──────────── */}
      <p className="rounded-xl bg-black/[0.02] px-4 py-3 text-[12px] leading-relaxed text-neutral-500">{t("tour.formOpponentUnavailable")}</p>
    </div>
  );
}
