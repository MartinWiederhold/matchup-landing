"use client";

/**
 * Fläche Profil: alles, was der Optimierer und die Warnungen brauchen, an einem Ort.
 * Identität aus /app (gekennzeichnet). Kein Verified, kein Karrierepreisgeld,
 * kein Rangverlauf, kein Geburtsdatum.
 */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT, useLocale } from "@/lib/i18n";
import TourLoginCard from "@/app/tour2/components/TourLoginCard";
import Tour2Area from "@/app/tour2/components/Tour2Area";
import { loadSetupState, type SetupState } from "@/lib/tourSetup";
import { loadPlayerDocs } from "@/lib/tourPlayerMaster";
import { loadCostRates, type CostRatesPatch } from "@/lib/tourCosts";
import { loadReminderSettings, saveReminderSettings } from "@/lib/tourReminders";
import { costRatesComplete } from "@/lib/tourPlanner";
import { loadTourOptPrefs } from "@/lib/tourOptPrefs";
import { profileGaps, type ProfileGap } from "@/domain/tour/profileReadiness";
import StepWhoAreYou from "@/app/tour2/components/setup/StepWhoAreYou";
import SetupPanel from "@/app/tour2/components/setup/SetupPanel";
import PlanRulesCard from "./PlanRulesCard";
import CostRatesForm from "@/app/tour2/costs/components/CostRatesForm";
import PlayerMasterForm from "./PlayerMasterForm";
import TravelDocsCard from "./TravelDocsCard";
import { t2markArea } from "@/app/tour2/t2mark";
import type { TourCostRates } from "@/lib/types";

function Kpi({ label, children, note }: { label: string; children: ReactNode; note?: ReactNode }) {
  return (
    <div className="border-t border-[var(--t2-line)] py-4 md:border-t-0 md:border-l md:px-4 md:py-0 md:first:border-l-0 md:first:pl-0">
      <p className="t2-label">{label}</p>
      <div className="mt-2 t2-fs-display font-semibold tracking-[-0.03em] tabular-nums">{children}</div>
      {note && <div className="mt-1.5 t2-fs-micro leading-relaxed text-[var(--t2-muted)]">{note}</div>}
    </div>
  );
}

export default function ProfileView({ initialStep }: { initialStep?: 1 | 2 | 3 | 4 }) {
  const { user, loading: authLoading } = useAuth();
  const t = useT();
  const { locale } = useLocale();
  const [setup, setSetup] = useState<SetupState | null>(null);
  const [docs, setDocs] = useState<Awaited<ReturnType<typeof loadPlayerDocs>>>(null);
  const [rates, setRates] = useState<TourCostRates | null>(null);
  const [reminderOn, setReminderOn] = useState(true);
  const [state, setState] = useState<"loading" | "error" | "done">("loading");
  const [showSetup, setShowSetup] = useState(!!initialStep);
  const todayISO = new Date().toISOString().slice(0, 10);
  const prefs = useMemo(() => loadTourOptPrefs(), [setup]);

  const reload = useCallback(async () => {
    if (!user) return;
    const [s, d, r] = await Promise.all([loadSetupState(user.id), loadPlayerDocs(user.id), loadCostRates()]);
    setSetup(s);
    setDocs(d);
    setRates(r);
  }, [user]);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancel = false;
    Promise.all([loadSetupState(user.id), loadPlayerDocs(user.id), loadCostRates(), loadReminderSettings(user.id)])
      .then(([s, d, r, rem]) => {
        if (cancel) return;
        setSetup(s);
        setDocs(d);
        setRates(r);
        setReminderOn(rem.enabled);
        setState("done");
        t2markArea("profile");
      })
      .catch(() => { if (!cancel) setState("error"); });
    return () => { cancel = true; };
  }, [authLoading, user]);

  const onRatesSaved = useCallback((patch: CostRatesPatch) => {
    if (!user) return;
    setRates((r) => ({
      user_id: r?.user_id ?? user.id,
      arrival_minor: patch.arrival_minor,
      per_night_minor: patch.per_night_minor,
      food_per_day_minor: patch.food_per_day_minor,
      coach_per_week_minor: patch.coach_per_week_minor,
      currency: patch.currency,
      created_at: r?.created_at ?? "",
      updated_at: r?.updated_at ?? "",
    }));
    void reload();
  }, [user, reload]);

  const toggleReminders = (next: boolean) => {
    if (!user) return;
    setReminderOn(next);
    void saveReminderSettings(user.id, next, locale === "en" ? "en" : "de").catch(() => setReminderOn(!next));
  };

  const gaps = useMemo(() => {
    if (!setup) return [] as ProfileGap[];
    return profileGaps({
      nowISO: todayISO,
      hasHome: !!(setup.city || setup.hasCoords),
      hasNationality: setup.passports.length > 0,
      hasRates: setup.hasRates,
      passportCountry: docs?.passport_country ?? null,
      passportExpiry: docs?.passport_expiry ?? null,
      insuranceExpiry: docs?.insurance_expiry ?? null,
    });
  }, [setup, docs, todayISO]);

  const gapText = (g: ProfileGap): string => {
    if (g.kind === "home") return t("tour.t2profGapHome");
    if (g.kind === "nationality") return t("tour.t2profGapNat");
    if (g.kind === "rates") return t("tour.t2profGapRates");
    if (g.kind === "passport_date") return t("tour.t2profGapPassDate");
    if (g.kind === "passport_expired") return t("tour.t2profGapPassExpired");
    if (g.kind === "passport_expiring") return t("tour.t2profGapPassDays", { n: g.days });
    if (g.kind === "insurance_expired") return t("tour.t2profGapInsExpired");
    return t("tour.t2profGapInsDays", { n: g.days });
  };

  if (authLoading || (user && state === "loading")) {
    return <p className="px-4 py-16 t2-fs-body text-[var(--t2-muted)]">{t("tour.t2dataLoading")}</p>;
  }
  if (!user) return <TourLoginCard />;
  if (state === "error" || !setup) return <p className="px-4 py-16 t2-fs-body text-[var(--t2-muted)]">{t("tour.loadError")}</p>;

  const money = (n: number) => new Intl.NumberFormat(locale === "en" ? "en-GB" : "de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
  const ratesOk = costRatesComplete(rates ?? setup.rates);

  const kpis = (
    <div className="grid gap-0 md:grid-cols-4">
      <Kpi label={t("tour.plBudget")}>{setup.seasonBudget != null ? money(setup.seasonBudget) : "—"}</Kpi>
      <Kpi label={t("tour.t2profRates")}>{ratesOk ? t("tour.t2profRatesReady") : t("tour.t2profRatesNeed")}</Kpi>
      <Kpi label={t("tour.costsNights")}>{prefs.nights || "—"}</Kpi>
      <Kpi label={t("tour.wsRemindersLabel")}>{reminderOn ? t("tour.t2profRemindOn") : t("tour.t2profRemindOff")}</Kpi>
    </div>
  );

  const aside = (
    <>
      <section>
        <h2 className="t2-section-title">{t("tour.t2profOptUsesTitle")}</h2>
        <p className="mt-2 t2-fs-body-sm leading-relaxed text-[var(--t2-muted)]">{t("tour.t2profOptUses")}</p>
        <p className="mt-3 t2-fs-body-sm leading-relaxed text-[var(--t2-muted)]">{t("tour.t2profOptSkip")}</p>
      </section>
      {gaps.length > 0 && (
        <section>
          <h2 className="t2-section-title">{t("tour.t2profGaps")}</h2>
          <ul className="mt-2 space-y-1 t2-fs-body-sm text-[var(--t2-muted)]">
            {gaps.map((g) => <li key={g.kind}>{gapText(g)}</li>)}
          </ul>
        </section>
      )}
      <p>
        <Link href="/app" className="t2-fs-body-sm font-semibold text-[var(--t2-accent)]">{t("tour.t2profEditApp")} →</Link>
      </p>
    </>
  );

  return (
    <Tour2Area title={t("tour.t2navProfile")} lead={t("tour.t2profLead")} kpis={kpis} aside={aside}>
      <StepWhoAreYou state={setup} userId={user.id} tone="light" onSaved={() => { void reload(); }} />
      <PlanRulesCard userId={user.id} seasonBudget={setup.seasonBudget} onBudgetSaved={() => { void reload(); }} />
      <div className="mt-6">
        <CostRatesForm rates={rates ?? setup.rates} userId={user.id} onSaved={onRatesSaved} hideTravelAssumptions />
      </div>
      <PlayerMasterForm tone="light" hideIds />
      <TravelDocsCard tone="light" />

      <section className="t2-panel mt-6">
        <h2 className="t2-section-title">{t("tour.wsRemindersLabel")}</h2>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="t2-fs-body-sm leading-relaxed text-[var(--t2-muted)]">{t("tour.wsRemindersHint")}</p>
          <button type="button" role="switch" aria-checked={reminderOn} onClick={() => toggleReminders(!reminderOn)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${reminderOn ? "bg-[var(--t2-accent)]" : "bg-[var(--t2-line-strong)]"}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-[var(--t2-on-accent)] shadow transition-transform ${reminderOn ? "translate-x-[22px]" : "translate-x-0.5"}`} />
          </button>
        </div>
      </section>

      <section className="mt-8">
        <button
          type="button"
          onClick={() => setShowSetup((v) => !v)}
          className="flex w-full items-center justify-between border-t border-[var(--t2-line)] py-3 text-left"
        >
          <span className="t2-fs-body-sm font-bold">{t("tour.t2profSetup")}</span>
          <span className="t2-fs-micro text-[var(--t2-muted)]">{setup.complete ? t("tour.t2profSetupDone") : t("tour.t2profSetupHint")}</span>
        </button>
        {showSetup && (
          <div className="mt-3 border-t border-[var(--t2-line)] pt-4">
            <SetupPanel initialStep={initialStep} />
          </div>
        )}
      </section>
    </Tour2Area>
  );
}
