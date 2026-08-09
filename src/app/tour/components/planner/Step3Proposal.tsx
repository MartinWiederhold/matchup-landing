"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useT, useLocale } from "@/lib/i18n";
import CostRatesForm from "@/app/tour/costs/components/CostRatesForm";
import {
  buildSeasonCandidates,
  budgetMoney,
  costRatesComplete,
  placeKey,
  ratesToCostParams,
  tournamentsInFrame,
  type Frame,
  type PlannerProfile,
} from "@/lib/tourPlanner";
import { addToSeason } from "@/lib/tourSeason";
import { loadStays } from "@/lib/tourStays";
import { hasSchengenPassport } from "@/lib/visa";
import { bannedDestinations } from "@/lib/tourVisaRequirements";
import { DeadlineCountdown, EntryPath } from "../EntryDeadline";
import type { TourTournament, TourCostRates } from "@/lib/types";
import { optimizeSeason, type SeasonProposal } from "@/domain/tour/optimizeSeason";
import { computeSeasonCost } from "@/domain/tour/costs";
import { schengenUsage, isSchengenCode, type Stay, type SchengenUsage } from "@/domain/tour/schengen";

const NIGHTS_KEY = "mu_tour_nights"; // dieselbe Annahme wie /tour/costs
const DAY = 86_400_000;

/**
 * Schritt 3 des Planers: den Saison-Optimierer anbinden, das Ergebnis ANZEIGEN,
 * per Streichen ANPASSEN und erst auf Knopfdruck ÜBERNEHMEN (Ergänzen, nie ersetzen).
 *
 * REAKTIV (wie der /map-Planer): der Vorschlag rechnet automatisch, sobald genug
 * Daten da sind — KEIN „Vorschlagen"-Knopf. Der Optimierer ist mit ~3 ms je Lauf
 * (44 Kandidaten, Strahlbreite 64) weit unter jeder spürbaren Grenze. Die
 * nutzerabhängigen Basisdaten (Schengen-Aufenthalte, Einreisesperren) hängen NICHT
 * am Rahmen und werden EINMAL geladen; die eigentliche Rechnung ist rein (useMemo).
 *
 * Gate: fehlen echte Kostensätze, führen wir ZUERST dorthin — es wird NICHT mit
 * Vorschlagswerten gerechnet. Der berechnete Vorschlag wird nach oben gereicht
 * (setProposal), damit die klebende Karte den Reiseweg zeigt.
 */
export default function Step3Proposal({
  userId,
  profile,
  tours,
  frame,
  rates,
  existingWeeks,
  existingIds,
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

  const [busy, setBusy] = useState(false); // nur noch für „Übernehmen"
  const [error, setError] = useState(false);
  const [takeoverMsg, setTakeoverMsg] = useState<string | null>(null);

  // ── Nutzerabhängige Basisdaten EINMAL laden (hängen an Nationalität/Aufenthalten,
  //    NICHT am Rahmen) — damit die reaktive Rechnung rein bleibt und nicht bei jeder
  //    Rahmenänderung die DB fragt. ─────────────────────────────────────────────────
  const [stays, setStays] = useState<Stay[]>([]);
  const [entryBanned, setEntryBanned] = useState<Set<string>>(new Set());
  const passportsKey = profile.passports.join(",");
  useEffect(() => {
    let alive = true;
    const applies = profile.passports.length > 0 && !hasSchengenPassport(profile.passports);
    (async () => {
      const loaded = applies
        ? (await loadStays(userId)).filter((s) => s.confirmed).map((s) => ({ country: s.country, entry: s.entry_date, exit: s.exit_date }))
        : [];
      const banned = await bannedDestinations(profile.passports);
      if (alive) { setStays(loaded); setEntryBanned(banned); }
    })().catch(() => { if (alive) { setStays([]); setEntryBanned(new Set()); } });
    return () => { alive = false; };
  }, [userId, passportsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reaktiver Vorschlag: pure Rechnung, automatisch bei Änderung von Rahmen/Budget/
  //    Kostensätzen/Nächten/Basisdaten. Kein Knopf. ──────────────────────────────────
  const proposal = useMemo<SeasonProposal | null>(() => {
    if (!costRatesComplete(rates)) return null;
    const rr = rates!;
    const params = ratesToCostParams(rr);
    const currency = rr.currency ?? "EUR";
    const budget = budgetMoney(profile.seasonBudget, currency);
    const homePlace = placeKey(profile.country, profile.city) ?? "";
    let n: number | null = parseInt(nights.trim(), 10);
    if (!Number.isFinite(n) || (n as number) < 0) n = null;
    const applies = profile.passports.length > 0 && !hasSchengenPassport(profile.passports);
    const candidates = buildSeasonCandidates(tours, frame, existingWeeks, existingIds);
    return optimizeSeason({
      candidates, budget, params, homePlace, nightsPerWeek: n, now: new Date(),
      schengen: applies ? { applies: true, existingStays: stays } : null,
      entryBanned,
    });
  }, [rates, tours, frame, existingWeeks, existingIds, nights, stays, entryBanned, profile.seasonBudget, profile.country, profile.city, passportsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Nach oben reichen (klebende Karte/Reiseweg) und Streichungen bei Neurechnung zurücksetzen.
  useEffect(() => { setProposal(proposal); setRemoved(new Set()); }, [proposal]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stichtag für den Meldefrist-Countdown (aus der Komponente, nicht aus der Domain).
  // useState-Initializer: läuft EINMAL beim Mount → reine Render-Phase (react-hooks/purity),
  // und der Hook steht VOR dem Kostensätze-Gate (feste Hook-Reihenfolge).
  const [nowMs] = useState(() => Date.now());

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
  if (!costRatesComplete(rates) || !proposal) {
    return (
      <div>
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-[13px] text-amber-900 ring-1 ring-amber-200">
          <p className="font-bold">{t("tour.opt.ratesFirstTitle")}</p>
          <p className="mt-1 text-amber-800">{t("tour.opt.ratesFirstText")}</p>
        </div>
        <div className="mt-4">
          <CostRatesForm rates={rates} userId={userId} onSaved={() => onRatesSaved()} nights={nights} onNightsChange={onNightsChange} />
        </div>
      </div>
    );
  }
  const ready = rates!;
  const params = ratesToCostParams(ready);
  const currency = ready.currency ?? "EUR";
  const budget = budgetMoney(profile.seasonBudget, currency);

  // ── Ergebnis: Picks (parallel zu stations), abzüglich gestrichener ──────────
  const nightsUsed = proposal.stations[0]?.nights ?? (() => { const n = parseInt(nights.trim(), 10); return Number.isFinite(n) && n >= 0 ? n : 7; })();
  const pairs = proposal.picks.map((pick, i) => ({ pick, station: proposal.stations[i] }));
  const remaining = pairs.filter((x) => !removed.has(x.pick.id));

  const liveCost = computeSeasonCost(remaining.map((x) => x.station), params);
  const budgetLeftMinor = budget ? budget.amount - (liveCost.total[budget.currency] ?? 0) : null;

  // Schengen der verbliebenen Auswahl neu rechnen (nur wenn betroffen).
  const liveSchengen: SchengenUsage | null = (() => {
    if (proposal.schengen == null) return null; // Nationalität nicht betroffen → gar nicht geprüft
    const s: Stay[] = [...stays];
    for (const { pick } of remaining) {
      const cc = pick.place.split("|")[0];
      if (!isSchengenCode(cc)) continue;
      const start = Date.parse(pick.weekMonday + "T00:00:00Z");
      s.push({ country: cc, entry: pick.weekMonday, exit: new Date(start + nightsUsed * DAY).toISOString().slice(0, 10) });
    }
    if (s.length === 0) return null;
    const today = new Date().toISOString().slice(0, 10);
    const asOf = s.reduce((mx, x) => (x.exit && x.exit > mx ? x.exit : mx), today);
    return schengenUsage(s, asOf);
  })();

  const natUnknown = profile.passports.length === 0;
  const noMapPicks = remaining.filter((x) => !x.pick.onMap);

  function toggle(id: string) {
    const next = new Set(removed);
    if (next.has(id)) next.delete(id); else next.add(id);
    setRemoved(next);
  }

  async function takeover() {
    setBusy(true);
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
      setBusy(false);
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

  // ── Grund einer LEEREN Saison ehrlich unterscheiden (Anzeige, keine Domain-Änderung):
  //    (a) kein Turnier im Rahmen · (b) Turniere da, aber alle Wochen belegt · (c) Budget zu klein.
  function emptyReason() {
    const inFrame = tournamentsInFrame(tours, frame);
    const cands = buildSeasonCandidates(tours, frame, existingWeeks, existingIds);
    if (inFrame.length === 0) {
      return <p className="rounded-xl bg-black/[0.03] px-4 py-3 text-[13px] text-neutral-600">{t("tour.opt.emptyNoTournaments")}</p>;
    }
    if (cands.length === 0) {
      // Alle im Rahmen liegenden Turniere fallen an belegten Wochen / bereits geplanten IDs raus → nennen.
      return (
        <div className="rounded-xl bg-black/[0.03] px-4 py-3 text-[13px] text-neutral-600">
          <p className="font-semibold">{t("tour.opt.emptyWeeksBlocked")}</p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-[12px] text-neutral-500">
            {inFrame.slice(0, 8).map((x) => (
              <li key={x.id}>{[x.city, x.category].filter(Boolean).join(" · ") || x.id} — {fmtDay(x.tournament_monday)}</li>
            ))}
            {inFrame.length > 8 && <li>… (+{inFrame.length - 8})</li>}
          </ul>
        </div>
      );
    }
    // Kandidaten da, aber keiner gewählt → am Ablehnungsgrund des Optimierers festmachen
    // (nicht raten): Budget nur nennen, wenn Budget wirklich der Grund war.
    const codes = new Set(proposal!.rejected.flatMap((r) => r.reasons.map((x) => x.code)));
    if (codes.has("budget_erschoepft")) {
      let cheapest = Infinity;
      for (const c of cands) {
        if (!c.place) continue;
        const cst = computeSeasonCost([{ place: c.place, nights: nightsUsed, entryFee: c.entryFee ?? null }], params);
        const v = cst.total[currency] ?? (cst.currencies[0] ? cst.total[cst.currencies[0]] : 0);
        if (v < cheapest) cheapest = v;
      }
      return (
        <p className="rounded-xl bg-black/[0.03] px-4 py-3 text-[13px] text-neutral-600">
          {t("tour.opt.emptyBudget", {
            needed: Number.isFinite(cheapest) ? fmt(cheapest, currency) : "—",
            budget: budget ? fmt(budget.amount, budget.currency) : "—",
          })}
        </p>
      );
    }
    // Kandidaten da, aber keiner planbar (meist verstrichene Meldefristen) → ehrlich sagen.
    return <p className="rounded-xl bg-black/[0.03] px-4 py-3 text-[13px] text-neutral-600">{t("tour.opt.emptyAllPassed")}</p>;
  }

  return (
    <div className="space-y-4">
      {/* Kopf: Titel + Anzahl (reaktiv, kein „Vorschlagen"-Knopf mehr) */}
      <div>
        <p className="text-[15px] font-bold text-neutral-900">{t("tour.opt.resultTitle")}</p>
        <p className="text-[12px] text-neutral-500">{t("tour.opt.countTournaments", { n: remaining.length })}</p>
      </div>

      {pairs.length === 0 ? (
        emptyReason()
      ) : remaining.length === 0 ? (
        <p className="rounded-xl bg-black/[0.03] px-4 py-3 text-[13px] text-neutral-600">{t("tour.opt.emptyAllStruck")}</p>
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
              const xt = byId.get(pick.id); // volle Turnierdaten (Serie/Frist/website) für Countdown + Meldeweg
              return (
                <li key={pick.id} className={`rounded-xl px-4 py-3 ring-1 ${struck ? "bg-black/[0.02] ring-black/5 opacity-60" : "bg-white ring-black/[0.08]"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`text-[14px] font-bold text-neutral-900 ${struck ? "line-through" : ""}`}>{tName(pick.id)}</p>
                      <p className="text-[12px] text-neutral-500">
                        {t("tour.opt.week", { d: fmtDay(pick.weekMonday) })}
                        {arrival ? ` · ${t("tour.opt.arrival")}` : ""}
                      </p>
                      {/* Countdown zur Meldefrist — Stichtag aus der Komponente (nowMs). */}
                      {xt && <p className="mt-1"><DeadlineCountdown tournament={xt} now={nowMs} /></p>}
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {pick.reasons.map((r, i) => (
                          <span key={i} className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${r.direction === "dafuer" ? "bg-emerald-50 text-emerald-700" : "bg-black/[0.04] text-neutral-500"}`}>
                            {t(`tour.opt.reason.${r.code}`)}
                          </span>
                        ))}
                      </div>
                      {/* Weg zur Meldung — ehrlich beschriftet, kein Anmelde-Knopf. */}
                      {xt && !struck && <EntryPath tournament={xt} />}
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
              disabled={busy || remaining.length === 0}
              className="inline-flex rounded-full bg-matchup px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-matchup-hover disabled:opacity-60"
            >
              {busy ? t("tour.opt.takeoverBusy") : t("tour.opt.takeoverCta")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
