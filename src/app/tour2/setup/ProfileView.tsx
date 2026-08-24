"use client";

/**
 * /tour2 Profil (Etappe 5): Spieler-Dossier statt hellem Setup-Wizard.
 * Identität aus /app, Tour-Felder (Nationalität, Ranking), Kit (Pass/Visa/Equipment)
 * und Werkzeuge. Lücken nur mit belegten Daten (profileGaps). Kein neues Schema.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import TourLoginCard from "@/app/tour2/components/TourLoginCard";
import { loadSetupState, type SetupState } from "@/lib/tourSetup";
import { loadPlayerDocs } from "@/lib/tourPlayerMaster";
import { profileGaps, type ProfileGap } from "@/domain/tour/profileReadiness";
import StepWhoAreYou from "@/app/tour2/components/setup/StepWhoAreYou";
import SetupPanel from "@/app/tour2/components/setup/SetupPanel";
import PlayerMasterForm from "./PlayerMasterForm";
import TravelDocsCard from "./TravelDocsCard";

type LoadState = "loading" | "error" | "done";

const TOOLS: { href: string; label: "costsTitle" | "expTitle" | "schengenTitle" | "pointsTitle" | "formTitle" | "wildcardsTitle" | "financeTitle" }[] = [
  { href: "/tour2/costs", label: "costsTitle" },
  { href: "/tour2/expenses", label: "expTitle" },
  { href: "/tour2/schengen", label: "schengenTitle" },
  { href: "/tour2/points", label: "pointsTitle" },
  { href: "/tour2/form", label: "formTitle" },
  { href: "/tour2/wildcards", label: "wildcardsTitle" },
  { href: "/tour2/finance", label: "financeTitle" },
];

export default function ProfileView({ initialStep }: { initialStep?: 1 | 2 | 3 }) {
  const { user, loading: authLoading } = useAuth();
  const t = useT();
  const [setup, setSetup] = useState<SetupState | null>(null);
  const [docs, setDocs] = useState<Awaited<ReturnType<typeof loadPlayerDocs>>>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [showSetup, setShowSetup] = useState(!!initialStep);
  const todayISO = new Date().toISOString().slice(0, 10);

  const reload = useCallback(async () => {
    if (!user) return;
    const [s, d] = await Promise.all([loadSetupState(user.id), loadPlayerDocs(user.id)]);
    setSetup(s);
    setDocs(d);
  }, [user]);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancel = false;
    setState("loading");
    Promise.all([loadSetupState(user.id), loadPlayerDocs(user.id)])
      .then(([s, d]) => { if (!cancel) { setSetup(s); setDocs(d); setState("done"); } })
      .catch(() => { if (!cancel) setState("error"); });
    return () => { cancel = true; };
  }, [authLoading, user]);

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

  if (authLoading || state === "loading") return <p className="p-6 text-sm text-neutral-400">{t("tour.loading")}</p>;
  if (!user) return <TourLoginCard />;
  if (state === "error" || !setup) return <p className="p-6 text-sm text-neutral-400">{t("tour.loadError")}</p>;

  const name = setup.displayName || setup.firstName;
  const countryName = (c: string) => {
    const n = t(`tour.country.${c}`);
    return n.startsWith("tour.country.") ? c : n;
  };
  const home = [setup.city, setup.countryName || (setup.country ? countryName(setup.country) : null)].filter(Boolean).join(", ");
  const nats = setup.passports.map(countryName).join(" · ");

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 pb-28 sm:px-6">
      <header className="relative overflow-hidden rounded-3xl bg-white/[0.03] p-5 ring-1 ring-white/10 sm:p-7">
        <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-matchup/20 blur-3xl" />
        <div className="relative flex items-center gap-4">
          {setup.profileImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={setup.profileImage} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-white/15 sm:h-20 sm:w-20" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-matchup/20 text-[22px] font-bold text-matchup ring-2 ring-white/15 sm:h-20 sm:w-20 sm:text-[26px]">
              {(name?.[0] ?? "?").toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-500">{t("tour.t2navProfile")}</p>
            <h1 className="truncate text-[28px] font-extrabold tracking-tight text-white sm:text-[34px]">{name || t("tour.fieldMissing")}</h1>
            <p className="mt-1 text-[13px] text-neutral-400">
              {[
                setup.ranking != null ? `#${setup.ranking}` : null,
                nats || null,
                home || null,
              ].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
          <Link href="/app" className="ml-auto hidden shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold text-matchup sm:inline">{t("tour.t2profEditApp")} →</Link>
        </div>
        {gaps.length > 0 && (
          <ul className="relative mt-4 flex flex-wrap gap-1.5">
            {gaps.map((g) => (
              <li key={g.kind} className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-200">{gapText(g)}</li>
            ))}
          </ul>
        )}
        <Link href="/app" className="relative mt-3 inline-block text-[12px] font-semibold text-matchup sm:hidden">{t("tour.t2profEditApp")} →</Link>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div>
          <StepWhoAreYou state={setup} userId={user.id} tone="dark" onSaved={() => { void reload(); }} />
          <div className="mt-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-500">{t("tour.t2profKit")}</p>
            <PlayerMasterForm tone="dark" />
            <TravelDocsCard tone="dark" />
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <section className="rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/10">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-500">{t("tour.t2profTools")}</h2>
            <ul className="mt-3 space-y-1">
              {TOOLS.map((x) => (
                <li key={x.href}>
                  <Link href={x.href} className="flex items-center justify-between rounded-xl px-2 py-2 text-[13px] font-semibold text-neutral-200 hover:bg-white/[0.05]">
                    {t(`tour.${x.label}`)}
                    <span className="text-neutral-600">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <section className="mt-8">
        <button
          type="button"
          onClick={() => setShowSetup((v) => !v)}
          className="flex w-full items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3 text-left ring-1 ring-white/10"
        >
          <span className="text-[13px] font-bold text-white">{t("tour.t2profSetup")}</span>
          <span className="text-[12px] text-neutral-500">{setup.complete ? t("tour.t2profSetupDone") : t("tour.t2profSetupHint")}</span>
        </button>
        {showSetup && (
          <div className="mt-3 overflow-hidden rounded-3xl bg-[#f4f4f5] p-4 text-neutral-900 ring-1 ring-white/10">
            <SetupPanel initialStep={initialStep} />
          </div>
        )}
      </section>
    </div>
  );
}
