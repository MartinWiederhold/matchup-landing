"use client";

import { useEffect, useState } from "react";
import { useT, useLocale } from "@/lib/i18n";
import { DeadlineCountdown, EntryPath } from "../EntryDeadline";
import { hotelUrl, flightUrl, carUrl, flightPriceQuery, type LivePrice } from "@/lib/travelpayouts";
import type { TourTournament, TourCostRates } from "@/lib/types";

const DAY = 86_400_000;

/** ISO-Datum + n Tage (UTC, deterministisch). */
function addDaysISO(iso: string, n: number): string {
  return new Date(Date.parse(iso + "T00:00:00Z") + n * DAY).toISOString().slice(0, 10);
}

/**
 * Live-Flugpreis (das Einzige, was Travelpayouts noch liefert — Hotellook ist 10/2025
 * eingestellt, hotelPriceQuery gibt immer null). Origin ist der Startort (Stadt ODER
 * IATA); die /api/prices-Route löst eine Stadt server-seitig zu IATA auf. Die Komponente
 * wird pro Turnier neu gemountet (key=tt.id) → Anfangszustand "loading", genau ein Abruf.
 */
type PriceState = "loading" | LivePrice;
function useFlightPrice(city: string, country: string, start: string, end: string, origin: string): PriceState {
  const [state, setState] = useState<PriceState>("loading");
  useEffect(() => {
    let cancel = false;
    flightPriceQuery({ city, country, start, end }, origin || undefined).then((r) => { if (!cancel) setState(r); });
    return () => { cancel = true; };
  }, [city, country, start, end, origin]);
  return state;
}

/**
 * Turnier-Detail des Saisonplaners: Kopf, PROMINENTE Hauptaktion (zur Saison hinzufügen/
 * entfernen), Meldefrist + Weg zur Meldung, Wochenkosten-Richtwert und Live-Flugpreis mit
 * EHRLICHEM Fallback („Keine Live-Preise für diesen Ort" statt leerem Kasten/Endlos-Spinner).
 * Buchungs-Deep-Links funktionieren immer, auch ohne Live-Preis.
 */
export default function TournamentDetail({
  tt, countryName, inSeason, onToggle, onClose, originCity, originLabel, nights, rates, nowMs,
}: {
  tt: TourTournament;
  countryName: string;
  inSeason: boolean;
  onToggle: () => void;
  onClose: () => void;
  originCity: string | null;
  originLabel: string | null;
  nights: number;
  rates: TourCostRates | null;
  nowMs: number;
}) {
  const t = useT();
  const { locale } = useLocale();

  const start = tt.tournament_monday;
  const end = addDaysISO(start, nights > 0 ? nights : 7);
  const stop = { city: tt.city ?? "", country: countryName, start, end };
  const price = useFlightPrice(tt.city ?? "", countryName, start, end, originCity ?? "");

  const fmtEUR = (n: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
  const fmtDay = (iso: string) => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z"));

  // Wochenkosten-Richtwert dieses Turniers (nur wenn Pflichtsätze da sind).
  const ratesDone = rates?.currency != null && rates.arrival_minor != null && rates.per_night_minor != null && rates.food_per_day_minor != null;
  const weekMinor = ratesDone ? (rates!.arrival_minor ?? 0) + (rates!.per_night_minor ?? 0) * nights + (rates!.food_per_day_minor ?? 0) * nights + (rates!.coach_per_week_minor ?? 0) : 0;
  const fmtCur = (minor: number, cur: string) => new Intl.NumberFormat(locale, { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(minor / 100);
  // Abrufdatum (Tag genügt) — nowMs vom Elter, kein Laufzeit-Clock in Render.
  const fmtStand = (ms: number) => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }).format(new Date(ms));

  // Flugpreis (Zahl oder null). "loading" → null → keine Zeile (kein Platzhalter, kein Hinweis).
  const flightPrice = price === "loading" ? null : price.price;

  const link = "flex items-center justify-between rounded-xl border border-black/10 px-3 py-2.5 text-[13px] font-semibold text-neutral-800 transition-colors hover:bg-black/[0.03]";

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Kopf mit Zurück */}
      <div className="flex shrink-0 items-center gap-2 border-b border-neutral-200 px-4 py-3">
        <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-[18px] text-neutral-500 hover:bg-black/[0.04]" aria-label={t("tour.wsDetailBack")}>←</button>
        <span className="text-[13px] font-bold text-neutral-500">{t("tour.wsDetailBack")}</span>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
        {/* Titel */}
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-neutral-900">{tt.city || t("tour.fieldMissing")}</h2>
          <p className="text-[13px] text-neutral-500">{countryName} · {fmtDay(start)}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tt.category && <span className="rounded-full bg-matchup/10 px-2.5 py-0.5 text-[11px] font-bold text-matchup">{tt.category}</span>}
            {tt.surface && <span className="rounded-full bg-black/[0.04] px-2.5 py-0.5 text-[11px] font-semibold text-neutral-600">{tt.surface}</span>}
          </div>
        </div>

        {/* HAUPTAKTION — prominent, nicht als kleiner Link */}
        <button
          type="button"
          onClick={onToggle}
          className={`w-full rounded-2xl px-5 py-3.5 text-[15px] font-bold transition-colors ${inSeason ? "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-300 hover:bg-emerald-500/15" : "bg-matchup text-white shadow-sm hover:bg-matchup-hover"}`}
        >
          {inSeason ? `✓ ${t("tour.wsDetailInSeason")}` : t("tour.wsDetailAdd")}
        </button>
        {inSeason && <button type="button" onClick={onToggle} className="w-full text-center text-[12px] font-semibold text-neutral-400 hover:text-neutral-700">{t("tour.wsDetailRemove")}</button>}

        {/* Meldefrist + Weg zur Meldung */}
        <section className="rounded-2xl bg-black/[0.02] p-4 ring-1 ring-black/5">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">{t("tour.wsDetailDeadline")}</p>
          <div className="mt-1"><DeadlineCountdown tournament={tt} now={nowMs} /></div>
          <EntryPath tournament={tt} />
        </section>

        {/* Kosten: Wochen-Richtwert + (NUR falls vorhanden) der Live-Flugpreis als EINE
            Zeile. Kein Preis → keine Zeile: bei ~36 % Abdeckung, nur Flügen und volatilen
            Werten trägt das keinen eigenen Block. Was fehlt, wird nicht angekündigt. */}
        {(ratesDone || flightPrice != null) && (
          <section className="space-y-1">
            {ratesDone && <p className="text-[12px] text-neutral-500">{t("tour.wsWeekCostThis", { amount: fmtCur(weekMinor, rates!.currency ?? "EUR") })}</p>}
            {flightPrice != null && (
              // Mit Abrufdatum, weil der Preis morgen anders sein kann.
              <p className="text-[12px] font-semibold text-neutral-700">✈ {t("tour.wsFlightLine", { origin: originLabel ?? "", amount: fmtEUR(flightPrice), date: fmtStand(nowMs) })}</p>
            )}
          </section>
        )}

        {/* Buchen — Deep-Links. Funktionieren IMMER (auch ohne Live-Preis) und sind der
            eigentliche Nutzen. Bewusst KEIN „Live-Preise"-Titel mehr. */}
        <section>
          <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.wsBookTitle")}</p>
          <div className="mt-2 space-y-1.5">
            <a href={flightUrl(stop, originCity || undefined)} target="_blank" rel="noopener noreferrer" className={link}><span>✈ {t("tour.wsBookFlights")}</span><span className="text-neutral-400">↗</span></a>
            <a href={hotelUrl(stop)} target="_blank" rel="noopener noreferrer" className={link}><span>🏨 {t("tour.wsBookHotels")}</span><span className="text-neutral-400">↗</span></a>
            <a href={carUrl(stop)} target="_blank" rel="noopener noreferrer" className={link}><span>🚗 {t("tour.wsBookCars")}</span><span className="text-neutral-400">↗</span></a>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-neutral-400">{t("tour.wsBookNote")}</p>
        </section>
      </div>
    </div>
  );
}
