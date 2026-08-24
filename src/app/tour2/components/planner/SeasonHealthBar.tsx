"use client";

/**
 * Saison-Gesundheitsleiste (Etappe 2): belegte Kennzahlen + Optimierer-CTA.
 * Keine Belastungslampe — dafür gibt es keine Regel.
 */

import { useT } from "@/lib/i18n";

export default function SeasonHealthBar({
  count,
  budgetText,
  budgetOver,
  points,
  roundLabel,
  tightCount,
  schengen,
  onPlan,
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
  onPlan: () => void;
  planning: boolean;
  planDisabled: boolean;
}) {
  const t = useT();
  const schengenOver = schengen?.exceeds ? Math.max(0, schengen.used - 90) : 0;
  const schengenNear = !!schengen && !schengen.exceeds && schengen.used >= 80;

  return (
    <div className="flex shrink-0 flex-col gap-3 border-b border-[var(--t2-line)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="min-w-0">
        <dl className="t2-telem !border-0">
          <div className="!border-0 !py-0">
            <dt>{t("tour.t2count")}</dt>
            <dd>{count}</dd>
          </div>
          <div className="!border-0 !py-0">
            <dt>{t("tour.t2budget")}</dt>
            <dd className={budgetOver ? "text-red-700" : ""}>{budgetText ?? t("tour.t2budgetNoData")}</dd>
          </div>
          <div className="!border-0 !py-0">
            <dt>{t("tour.t2expPoints")} · {t("tour.t2pointsAssume", { round: roundLabel })}</dt>
            <dd>{points}</dd>
          </div>
        </dl>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tightCount > 0 && (
            <span className="t2-chip is-on">
              {tightCount === 1 ? t("tour.t2healthTightOne") : t("tour.t2healthTight", { n: tightCount })}
            </span>
          )}
          {schengen?.exceeds && (
            <span className="t2-chip is-on">
              {t("tour.t2healthSchengenOver", { n: schengenOver })}
            </span>
          )}
          {schengenNear && (
            <span className="t2-chip">
              {t("tour.t2healthSchengenNear", { used: schengen!.used })}
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onPlan}
        disabled={planning || planDisabled}
        className="t2-cta shrink-0 disabled:opacity-40"
      >
        {planning ? t("tour.wsPlanning") : t("tour.wsFill")}
      </button>
    </div>
  );
}
