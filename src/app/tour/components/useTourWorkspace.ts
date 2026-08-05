"use client";

import { useCallback, useEffect, useState } from "react";
import { computeSeasonCost, type SeasonCost, type CostParams } from "@/domain/tour/costs";
import { scorePoints } from "@/domain/tour/points";
import { schengenUsage } from "@/domain/tour/schengen";
import { loadSeason, type SeasonEntry } from "@/lib/tourSeason";
import { loadCostRates } from "@/lib/tourCosts";
import { loadExpenses, amountToMinor } from "@/lib/tourExpenses";
import { loadPointsData } from "@/lib/tourPoints";
import { loadStays } from "@/lib/tourStays";
import { loadTourProfile } from "@/lib/tour";
import { placeKey } from "./TourDecideBlock";
import type { TourCostRates } from "@/lib/types";

// Gleicher localStorage-Schlüssel wie /tour/costs — die Nächte-Annahme wird geteilt,
// damit Kosten im Überblick und auf der Kosten-Einzelseite dieselbe Zahl zeigen.
const NIGHTS_KEY = "mu_tour_nights";

export type WorkspaceStatus = "loading" | "error" | "ready";

/** Ein gebündelter Datenstand für die gesamte Arbeitsfläche (EIN Load statt acht). */
export type WorkspaceData = {
  entries: SeasonEntry[]; // Saison, nach Turnierwoche sortiert (loadSeason)
  rates: TourCostRates | null;
  seasonBudget: number | null; // tour_profiles.season_budget (Major Units)
  seasonCost: SeasonCost; // Reisekette (computeSeasonCost) — je Station ausgerichtet auf entries
  spentByCurrency: Record<string, number>; // tatsächliche Ausgaben je Währung (Minor Units)
  points: { total: number; limit: 6 | 7; expiringCount: number };
  schengen: { used: number; left: number };
  seasonStartMonday: string; // abgeleitet: frühester Plan-Montag, sonst Stichtag
};

/**
 * Lädt alle Daten der Arbeitsfläche einmal gebündelt und leitet die Kennzahlen ab.
 * Reine Datenschicht: benutzt ausschließlich die bestehenden lib/tour*-Loader und die
 * reinen Domain-Funktionen. Der Stichtag `asOf` kommt von außen (kein Clock hier).
 */
export function useTourWorkspace(userId: string | null, asOf: string) {
  const [status, setStatus] = useState<WorkspaceStatus>("loading");
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (!userId) return;
    let cancel = false;
    setStatus("loading");
    (async () => {
      try {
        const [entries, rates, profile, exp, pts, stays] = await Promise.all([
          loadSeason(),
          loadCostRates(),
          loadTourProfile(userId),
          loadExpenses(userId),
          loadPointsData(userId),
          loadStays(userId),
        ]);
        if (cancel) return;

        // Nächte-Annahme (nur Browser, reine Client-Bequemlichkeit).
        let nights: number | null = null;
        try {
          const v = localStorage.getItem(NIGHTS_KEY);
          const n = v ? parseInt(v, 10) : NaN;
          nights = Number.isFinite(n) && n > 0 ? n : null;
        } catch { /* egal */ }

        // Kosten als Reisekette — exakt wie SeasonCostBreakdown die Sätze aufbaut.
        const cur = rates?.currency ?? null;
        const m = (a: number | null) => (a != null && cur ? { amount: a, currency: cur } : null);
        const params: CostParams = {
          arrival: m(rates?.arrival_minor ?? null),
          perNight: m(rates?.per_night_minor ?? null),
          foodPerDay: m(rates?.food_per_day_minor ?? null),
          coachPerWeek: m(rates?.coach_per_week_minor ?? null),
        };
        const stations = entries.map((e) => ({ place: placeKey(e.tournament), nights: nights ?? 0 }));
        const seasonCost = computeSeasonCost(stations, params);

        // Tatsächliche Ausgaben je Währung (nie währungsübergreifend addiert).
        const spentByCurrency: Record<string, number> = {};
        for (const r of exp.rows) {
          const c = r.currency ?? "?";
          spentByCurrency[c] = (spentByCurrency[c] ?? 0) + amountToMinor(r.amount);
        }

        // Punkte (reine Domain-Funktion, Stichtag von außen).
        const scored = scorePoints(pts.rows.map((r) => r.result), asOf);

        // Schengen: nur bestätigte Aufenthalte (wie SchengenView).
        const confirmed = stays.filter((s) => s.confirmed);
        const usage = schengenUsage(
          confirmed.map((s) => ({ country: s.country, entry: s.entry_date, exit: s.exit_date })),
          asOf,
        );

        // Startdatum abgeleitet: frühester Plan-Montag (entries ist sortiert), sonst Stichtag.
        const seasonStartMonday = entries.length ? entries[0].tournament.tournament_monday : asOf;

        setData({
          entries,
          rates,
          seasonBudget: profile?.season_budget ?? null,
          seasonCost,
          spentByCurrency,
          points: { total: scored.countingTotal, limit: scored.countingLimit, expiringCount: scored.expiringSoon.length },
          schengen: { used: usage.used, left: usage.left },
          seasonStartMonday,
        });
        setStatus("ready");
      } catch {
        if (!cancel) setStatus("error");
      }
    })();
    return () => { cancel = true; };
  }, [userId, asOf, reloadKey]);

  return { status, data, reload };
}
