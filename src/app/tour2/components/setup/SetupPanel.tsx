"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { loadSetupState, type SetupState } from "@/lib/tourSetup";
import StepWhoAreYou from "./StepWhoAreYou";
import StepFrame from "./StepFrame";
import StepPickTournaments from "./StepPickTournaments";
import { BTN_PRIMARY } from "../tourUi";

type Step = 1 | 2 | 3;
const SKIP_KEY = "mu_tour_setup_skipped";

/**
 * Der geführte Einstieg in drei Schritten. Ersetzt die Arbeitsfläche, solange die
 * Einrichtung nicht abgeschlossen ist (inline via `onExit`) — und ist über die Route
 * /tour/setup jederzeit wieder aufrufbar (dann ohne `onExit`, Ausstieg per Link).
 *
 * Überspringen ist IMMER möglich: ein unauffälliger Weg zur Arbeitsfläche steht auf
 * jedem Schritt. Inline merkt sich das Überspringen in localStorage — siehe TourWorkspace.
 */
export default function SetupPanel({ initialStep, onExit }: { initialStep?: Step; onExit?: () => void }) {
  const { user, loading: authLoading } = useAuth();
  const t = useT();

  const [state, setState] = useState<SetupState | null>(null);
  const [load, setLoad] = useState<"loading" | "error" | "ready">("loading");
  const [step, setStep] = useState<Step>(initialStep ?? 1);

  // Aktualisiert nur den Stand (für die Häkchen), OHNE den Schritt zu wechseln.
  const refresh = useCallback(() => {
    if (!user) return;
    loadSetupState(user.id).then(setState).catch(() => { /* Stand bleibt, kein harter Fehler */ });
  }, [user]);

  // Erstladen: Stand holen und — falls kein Schritt fixiert ist — zum ersten offenen springen.
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

  const markSkipped = () => { try { localStorage.setItem(SKIP_KEY, "1"); } catch { /* egal */ } };

  // Ausstieg zur Arbeitsfläche: inline über onExit (+ Skip-Merker), auf der Route per Link.
  const ExitAction = ({ label, primary }: { label: string; primary: boolean }) => {
    const cls = primary
      ? BTN_PRIMARY
      : "rounded-full px-4 py-2 text-[13px] font-semibold text-neutral-500 transition-colors hover:text-neutral-800";
    if (onExit) return <button type="button" onClick={() => { markSkipped(); onExit(); }} className={cls}>{label}</button>;
    return <Link href="/tour2" className={cls}>{label}</Link>;
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

  const done = (n: Step) => (n === 1 ? state.step1Done : n === 2 ? state.step2Done : state.step3Done);

  return (
    <div className="mt-6">
      <p className="text-sm text-neutral-500">{t("tour.setupSubtitle")}</p>

      {/* Fortschritt — Schritte sind einzeln anklickbar (später editierbar). */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {([1, 2, 3] as Step[]).map((n) => {
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
              <span>{done(n) && !active ? "✓" : n}</span> {t(`tour.setupStep${n}`)}
            </button>
          );
        })}
      </div>

      {/* Aktueller Schritt */}
      <div className="mt-5">
        {step === 1 && <StepWhoAreYou state={state} userId={user.id} onSaved={refresh} />}
        {step === 2 && <StepFrame state={state} userId={user.id} onSaved={refresh} />}
        {step === 3 && <StepPickTournaments state={state} />}
      </div>

      {/* Fußzeile: zurück / weiter bzw. fertig — und IMMER ein Weg zur Arbeitsfläche. */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {step > 1 && (
            <button type="button" onClick={() => setStep((step - 1) as Step)} className="rounded-full px-4 py-2 text-[13px] font-semibold text-neutral-600 transition-colors hover:text-neutral-900">
              ← {t("tour.setupBack")}
            </button>
          )}
          {step < 3 && (
            <button type="button" onClick={() => setStep((step + 1) as Step)} className={BTN_PRIMARY}>
              {t("tour.setupNext")}
            </button>
          )}
          {step === 3 && <ExitAction label={t("tour.setupFinish")} primary />}
        </div>
        {step < 3 && <ExitAction label={t("tour.setupSkip")} primary={false} />}
      </div>
    </div>
  );
}
