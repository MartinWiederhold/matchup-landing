"use client";

import { useCallback, useState } from "react";
import { useT } from "@/lib/i18n";
import { saveSeasonBudget, type SetupState } from "@/lib/tourSetup";
import CostRatesForm from "../../costs/components/CostRatesForm";
import { CARD_SOFT } from "../tourUi";
import { loadTourOptPrefs, saveTourOptPrefs } from "@/lib/tourOptPrefs";
const inputCls = "t2-input";

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
      <section className="t2-panel">
        <h2 className="t2-kicker">{t("tour.setupFrameTitle")}</h2>
        <p className="mt-2 t2-fs-body text-[var(--t2-muted)]">{t("tour.setupFrameIntro")}</p>

        <label className="mt-4 block sm:max-w-[16rem]">
          <span className="mb-1 block t2-fs-micro font-semibold text-[var(--t2-muted)]">{t("tour.setupBudget")}</span>
          <input type="text" inputMode="numeric" value={budget} onChange={(e) => { setBudget(e.target.value); setStatus("idle"); }} placeholder="—" className={inputCls} />
        </label>
        <p className="mt-2 t2-fs-meta leading-relaxed text-[var(--t2-faint)]">{t("tour.setupBudgetHint")}</p>

        <div className="mt-4 flex items-center gap-3">
          <button type="button" onClick={saveBudget} disabled={busy} className="t2-cta">
            {t("tour.setupSave")}
          </button>
          {status === "saved" && <span className="t2-fs-micro text-[var(--t2-success)]">{t("tour.setupSaved")}</span>}
          {status === "error" && <span className="t2-fs-micro text-[var(--t2-muted)]">{t("tour.setupSaveError")}</span>}
        </div>
      </section>

      {/* Kostensätze: bestehendes Formular (schreibt tour_cost_rates); onSaved zieht den Fortschritt nach. */}
      <CostRatesForm rates={state.rates} userId={userId} onSaved={() => onSaved()} nights={nights} onNightsChange={onNightsChange} buffer={buffer} onBufferChange={onBufferChange} />
    </div>
  );
}
