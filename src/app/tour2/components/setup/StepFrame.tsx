"use client";

import { useCallback, useState } from "react";
import { useT } from "@/lib/i18n";
import { saveSeasonBudget, type SetupState } from "@/lib/tourSetup";
import CostRatesForm from "../../costs/components/CostRatesForm";
import { CARD_SOFT } from "../tourUi";
import { loadTourOptPrefs, saveTourOptPrefs } from "@/lib/tourOptPrefs";
const inputCls =
  "w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-black/30 focus:outline-none";

/**
 * Schritt 2 „Dein Rahmen": Saisonbudget (tour_profiles.season_budget) + Kostensätze
 * (tour_cost_rates via bestehendem CostRatesForm — eine Wahrheit). Das Startdatum wird
 * NICHT gefragt (es wird abgeleitet: frühester Plan-Montag, sonst heute). Beide Speicher-
 * aktionen melden über onSaved zurück, damit der Schritt-Fortschritt nachzieht.
 */
export default function StepFrame({ state, userId, onSaved }: { state: SetupState; userId: string; onSaved: () => void }) {
  const t = useT();
  const [budget, setBudget] = useState(state.seasonBudget != null ? String(state.seasonBudget) : "");
  const [nights, setNights] = useState(() => loadTourOptPrefs().nights);
  const [buffer, setBuffer] = useState(() => loadTourOptPrefs().buffer);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  const onNightsChange = useCallback((v: string) => {
    setNights(v);
    saveTourOptPrefs({ nights: v });
  }, []);
  const onBufferChange = useCallback((v: string) => {
    setBuffer(v);
    saveTourOptPrefs({ buffer: v });
  }, []);

  async function saveBudget() {
    if (busy) return;
    const raw = budget.trim().replace(",", ".");
    const n = raw === "" ? null : Number(raw);
    const value = n != null && Number.isFinite(n) && n > 0 ? Math.round(n) : null;
    setBusy(true);
    setStatus("idle");
    try { await saveSeasonBudget(userId, value); setStatus("saved"); onSaved(); }
    catch { setStatus("error"); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-3">
      <section className={`${CARD_SOFT} p-5`}>
        <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.setupFrameTitle")}</h2>
        <p className="mt-2 text-sm text-neutral-500">{t("tour.setupFrameIntro")}</p>

        <label className="mt-4 block sm:max-w-[16rem]">
          <span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.setupBudget")}</span>
          <input type="text" inputMode="numeric" value={budget} onChange={(e) => { setBudget(e.target.value); setStatus("idle"); }} placeholder="—" className={inputCls} />
        </label>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-400">{t("tour.setupBudgetHint")}</p>

        <div className="mt-4 flex items-center gap-3">
          <button type="button" onClick={saveBudget} disabled={busy} className="rounded-full bg-neutral-900 px-5 py-2 text-[13px] font-bold text-white transition-colors hover:bg-neutral-700 disabled:opacity-50">
            {t("tour.setupSave")}
          </button>
          {status === "saved" && <span className="text-[12px] text-emerald-600">{t("tour.setupSaved")}</span>}
          {status === "error" && <span className="text-[12px] text-neutral-500">{t("tour.setupSaveError")}</span>}
        </div>
      </section>

      {/* Kostensätze: bestehendes Formular (schreibt tour_cost_rates); onSaved zieht den Fortschritt nach. */}
      <CostRatesForm rates={state.rates} userId={userId} onSaved={() => onSaved()} nights={nights} onNightsChange={onNightsChange} buffer={buffer} onBufferChange={onBufferChange} />
    </div>
  );
}
