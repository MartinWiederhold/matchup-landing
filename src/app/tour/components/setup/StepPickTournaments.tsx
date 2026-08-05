"use client";

import { useT } from "@/lib/i18n";
import TourBrowser from "../TourBrowser";
import { presetFromProfile, presetCategories, type SetupState } from "@/lib/tourSetup";
import { CARD_SOFT } from "../tourUi";

/**
 * Schritt 3 „Turniere wählen": der bestehende TourBrowser, aus dem Profil vorgefiltert.
 * Die Begründung ist bewusst KEINE sportliche Aussage („du solltest …"), sondern erklärt
 * nur die Vorauswahl und dass sie überschreibbar ist (Ränder sind Erfahrungswerte, s.
 * RANKING_BANDS). Nationalität dient nur als Rückfall fürs Heimatland, schränkt nichts ein.
 */
export default function StepPickTournaments({ state }: { state: SetupState }) {
  const t = useT();

  const homeCountry = state.country ?? state.passports[0] ?? null; // Pass nur als Rückfall
  const preset = presetFromProfile(state.ranking, homeCountry);
  const cats = presetCategories(state.ranking).join(", ");
  const countryName = (code: string) => {
    const n = t(`tour.country.${code}`);
    return n.startsWith("tour.country.") ? code : n;
  };

  return (
    <div>
      <section className={`${CARD_SOFT} p-5`}>
        <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.setupPickTitle")}</h2>
        <p className="mt-2 text-sm text-neutral-500">
          {state.ranking != null ? t("tour.setupPickPrefilled", { cats }) : t("tour.setupPickNoRanking", { cats })}
        </p>
        {preset.country.length > 0 && (
          <p className="mt-1 text-sm text-neutral-500">{t("tour.setupPickCountryNote", { country: countryName(preset.country[0]) })}</p>
        )}
      </section>

      <div className="mt-3">
        <TourBrowser preset={preset} />
      </div>
    </div>
  );
}
