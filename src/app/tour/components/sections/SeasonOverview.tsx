"use client";

import { useT } from "@/lib/i18n";
import { minorToEuro } from "@/lib/tourCosts";
import type { MoneyBag } from "@/domain/tour/costs";
import type { WorkspaceData } from "../useTourWorkspace";
import { CARD } from "../tourUi";

/** MoneyBag (Minor Units je Währung) → Anzeige „49.50 EUR · 20 USD", oder „—" wenn leer. */
function bagText(bag: MoneyBag): string {
  const keys = Object.keys(bag).filter((c) => bag[c] !== 0).sort();
  if (keys.length === 0) return "—";
  return keys.map((c) => `${minorToEuro(bag[c])} ${c}`).join(" · ");
}

/** Eine Kachel im Überblick. */
function Tile({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`${CARD} px-4 py-4`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">{label}</p>
      <p className={`mt-1 text-3xl font-extrabold tracking-tight ${accent ? "text-matchup" : "text-neutral-900"}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[12px] text-neutral-500">{sub}</p>}
    </div>
  );
}

/**
 * Saisonüberblick: Budget (verplant GEGEN tatsächlich ausgegeben — „liege ich über
 * Plan?"), Punktestand, Anzahl Turniere, Schengen. Alle Zahlen kommen gebündelt aus
 * useTourWorkspace (Domain-Bausteine costs/points/schengen).
 */
export default function SeasonOverview({ data }: { data: WorkspaceData }) {
  const t = useT();
  const cur = data.rates?.currency ?? null;

  // Budget-Kachel: verplant vs. ausgegeben. Vergleich nur innerhalb DERSELBEN Währung
  // (der Sätze-Währung); andere Währungen werden separat ausgewiesen, nie vermischt.
  const plannedText = bagText(data.seasonCost.total);
  const spentText = bagText(data.spentByCurrency);
  const plannedPrimary = cur ? data.seasonCost.total[cur] ?? 0 : 0;
  const spentPrimary = cur ? data.spentByCurrency[cur] ?? 0 : 0;
  const overPlan = cur != null && plannedPrimary > 0 && spentPrimary > plannedPrimary;

  const budgetText = data.seasonBudget != null ? `${data.seasonBudget}${cur ? " " + cur : ""}` : t("tour.wsBudgetNotSet");

  return (
    <section>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile
          label={t("tour.wsBudgetLabel")}
          value={budgetText}
          sub={t("tour.wsBudgetSpentPlanned", { spent: spentText, planned: plannedText })}
        />
        <Tile label={t("tour.wsPointsLabel")} value={String(data.points.total)} sub={t("tour.wsPointsSub", { n: data.points.limit })} accent />
        <Tile label={t("tour.wsTournamentsLabel")} value={String(data.entries.length)} />
        <Tile label={t("tour.wsSchengenLabel")} value={`${data.schengen.used}/90`} sub={t("tour.wsSchengenSub", { n: data.schengen.left })} />
      </div>
      {overPlan && <p className="mt-2 text-[12px] font-semibold text-amber-700">{t("tour.wsOverPlan")}</p>}
    </section>
  );
}
