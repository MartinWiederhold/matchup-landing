"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import type { TourCostRates } from "@/lib/types";
import {
  CURRENCIES,
  SUGGESTED_RATES_MINOR,
  euroToMinor,
  minorToEuro,
  saveCostRates,
  type CostRatesPatch,
} from "@/lib/tourCosts";

// Vorschlag als Euro-String für den PLATZHALTER (grau, nie gesendet). Ein
// vorausgefüllter Wert wäre nach dem Speichern nicht mehr von echter Eingabe zu
// unterscheiden — deshalb nur Platzhalter, das Feld bleibt sichtbar leer.
const SUGGEST = {
  arrival: minorToEuro(SUGGESTED_RATES_MINOR.arrival),
  perNight: minorToEuro(SUGGESTED_RATES_MINOR.perNight),
  foodPerDay: minorToEuro(SUGGESTED_RATES_MINOR.foodPerDay),
};

const inputCls =
  "w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-black/30 focus:outline-none";

/** Kostensätze-Formular. Beträge als Euro-String (leer = unbekannt); Umrechnung in
 *  Cent passiert in tourCosts.ts. Nächte-Annahme wird vom Elter gehalten (localStorage). */
export default function CostRatesForm({
  rates,
  userId,
  onSaved,
  nights,
  onNightsChange,
}: {
  rates: TourCostRates | null;
  userId: string;
  onSaved: (patch: CostRatesPatch) => void;
  nights: string;
  onNightsChange: (v: string) => void;
}) {
  const t = useT();

  // Eingaben als Euro-String; gespeicherte Werte werden angezeigt, leere bleiben leer.
  const [arrival, setArrival] = useState("");
  const [perNight, setPerNight] = useState("");
  const [foodPerDay, setFoodPerDay] = useState("");
  const [coach, setCoach] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error" | "invalid">("idle");

  // Aus geladenen/gespeicherten Sätzen befüllen (nur echte Werte, kein Vorschlag).
  useEffect(() => {
    setArrival(rates?.arrival_minor != null ? minorToEuro(rates.arrival_minor) : "");
    setPerNight(rates?.per_night_minor != null ? minorToEuro(rates.per_night_minor) : "");
    setFoodPerDay(rates?.food_per_day_minor != null ? minorToEuro(rates.food_per_day_minor) : "");
    setCoach(rates?.coach_per_week_minor != null ? minorToEuro(rates.coach_per_week_minor) : "");
    if (rates?.currency) setCurrency(rates.currency);
  }, [rates]);

  // Ein Feld → Cent oder null; `invalid`, wenn nicht leer und nicht parsebar.
  function parse(v: string): { minor: number | null; invalid: boolean } {
    if (v.trim() === "") return { minor: null, invalid: false };
    const m = euroToMinor(v);
    return m === null ? { minor: null, invalid: true } : { minor: m, invalid: false };
  }

  async function save() {
    if (busy) return;
    const fields = [parse(arrival), parse(perNight), parse(foodPerDay), parse(coach)];
    if (fields.some((f) => f.invalid)) { setStatus("invalid"); return; }
    const patch: CostRatesPatch = {
      arrival_minor: fields[0].minor,
      per_night_minor: fields[1].minor,
      food_per_day_minor: fields[2].minor,
      coach_per_week_minor: fields[3].minor,
      currency, // Auswahl, immer gesetzt → CHECK „Betrag ohne Währung" kann nicht greifen
    };
    setBusy(true);
    setStatus("idle");
    try {
      await saveCostRates(userId, patch);
      onSaved(patch);
      setStatus("saved");
    } catch {
      setStatus("error");
    } finally {
      setBusy(false);
    }
  }

  const field = (label: string, value: string, setValue: (v: string) => void, placeholder: string) => (
    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold text-neutral-600">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => { setValue(e.target.value); setStatus("idle"); }}
        placeholder={placeholder}
        className={inputCls}
      />
    </label>
  );

  return (
    <section className="rounded-2xl bg-black/[0.02] ring-1 ring-black/5 p-5">
      <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.costsRatesTitle")}</h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {field(t("tour.costsArrival"), arrival, setArrival, SUGGEST.arrival)}
        {field(t("tour.costsPerNight"), perNight, setPerNight, SUGGEST.perNight)}
        {field(t("tour.costsFoodPerDay"), foodPerDay, setFoodPerDay, SUGGEST.foodPerDay)}
        {/* Coach ohne Vorschlag (keine belastbare Größenordnung) → neutraler Platzhalter. */}
        {field(t("tour.costsCoachPerWeek"), coach, setCoach, t("tour.costsAmountPlaceholder"))}

        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.costsCurrency")}</span>
          <select
            value={currency}
            onChange={(e) => { setCurrency(e.target.value); setStatus("idle"); }}
            className={inputCls}
          >
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.costsNights")}</span>
          <input
            type="text"
            inputMode="numeric"
            value={nights}
            onChange={(e) => onNightsChange(e.target.value)}
            placeholder="7"
            className={inputCls}
          />
        </label>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-neutral-400">{t("tour.costsNightsHint")}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">{t("tour.costsEstimateHint")}</p>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="rounded-full bg-neutral-900 px-5 py-2 text-[13px] font-bold text-white transition-colors hover:bg-neutral-700 disabled:opacity-50"
        >
          {t("tour.costsSave")}
        </button>
        {status === "saved" && <span className="text-[12px] text-emerald-600">{t("tour.costsSaved")}</span>}
        {status === "error" && <span className="text-[12px] text-neutral-500">{t("tour.costsSaveError")}</span>}
        {status === "invalid" && <span className="text-[12px] text-neutral-500">{t("tour.costsInvalidAmount")}</span>}
      </div>
    </section>
  );
}
