"use client";

/**
 * Overview-Tagesblick: heute / morgen. Kalender-Knopf in der Kopfzeile.
 */

import Link from "next/link";
import { useT } from "@/lib/i18n";
import type { GlanceRow } from "@/domain/tour/dayGlance";

export default function DayGlance({
  todayISO,
  groups,
}: {
  todayISO: string;
  groups: { date: string; rows: GlanceRow[] }[];
}) {
  const t = useT();
  const kindLabel = (row: GlanceRow) => {
    if (row.source === "tournament") return t("tour.calFilterTournaments");
    if (row.eventKind && ["training", "match", "physio", "travel", "gym", "other"].includes(row.eventKind)) {
      return t(`tour.calKind_${row.eventKind}`);
    }
    return t("tour.calKind_other");
  };
  const when = (row: GlanceRow) => {
    if (row.clock) return row.clock;
    if (row.block) return t(`tour.tsBlock_${row.block}`);
    return t("tour.calAllDay");
  };
  const title = (row: GlanceRow) => {
    if (row.source === "tournament") return row.city || t("tour.fieldMissing");
    if (row.title) return row.title;
    return kindLabel(row);
  };

  return (
    <section className="t2-dash-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="t2-fs-body font-semibold tracking-tight">{t("tour.t2ovGlance")}</h2>
        <Link href="/tour2/calendar" className="t2-cta">
          {t("tour.t2ovGlanceCal")}<span aria-hidden>→</span>
        </Link>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {groups.map((g) => (
          <div key={g.date}>
            <p className="t2-fs-meta font-semibold uppercase tracking-[0.16em] text-[var(--t2-faint)]">
              {g.date === todayISO ? t("tour.t2ovToday") : t("tour.t2ovTomorrow")}
            </p>
            {g.rows.length === 0 ? (
              <p className="mt-2 t2-fs-body-sm text-[var(--t2-muted)]">{t("tour.t2ovGlanceEmpty")}</p>
            ) : (
              <ul className="mt-1.5">
                {g.rows.map((row) => (
                  <li key={row.id}>
                    <Link href={row.href} className="flex w-full items-baseline gap-3 py-1.5 text-left hover:text-[var(--t2-accent)]">
                      <span className="w-[4.75rem] shrink-0 t2-fs-micro font-semibold tabular-nums text-[var(--t2-muted)]">{when(row)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate t2-fs-body font-semibold tracking-tight">{title(row)}</span>
                        <span className="mt-0.5 block truncate t2-fs-meta text-[var(--t2-muted)]">
                          {[kindLabel(row), row.personName ? t("tour.t2ovGlanceWith", { name: row.personName }) : null].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
