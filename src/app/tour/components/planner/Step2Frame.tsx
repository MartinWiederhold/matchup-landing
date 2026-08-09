"use client";

import { useState } from "react";
import Link from "next/link";
import { useT, useLocale } from "@/lib/i18n";
import { saveSeasonBudget } from "@/lib/tourSetup";
import { costRatesComplete, ratesToCostParams, type Frame, type FrameResult, type RegionMode } from "@/lib/tourPlanner";
import { computeSeasonCost } from "@/domain/tour/costs";
import type { TourCostRates } from "@/lib/types";

const NIGHTS_KEY = "mu_tour_nights"; // dieselbe Annahme wie /tour/costs (fehlt → 7)

const inputCls =
  "w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-black/30 focus:outline-none";

const REGIONS: { key: RegionMode; labelKey: string }[] = [
  { key: "ch", labelKey: "tour.plRegionCh" },
  { key: "europe", labelKey: "tour.plRegionEurope" },
  { key: "all", labelKey: "tour.plRegionAll" },
];

/**
 * Schritt 2 „Rahmen": Budget (persistiert in tour_profiles.season_budget) sowie
 * Zeitraum und Zielregion — Letztere BEWUSST nur als Komponenten-Zustand (kein
 * localStorage, keine Spalte): beim Neuladen weg, das erwartet man. Region/Zeitraum
 * werden vom Eltern-Planer gehalten (frame), damit die Karte darauf reagiert.
 */
export default function Step2Frame({
  budgetInitial,
  userId,
  frame,
  setFrame,
  result,
  rates,
  onSaved,
}: {
  budgetInitial: number | null;
  userId: string;
  frame: Frame;
  setFrame: (f: Frame) => void;
  result: FrameResult;
  rates: TourCostRates | null;
  onSaved?: () => void; // nach erfolgreichem Budget-Speichern → Eltern zieht Profil nach + geht zu Schritt 3
}) {
  const t = useT();
  const { locale } = useLocale();
  const [budget, setBudget] = useState(budgetInitial != null ? String(budgetInitial) : "");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  // Nächte-Annahme wie in /tour/costs (fehlt → 7). Nur Anzeige, kein Persistieren hier.
  const nights = (() => {
    let raw = "";
    try { raw = localStorage.getItem(NIGHTS_KEY) ?? ""; } catch { /* egal */ }
    const n = parseInt(raw.trim(), 10);
    return Number.isFinite(n) && n >= 0 ? n : 7;
  })();

  // Kosten EINER Turnierwoche — über computeSeasonCost mit genau einer Station,
  // NICHT über eine eigene Formel (sonst laufen zwei Rechnungen auseinander).
  const week = costRatesComplete(rates)
    ? (() => {
        const cur = rates!.currency ?? "EUR";
        const cost = computeSeasonCost([{ place: "x", nights }], ratesToCostParams(rates!));
        const total = cost.total[cur] ?? 0;
        const fmt = (minor: number) => new Intl.NumberFormat(locale, { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(minor / 100);
        // Aufschlüsselung = die Sätze selbst beschriftet (die maßgebliche Summe kommt oben aus computeSeasonCost).
        const parts = [
          `${fmt(rates!.arrival_minor!)} ${t("tour.plWeekArrival")}`,
          `${nights} ${t("tour.plWeekNights")} à ${fmt(rates!.per_night_minor!)}`,
          `${nights} ${t("tour.plWeekFood")} à ${fmt(rates!.food_per_day_minor!)}`,
        ];
        if (rates!.coach_per_week_minor != null) parts.push(`${t("tour.plWeekCoach")} à ${fmt(rates!.coach_per_week_minor)}`);
        return { totalMinor: total, totalLabel: fmt(total), parts: parts.join(" + ") };
      })()
    : null;

  // Eingegebenes Budget (Major) → liegt es unter einer Woche? Direkt an der Eingabe melden.
  const budgetMajor = (() => {
    const n = Number(budget.trim().replace(",", "."));
    return budget.trim() !== "" && Number.isFinite(n) && n > 0 ? n : null;
  })();
  const belowWeek = week != null && budgetMajor != null && budgetMajor * 100 < week.totalMinor;

  async function saveBudget() {
    if (busy) return;
    const raw = budget.trim().replace(",", ".");
    const n = raw === "" ? null : Number(raw);
    const value = n != null && Number.isFinite(n) && n > 0 ? Math.round(n) : null;
    setBusy(true);
    setStatus("idle");
    try { await saveSeasonBudget(userId, value); setStatus("saved"); onSaved?.(); }
    catch { setStatus("error"); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      {/* Budget (persistiert) */}
      <div className="grid gap-3 sm:grid-cols-[16rem_auto] sm:items-end">
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.plBudget")}</span>
          <input type="text" inputMode="numeric" value={budget} onChange={(e) => { setBudget(e.target.value); setStatus("idle"); }} placeholder="—" className={inputCls} />
        </label>
        <div className="flex items-center gap-3 pb-0.5">
          <button type="button" onClick={saveBudget} disabled={busy} className="rounded-full bg-neutral-900 px-5 py-2 text-[13px] font-bold text-white transition-colors hover:bg-neutral-700 disabled:opacity-50">
            {t("tour.setupSave")}
          </button>
          {status === "saved" && <span className="text-[12px] text-emerald-600">{t("tour.setupSaved")}</span>}
          {status === "error" && <span className="text-[12px] text-neutral-500">{t("tour.setupSaveError")}</span>}
        </div>

        {/* Budget-Rückmeldung schon bei der Eingabe: Kosten einer Turnierwoche bzw. Verweis auf die Kostensätze */}
        <div className="sm:col-span-2">
          {week ? (
            <>
              <p className="text-[12px] text-neutral-500">{t("tour.plBudgetWeek", { total: week.totalLabel, parts: week.parts })}</p>
              {belowWeek && <p className="mt-1 text-[12px] font-semibold text-amber-700">{t("tour.plBudgetTooLow", { total: week.totalLabel })}</p>}
            </>
          ) : (
            <p className="text-[12px] text-neutral-500">
              {t("tour.plBudgetNoRates")}{" "}
              <Link href="/tour/costs" className="font-semibold text-matchup hover:underline">{t("tour.plBudgetNoRatesLink")}</Link>
            </p>
          )}
        </div>
      </div>

      {/* Zeitraum (nur Komponenten-Zustand) */}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.plFrom")}</span>
          <input type="date" value={frame.from} onChange={(e) => setFrame({ ...frame, from: e.target.value })} className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.plTo")}</span>
          <input type="date" value={frame.to} onChange={(e) => setFrame({ ...frame, to: e.target.value })} className={inputCls} />
        </label>
      </div>

      {/* Zielregion (nur Komponenten-Zustand) */}
      <div>
        <span className="mb-1.5 block text-[12px] font-semibold text-neutral-600">{t("tour.plRegion")}</span>
        <div className="flex flex-wrap gap-1.5">
          {REGIONS.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setFrame({ ...frame, region: r.key })}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold ring-1 transition-colors ${
                frame.region === r.key ? "bg-matchup text-white ring-matchup" : "bg-white text-neutral-700 ring-black/10 hover:bg-black/[0.03]"
              }`}
            >
              {t(r.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Rahmen-Zählung: im Rahmen vs. ohne Koordinaten (MU-029 — nicht still verschwinden lassen) */}
      <div className="rounded-xl bg-black/[0.02] p-3 ring-1 ring-black/5">
        <p className="text-[13px] font-bold text-neutral-900">{t("tour.plCoverage", { n: result.inFrame })}</p>
        {result.noCoords > 0 && (
          <p className="mt-1 text-[12px] text-amber-700">
            {t("tour.plNoCoords", { n: result.noCoords })}
            <span className="mt-0.5 block text-[11px] text-neutral-400">{t("tour.plNoCoordsHint")}</span>
          </p>
        )}
      </div>
    </div>
  );
}
