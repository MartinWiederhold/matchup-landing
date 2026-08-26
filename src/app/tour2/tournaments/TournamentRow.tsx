"use client";

import { useT, useLocale } from "@/lib/i18n";
import type { TourTournament } from "@/lib/types";

function fmtDay(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "de" ? "de-CH" : "en-GB", {
    day: "numeric", month: "short", timeZone: "UTC",
  }).format(new Date(iso + "T00:00:00Z"));
}

export default function TournamentRow({
  tt,
  countryName,
  selected,
  inSeason,
  weekEnd,
  prize,
  deadline,
  cost,
  pts,
  onSelect,
  onToggle,
}: {
  tt: TourTournament;
  countryName: string;
  selected: boolean;
  inSeason: boolean;
  weekEnd: string;
  prize: string | null;
  deadline: string;
  cost: string | null;
  pts: number;
  onSelect: () => void;
  onToggle: () => void;
}) {
  const t = useT();
  const { locale } = useLocale();
  const series = tt.series === "itf_wtt" ? t("tour.seriesItf") : tt.series === "itf_juniors" ? t("tour.seriesJuniors") : tt.series === "wta" ? t("tour.seriesWta") : t("tour.seriesChallenger");
  const surface = tt.surface ? t(`tour.surface_${tt.surface}`) : t("tour.fieldMissing");

  return (
    <div className={`flex h-full items-start gap-2 px-1 py-2 ${selected ? "border-l-2 border-matchup bg-[color-mix(in_srgb,var(--t2-accent)_8%,transparent)]" : "border-l-2 border-transparent"}`}>
      <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
        <p className="truncate text-[15px] font-semibold tracking-tight">
          {tt.city || t("tour.fieldMissing")}
          <span className="text-[var(--t2-muted)]">, {countryName}</span>
        </p>
        <p className="text-[11px] text-[var(--t2-muted)]">
          {t("tour.t2findColWeek")} {fmtDay(tt.tournament_monday, locale)}–{fmtDay(weekEnd, locale)}
          {" · "}{tt.category || "—"}
          {" · "}{surface}
          {" · "}{series}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-[var(--t2-muted)]">
          {t("tour.prizeLabel")}: {prize ?? "—"}
          {" · "}{deadline}
          {" · "}{cost ?? "—"}
          {pts > 0 ? ` · ${t("tour.t2ptsAssume", { n: pts })}` : ""}
        </p>
      </button>
      <button
        type="button"
        onClick={onToggle}
        aria-label={inSeason ? t("tour.seasonRemove") : t("tour.addToSeason")}
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center text-[14px] font-bold ${inSeason ? "bg-[var(--t2-ink)] text-white" : "border border-[var(--t2-line)] text-[var(--t2-ink)]"}`}
      >
        {inSeason ? "✓" : "+"}
      </button>
    </div>
  );
}
