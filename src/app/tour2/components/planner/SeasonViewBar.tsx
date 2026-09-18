"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";

export const SEASON_VIEWS = ["chain", "weeks", "calendar", "timeline"] as const;
export type SeasonView = (typeof SEASON_VIEWS)[number];

export function parseSeasonView(raw: string | null | undefined): SeasonView {
  if (raw === "weeks" || raw === "calendar" || raw === "timeline") return raw;
  return "chain";
}

export default function SeasonViewBar({ view, hrefFor }: { view: SeasonView; hrefFor: (v: SeasonView) => string }) {
  const t = useT();
  const labels: Record<SeasonView, string> = {
    chain: t("tour.t2viewChain"),
    weeks: t("tour.t2viewWeeks"),
    calendar: t("tour.t2viewCalendar"),
    timeline: t("tour.t2viewTimeline"),
  };
  return (
    <nav className="mt-3 flex flex-wrap gap-1" aria-label={t("tour.t2navPlanner")}>
      {SEASON_VIEWS.map((v) => (
        <Link
          key={v}
          href={hrefFor(v)}
          className={`rounded-full px-3 py-1 t2-fs-micro font-semibold ${
            view === v ? "bg-[var(--t2-ink)] text-[var(--t2-on-accent)]" : "text-[var(--t2-muted)] hover:text-[var(--t2-ink)]"
          }`}
        >
          {labels[v]}
        </Link>
      ))}
    </nav>
  );
}
