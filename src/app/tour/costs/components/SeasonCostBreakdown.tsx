"use client";

import { useT, useLocale } from "@/lib/i18n";
import { computeSeasonCost, type CostParams, type MoneyBag } from "@/domain/tour/costs";
import { minorToEuro } from "@/lib/tourCosts";
import { placeKey } from "../../components/TourDecideBlock";
import type { SeasonEntry } from "@/lib/tourSeason";

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
      <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.costsCalcTitle")}</h2>

      {/* Hinweise oben: fehlende Nächte / fehlende Sätze — sichtbar, aber unaufgeregt. */}
      {nights == null && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[12px] leading-relaxed text-amber-800">{t("tour.costsNightsMissing")}</p>
      )}
      {missing.length > 0 && (
        <p className="mt-2 text-[12px] leading-relaxed text-neutral-500">
          {t("tour.costsMissingRates", { list: missing.join(", ") })}
        </p>
      )}

      {/* Stationen */}
      <div className="mt-4 space-y-3">
        {result.stations.map((st, i) => {
          const x = entries[i].tournament;
          const countryName = x.country ? (t(`tour.country.${x.country}`).startsWith("tour.country.") ? x.country : t(`tour.country.${x.country}`)) : t("tour.fieldMissing");
          return (
            <article key={entries[i].planId} className="rounded-2xl border border-black/[0.08] bg-white p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-[15px] font-bold tracking-tight text-neutral-900">
                  {x.city || t("tour.fieldMissing")}
                  <span className="text-neutral-400">, </span>
                  <span className="text-neutral-600">{countryName}</span>
                </h3>
                <span className="text-[12px] text-neutral-500">{t("tour.mondayLabel")} {fmtMonday(x.tournament_monday, locale)}</span>
              </div>

              <p className={`mt-1 text-[12px] font-semibold ${st.arrivalCharged ? "text-neutral-700" : "text-emerald-600"}`}>
                {st.arrivalCharged ? t("tour.costsStationArrival") : t("tour.costsStationNoArrival")}
              </p>

              {/* Einzelposten: bekannt (Betrag) oder unbekannt. */}
              <ul className="mt-2 space-y-0.5 text-[13px]">
                {st.items.map((it, k) => (
                  <li key={k} className="flex items-baseline justify-between gap-3">
                    <span className="text-neutral-500">{t(`tour.costsItem_${it.code}`)}</span>
                    <span className={"unknown" in it && it.unknown ? "text-neutral-400" : "font-medium text-neutral-800 tabular-nums"}>
                      {"unknown" in it && it.unknown ? t("tour.costsUnknown") : money(it.amount, it.currency)}
                    </span>
                  </li>
                ))}
              </ul>

              {Object.keys(st.subtotal).length > 0 && (
                <div className="mt-2 flex items-baseline justify-between gap-3 border-t border-black/[0.06] pt-2 text-[13px]">
                  <span className="font-semibold text-neutral-600">{t("tour.costsStationSubtotal")}</span>
                  <span className="flex flex-col items-end font-bold text-neutral-900"><BagLines bag={st.subtotal} /></span>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Gesamt je Währung + Cluster-Effekt */}
      <div className="mt-4 rounded-2xl border border-black/[0.08] bg-black/[0.02] p-5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.costsTotal")}</span>
          <span className="flex flex-col items-end text-[18px] font-extrabold text-neutral-900">
            {result.currencies.length > 0 ? <BagLines bag={result.total} /> : <span className="text-neutral-400">{t("tour.costsUnknown")}</span>}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-neutral-400">{t("tour.costsPerCurrencyNote")}</p>

        {result.arrivalsSaved > 0 && (
          <p className="mt-3 border-t border-black/[0.06] pt-3 text-[13px] text-neutral-700">
            {t("tour.costsSavedArrivals", { n: result.arrivalsSaved })}
            {savedMoney && <span className="text-neutral-400"> · {t("tour.costsSavedArrivalsAmount", { amount: savedMoney })}</span>}
          </p>
        )}
      </div>
    </section>
  );
}
