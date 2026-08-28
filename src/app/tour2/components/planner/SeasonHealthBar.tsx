"use client";

/**
 * Saison-Kopf: Kennzahlen plus der kurze Optimierer-Ablauf (Ziel, Budget,
 * Zeitraum, Region, Wochen am Stück, Puffer). Vorschlag entsteht erst auf Klick,
 * Übernehmen bleibt ein zweiter Schritt.
 */

import { useT } from "@/lib/i18n";
import type { SeasonObjective } from "@/domain/tour/optimizeSeason";
import type { Frame, RegionMode } from "@/lib/tourPlanner";

export default function SeasonHealthBar({
  count,
  budgetText,
  budgetOver,
  points,
  roundLabel,
  tightCount,
  schengen,
  objective,
  onObjective,
  budget,
  onBudget,
  frame,
  onFrame,
  maxStreak,
  onMaxStreak,
  buffer,
  onBuffer,
  onPlan,
  onMore,
  planning,
  planDisabled,
}: {
  count: number;
  budgetText: string | null;
  budgetOver: boolean;
  points: number;
  roundLabel: string;
  tightCount: number;
  schengen: { exceeds: boolean; used: number; left: number } | null;
  objective: SeasonObjective;
  onObjective: (o: SeasonObjective) => void;
  budget: string;
  onBudget: (v: string) => void;
  frame: Frame;
  onFrame: (patch: Partial<Frame>) => void;
  maxStreak: string;
  onMaxStreak: (v: string) => void;
  buffer: string;
  onBuffer: (v: string) => void;
  onPlan: () => void;
  onMore: () => void;
  planning: boolean;
  planDisabled: boolean;
}) {
  const t = useT();
  const schengenOver = schengen?.exceeds ? Math.max(0, schengen.used - 90) : 0;
  const schengenNear = !!schengen && !schengen.exceeds && schengen.used >= 80;
  const notes = [
    tightCount === 1 ? t("tour.t2healthTightOne") : tightCount > 0 ? t("tour.t2healthTight", { n: tightCount }) : null,
    schengen?.exceeds ? t("tour.t2healthSchengenOver", { n: schengenOver }) : schengenNear ? t("tour.t2healthSchengenNear", { used: schengen!.used }) : null,
  ].filter(Boolean);
  const chip = (on: boolean) => `t2-chip ${on ? "is-on" : ""}`;
  const setRegion = (region: RegionMode) => onFrame({ region, countries: [] });

  return (
    <div className="shrink-0 border-b border-[var(--t2-line)] px-4 py-4 sm:px-6">
      <dl className="t2-telem !border-b-0">
        <div>
          <dt>{t("tour.t2count")}</dt>
          <dd>{count}</dd>
        </div>
        <div>
          <dt>{t("tour.t2budget")}</dt>
          <dd className={budgetOver ? "text-[var(--t2-danger)]" : ""}>{budgetText ?? t("tour.t2budgetNoData")}</dd>
        </div>
        <div>
          <dt>{t("tour.t2expPoints")}</dt>
          <dd>{points}</dd>
          <p className="mt-1 t2-fs-meta font-medium text-[var(--t2-faint)]">{t("tour.t2pointsAssume", { round: roundLabel })}</p>
        </div>
      </dl>
      {notes.length > 0 && (
        <p className="mt-2 t2-fs-micro text-[var(--t2-muted)]">{notes.join(" · ")}</p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <span className="mb-1 block t2-fs-meta font-semibold uppercase tracking-[0.12em] text-[var(--t2-faint)]">{t("tour.wsObjectiveTitle")}</span>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => onObjective("most_tournaments")} className={chip(objective === "most_tournaments")}>{t("tour.wsObjTournaments")}</button>
            <button type="button" onClick={() => onObjective("most_points")} className={chip(objective === "most_points")}>{t("tour.wsObjPoints")}</button>
          </div>
        </div>
        <label className="block">
          <span className="mb-1 block t2-fs-meta font-semibold uppercase tracking-[0.12em] text-[var(--t2-faint)]">{t("tour.plBudget")}</span>
          <input value={budget} onChange={(e) => onBudget(e.target.value)} inputMode="numeric" placeholder="—" className="t2-input" />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1 block t2-fs-meta font-semibold uppercase tracking-[0.12em] text-[var(--t2-faint)]">{t("tour.plFrom")}</span>
            <input type="date" value={frame.from} onChange={(e) => onFrame({ from: e.target.value })} className="t2-input" />
          </label>
          <label className="block">
            <span className="mb-1 block t2-fs-meta font-semibold uppercase tracking-[0.12em] text-[var(--t2-faint)]">{t("tour.plTo")}</span>
            <input type="date" value={frame.to} onChange={(e) => onFrame({ to: e.target.value })} className="t2-input" />
          </label>
        </div>
        <div>
          <span className="mb-1 block t2-fs-meta font-semibold uppercase tracking-[0.12em] text-[var(--t2-faint)]">{t("tour.plRegion")}</span>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setRegion("europe")} className={chip(frame.region === "europe" && (frame.countries?.length ?? 0) === 0)}>{t("tour.plRegionEurope")}</button>
            <button type="button" onClick={() => setRegion("all")} className={chip(frame.region === "all" && (frame.countries?.length ?? 0) === 0)}>{t("tour.plRegionAll")}</button>
          </div>
        </div>
        <label className="block">
          <span className="mb-1 block t2-fs-meta font-semibold uppercase tracking-[0.12em] text-[var(--t2-faint)]">{t("tour.t2optMaxStreak")}</span>
          <input value={maxStreak} onChange={(e) => onMaxStreak(e.target.value)} inputMode="numeric" placeholder="—" className="t2-input" />
        </label>
        <label className="block">
          <span className="mb-1 block t2-fs-meta font-semibold uppercase tracking-[0.12em] text-[var(--t2-faint)]">{t("tour.t2optBufferShort")}</span>
          <input value={buffer} onChange={(e) => onBuffer(e.target.value)} inputMode="numeric" placeholder="2" className="t2-input" />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={onPlan} disabled={planning || planDisabled} className="t2-cta disabled:opacity-40">
          {planning ? t("tour.wsPlanning") : t("tour.wsFill")}
        </button>
        <button type="button" onClick={onMore} className="t2-fs-micro font-semibold text-[var(--t2-accent)]">{t("tour.t2optMoreFilters")}</button>
      </div>
    </div>
  );
}
