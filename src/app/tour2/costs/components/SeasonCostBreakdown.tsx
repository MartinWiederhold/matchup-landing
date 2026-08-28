"use client";

import { useT, useLocale } from "@/lib/i18n";
import { computeSeasonCost, type CostParams, type MoneyBag } from "@/domain/tour/costs";
import { minorToEuro } from "@/lib/tourCosts";
import { placeKey } from "../../components/TourDecideBlock";
import type { SeasonEntry } from "@/lib/tourSeason";
import { displayCity } from "@/domain/tour/displayCity";

// Turnierwoche als UTC-Kalendertag formatieren (keine Zeitzonen-Verschiebung).
function fmtMonday(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "de" ? "de-CH" : "en-GB", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  }).format(new Date(iso + "T00:00:00Z"));
}

// Betrag (Cent) + Währung → Anzeige. Nie währungsübergreifend addiert.
function money(amount: number, currency: string) {
  return `${minorToEuro(amount)} ${currency}`;
}

/** Ein MoneyBag als Liste „Betrag Währung" (getrennt je Währung). */
function BagLines({ bag }: { bag: MoneyBag }) {
  const keys = Object.keys(bag).sort();
  if (keys.length === 0) return null;
  return <>{keys.map((c) => <span key={c} className="tabular-nums">{money(bag[c], c)}</span>)}</>;
}

/**
 * Die Saison, gerechnet mit computeSeasonCost. Fehlende Kostensätze werden als
 * „unbekannt" ausgewiesen (nie geschätzt). Fehlt die Nächte-Annahme, bleiben
 * Übernachtung/Verpflegung/Coach unbekannt — die Anreise-/Cluster-Rechnung
 * (der eigentliche Nutzen) funktioniert trotzdem.
 */
export default function SeasonCostBreakdown({
  entries,
  rates,
  nights,
}: {
  entries: SeasonEntry[];
  rates: { arrival_minor: number | null; per_night_minor: number | null; food_per_day_minor: number | null; coach_per_week_minor: number | null; currency: string | null } | null;
  nights: number | null;
}) {
  const t = useT();
  const { locale } = useLocale();

  const cur = rates?.currency ?? null;
  const m = (amount: number | null) => (amount != null && cur ? { amount, currency: cur } : null);
  const params: CostParams = {
    arrival: m(rates?.arrival_minor ?? null),
    perNight: m(rates?.per_night_minor ?? null),
    foodPerDay: m(rates?.food_per_day_minor ?? null),
    coachPerWeek: m(rates?.coach_per_week_minor ?? null),
  };

  // Nächte ist die Nutzer-Annahme; ohne Angabe 0 → costs.ts lässt Übernachtung/
  // Verpflegung/Coach weg (wir weisen sie separat als „unbekannt" aus).
  const nightsPerStation = nights ?? 0;
  const stations = entries.map((e) => ({ place: placeKey(e.tournament), nights: nightsPerStation }));
  const result = computeSeasonCost(stations, params);

  // Welche PFLICHT-Sätze fehlen (Coach ist optional und zählt hier nicht)?
  const missing: string[] = [];
  if (!params.arrival) missing.push(t("tour.costsItem_arrival"));
  if (!params.perNight) missing.push(t("tour.costsItem_lodging"));
  if (!params.foodPerDay) missing.push(t("tour.costsItem_food"));

  // Eingesparter Betrag durch Cluster (nur wenn der Anreisesatz bekannt ist).
  const savedMoney = params.arrival && result.arrivalsSaved > 0
    ? money(params.arrival.amount * result.arrivalsSaved, params.arrival.currency)
    : null;

  return (
    <section className="mt-8">
      <h2 className="t2-section-title">{t("tour.costsCalcTitle")}</h2>

      {/* Hinweise oben: fehlende Nächte / fehlende Sätze — sichtbar, aber unaufgeregt. */}
      {nights == null && (
        <p className="mt-3 rounded-lg bg-[var(--t2-warn-surface)] px-3 py-2 t2-fs-micro leading-relaxed text-[var(--t2-warn)]">{t("tour.costsNightsMissing")}</p>
      )}
      {missing.length > 0 && (
        <p className="mt-2 t2-fs-micro leading-relaxed text-[var(--t2-muted)]">
          {t("tour.costsMissingRates", { list: missing.join(", ") })}
        </p>
      )}

      {/* Stationen */}
      <div className="mt-4 space-y-3">
        {result.stations.map((st, i) => {
          const x = entries[i].tournament;
          const countryName = x.country ? (t(`tour.country.${x.country}`).startsWith("tour.country.") ? x.country : t(`tour.country.${x.country}`)) : t("tour.fieldMissing");
          return (
            <article key={entries[i].planId} className="t2-panel">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="t2-fs-body font-bold tracking-tight text-[var(--t2-text)]">
                  {displayCity(x.city) || t("tour.fieldMissing")}
                  <span className="text-[var(--t2-faint)]">, </span>
                  <span className="text-[var(--t2-muted)]">{countryName}</span>
                </h3>
                <span className="t2-fs-micro text-[var(--t2-muted)]">{t("tour.mondayLabel")} {fmtMonday(x.tournament_monday, locale)}</span>
              </div>

              <p className={`mt-1 t2-fs-micro font-semibold ${st.arrivalCharged ? "text-[var(--t2-muted)]" : "text-[var(--t2-success)]"}`}>
                {st.arrivalCharged ? t("tour.costsStationArrival") : t("tour.costsStationNoArrival")}
              </p>

              {/* Einzelposten: bekannt (Betrag) oder unbekannt. */}
              <ul className="mt-2 space-y-0.5 t2-fs-body-sm">
                {st.items.map((it, k) => (
                  <li key={k} className="flex items-baseline justify-between gap-3">
                    <span className="text-[var(--t2-muted)]">{t(`tour.costsItem_${it.code}`)}</span>
                    <span className={"unknown" in it && it.unknown ? "text-[var(--t2-faint)]" : "font-medium text-[var(--t2-text-muted)] tabular-nums"}>
                      {"unknown" in it && it.unknown ? t("tour.costsUnknown") : money(it.amount, it.currency)}
                    </span>
                  </li>
                ))}
              </ul>

              {Object.keys(st.subtotal).length > 0 && (
                <div className="mt-2 flex items-baseline justify-between gap-3 border-t border-[var(--t2-line)] pt-2 t2-fs-body-sm">
                  <span className="font-semibold text-[var(--t2-muted)]">{t("tour.costsStationSubtotal")}</span>
                  <span className="flex flex-col items-end font-bold text-[var(--t2-text)]"><BagLines bag={st.subtotal} /></span>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Gesamt je Währung + Cluster-Effekt */}
      <div className="t2-panel mt-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="t2-label">{t("tour.costsTotal")}</span>
          <span className="flex flex-col items-end t2-fs-h3 font-extrabold text-[var(--t2-text)]">
            {result.currencies.length > 0 ? <BagLines bag={result.total} /> : <span className="text-[var(--t2-faint)]">{t("tour.costsUnknown")}</span>}
          </span>
        </div>
        <p className="mt-1 t2-fs-meta text-[var(--t2-faint)]">{t("tour.costsPerCurrencyNote")}</p>

        {result.arrivalsSaved > 0 && (
          <p className="mt-3 border-t border-[var(--t2-line)] pt-3 t2-fs-body-sm text-[var(--t2-muted)]">
            {t("tour.costsSavedArrivals", { n: result.arrivalsSaved })}
            {savedMoney && <span className="text-[var(--t2-faint)]"> · {t("tour.costsSavedArrivalsAmount", { amount: savedMoney })}</span>}
          </p>
        )}
      </div>
    </section>
  );
}
