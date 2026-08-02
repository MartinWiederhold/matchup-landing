"use client";

import { useT, useLocale } from "@/lib/i18n";
import { tourDeadlines } from "@/domain/tour/deadlines";
import type { TourTournament } from "@/lib/types";

// Turniermontag ist ein Kalendertag → in UTC formatieren, damit sich das Datum
// nicht durch die lokale Zeitzone verschiebt.
function fmtMonday(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "de" ? "de-CH" : "en-GB", {
    weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date(iso + "T00:00:00Z"));
}
// Fristen sind echte Zeitpunkte (14:00 GMT) → in der LOKALEN Zeitzone anzeigen,
// inklusive Zeitzonen-Kürzel, damit klar ist, worauf sich die Angabe bezieht.
function fmtDeadline(d: Date, locale: string) {
  return new Intl.DateTimeFormat(locale === "de" ? "de-CH" : "en-GB", {
    weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    timeZoneName: "short",
  }).format(d);
}

/** Eine Fristzeile: Label + Zeitpunkt (lokal), abgelaufene dezent markiert. */
function DeadlineRow({ label, date, suffix }: { label: string; date: Date; suffix?: string }) {
  const { locale } = useLocale();
  const t = useT();
  const expired = date.getTime() < Date.now();
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 text-[13px]">
      <span className="text-neutral-500">
        {label}
        {suffix && <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">{suffix}</span>}
      </span>
      <span className={expired ? "text-neutral-400 line-through" : "font-medium text-neutral-800"}>
        {fmtDeadline(date, locale)}
        {expired && <span className="ml-1.5 text-[10px] uppercase tracking-wide text-neutral-400 no-underline">({t("tour.expired")})</span>}
      </span>
    </div>
  );
}

export default function TournamentCard({ tournament: x }: { tournament: TourTournament }) {
  const t = useT();
  const { locale } = useLocale();

  const countryName = (() => {
    if (!x.country) return t("tour.fieldMissing");
    const n = t(`tour.country.${x.country}`);
    return n.startsWith("tour.country.") ? x.country : n; // ehrlicher Fallback auf ISO-Code
  })();
  const surfaceLabel = x.surface ? t(`tour.surface_${x.surface}`) : null;
  const hall = x.indoor === true ? t("tour.indoor") : x.indoor === false ? t("tour.outdoor") : null;

  // Fristen berechnen (Turniermontag als UTC-Mitternacht in die reine Domain-Funktion).
  const dl = tourDeadlines(new Date(x.tournament_monday + "T00:00:00Z"), x.series);

  return (
    <article className="rounded-2xl border border-black/[0.08] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold tracking-tight text-neutral-900">
            {x.city || t("tour.fieldMissing")}
            <span className="text-neutral-400">, </span>
            <span className="text-neutral-600">{countryName}</span>
          </h2>
          <p className="mt-0.5 text-[12px] text-neutral-500">
            {x.series === "itf_wtt" ? t("tour.seriesItf") : t("tour.seriesChallenger")}
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

      {/* Fristen */}
      <div className="mt-4 border-t border-black/[0.06] pt-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.deadlinesTitle")}</p>
        {dl.known && dl.entry && dl.withdrawal && dl.freezeVarianteA ? (
          <div className="mt-1">
            <DeadlineRow label={t("tour.entry")} date={dl.entry} />
            <DeadlineRow label={t("tour.withdrawal")} date={dl.withdrawal} />
            {/* Bewusst nur Variante A, sichtbar als ungeprüft markiert. */}
            <DeadlineRow label={t("tour.freeze")} date={dl.freezeVarianteA} suffix={t("tour.freezeUnverified")} />
            <p className="mt-2 text-[11px] text-neutral-400">{t("tour.tzHint")}</p>
          </div>
        ) : (
          // Challenger: Regel unbekannt — ehrlich anzeigen, nicht kaschieren.
          <div className="mt-1 rounded-lg bg-black/[0.035] px-3 py-2.5">
            <p className="text-[13px] font-semibold text-neutral-700">{t("tour.challengerUnknownTitle")}</p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-neutral-500">{t("tour.challengerUnknownText")}</p>
          </div>
        )}
      </div>
    </article>
  );
}
