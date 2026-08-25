"use client";

/**
 * Profil: Planung + Sätze — was der Optimierer braucht, an einem Ort.
 * Caps/Sperre/Nächte/Puffer: localStorage (wie bisher). Budget und Sätze: vorhandene Tabellen.
 */

import { useCallback, useEffect, useState } from "react";
import { useT, useLocale } from "@/lib/i18n";
import { saveSeasonBudget } from "@/lib/tourSetup";
import { loadCostRates, type CostRatesPatch } from "@/lib/tourCosts";
import { loadReminderSettings, saveReminderSettings } from "@/lib/tourReminders";
import CostRatesForm from "@/app/tour2/costs/components/CostRatesForm";
import type { TourCostRates } from "@/lib/types";
import { loadTourOptPrefs, saveTourOptPrefs } from "@/lib/tourOptPrefs";

export default function PlanRulesCard({
  userId,
  seasonBudget,
  onBudgetSaved,
}: {
  userId: string;
  seasonBudget: number | null;
  onBudgetSaved: () => void;
}) {
  const t = useT();
  const { locale } = useLocale();
  const [budget, setBudget] = useState(seasonBudget != null ? String(seasonBudget) : "");
  const [budgetBusy, setBudgetBusy] = useState(false);
  const [budgetOk, setBudgetOk] = useState(false);
  const [prefs, setPrefs] = useState(() => loadTourOptPrefs());
  const [rates, setRates] = useState<TourCostRates | null>(null);
  const [reminderOn, setReminderOn] = useState(true);

  useEffect(() => { setBudget(seasonBudget != null ? String(seasonBudget) : ""); }, [seasonBudget]);
  useEffect(() => {
    let alive = true;
    loadCostRates().then((r) => { if (alive) setRates(r); }).catch(() => {});
    loadReminderSettings(userId).then((s) => { if (alive) setReminderOn(s.enabled); }).catch(() => {});
    return () => { alive = false; };
  }, [userId]);

  const setPref = (patch: Partial<typeof prefs>) => {
    setPrefs((cur) => {
      const next = { ...cur, ...patch };
      saveTourOptPrefs(patch);
      return next;
    });
  };

  const saveBudget = async () => {
    setBudgetBusy(true);
    setBudgetOk(false);
    try {
      const raw = budget.trim().replace(",", ".");
      const n = raw === "" ? null : Number(raw);
      await saveSeasonBudget(userId, n != null && Number.isFinite(n) && n >= 0 ? Math.round(n) : null);
      setBudgetOk(true);
      onBudgetSaved();
    } finally {
      setBudgetBusy(false);
    }
  };

  const onRatesSaved = useCallback((patch: CostRatesPatch) => {
    setRates((r) => ({
      user_id: r?.user_id ?? userId,
      arrival_minor: patch.arrival_minor,
      per_night_minor: patch.per_night_minor,
      food_per_day_minor: patch.food_per_day_minor,
      coach_per_week_minor: patch.coach_per_week_minor,
      currency: patch.currency,
      created_at: r?.created_at ?? "",
      updated_at: r?.updated_at ?? "",
    }));
  }, [userId]);

  const toggleReminders = (next: boolean) => {
    setReminderOn(next);
    void saveReminderSettings(userId, next, locale === "en" ? "en" : "de").catch(() => setReminderOn(!next));
  };

  const inp = "t2-input";
  const lbl = "mb-1 block text-[12px] font-semibold text-neutral-600";

  return (
    <section className="t2-panel mt-6">
      <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.t2profPlan")}</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">{t("tour.t2profPlanLead")}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className={lbl}>{t("tour.plBudget")}</span>
          <input value={budget} onChange={(e) => { setBudget(e.target.value); setBudgetOk(false); }} inputMode="numeric" placeholder="—" className={inp} />
        </label>
        <label className="block">
          <span className={lbl}>{t("tour.t2optMaxEvents")}</span>
          <input value={prefs.maxPicks} onChange={(e) => setPref({ maxPicks: e.target.value })} inputMode="numeric" placeholder="—" className={inp} />
        </label>
        <label className="block">
          <span className={lbl}>{t("tour.t2optMaxStreak")}</span>
          <input value={prefs.maxStreak} onChange={(e) => setPref({ maxStreak: e.target.value })} inputMode="numeric" placeholder="—" className={inp} />
        </label>
        <div className="sm:col-span-2">
          <span className={`${lbl} mb-1.5`}>{t("tour.t2optBlocked")}</span>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-[11px] text-neutral-500">{t("tour.t2optBlockedFrom")}</span>
              <input type="date" value={prefs.blockedFrom} onChange={(e) => setPref({ blockedFrom: e.target.value })} className={inp} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] text-neutral-500">{t("tour.t2optBlockedTo")}</span>
              <input type="date" value={prefs.blockedTo} onChange={(e) => setPref({ blockedTo: e.target.value })} className={inp} />
            </label>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button type="button" onClick={() => void saveBudget()} disabled={budgetBusy} className="t2-cta disabled:opacity-50">{t("tour.t2profBudgetSave")}</button>
        {budgetOk && <span className="text-[12px] text-emerald-600">{t("tour.setupSaved")}</span>}
      </div>

      <div className="mt-6">
        <CostRatesForm
          rates={rates}
          userId={userId}
          onSaved={onRatesSaved}
          nights={prefs.nights}
          onNightsChange={(v) => setPref({ nights: v })}
          buffer={prefs.buffer}
          onBufferChange={(v) => setPref({ buffer: v })}
        />
      </div>

      <div className="mt-6 border-t border-[var(--t2-line)] pt-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12px] font-semibold text-neutral-700">{t("tour.wsRemindersLabel")}</span>
          <button type="button" role="switch" aria-checked={reminderOn} onClick={() => toggleReminders(!reminderOn)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${reminderOn ? "bg-matchup" : "bg-black/15"}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${reminderOn ? "translate-x-[22px]" : "translate-x-0.5"}`} />
          </button>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">{t("tour.wsRemindersHint")}</p>
      </div>
    </section>
  );
}
