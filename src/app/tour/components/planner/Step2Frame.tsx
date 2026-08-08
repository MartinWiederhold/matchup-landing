"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n";
import { saveSeasonBudget } from "@/lib/tourSetup";
import type { Frame, FrameResult, RegionMode } from "@/lib/tourPlanner";

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
}: {
  budgetInitial: number | null;
  userId: string;
  frame: Frame;
  setFrame: (f: Frame) => void;
  result: FrameResult;
}) {
  const t = useT();
  const [budget, setBudget] = useState(budgetInitial != null ? String(budgetInitial) : "");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  async function saveBudget() {
    if (busy) return;
    const raw = budget.trim().replace(",", ".");
    const n = raw === "" ? null : Number(raw);
    const value = n != null && Number.isFinite(n) && n > 0 ? Math.round(n) : null;
    setBusy(true);
    setStatus("idle");
    try { await saveSeasonBudget(userId, value); setStatus("saved"); }
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
