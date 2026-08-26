"use client";

/**
 * Onboarding-Wow: zählt Turniere im Rahmen und Optimierer-Picks — ohne INSERT (MU-037).
 * „Passen" = was der Optimierer unter den gesetzten Regeln vorschlagen würde.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n";
import { CARD_SOFT } from "../tourUi";
import { buildSeasonCandidates, ratesToCostParams, budgetMoney, costRatesComplete, placeKey, type Frame } from "@/lib/tourPlanner";
import { getTourCatalog } from "@/lib/tourCatalogCache";
import { loadCostRates } from "@/lib/tourCosts";
import { bannedDestinations } from "@/lib/tourVisaRequirements";
import { optimizeSeason } from "@/domain/tour/optimizeSeason";
import { loadTourOptPrefs, parseCap, blockedRangesFrom, SETUP_SKIP_KEY } from "@/lib/tourOptPrefs";
import type { SetupState } from "@/lib/tourSetup";

export default function StepWow({ state }: { state: SetupState }) {
  const t = useT();
  const [phase, setPhase] = useState<"run" | "done">("run");
  const [found, setFound] = useState(0);
  const [fit, setFit] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const frame: Frame = { region: "europe", from: new Date().toISOString().slice(0, 10), to: "", countries: [], series: [], surface: [] };
        const [tours, rates] = await Promise.all([getTourCatalog(), loadCostRates()]);
        const candidates = buildSeasonCandidates(tours, frame, new Set(), new Set());
        if (!alive) return;
        setFound(candidates.length);
        if (!costRatesComplete(rates)) { setFit(null); setPhase("done"); return; }
        const prefs = loadTourOptPrefs();
        const cur = rates!.currency ?? "EUR";
        const nightsNum = parseInt(prefs.nights.trim(), 10);
        const bufferNum = parseInt(prefs.buffer.trim(), 10);
        const banned = state.passports.length > 0 ? await bannedDestinations(state.passports) : new Set<string>();
        if (!alive) return;
        const result = optimizeSeason({
          candidates,
          budget: budgetMoney(state.seasonBudget, cur),
          params: ratesToCostParams(rates!),
          homePlace: placeKey(state.country, state.city) ?? "",
          nightsPerWeek: Number.isFinite(nightsNum) && nightsNum >= 0 ? nightsNum : null,
          bufferDays: Number.isFinite(bufferNum) && bufferNum >= 0 ? bufferNum : null,
          now: new Date(),
          schengen: null,
          entryBanned: banned,
          maxPicks: parseCap(prefs.maxPicks),
          maxConsecutiveWeeks: parseCap(prefs.maxStreak),
          blockedRanges: blockedRangesFrom(prefs.blockedFrom, prefs.blockedTo),
        });
        if (!alive) return;
        setFit(result.picks.length);
      } catch {
        if (alive) { setFit(null); }
      } finally {
        if (alive) setPhase("done");
      }
    })();
    return () => { alive = false; };
  }, [state.seasonBudget, state.country, state.city, state.passports]);

  return (
    <section className="t2-panel">
      <h2 className="t2-kicker">{t("tour.t2onbWowTitle")}</h2>
      {phase === "run" ? (
        <p className="mt-4 text-[18px] font-semibold text-[var(--t2-ink)]">{t("tour.t2onbWowWait")}</p>
      ) : (
        <>
          <p className="mt-4 t2-display text-[clamp(1.6rem,4vw,2.2rem)]">
            {fit != null ? t("tour.t2onbWowSummary", { found, fit }) : t("tour.t2onbWowFoundOnly", { found })}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/tour2/finder" onClick={() => { try { localStorage.setItem(SETUP_SKIP_KEY, "1"); } catch { /* egal */ } }} className="t2-cta">{t("tour.t2onbBrowse")}</Link>
            <Link href="/tour2/season" onClick={() => { try { localStorage.setItem(SETUP_SKIP_KEY, "1"); } catch { /* egal */ } }} className="t2-ghost">{t("tour.t2onbPlan")}</Link>
          </div>
        </>
      )}
    </section>
  );
}
