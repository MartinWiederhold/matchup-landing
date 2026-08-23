"use client";

import { useT, useLocale } from "@/lib/i18n";
import type { TourTournament } from "@/lib/types";
import TourDeadlineBlock from "./TourDeadlineBlock";
import TourDecideBlock from "./TourDecideBlock";
import AddToSeasonButton from "./AddToSeasonButton";

// Turniermontag ist ein Kalendertag → in UTC formatieren, damit sich das Datum
// nicht durch die lokale Zeitzone verschiebt.
function fmtMonday(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "de" ? "de-CH" : "en-GB", {
    weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date(iso + "T00:00:00Z"));
}

/**
 * Turnierkarte im Kalender (/tour). Fristen- und Einschätzungsblock kommen aus den
 * geteilten Komponenten (identisch zur Saison-Ansicht). Der Aufnehmen-Knopf wird
 * nur gerendert, wenn ein eingeloggter Nutzer feststeht (userId + onSeasonChange).
 */
export default function TournamentCard({
  tournament: x,
  userId,
  inSeason,
  onSeasonChange,
}: {
  tournament: TourTournament;
  userId?: string | null;
  inSeason?: boolean;
  onSeasonChange?: (id: string, next: boolean) => void;
}) {
  const t = useT();
  const { locale } = useLocale();

  const countryName = (() => {
    if (!x.country) return t("tour.fieldMissing");
    const n = t(`tour.country.${x.country}`);
    return n.startsWith("tour.country.") ? x.country : n; // ehrlicher Fallback auf ISO-Code
  })();
  const surfaceLabel = x.surface ? t(`tour.surface_${x.surface}`) : null;
  const hall = x.indoor === true ? t("tour.indoor") : x.indoor === false ? t("tour.outdoor") : null;

  return (
    <article className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold tracking-tight text-neutral-900">
            {x.city || t("tour.fieldMissing")}
            <span className="text-neutral-400">, </span>
            <span className="text-neutral-600">{countryName}</span>
          </h2>
          <p className="mt-0.5 text-[12px] text-neutral-500">
            {x.series === "itf_wtt" ? t("tour.seriesItf") : x.series === "itf_juniors" ? t("tour.seriesJuniors") : x.series === "wta" ? t("tour.seriesWta") : t("tour.seriesChallenger")}
            {" · "}
            {t("tour.mondayLabel")} {fmtMonday(x.tournament_monday, locale)}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-matchup/10 px-3 py-1 text-[12px] font-bold text-matchup">
          {x.category || t("tour.fieldMissing")}
        </span>
      </div>

      {/* Belag/Halle + Preisgeld */}
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-neutral-600">
        <span>
          {t("tour.surfaceLabel")}: {surfaceLabel ?? t("tour.fieldMissing")}
          {hall && <span className="text-neutral-400"> · {hall}</span>}
        </span>
        {x.prize_money && (
          <span>
            {t("tour.prizeLabel")}: {Number(x.prize_money).toLocaleString(locale === "de" ? "de-CH" : "en-GB")}
            {x.prize_currency ? ` ${x.prize_currency}` : ""}
          </span>
        )}
      </div>

      <TourDeadlineBlock tournament={x} />
      {/* Kalender-Liste: OHNE prevPlace (keine Reisekette) → decide ohne cost-Teil. */}
      <TourDecideBlock tournament={x} />

      {userId && onSeasonChange && (
        <AddToSeasonButton
          tournamentId={x.id}
          userId={userId}
          inSeason={!!inSeason}
          onChange={(next) => onSeasonChange(x.id, next)}
        />
      )}
    </article>
  );
}
