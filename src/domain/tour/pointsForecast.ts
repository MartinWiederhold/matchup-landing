/**
 * Rangprognose für die Tour (Domain-Schicht, v1).
 *
 *   Liste zählender Ergebnisse + Stichtag
 *   →  aktueller Stand, Ausblick auf +4/+8/+12 Wochen (was fällt weg, was bleibt),
 *      Verfallsplan („Punkte, die verteidigt werden müssen")
 *
 * NUTZT src/domain/tour/points.ts (scorePoints), ändert es NICHT. Der 52-Wochen-Verfall
 * inkl. ITF-Verzögerung liegt dort und wird nur konsumiert. Reine Funktion: keine DB, kein
 * Netzwerk, KEINE Systemzeit — der Stichtag ist PFLICHT. Gleiche Eingabe ⇒ gleiche Ausgabe.
 *
 * KEIN RANGPLATZ: Punkte→Rang bräuchte die aktuelle Ranglistenverteilung (kennt nur die ATP).
 * Diese Datei rechnet ausschließlich mit Punkten.
 *
 * Der Netto-Ausblick ist DETERMINISTISCH aus scorePoints: der Stand an einem künftigen Datum
 * ist schlicht scorePoints(results, stichtag+horizont). Das bildet Verfall UND ein etwaiges
 * Nachrücken (best-n) korrekt ab — es wird nicht „von Hand" subtrahiert.
 */

import { scorePoints, type MatchResult } from "./points";

export const POINTS_FORECAST_VERSION = "v1";

const DAY = 86_400_000;

/** Ein bewertetes Ergebnis mit Verfallsdaten (in Eingabereihenfolge). */
export type ForecastResult = {
  index: number;
  category: string;
  round: string;
  points: number;
  counts: boolean;
  effectiveDate: string;
  expiresOn: string;
};

/** Ein Verfallseintrag: welches Ergebnis (Index) mit wie vielen Punkten wann verfällt. */
export type ExpiryItem = { index: number; points: number; expiresOn: string };

/** Ein Ausblick-Schritt (Horizont in Wochen). */
export type ForecastStep = {
  weeks: number;
  date: string; // Stichtag + weeks*7 Tage (ISO)
  total: number; // Netto-Stand an diesem Datum
  delta: number; // total − currentTotal (negativ = es fällt netto weg)
  expiring: ExpiryItem[]; // zählende Ergebnisse, die im Fenster (asOf, date] verfallen
};

export type PointsForecast = {
  rulesVersion: string;
  asOf: string;
  currentTotal: number;
  countingLimit: 6 | 7 | 18; // Herren 6/7 (ATP) · Damen 18 (WTA VIII.4.a.i)
  results: ForecastResult[]; // alle Ergebnisse mit Bewertung
  steps: ForecastStep[]; // Ausblick je Horizont
  schedule: ExpiryItem[]; // zählende Ergebnisse nach Verfallsdatum aufsteigend — „verteidigen"
};

/** ISO-Datum + n Tage (UTC, deterministisch). Ungültige Eingabe → unverändert zurück. */
function isoAddDays(iso: string, n: number): string {
  const ms = Date.parse(iso + "T00:00:00Z");
  if (Number.isNaN(ms)) return iso;
  return new Date(ms + n * DAY).toISOString().slice(0, 10);
}
function dayMs(iso: string): number {
  return Date.parse(iso + "T00:00:00Z");
}

/**
 * Rangprognose bilden.
 * @param results  zählende Ergebnisse (Reihenfolge egal; Ausgabe in Eingabereihenfolge)
 * @param asOf     Stichtag als ISO-Datum (PFLICHT — keine Systemuhr)
 * @param opts     horizonsWeeks: Ausblick-Horizonte in Wochen (Default [4, 8, 12])
 */
export function pointsForecast(results: MatchResult[], asOf: string, opts?: { horizonsWeeks?: number[] }): PointsForecast {
  const horizons = opts?.horizonsWeeks ?? [4, 8, 12];
  const base = scorePoints(results, asOf);
  const currentTotal = base.countingTotal;
  const asOfMs = dayMs(asOf);

  const fResults: ForecastResult[] = base.results.map((s, i) => ({
    index: i, category: s.category, round: s.round, points: s.points, counts: s.counts,
    effectiveDate: s.effectiveDate, expiresOn: s.expiresOn,
  }));

  // Verfällt im Fenster (asOf, bis]: Ergebnis mit Punkten, das zum Stichtag wirksam ist und
  // dessen Verfall in das Fenster fällt. (noch nicht wirksame ITF-Ergebnisse zählen nicht.)
  const expiringUntil = (bisMs: number): ExpiryItem[] =>
    base.results
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => {
        if (s.points <= 0 || !s.expiresOn || s.notes.includes("noch_nicht_im_system")) return false;
        const exp = dayMs(s.expiresOn);
        return !Number.isNaN(asOfMs) && exp > asOfMs && exp <= bisMs;
      })
      .map(({ s, i }) => ({ index: i, points: s.points, expiresOn: s.expiresOn }));

  const steps: ForecastStep[] = horizons.map((w) => {
    const date = isoAddDays(asOf, w * 7);
    const total = scorePoints(results, date).countingTotal;
    return { weeks: w, date, total, delta: total - currentTotal, expiring: expiringUntil(dayMs(date)) };
  });

  // Verfallsplan: alle ZÄHLENDEN Ergebnisse nach Verfallsdatum aufsteigend — das, was zu
  // verteidigen ist (das Nächste zuerst).
  const schedule: ExpiryItem[] = base.results
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.counts && s.points > 0 && s.expiresOn)
    .sort((a, b) => a.s.expiresOn.localeCompare(b.s.expiresOn))
    .map(({ s, i }) => ({ index: i, points: s.points, expiresOn: s.expiresOn }));

  return {
    rulesVersion: POINTS_FORECAST_VERSION,
    asOf,
    currentTotal,
    countingLimit: base.countingLimit,
    results: fResults,
    steps,
    schedule,
  };
}
