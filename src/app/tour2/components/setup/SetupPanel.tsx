"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { loadSetupState, type SetupState } from "@/lib/tourSetup";
import StepWhoAreYou from "./StepWhoAreYou";
import StepFrame from "./StepFrame";
import StepLimits from "./StepLimits";
import StepWow from "./StepWow";
import { BTN_PRIMARY } from "../tourUi";
import { SETUP_SKIP_KEY } from "@/lib/tourOptPrefs";

export type SetupStep = 1 | 2 | 3 | 4;

/**
 * Geführter Einstieg in vier Schritten. Wow am Ende zeigt belegte Zählung
 * (Rahmen + Optimierer-Picks), ohne die Saison zu schreiben.
 */
export default function SetupPanel({ initialStep, onExit }: { initialStep?: SetupStep; onExit?: () => void }) {
  const { user, loading: authLoading } = useAuth();
  const t = useT();

  const [state, setState] = useState<SetupState | null>(null);
  const [load, setLoad] = useState<"loading" | "error" | "ready">("loading");
  const [step, setStep] = useState<SetupStep>(initialStep ?? 1);

  const refresh = useCallback(() => {
    if (!user) return;
    loadSetupState(user.id).then(setState).catch(() => { /* Stand bleibt */ });
  }, [user]);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancel = false;
    setLoad("loading");
    loadSetupState(user.id)
      .then((s) => {
        if (cancel) return;
        setState(s);
        if (initialStep == null) setStep(s.step1Done ? (s.step2Done ? 3 : 2) : 1);
        setLoad("ready");
      })
      .catch(() => { if (!cancel) setLoad("error"); });
    return () => { cancel = true; };
  }, [authLoading, user, initialStep]);

  const markSkipped = () => { try { localStorage.setItem(SETUP_SKIP_KEY, "1"); } catch { /* egal */ } };

  const ExitAction = ({ label, primary }: { label: string; primary: boolean }) => {
    const cls = primary
      ? BTN_PRIMARY
      : "rounded-full px-4 py-2 text-[13px] font-semibold text-neutral-500 transition-colors hover:text-neutral-800";
    const go = () => { markSkipped(); onExit?.(); };
    if (onExit) return <button type="button" onClick={go} className={cls}>{label}</button>;
    return <Link href="/tour2" onClick={markSkipped} className={cls}>{label}</Link>;
  };

  if (authLoading || load === "loading") return <p className="mt-8 text-sm text-neutral-500">{t("tour.loading")}</p>;
  if (!user) {
    return (
      <div className="mt-8 rounded-2xl bg-black/[0.02] ring-1 ring-black/5 px-6 py-10 text-center">
        <h2 className="text-lg font-bold text-neutral-900">{t("tour.loginRequiredTitle")}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">{t("tour.loginRequiredText")}</p>
        <Link href="/app" className={`mt-6 ${BTN_PRIMARY}`}>{t("tour.loginCta")}</Link>
      </div>
    );
  }
  if (load === "error" || !state) return <p className="mt-8 text-sm text-neutral-500">{t("tour.loadError")}</p>;

  const done = (n: SetupStep) => (n === 1 ? state.step1Done : n === 2 ? state.step2Done : n < step);

  return (
    <div className="mt-6">
      <p className="text-sm text-neutral-500">{t("tour.t2onbSubtitle")}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {([1, 2, 3, 4] as SetupStep[]).map((n) => {
          const active = step === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => setStep(n)}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-bold transition-colors ${
                active ? "bg-matchup text-white" : done(n) ? "bg-matchup/10 text-matchup" : "bg-black/[0.04] text-neutral-500"
              }`}
            >
              <span>{done(n) && !active ? "✓" : n}</span> {t(`tour.t2onbStep${n}`)}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {step === 1 && <StepWhoAreYou state={state} userId={user.id} onSaved={refresh} />}
        {step === 2 && <StepFrame state={state} userId={user.id} onSaved={refresh} />}
        {step === 3 && <StepLimits />}
        {step === 4 && <StepWow state={state} />}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {step > 1 && (
            <button type="button" onClick={() => setStep((step - 1) as SetupStep)} className="rounded-full px-4 py-2 text-[13px] font-semibold text-neutral-600 transition-colors hover:text-neutral-900">
              ← {t("tour.setupBack")}
            </button>
          )}
          {step < 4 && (
            <button type="button" onClick={() => setStep((step + 1) as SetupStep)} className={BTN_PRIMARY}>
              {t("tour.setupNext")}
            </button>
          )}
          {step === 4 && <ExitAction label={t("tour.setupFinish")} primary />}
        </div>
        {step < 4 && <ExitAction label={t("tour.setupSkip")} primary={false} />}
      </div>
    </div>
  );
}
