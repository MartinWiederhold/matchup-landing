"use client";

import { useT, useLocale } from "@/lib/i18n";
import { expectedPoints } from "@/domain/tour/points";
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
  onSelect,
  onToggle,
}: {
  tt: TourTournament;
  countryName: string;
  selected: boolean;
  inSeason: boolean;
  onSelect: () => void;
  onToggle: () => void;
}) {
  const t = useT();
  const { locale } = useLocale();
  const pts = expectedPoints(tt.category, "R16", tt.tournament_monday).points;
  const series = tt.series === "itf_wtt" ? t("tour.seriesItf") : tt.series === "itf_juniors" ? t("tour.seriesJuniors") : tt.series === "wta" ? t("tour.seriesWta") : t("tour.seriesChallenger");

  return (
    <div className={`flex items-start gap-2 rounded-xl px-2 py-2 ${selected ? "bg-matchup/20 ring-1 ring-matchup/50" : "hover:bg-white/[0.04]"}`}>
      <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
        <p className="truncate text-[13px] font-semibold text-white">
          {tt.city || t("tour.fieldMissing")}
          <span className="text-neutral-500">, {countryName}</span>
        </p>
        <p className="text-[11px] text-neutral-400">{fmtDay(tt.tournament_monday, locale)} · {tt.category || "—"} · {series}</p>
        {pts > 0 && (
          <p className="mt-0.5 text-[11px] font-semibold text-neutral-500">
            {t("tour.t2ptsAssume", { n: pts })} · {t("tour.t2pointsAssume", { round: t("tour.round_R16") })}
          </p>
        )}
      </button>
      <button
        type="button"
        onClick={onToggle}
        aria-label={inSeason ? t("tour.seasonRemove") : t("tour.addToSeason")}
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[14px] font-bold ${inSeason ? "bg-emerald-500/20 text-emerald-300" : "bg-matchup/20 text-matchup"}`}
      >
        {inSeason ? "✓" : "+"}
      </button>
    </div>
  );
}
