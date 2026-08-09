"use client";

import { useCallback, useState } from "react";
import { useT, useLocale } from "@/lib/i18n";
import CostRatesForm from "@/app/tour/costs/components/CostRatesForm";
import {
  buildSeasonCandidates,
  budgetMoney,
  costRatesComplete,
  placeKey,
  ratesToCostParams,
  type Frame,
  type PlannerProfile,
} from "@/lib/tourPlanner";
import { addToSeason } from "@/lib/tourSeason";
import { loadStays } from "@/lib/tourStays";
import { hasSchengenPassport } from "@/lib/visa";
import { bannedDestinations } from "@/lib/tourVisaRequirements";
import type { TourTournament, TourCostRates } from "@/lib/types";
import type { CostRatesPatch } from "@/lib/tourCosts";
import { optimizeSeason, type SeasonProposal, type SeasonPick } from "@/domain/tour/optimizeSeason";
import { computeSeasonCost } from "@/domain/tour/costs";
import { schengenUsage, isSchengenCode, type Stay, type SchengenUsage } from "@/domain/tour/schengen";

const NIGHTS_KEY = "mu_tour_nights"; // dieselbe Annahme wie /tour/costs
const DAY = 86_400_000;

/**
 * Schritt 3 des Planers: den Saison-Optimierer anbinden, das Ergebnis ANZEIGEN,
 * per Streichen ANPASSEN und erst auf Knopfdruck ÜBERNEHMEN (Ergänzen, nie ersetzen).
 *
 * Gate: fehlen echte Kostensätze, führen wir ZUERST dorthin — es wird NICHT mit
 * Vorschlagswerten gerechnet. `proposal`/`removed` liegen im Eltern-Zustand, damit
 * die klebende Karte den Reiseweg zeigt und auf Streichungen reagiert.
 */
export default function Step3Proposal({
  userId,
  profile,
  tours,
  frame,
  rates,
  existingWeeks,
  existingIds,
  proposal,
  setProposal,
  removed,
  setRemoved,
  onRatesSaved,
  onTakenOver,
}: {
  userId: string;
  profile: PlannerProfile;
  tours: TourTournament[];
  frame: Frame;
  rates: TourCostRates | null;
  existingWeeks: Set<string>;
  existingIds: Set<string>;
  proposal: SeasonProposal | null;
  setProposal: (p: SeasonProposal | null) => void;
  removed: Set<string>;
  setRemoved: (s: Set<string>) => void;
  onRatesSaved: () => void;
  onTakenOver: () => void;
}) {
  const t = useT();
  const { locale } = useLocale();

  // Nächte-Feld für das Kostensätze-Gate (String, leer = keine Annahme → Fallback 7).
  const [nights, setNights] = useState(() => {
    try { return localStorage.getItem(NIGHTS_KEY) ?? ""; } catch { return ""; }
  });
  const onNightsChange = useCallback((v: string) => {
    setNights(v);
    try { localStorage.setItem(NIGHTS_KEY, v); } catch { /* egal */ }
  }, []);

  const [busy, setBusy] = useState<null | "run" | "takeover">(null);
  const [error, setError] = useState(false);
  const [takeoverMsg, setTakeoverMsg] = useState<string | null>(null);
  const [planStays, setPlanStays] = useState<Stay[]>([]); // Basis-Aufenthalte des Vorschlags (für Schengen-Neurechnung)

  const byId = new Map(tours.map((x) => [x.id, x]));
  const tName = (id: string) => {
    const x = byId.get(id);
    if (!x) return id;
    return [x.city, x.category].filter(Boolean).join(" · ") || x.name || id;
  };
  const fmt = (minor: number, currency: string) =>
    new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(minor / 100);
  const fmtDay = (iso: string) => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso + "T00:00:00Z"));

  // ── Kostensätze-Gate: ohne echte Sätze wird NICHT gerechnet ─────────────────
  if (!costRatesComplete(rates)) {
    return (
      <div>
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-[13px] text-amber-900 ring-1 ring-amber-200">
          <p className="font-bold">{t("tour.opt.ratesFirstTitle")}</p>
          <p className="mt-1 text-amber-800">{t("tour.opt.ratesFirstText")}</p>
        </div>
        <div className="mt-4">
          <CostRatesForm rates={rates} userId={userId} onSaved={(_: CostRatesPatch) => onRatesSaved()} nights={nights} onNightsChange={onNightsChange} />
        </div>
      </div>
    );
  }
  const ready = rates!; // ab hier vollständig

  // ── Vorschlag rechnen ───────────────────────────────────────────────────────
  async function run() {
    setBusy("run");
    setError(false);
    setTakeoverMsg(null);
    try {
      const params = ratesToCostParams(ready);
      const currency = ready.currency ?? "EUR";
      const budget = budgetMoney(profile.seasonBudget, currency);
      const homePlace = placeKey(profile.country, profile.city) ?? "";
      let nightsNum: number | null = parseInt(nights.trim(), 10);
      if (!Number.isFinite(nightsNum) || (nightsNum as number) < 0) nightsNum = null;

      // Schengen nur, wenn die Nationalität bekannt UND nicht Schengen-privilegiert ist.
      const natKnown = profile.passports.length > 0;
      const applies = natKnown && !hasSchengenPassport(profile.passports);
      let schengenStays: Stay[] = [];
      if (applies) {
        const stays = await loadStays(userId);
        schengenStays = stays
          .filter((s) => s.confirmed)
          .map((s) => ({ country: s.country, entry: s.entry_date, exit: s.exit_date }));
      }
      setPlanStays(schengenStays);

      const candidates = buildSeasonCandidates(tours, frame, existingWeeks, existingIds);
      // Einreisesperren der Nationalität(en) → gesperrte Länder gar nicht erst vorschlagen.
      const entryBanned = await bannedDestinations(profile.passports);
      const result = optimizeSeason({
        candidates,
        budget,
        params,
        homePlace,
        nightsPerWeek: nightsNum,
        now: new Date(),
        schengen: applies ? { applies: true, existingStays: schengenStays } : null,
        entryBanned,
      });
      setRemoved(new Set());
      setProposal(result);
    } catch {
      setError(true);
    } finally {
      setBusy(null);
    }
  }

  // ── Auslöse-Ansicht (noch kein Vorschlag) ───────────────────────────────────
  if (!proposal) {
    return (
      <div>
        <p className="text-[13px] font-bold text-neutral-900">{t("tour.opt.runTitle")}</p>
        <p className="mt-1 text-[12px] text-neutral-500">{t("tour.opt.runText")}</p>
        {error && <p className="mt-3 text-[12px] font-semibold text-amber-700">{t("tour.opt.takeoverError")}</p>}
        <button
          type="button"
          onClick={run}
          disabled={busy === "run"}
          className="mt-4 inline-flex rounded-full bg-matchup px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-matchup-hover disabled:opacity-60"
        >
          {busy === "run" ? t("tour.opt.running") : t("tour.opt.runCta")}
        </button>
      </div>
    );
  }

  // ── Ergebnis: Picks (parallel zu stations), abzüglich gestrichener ──────────
  const nightsUsed = proposal.stations[0]?.nights ?? 7;
  const pairs = proposal.picks.map((pick, i) => ({ pick, station: proposal.stations[i] }));
  const remaining = pairs.filter((x) => !removed.has(x.pick.id));

  const params = ratesToCostParams(ready);
  const liveCost = computeSeasonCost(remaining.map((x) => x.station), params);
  const budget = budgetMoney(profile.seasonBudget, ready.currency ?? "EUR");
  const budgetLeftMinor = budget ? budget.amount - (liveCost.total[budget.currency] ?? 0) : null;

  // Schengen der verbliebenen Auswahl neu rechnen (nur wenn betroffen).
  const liveSchengen: SchengenUsage | null = (() => {
    if (proposal.schengen == null) return null; // Nationalität nicht betroffen → gar nicht geprüft
    const stays: Stay[] = [...planStays];
    for (const { pick } of remaining) {
      const cc = pick.place.split("|")[0];
      if (!isSchengenCode(cc)) continue;
      const start = Date.parse(pick.weekMonday + "T00:00:00Z");
      stays.push({ country: cc, entry: pick.weekMonday, exit: new Date(start + nightsUsed * DAY).toISOString().slice(0, 10) });
    }
    if (stays.length === 0) return null;
    const today = new Date().toISOString().slice(0, 10);
    const asOf = stays.reduce((mx, s) => (s.exit && s.exit > mx ? s.exit : mx), today);
    return schengenUsage(stays, asOf);
  })();

  const natUnknown = profile.passports.length === 0;
  const noMapPicks = remaining.filter((x) => !x.pick.onMap);

  function toggle(id: string) {
    const next = new Set(removed);
    if (next.has(id)) next.delete(id); else next.add(id);
    setRemoved(next);
  }

  async function takeover() {
    setBusy("takeover");
    setError(false);
    try {
      const toAdd = remaining.filter((x) => !existingIds.has(x.pick.id));
      for (const x of toAdd) await addToSeason(userId, x.pick.id);
      setTakeoverMsg(
        toAdd.length === 0
          ? t("tour.opt.takenOverNone")
          : t("tour.opt.takenOver", { added: toAdd.length, weeks: existingWeeks.size }),
      );
      onTakenOver();
    } catch {
      setError(true);
    } finally {
      setBusy(null);
    }
  }

  // Näherung/Notes als sichtbare Zeilen (arrivals_gespart trägt den Wert im Code → am ":" trennen).
  const liveNotes: string[] = ["naeherung"];
  if (proposal.notes.includes("naechte_annahme")) liveNotes.push("naechte_annahme");
  if (liveCost.multiCurrency) liveNotes.push("mehrwaehrung");
  const noteText = (code: string) => {
    if (code.startsWith("arrivals_gespart:")) return t("tour.opt.note.arrivals_gespart", { n: code.split(":")[1] });
    return t(`tour.opt.note.${code}`);
  };

  return (
    <div className="space-y-4">
      {/* Kopf: Titel + Anzahl + „neu vorschlagen" */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[15px] font-bold text-neutral-900">{t("tour.opt.resultTitle")}</p>
          <p className="text-[12px] text-neutral-500">{t("tour.opt.countTournaments", { n: remaining.length })}</p>
        </div>
        <button type="button" onClick={() => { setProposal(null); setRemoved(new Set()); }} className="shrink-0 text-[12px] font-semibold text-matchup">
          {t("tour.opt.runCta")}
        </button>
      </div>

      {remaining.length === 0 && pairs.length === 0 ? (
        <p className="rounded-xl bg-black/[0.03] px-4 py-3 text-[13px] text-neutral-600">{t("tour.opt.empty")}</p>
      ) : (
        <>
          {/* Näherung — bewusst sichtbar, nicht kleingedruckt */}
          <div className="rounded-xl bg-sky-50 px-4 py-3 text-[13px] text-sky-900 ring-1 ring-sky-200">
            <p className="font-bold">{t("tour.opt.approxTitle")}</p>
            <p className="mt-1 text-sky-800">{t("tour.opt.approxText")}</p>
          </div>

          {/* Kosten je Währung + Budget + gesparte Anreisen */}
          <div className="rounded-xl bg-black/[0.03] px-4 py-3">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="text-[12px] font-semibold text-neutral-500">{t("tour.opt.totalCost")}</span>
              {liveCost.currencies.length === 0 ? (
                <span className="text-[15px] font-bold text-neutral-900">—</span>
              ) : (
                liveCost.currencies.map((c) => (
                  <span key={c} className="text-[15px] font-bold text-neutral-900">{fmt(liveCost.total[c], c)}</span>
                ))
              )}
              {budgetLeftMinor != null && budget && (
                <span className={`text-[12px] font-semibold ${budgetLeftMinor < 0 ? "text-amber-700" : "text-emerald-600"}`}>
                  {budgetLeftMinor < 0
                    ? `${fmt(-budgetLeftMinor, budget.currency)} ${t("tour.opt.budgetOver")}`
                    : `${fmt(budgetLeftMinor, budget.currency)} ${t("tour.opt.budgetLeft")}`}
                </span>
              )}
            </div>
            <p className="mt-2 text-[12px] text-neutral-500">{noteText(`arrivals_gespart:${liveCost.arrivalsSaved}`)}</p>
            {liveNotes.filter((n) => n !== "naeherung").map((n) => (
              <p key={n} className="text-[12px] text-neutral-500">{noteText(n)}</p>
            ))}
          </div>

          {/* Schengen (nur wenn betroffen) bzw. Hinweis, dass es nicht geprüft wurde */}
          {liveSchengen ? (
            <div className={`rounded-xl px-4 py-2.5 text-[13px] ring-1 ${liveSchengen.used >= 80 ? "bg-amber-50 text-amber-900 ring-amber-200" : "bg-black/[0.03] text-neutral-700 ring-black/5"}`}>
              <span className="font-bold">{t("tour.opt.schengenTitle")}: </span>
              {t("tour.opt.schengenUsed", { used: liveSchengen.used })}
            </div>
          ) : natUnknown ? (
            <p className="text-[12px] text-neutral-400">{t("tour.opt.schengenNotChecked")}</p>
          ) : null}

          {/* Picks chronologisch — streichbar */}
          <ul className="space-y-2">
            {pairs.map(({ pick }) => {
              const struck = removed.has(pick.id);
              const arrival = pick.reasons.some((r) => r.code === "keine_anreise_cluster") ? false : true;
              return (
                <li key={pick.id} className={`rounded-xl px-4 py-3 ring-1 ${struck ? "bg-black/[0.02] ring-black/5 opacity-60" : "bg-white ring-black/[0.08]"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`text-[14px] font-bold text-neutral-900 ${struck ? "line-through" : ""}`}>{tName(pick.id)}</p>
                      <p className="text-[12px] text-neutral-500">
                        {t("tour.opt.week", { d: fmtDay(pick.weekMonday) })}
                        {arrival ? ` · ${t("tour.opt.arrival")}` : ""}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {pick.reasons.map((r, i) => (
                          <span key={i} className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${r.direction === "dafuer" ? "bg-emerald-50 text-emerald-700" : "bg-black/[0.04] text-neutral-500"}`}>
                            {t(`tour.opt.reason.${r.code}`)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button type="button" onClick={() => toggle(pick.id)} className="shrink-0 text-[12px] font-semibold text-neutral-500 hover:text-neutral-900">
                      {struck ? t("tour.opt.restore") : t("tour.opt.strike")}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Ohne Kartenpunkt — getrennt ausgewiesen */}
          {noMapPicks.length > 0 && (
            <div className="rounded-xl bg-black/[0.02] px-4 py-3 text-[12px] text-neutral-500 ring-1 ring-black/5">
              <p className="font-semibold text-neutral-600">{t("tour.opt.noMapTitle", { n: noMapPicks.length })}</p>
              <p className="mt-0.5">{t("tour.opt.noMapText")}</p>
            </div>
          )}

          {/* Nicht bewertbar — getrennt */}
          {proposal.unassessable.length > 0 && (
            <div className="rounded-xl bg-black/[0.02] px-4 py-3 text-[12px] text-neutral-500 ring-1 ring-black/5">
              <p className="font-semibold text-neutral-600">{t("tour.opt.unassessableTitle", { n: proposal.unassessable.length })}</p>
              <p className="mt-0.5">{t("tour.opt.unassessableText")}</p>
              <ul className="mt-1.5 list-disc space-y-0.5 pl-4">
                {proposal.unassessable.map((u) => <li key={u.id}>{tName(u.id)}</li>)}
              </ul>
            </div>
          )}

          {/* Verworfene — erreichbar, aber eingeklappt */}
          {proposal.rejected.length > 0 && (
            <details className="rounded-xl bg-black/[0.02] px-4 py-3 ring-1 ring-black/5">
              <summary className="cursor-pointer text-[12px] font-semibold text-neutral-600">{t("tour.opt.rejectedToggle", { n: proposal.rejected.length })}</summary>
              <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto pr-1">
                {proposal.rejected.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 text-[12px]">
                    <span className="min-w-0 truncate text-neutral-600">{tName(r.id)}</span>
                    <span className="shrink-0 text-neutral-400">{t(`tour.opt.reason.${r.reasons[0]?.code}`)}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}

          {/* Übernehmen — ausdrücklich, Ergänzen (nie ersetzen) */}
          <div className="border-t border-black/[0.06] pt-4">
            {takeoverMsg && <p className="mb-3 rounded-xl bg-emerald-50 px-4 py-2.5 text-[13px] font-semibold text-emerald-800 ring-1 ring-emerald-200">{takeoverMsg}</p>}
            {error && <p className="mb-3 text-[12px] font-semibold text-amber-700">{t("tour.opt.takeoverError")}</p>}
            <button
              type="button"
              onClick={takeover}
              disabled={busy === "takeover" || remaining.length === 0}
              className="inline-flex rounded-full bg-matchup px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-matchup-hover disabled:opacity-60"
            >
              {busy === "takeover" ? t("tour.opt.takeoverBusy") : t("tour.opt.takeoverCta")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
