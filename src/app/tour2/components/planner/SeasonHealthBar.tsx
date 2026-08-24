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
    <div className="flex shrink-0 flex-col gap-3 border-b border-black/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <p className="text-[15px] font-bold tabular-nums text-neutral-900">{t("tour.t2count")}: {count}</p>
          <p className={`text-[15px] font-bold tabular-nums ${budgetOver ? "text-red-600" : "text-neutral-900"}`}>
            {budgetText ?? <span className="font-semibold text-neutral-400">{t("tour.t2budgetNoData")}</span>}
          </p>
          <p className="text-[15px] font-bold tabular-nums text-neutral-900">
            {points}
            <span className="ml-1.5 text-[11px] font-semibold text-neutral-500">{t("tour.t2expPoints")} · {t("tour.t2pointsAssume", { round: roundLabel })}</span>
          </p>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tightCount > 0 && (
            <span className="border border-black/15 px-2.5 py-1 text-[11px] font-bold text-neutral-800">
              {tightCount === 1 ? t("tour.t2healthTightOne") : t("tour.t2healthTight", { n: tightCount })}
            </span>
          )}
          {schengen?.exceeds && (
            <span className="border border-black/20 px-2.5 py-1 text-[11px] font-bold text-neutral-900">
              {t("tour.t2healthSchengenOver", { n: schengenOver })}
            </span>
          )}
          {schengenNear && (
            <span className="border border-black/15 px-2.5 py-1 text-[11px] font-bold text-neutral-800">
              {t("tour.t2healthSchengenNear", { used: schengen!.used })}
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onPlan}
        disabled={planning || planDisabled}
        className="shrink-0 rounded-full bg-matchup px-5 py-2.5 text-[13px] font-bold text-white hover:bg-matchup-hover disabled:opacity-40"
      >
        {planning ? t("tour.wsPlanning") : t("tour.wsFill")}
      </button>
    </div>
  );
}
