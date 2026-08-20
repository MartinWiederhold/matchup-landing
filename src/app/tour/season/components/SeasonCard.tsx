"use client";

import { useT, useLocale } from "@/lib/i18n";
import type { SeasonEntry, SeasonStatus } from "@/lib/tourSeason";
import TourDeadlineBlock from "../../components/TourDeadlineBlock";
import TourDecideBlock from "../../components/TourDecideBlock";
import { DeadlineCountdown, EntryPath } from "../../components/EntryDeadline";

// Vollständige Optionsliste — sonst zeigt das Dropdown einen neuen Status-Wert als LEERE
// Auswahl (stille Unstimmigkeit). Reihenfolge nach Lebenszyklus; confirmed/cancelled als
// Legacy hinten (werden nicht mehr neu vergeben). NUR die Liste erweitert, sonst nichts.
const STATUSES: SeasonStatus[] = ["planned", "entered", "main_draw", "qualifying", "alternate", "withdrawn", "confirmed", "cancelled"];

// Turniermontag ist ein Kalendertag → in UTC formatieren (keine Zeitzonen-Verschiebung).
function fmtMonday(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "de" ? "de-CH" : "en-GB", {
    weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date(iso + "T00:00:00Z"));
}

/**
 * Eine Saisonkarte: Turnierkopf + Fristen + Einschätzung (MIT prevPlace, damit
 * „Anreise entfällt" bei gleichem Ort wie die Vorstation greift) + Status-Auswahl
 * + Entfernen. Soft-gelöschte Turniere bleiben in der Saison, werden aber erklärt.
 */
export default function SeasonCard({
  entry,
  prevPlace,
  onRemove,
  onStatusChange,
}: {
  entry: SeasonEntry;
  prevPlace: string | null;
  onRemove: () => void;
  onStatusChange: (status: SeasonStatus) => void;
}) {
  const t = useT();
  const { locale } = useLocale();
  const x = entry.tournament;
  const now = Date.now(); // Stichtag für den Meldefrist-Countdown (aus der Komponente, nicht aus der Domain)

  const countryName = (() => {
    if (!x.country) return t("tour.fieldMissing");
    const n = t(`tour.country.${x.country}`);
    return n.startsWith("tour.country.") ? x.country : n; // ehrlicher Fallback auf ISO-Code
  })();
  const surfaceLabel = x.surface ? t(`tour.surface_${x.surface}`) : null;
  const hall = x.indoor === true ? t("tour.indoor") : x.indoor === false ? t("tour.outdoor") : null;

  return (
    <article className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-5">
      {/* Soft-gelöscht: Planzeile bleibt, wird aber erklärt (kein stiller Verlust). */}
      {entry.tournamentInactive && (
        <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-[12px] leading-relaxed text-amber-800">
          {t("tour.tournamentInactive")}
        </p>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold tracking-tight text-neutral-900">
            {x.city || t("tour.fieldMissing")}
            <span className="text-neutral-400">, </span>
            <span className="text-neutral-600">{countryName}</span>
          </h2>
          <p className="mt-0.5 text-[12px] text-neutral-500">
            {x.series === "itf_wtt" ? t("tour.seriesItf") : x.series === "itf_juniors" ? t("tour.seriesJuniors") : t("tour.seriesChallenger")}
            {" · "}
            {t("tour.mondayLabel")} {fmtMonday(x.tournament_monday, locale)}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-matchup/10 px-3 py-1 text-[12px] font-bold text-matchup">
          {x.category || t("tour.fieldMissing")}
        </span>
      </div>

      {/* Countdown zur Meldefrist — gut sichtbar: ITF zählt herunter (verstrichen wird
          benannt), Challenger ehrlich als „unbekannt" (nicht geraten). Stichtag = now. */}
      <p className="mt-2"><DeadlineCountdown tournament={x} now={now} /></p>

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
      {/* Weg zur Meldung — ehrlich beschriftet (kein Anmelde-Knopf), direkt unter den Fristen. */}
      <EntryPath tournament={x} />
      {/* Saison: MIT prevPlace → „Anreise entfällt, gleicher Ort" bzw. „Ortswechsel". */}
      <TourDecideBlock tournament={x} prevPlace={prevPlace} />

      {/* Status ändern + Entfernen */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] pt-3">
        <label className="flex items-center gap-2 text-[12px] text-neutral-500">
          {t("tour.statusLabel")}
          <select
            value={entry.status}
            onChange={(e) => onStatusChange(e.target.value as SeasonStatus)}
            className="rounded-full border border-black/15 px-3 py-1.5 text-[12px] font-semibold text-neutral-700 transition-colors hover:border-black/30"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{t(`tour.status_${s}`)}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={onRemove}
          className="text-[12px] font-semibold text-neutral-500 transition-colors hover:text-neutral-800"
        >
          {t("tour.seasonRemove")}
        </button>
      </div>
    </article>
  );
}
