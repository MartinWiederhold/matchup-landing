"use client";

/**
 * Onboarding-Schritt: Caps und Sperre — dieselben Prefs wie Profil und Optimierer.
 */

import { useState } from "react";
import { useT } from "@/lib/i18n";
import { CARD_SOFT } from "../tourUi";
import { loadTourOptPrefs, saveTourOptPrefs } from "@/lib/tourOptPrefs";

export default function StepLimits() {
  const t = useT();
  const [prefs, setPrefs] = useState(() => loadTourOptPrefs());
  const inp = "t2-input";
  const lbl = "mb-1 block text-[12px] font-semibold text-[var(--t2-muted)]";

  const setPref = (patch: Partial<typeof prefs>) => {
    setPrefs((cur) => {
      const next = { ...cur, ...patch };
      saveTourOptPrefs(patch);
      return next;
    });
  };

  return (
    <section className="t2-panel">
      <h2 className="t2-kicker">{t("tour.t2onbLimitsTitle")}</h2>
      <p className="mt-2 text-sm text-[var(--t2-muted)]">{t("tour.t2onbLimitsIntro")}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
    </section>
  );
}
