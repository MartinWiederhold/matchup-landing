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

const inputCls = "t2-input";

/** Kostensätze-Formular. Beträge als Euro-String (leer = unbekannt); Umrechnung in
 *  Cent passiert in tourCosts.ts. Nächte-Annahme wird vom Elter gehalten (localStorage). */
export default function CostRatesForm({
  rates,
  userId,
  onSaved,
  nights = "",
  onNightsChange,
  buffer,
  onBufferChange,
  hideTravelAssumptions = false,
}: {
  rates: TourCostRates | null;
  userId: string;
  onSaved: (patch: CostRatesPatch) => void;
  nights?: string;
  onNightsChange?: (v: string) => void;
  buffer?: string;
  onBufferChange?: (v: string) => void;
  /** Nächte/Puffer liegen im Profil bei den Planungsregeln — hier nicht noch einmal. */
  hideTravelAssumptions?: boolean;
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
      <span className="mb-1 block t2-fs-micro font-semibold text-[var(--t2-text-muted)]">{label}</span>
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
    <section className="t2-panel">
      <h2 className="t2-section-title">{t("tour.costsRatesTitle")}</h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {field(t("tour.costsArrival"), arrival, setArrival, SUGGEST.arrival)}
        {field(t("tour.costsPerNight"), perNight, setPerNight, SUGGEST.perNight)}
        {field(t("tour.costsFoodPerDay"), foodPerDay, setFoodPerDay, SUGGEST.foodPerDay)}
        {/* Coach ohne Vorschlag (keine belastbare Größenordnung) → neutraler Platzhalter. */}
        {field(t("tour.costsCoachPerWeek"), coach, setCoach, t("tour.costsAmountPlaceholder"))}

        <label className="block">
          <span className="mb-1 block t2-fs-micro font-semibold text-[var(--t2-text-muted)]">{t("tour.costsCurrency")}</span>
          <select
            value={currency}
            onChange={(e) => { setCurrency(e.target.value); setStatus("idle"); }}
            className={inputCls}
          >
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        {!hideTravelAssumptions && onNightsChange && (
        <label className="block">
          <span className="mb-1 block t2-fs-micro font-semibold text-[var(--t2-text-muted)]">{t("tour.costsNights")}</span>
          <input
            type="text"
            inputMode="numeric"
            value={nights}
            onChange={(e) => onNightsChange(e.target.value)}
            placeholder="7"
            className={inputCls}
          />
        </label>
        )}

        {/* Anreisepuffer zwischen Turnieren an verschiedenen Orten — Nutzerangabe wie die Nächte.
            Nur wenn der Aufrufer ihn reicht (Planer); im Onboarding weggelassen. */}
        {!hideTravelAssumptions && onBufferChange && (
          <label className="block">
            <span className="mb-1 block t2-fs-micro font-semibold text-[var(--t2-text-muted)]">{t("tour.costsBuffer")}</span>
            <input
              type="text"
              inputMode="numeric"
              value={buffer ?? ""}
              onChange={(e) => onBufferChange(e.target.value)}
              placeholder="2"
              className={inputCls}
            />
          </label>
        )}
      </div>

      {!hideTravelAssumptions && <p className="mt-3 t2-fs-meta leading-relaxed text-[var(--t2-text-soft)]">{t("tour.costsNightsHint")}</p>}
      {!hideTravelAssumptions && onBufferChange && <p className="mt-1 t2-fs-meta leading-relaxed text-[var(--t2-text-soft)]">{t("tour.costsBufferHint")}</p>}
      <p className="mt-1 t2-fs-meta leading-relaxed text-[var(--t2-text-soft)]">{t("tour.costsEstimateHint")}</p>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="t2-cta disabled:opacity-50"
        >
          {t("tour.costsSave")}
        </button>
        {status === "saved" && <span className="t2-fs-micro text-[var(--t2-success)]">{t("tour.costsSaved")}</span>}
        {status === "error" && <span className="t2-fs-micro text-[var(--t2-text-soft)]">{t("tour.costsSaveError")}</span>}
        {status === "invalid" && <span className="t2-fs-micro text-[var(--t2-text-soft)]">{t("tour.costsInvalidAmount")}</span>}
      </div>
    </section>
  );
}
