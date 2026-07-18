"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useT, useLocale } from "@/lib/i18n";
import { getRackets } from "@/data/seed/rackets";
import { getStrings } from "@/data/seed/strings";
import { recommend, type Recommendation } from "@/domain/recommendations/scoreV1";
import { recommendStrings } from "@/domain/recommendations/stringScoreV1";
import { defaultProfile, type PlayerProfile } from "@/domain/advisory/playerProfile";
import { getProblemAdvice } from "@/domain/advisory/problemSolver";
import type { Axis } from "@/domain/equipment/racket";
import type { StringAxis } from "@/domain/equipment/string";
import RacketComparison from "./RacketComparison";

/* Frageflow: eine Entscheidung pro Screen, „Weiss ich nicht" → sinnvoller Default,
 * Autosave in der Session. Kein E-Mail-/Lead-Gate vor dem Ergebnis (Doc-Prinzip). */
type Q = { field: keyof PlayerProfile; qKey: string; options: { value: string; labelKey: string }[] };
const QUESTIONS: Q[] = [
  { field: "level", qKey: "q_level", options: [
    { value: "beginner", labelKey: "q_level_beginner" }, { value: "intermediate", labelKey: "q_level_intermediate" },
    { value: "advanced", labelKey: "q_level_advanced" }, { value: "competitive", labelKey: "q_level_competitive" } ] },
  { field: "swingStyle", qKey: "q_swing", options: [
    { value: "compact", labelKey: "q_swing_compact" }, { value: "moderate", labelKey: "q_swing_moderate" }, { value: "full", labelKey: "q_swing_full" } ] },
  { field: "goal", qKey: "q_goal", options: [
    { value: "power", labelKey: "q_goal_power" }, { value: "control", labelKey: "q_goal_control" }, { value: "spin", labelKey: "q_goal_spin" },
    { value: "comfort", labelKey: "q_goal_comfort" }, { value: "allround", labelKey: "q_goal_allround" } ] },
  { field: "playStyle", qKey: "q_playstyle", options: [
    { value: "baseline", labelKey: "q_playstyle_baseline" }, { value: "allcourt", labelKey: "q_playstyle_allcourt" },
    { value: "servevolley", labelKey: "q_playstyle_servevolley" }, { value: "defensive", labelKey: "q_playstyle_defensive" } ] },
  { field: "armSensitivity", qKey: "q_arm", options: [
    { value: "none", labelKey: "q_arm_none" }, { value: "some", labelKey: "q_arm_some" }, { value: "high", labelKey: "q_arm_high" } ] },
  { field: "problem", qKey: "q_problem", options: [
    { value: "none", labelKey: "q_problem_none" }, { value: "flies-long", labelKey: "q_problem_flies_long" }, { value: "no-control", labelKey: "q_problem_no_control" },
    { value: "arm-pain", labelKey: "q_problem_arm_pain" }, { value: "too-heavy", labelKey: "q_problem_too_heavy" }, { value: "no-spin", labelKey: "q_problem_no_spin" } ] },
];
const STORE = "mu_racket_finder_v1";

export default function RacketFinder() {
  const t = useT();
  const { locale } = useLocale();
  const [step, setStep] = useState(0); // 0..QUESTIONS.length-1 ; === length → Ergebnis
  const [answers, setAnswers] = useState<Partial<PlayerProfile>>({});
  const [showCompare, setShowCompare] = useState(false);

  useEffect(() => {
    try { const raw = sessionStorage.getItem(STORE); if (raw) setAnswers(JSON.parse(raw)); } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    try { sessionStorage.setItem(STORE, JSON.stringify(answers)); } catch { /* ignore */ }
  }, [answers]);

  const total = QUESTIONS.length;
  const axisLabel = (a: Axis) => t(`beratung.axis_${a}`);

  function choose(field: keyof PlayerProfile, value: string) {
    setAnswers((a) => ({ ...a, [field]: value }));
    setStep((s) => s + 1);
  }
  function skip() {
    const q = QUESTIONS[step];
    setAnswers((a) => ({ ...a, [q.field]: defaultProfile[q.field] }));
    setStep((s) => s + 1);
  }
  function restart() { setAnswers({}); setStep(0); try { sessionStorage.removeItem(STORE); } catch { /* ignore */ } }

  // ── Ergebnis ──────────────────────────────────────────────────────────
  if (step >= total) {
    const profile: PlayerProfile = { ...defaultProfile, ...answers, schemaVersion: 1 };
    const { recommendations, excludedCount } = recommend(profile, getRackets(), 5);
    const strings = recommendStrings(profile, getStrings(), 3);
    const sAxisLabel = (a: StringAxis) => t(`beratung.axis_${a}`);
    const advice = getProblemAdvice(profile.problem);
    const L = (x: { de: string; en: string }) => (locale === "en" ? x.en : x.de);
    return (
      <div className="mx-auto max-w-[640px]">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-2xl font-extrabold tracking-tight text-neutral-900">{t("beratung.finderResultTitle")}</h3>
            <p className="mt-1 text-sm text-neutral-500">{t("beratung.finderResultSub")}</p>
          </div>
          <button type="button" onClick={restart} className="shrink-0 rounded-full bg-black/[0.05] px-4 py-2 text-[13px] font-bold text-neutral-700 transition-colors hover:bg-black/[0.08]">
            {t("beratung.finderRestart")}
          </button>
        </div>

        {/* Problem-Solver: risikoarme Massnahmen ZUERST (vor Neukauf) */}
        {advice && (
          <div className="mb-5 rounded-[24px] border border-matchup/20 bg-matchup/[0.05] p-5">
            <p className="text-[15px] font-extrabold tracking-tight text-neutral-900">{t("beratung.psTitle")}</p>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-matchup">{t("beratung.psFirstTry")}</p>
            <ul className="mt-1.5 space-y-1.5">
              {advice.firstTry.map((s, i) => (
                <li key={i} className="flex gap-2 text-[13.5px] leading-snug text-neutral-700">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-matchup text-[10px] font-bold text-white">{i + 1}</span>
                  {L(s)}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("beratung.psThenConsider")}</p>
            <ul className="mt-1.5 space-y-1">
              {advice.thenConsider.map((s, i) => (
                <li key={i} className="flex gap-2 text-[13px] leading-snug text-neutral-500">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-neutral-400" />{L(s)}
                </li>
              ))}
            </ul>
            {advice.medical && <p className="mt-3 text-[11px] leading-relaxed text-neutral-400">{t("beratung.psMedical")}</p>}
          </div>
        )}

        <div className="space-y-3">
          {recommendations.map((rec, i) => (
            <RecCard key={rec.racket.id} rec={rec} rank={i + 1} locale={locale} axisLabel={axisLabel} t={t} />
          ))}
        </div>

        {excludedCount > 0 && (
          <p className="mt-4 text-[12px] text-neutral-400">{t("beratung.finderExcludedNote", { n: excludedCount })}</p>
        )}

        {/* ── Vergleich der Top 3 (aufklappbar) ── */}
        {recommendations.length >= 2 && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowCompare((v) => !v)}
              className="flex w-full items-center justify-center gap-1.5 rounded-full bg-black/[0.05] py-2.5 text-[13px] font-bold text-neutral-700 transition-colors hover:bg-black/[0.08]"
            >
              {showCompare ? t("beratung.compareHide") : t("beratung.compareShow")}
              <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-transform ${showCompare ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
            </button>
            {showCompare && (
              <>
                <p className="mt-3 px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">{t("beratung.compareTitle")}</p>
                <RacketComparison rackets={recommendations.slice(0, 3).map((r) => r.racket)} axisLabel={axisLabel} t={t} />
              </>
            )}
          </div>
        )}

        {/* ── Passende Besaitung (Saite + Spannungsbereich) ── */}
        <div className="mt-8">
          <h3 className="text-2xl font-extrabold tracking-tight text-neutral-900">{t("beratung.stringSectionTitle")}</h3>
          <p className="mt-1 text-sm text-neutral-500">{t("beratung.stringSectionSub")}</p>

          {/* Empfohlener Spannungs-BEREICH */}
          <div className="mt-4 flex items-center gap-4 rounded-[24px] bg-gradient-to-br from-matchup to-indigo-600 p-5 text-white">
            <div className="flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">{t("beratung.tensionLabel")}</p>
              <p className="mt-1 text-[30px] font-extrabold leading-none tracking-tight">
                {t("beratung.tensionRange", { min: strings.tensionKg.min, max: strings.tensionKg.max })}
              </p>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 10h16M4 14h16M4 18h16M8 3v18M16 3v18" /></svg>
            </span>
          </div>

          <div className="mt-3 space-y-3">
            {strings.recommendations.map((s, i) => (
              <div key={s.product.id} className="rounded-[24px] bg-black/[0.035] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">#{i + 1} · {s.product.brand} · {t(`beratung.mat_${s.product.material.replace("-", "_")}`)}</p>
                    <h4 className="mt-0.5 text-[17px] font-extrabold tracking-tight text-neutral-900">{s.product.name}</h4>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[26px] font-extrabold leading-none tracking-tight text-matchup">{s.matchScore}</div>
                    <div className="text-[9px] font-bold uppercase tracking-wide text-neutral-400">{t("beratung.finderMatch")}</div>
                  </div>
                </div>
                <div className="mt-2"><ConfBadge conf={s.confidence} t={t} /></div>
                <p className="mt-3 text-[13.5px] leading-relaxed text-neutral-600">{s.product.editorial.summary[locale === "en" ? "en" : "de"]}</p>
                {s.topAxes.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {s.topAxes.map((a) => (
                      <span key={a} className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">{sAxisLabel(a)}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-neutral-400">{t("beratung.stringDisclaimer")}</p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link href="/beratung/methodik" className="text-[12px] font-bold text-matchup underline underline-offset-2">
            {t("beratung.finderMethodikLink")}
          </Link>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-400">{t("beratung.finderDemoNote")}</p>
      </div>
    );
  }

  // ── Fragen ────────────────────────────────────────────────────────────
  const q = QUESTIONS[step];
  const pct = Math.round((step / total) * 100);
  const current = answers[q.field];
  return (
    <div className="mx-auto max-w-[560px]">
      {/* Fortschritt */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-[12px] font-semibold text-neutral-400">
          <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="disabled:opacity-0">← {t("beratung.finderBack")}</button>
          <span>{t("beratung.finderStep", { n: step + 1, total })}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10">
          <div className="h-full rounded-full bg-matchup transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <h3 className="mb-5 text-[22px] font-extrabold leading-tight tracking-tight text-neutral-900">{t(`beratung.${q.qKey}`)}</h3>

      <div className="grid gap-2.5">
        {q.options.map((o) => {
          const active = current === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => choose(q.field, o.value)}
              className={`flex items-center justify-between rounded-2xl px-5 py-4 text-left text-[15px] font-semibold transition-all active:scale-[0.99] ${
                active ? "bg-matchup text-white" : "bg-black/[0.035] text-neutral-900 hover:bg-black/[0.06]"
              }`}
            >
              {t(`beratung.${o.labelKey}`)}
              <span className={`text-lg ${active ? "opacity-100" : "opacity-20"}`}>›</span>
            </button>
          );
        })}
      </div>

      <button type="button" onClick={skip} className="mt-4 w-full py-2 text-center text-[13px] font-semibold text-neutral-400 transition-colors hover:text-neutral-600">
        {t("beratung.finderDontKnow")}
      </button>
    </div>
  );
}

function ConfBadge({ conf, t }: { conf: Recommendation["confidence"]; t: (k: string) => string }) {
  const cls = conf === "high" ? "bg-emerald-500/10 text-emerald-600" : conf === "medium" ? "bg-amber-500/10 text-amber-600" : "bg-black/[0.06] text-neutral-500";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cls}`}>{t("beratung.finderConfidence")}: {t(`beratung.conf_${conf}`)}</span>;
}

function RecCard({ rec, rank, locale, axisLabel, t }: {
  rec: Recommendation; rank: number; locale: string;
  axisLabel: (a: Axis) => string; t: (k: string, v?: Record<string, string | number>) => string;
}) {
  const r = rec.racket;
  const summary = r.editorial.summary[locale === "en" ? "en" : "de"];
  return (
    <div className="rounded-[24px] bg-black/[0.035] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">#{rank} · {r.brand}</p>
          <h4 className="mt-0.5 text-[17px] font-extrabold tracking-tight text-neutral-900">{r.model}</h4>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[26px] font-extrabold leading-none tracking-tight text-matchup">{rec.matchScore}</div>
          <div className="text-[9px] font-bold uppercase tracking-wide text-neutral-400">{t("beratung.finderMatch")}</div>
        </div>
      </div>

      <div className="mt-2"><ConfBadge conf={rec.confidence} t={t} /></div>

      <p className="mt-3 text-[13.5px] leading-relaxed text-neutral-600">{summary}</p>

      <div className="mt-3 grid grid-cols-2 gap-3 text-[11px] text-neutral-500">
        <span>{r.specs.headSizeSqIn} in² · {r.specs.unstrungWeightG} g</span>
        <span className="text-right">RA {r.specs.stiffnessRa} · {r.specs.stringPattern}</span>
      </div>

      {rec.topAxes.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("beratung.finderWhy")}</p>
          <div className="flex flex-wrap gap-1.5">
            {rec.topAxes.map((a) => (
              <span key={a} className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">{axisLabel(a)}</span>
            ))}
          </div>
        </div>
      )}
      {rec.watchAxes.length > 0 && (
        <div className="mt-2.5">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("beratung.finderWatch")}</p>
          <div className="flex flex-wrap gap-1.5">
            {rec.watchAxes.map((a) => (
              <span key={a} className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-700">{axisLabel(a)}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
