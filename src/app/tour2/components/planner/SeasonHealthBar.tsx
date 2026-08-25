"use client";

/**
 * Saison-Gesundheitsleiste (Etappe 2): belegte Kennzahlen + Optimierer-CTA.
 * Haarlinien wie Home/Kalender — keine Cadillac-Karten, keine Belastungslampe.
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
  const notes = [
    tightCount === 1 ? t("tour.t2healthTightOne") : tightCount > 0 ? t("tour.t2healthTight", { n: tightCount }) : null,
    schengen?.exceeds ? t("tour.t2healthSchengenOver", { n: schengenOver }) : schengenNear ? t("tour.t2healthSchengenNear", { used: schengen!.used }) : null,
  ].filter(Boolean);

  return (
    <div className="flex shrink-0 flex-col gap-3 border-b border-[var(--t2-line)] px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
      <div className="min-w-0 flex-1">
        <dl className="t2-telem !border-b-0">
          <div>
            <dt>{t("tour.t2count")}</dt>
            <dd>{count}</dd>
          </div>
          <div>
            <dt>{t("tour.t2budget")}</dt>
            <dd className={budgetOver ? "text-red-700" : ""}>{budgetText ?? t("tour.t2budgetNoData")}</dd>
          </div>
          <div>
            <dt>{t("tour.t2expPoints")} · {t("tour.t2pointsAssume", { round: roundLabel })}</dt>
            <dd>{points}</dd>
          </div>
        </dl>
        {notes.length > 0 && (
          <p className="mt-2 text-[12px] text-[var(--t2-muted)]">{notes.join(" · ")}</p>
        )}
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
