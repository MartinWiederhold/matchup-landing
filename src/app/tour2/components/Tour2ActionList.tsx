"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";
import type { ActionItem } from "@/domain/tour/actionBoard";
import { tour2ActionHref, tour2PlannerTournamentHref } from "./t2Action";

/** Klickbare Handlungsbedarf-Liste (Home + Saison). Texte über i18n, Ziele über t2Action. */
export default function Tour2ActionList({
  actions,
  countryName,
  fmtDate,
  money,
  onOpenTournament,
}: {
  actions: ActionItem[];
  countryName: (c: string | null) => string;
  fmtDate: (iso: string) => string;
  money: (minor: number, currency: string) => string;
  onOpenTournament?: (id: string) => void;
}) {
  const t = useT();

  const actionText = (a: ActionItem): string => {
    const p = a.params;
    if (a.kind === "doc_expired" || a.kind === "doc_expiring") {
      return t(`tour.docWarn_${p.kind}`, { date: p.date ?? "", days: p.days ?? 0, dest: p.dest ? countryName(String(p.dest)) : "" });
    }
    if (a.kind === "budget_over") return t("tour.action_budget_over", { amount: money(Number(p.amount), String(p.currency)) });
    if (a.kind === "entry_banned") return t("tour.action_entry_banned", { city: p.city ?? "", dest: countryName(String(p.dest)) });
    if (a.kind === "points_expiring") return t("tour.action_points_expiring", { points: p.points ?? 0, date: fmtDate(String(p.date)) });
    if (a.kind === "visa_lead") return t("tour.action_visa_lead", { city: p.city ?? "", dest: countryName(String(p.dest)), weeks: p.weeks ?? 0, lead: p.lead ?? 0 });
    return t(`tour.action_${a.kind}`, p);
  };
  const isRuleOfThumb = (a: ActionItem) => (a.kind === "doc_expiring" || a.kind === "doc_expired") && a.params.ruleOfThumb === 1;
  const isUserEstimate = (a: ActionItem) => a.kind === "visa_lead";

  if (actions.length === 0) {
    return <p className="mt-4 text-[17px] font-semibold tracking-tight">{t("tour.boardClear")}</p>;
  }

  return (
    <ul className="mt-4 divide-y divide-black/10 border-y border-black/10">
      {actions.map((a, i) => {
        const href = a.target.type === "tournament"
          ? tour2PlannerTournamentHref(a.target.id)
          : tour2ActionHref(a.target.href);
        return (
          <li key={`${a.kind}-${i}`}>
            <Link
              href={href}
              onClick={() => { if (a.target.type === "tournament") onOpenTournament?.(a.target.id); }}
              className="flex w-full items-start gap-4 py-4 text-left hover:text-matchup"
            >
              <span aria-hidden className={`mt-2 h-1.5 w-1.5 shrink-0 ${a.severity === "red" ? "bg-red-600" : "bg-matchup"}`} />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold leading-snug tracking-tight">{actionText(a)}</span>
                {isRuleOfThumb(a) && <span className="mt-1 block text-[12px] font-normal text-[var(--t2-muted)]">{t("tour.docWarnRuleOfThumb")}</span>}
                {isUserEstimate(a) && <span className="mt-1 block text-[12px] font-normal text-[var(--t2-muted)]">{t("tour.visaLeadUserEstimate")}</span>}
              </span>
              <span className="mt-0.5 shrink-0 text-matchup">→</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
