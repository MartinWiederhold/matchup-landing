"use client";

/**
 * Planungsregeln für den Optimierer: Budget, Nächte, Puffer, Caps, Sperre.
 * Dieselben localStorage-Keys wie der Planer — eine Quelle, zwei Editoren.
 */

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { saveSeasonBudget } from "@/lib/tourSetup";
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
  const [budget, setBudget] = useState(seasonBudget != null ? String(seasonBudget) : "");
  const [budgetBusy, setBudgetBusy] = useState(false);
  const [budgetOk, setBudgetOk] = useState(false);
  const [prefs, setPrefs] = useState(() => loadTourOptPrefs());

  useEffect(() => { setBudget(seasonBudget != null ? String(seasonBudget) : ""); }, [seasonBudget]);

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

  const inp = "t2-input";
  const lbl = "mb-1 block text-[12px] font-semibold text-[var(--t2-muted)]";

  return (
    <section className="t2-panel mt-6">
      <h2 className="t2-kicker">{t("tour.t2profPlan")}</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-[var(--t2-muted)]">{t("tour.t2profPlanLead")}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className={lbl}>{t("tour.plBudget")}</span>
          <input value={budget} onChange={(e) => { setBudget(e.target.value); setBudgetOk(false); }} inputMode="numeric" placeholder="—" className={inp} />
        </label>
        <label className="block">
          <span className={lbl}>{t("tour.costsNights")}</span>
          <input value={prefs.nights} onChange={(e) => setPref({ nights: e.target.value })} inputMode="numeric" placeholder="7" className={inp} />
        </label>
        <label className="block">
          <span className={lbl}>{t("tour.t2optBufferShort")}</span>
          <input value={prefs.buffer} onChange={(e) => setPref({ buffer: e.target.value })} inputMode="numeric" placeholder="2" className={inp} />
        </label>
        <label className="block">
          <span className={lbl}>{t("tour.t2optMaxStreak")}</span>
          <input value={prefs.maxStreak} onChange={(e) => setPref({ maxStreak: e.target.value })} inputMode="numeric" placeholder="—" className={inp} />
        </label>
        <label className="block">
          <span className={lbl}>{t("tour.t2optMaxEvents")}</span>
          <input value={prefs.maxPicks} onChange={(e) => setPref({ maxPicks: e.target.value })} inputMode="numeric" placeholder="—" className={inp} />
        </label>
        <div className="sm:col-span-2">
          <span className={`${lbl} mb-1.5`}>{t("tour.t2optBlocked")}</span>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-[11px] text-[var(--t2-muted)]">{t("tour.t2optBlockedFrom")}</span>
              <input type="date" value={prefs.blockedFrom} onChange={(e) => setPref({ blockedFrom: e.target.value })} className={inp} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] text-[var(--t2-muted)]">{t("tour.t2optBlockedTo")}</span>
              <input type="date" value={prefs.blockedTo} onChange={(e) => setPref({ blockedTo: e.target.value })} className={inp} />
            </label>
          </div>
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-[var(--t2-faint)]">{t("tour.costsNightsHint")}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-[var(--t2-faint)]">{t("tour.costsBufferHint")}</p>
      <div className="mt-3 flex items-center gap-3">
        <button type="button" onClick={() => void saveBudget()} disabled={budgetBusy} className="t2-cta disabled:opacity-50">{t("tour.t2profBudgetSave")}</button>
        {budgetOk && <span className="text-[12px] text-emerald-600">{t("tour.setupSaved")}</span>}
      </div>
    </section>
  );
}
