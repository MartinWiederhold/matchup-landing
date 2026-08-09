"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { EYEBROW, PAGE_H1, PAGE_SUB } from "@/app/tour/components/tourUi";
import TourMapView from "@/app/tour/map/components/TourMapView";
import {
  loadPlannerProfile,
  loadActiveTournaments,
  filterFrame,
  picksToMapEntries,
  type PlannerProfile,
  type Frame,
} from "@/lib/tourPlanner";
import { loadCostRates } from "@/lib/tourCosts";
import { loadSeason } from "@/lib/tourSeason";
import type { TourTournament, TourCostRates } from "@/lib/types";
import type { SeasonProposal } from "@/domain/tour/optimizeSeason";
import ProfileChip from "./ProfileChip";
import Step1Profile from "./Step1Profile";
import Step2Frame from "./Step2Frame";
import Step3Proposal from "./Step3Proposal";

/**
 * Der durchgehende Saisonplaner unter /tour (Schritt 1 + 2). Ersetzt die alte
 * Arbeitsfläche mit acht Abschnitten durch EINEN Ablauf: links die nummerierten
 * Schritte (aktiver offen, erledigte als aufklappbare Zusammenfassung), rechts die
 * klebende Karte, die auf jede Eingabe reagiert. Profil-Chip oben rechts nach Schritt 1.
 *
 * Zustand von Zeitraum + Region liegt NUR hier in der Komponente (kein localStorage,
 * keine Spalte) — beim Neuladen weg, das erwartet man. Budget/Profil persistieren.
 */
export default function TourPlanner() {
  const { user, loading: authLoading } = useAuth();
  const t = useT();

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [profile, setProfile] = useState<PlannerProfile | null>(null);
  const [tours, setTours] = useState<TourTournament[]>([]);
  const [openStep, setOpenStep] = useState<1 | 2 | 3>(1);
  // Rahmen — reiner Komponenten-Zustand.
  const [frame, setFrame] = useState<Frame>({ region: "europe", from: "", to: "" });
  // Schritt 3: Kostensätze, bestehende Saison (Wochen + IDs), Vorschlag + Streichungen.
  const [rates, setRates] = useState<TourCostRates | null>(null);
  const [existing, setExisting] = useState<{ ids: Set<string>; weeks: Set<string> }>({ ids: new Set(), weeks: new Set() });
  const [proposal, setProposal] = useState<SeasonProposal | null>(null);
  const [removed, setRemoved] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    let alive = true;
    setStatus("loading");
    Promise.all([loadPlannerProfile(user.id), loadActiveTournaments(), loadCostRates(), loadSeason()])
      .then(([p, ts, r, season]) => {
        if (!alive) return;
        setProfile(p);
        setTours(ts);
        setRates(r);
        setExisting({
          ids: new Set(season.map((e) => e.tournament.id)),
          weeks: new Set(season.map((e) => e.tournament.tournament_monday)),
        });
        setOpenStep(p.city ? 2 : 1); // Profil schon da → direkt in den Rahmen
        setStatus("ready");
      })
      .catch(() => { if (alive) setStatus("error"); });
    return () => { alive = false; };
  }, [user]);

  async function reloadProfile() {
    if (!user) return;
    try { setProfile(await loadPlannerProfile(user.id)); } catch { /* Anzeige bleibt */ }
  }
  async function reloadRates() {
    try { setRates(await loadCostRates()); } catch { /* Anzeige bleibt */ }
  }
  async function reloadExisting() {
    try {
      const season = await loadSeason();
      setExisting({
        ids: new Set(season.map((e) => e.tournament.id)),
        weeks: new Set(season.map((e) => e.tournament.tournament_monday)),
      });
    } catch { /* Anzeige bleibt */ }
  }

  const step1Done = !!profile?.city;
  const result = useMemo(() => filterFrame(tours, frame), [tours, frame]);
  const focus = profile?.lat != null && profile?.lng != null ? { lat: profile.lat, lng: profile.lng } : null;
  // Reiseweg des Vorschlags (verbliebene Picks) für Schritt 3 → reagiert auf Streichungen.
  const routeEntries = useMemo(() => {
    if (!proposal) return [];
    const keep = proposal.picks.filter((p) => !removed.has(p.id));
    return picksToMapEntries(keep, tours);
  }, [proposal, removed, tours]);
  // Karte: Schritt 1 → nur Zentrum; Schritt 2 → Kandidaten; Schritt 3 → Reiseweg.
  const showRoute = openStep === 3 && proposal != null;
  const mapEntries = showRoute ? routeEntries : openStep === 2 ? result.mapEntries : [];

  // ── Gates ────────────────────────────────────────────────────────────────
  if (authLoading || status === "loading") return <p className="mt-10 text-sm text-neutral-500">{t("tour.loading")}</p>;
  if (!user) {
    return (
      <div className="mt-10 rounded-2xl bg-black/[0.02] px-6 py-10 text-center ring-1 ring-black/5">
        <h2 className="text-lg font-bold text-neutral-900">{t("tour.loginRequiredTitle")}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">{t("tour.loginRequiredText")}</p>
        <Link href="/app" className="mt-6 inline-flex rounded-full bg-matchup px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-matchup-hover">
          {t("tour.loginCta")}
        </Link>
      </div>
    );
  }
  if (status === "error" || !profile) return <p className="mt-8 text-sm text-neutral-500">{t("tour.loadError")}</p>;

  // Zusammenfassungen der erledigten Schritte (aufklappbar).
  const countryName = (code: string | null) => {
    if (!code) return "—";
    const n = t(`tour.country.${code}`);
    return n.startsWith("tour.country.") ? code : n;
  };
  // Wohnort MIT Wohnland (profiles.country) — der Pass ist etwas anderes und wird
  // getrennt beschriftet, damit „Dietikon, Schweiz · Pass: AT" nicht als „Dietikon
  // liegt in Österreich" gelesen wird. Mehrere Pässe: alle nennen.
  const homeLabel = profile.city ? (profile.country ? `${profile.city}, ${countryName(profile.country)}` : profile.city) : null;
  const step1Summary = [
    homeLabel,
    profile.ranking != null ? t("tour.plChipRank", { n: profile.ranking }) : null,
    profile.passports.length ? `${t("tour.plChipPass")}: ${profile.passports.join(", ")}` : null,
  ].filter(Boolean).join(" · ");
  const regionLabel = t(frame.region === "ch" ? "tour.plRegionCh" : frame.region === "all" ? "tour.plRegionAll" : "tour.plRegionEurope");
  const step2Summary = [profile.seasonBudget != null ? `${profile.seasonBudget} €` : null, regionLabel, frame.from || frame.to ? `${frame.from || "…"} – ${frame.to || "…"}` : null].filter(Boolean).join(" · ");

  return (
    <div>
      {/* Kopf + Profil-Chip oben rechts */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={EYEBROW}>Matchup Tour</p>
          <h1 className={PAGE_H1}>{t("tour.plTitle")}</h1>
          <p className={PAGE_SUB}>{t("tour.plSubtitle")}</p>
        </div>
        {step1Done && <div className="hidden shrink-0 pt-2 sm:block"><ProfileChip profile={profile} /></div>}
      </div>

      <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start lg:gap-6">
        {/* KARTE — mobil oben klebend (~40vh), Desktop rechte Spalte klebend */}
        <div className="sticky top-0 z-20 -mx-4 mb-4 sm:-mx-6 lg:order-2 lg:mx-0 lg:mb-0 lg:top-6 lg:self-start">
          {mapEntries.length === 0 && !focus ? (
            <div className="flex h-[40vh] w-full items-center justify-center rounded-2xl border border-black/[0.08] bg-black/[0.02] px-6 text-center text-sm text-neutral-500 lg:h-[calc(100vh-7rem)]">
              {t("tour.plMapEmpty")}
            </div>
          ) : (
            <TourMapView entries={mapEntries} focus={focus} showRoute={showRoute} heightClass="h-[40vh] lg:h-[calc(100vh-7rem)]" />
          )}
        </div>

        {/* ABLAUF — links */}
        <div className="space-y-3 lg:order-1">
          <StepBlock n={1} title={t("tour.plStep1")} intro={t("tour.plStep1Intro")} open={openStep === 1} done={step1Done} summary={step1Summary} onOpen={() => setOpenStep(1)} t={t}>
            <Step1Profile profile={profile} userId={user.id} onSaved={() => { reloadProfile(); setOpenStep(2); }} />
          </StepBlock>

          <StepBlock n={2} title={t("tour.plStep2")} intro={t("tour.plStep2Intro")} open={openStep === 2} done={profile.seasonBudget != null} summary={step2Summary} onOpen={() => setOpenStep(2)} t={t}>
            <Step2Frame budgetInitial={profile.seasonBudget} userId={user.id} frame={frame} setFrame={setFrame} result={result} rates={rates} />
          </StepBlock>

          <StepBlock n={3} title={t("tour.plStep3")} intro={t("tour.plStep3Intro")} open={openStep === 3} done={false} summary="" onOpen={() => setOpenStep(3)} t={t}>
            <Step3Proposal
              userId={user.id}
              profile={profile}
              tours={tours}
              frame={frame}
              rates={rates}
              existingWeeks={existing.weeks}
              existingIds={existing.ids}
              proposal={proposal}
              setProposal={setProposal}
              removed={removed}
              setRemoved={setRemoved}
              onRatesSaved={reloadRates}
              onTakenOver={reloadExisting}
            />
          </StepBlock>
        </div>
      </div>
    </div>
  );
}

// ── Ein Schritt: Kopf (Nummer + Titel), offen → Inhalt, erledigt+zu → Zusammenfassung ──
function StepBlock({
  n, title, intro, open, done, summary, onOpen, t, children,
}: {
  n: number;
  title: string;
  intro: string;
  open: boolean;
  done: boolean;
  summary: string;
  onOpen: () => void;
  t: (k: string, v?: Record<string, string | number>) => string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
      <button type="button" onClick={onOpen} className="flex w-full items-center gap-3 px-5 py-4 text-left">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${done ? "bg-emerald-500 text-white" : open ? "bg-neutral-900 text-white" : "bg-neutral-200 text-neutral-600"}`}>
          {done && !open ? "✓" : n}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-bold text-neutral-900">{title}</span>
          {open ? (
            <span className="block text-[12px] text-neutral-500">{intro}</span>
          ) : (
            <span className="block truncate text-[12px] text-neutral-400">{summary || intro}</span>
          )}
        </span>
        {!open && <span className="shrink-0 text-[12px] font-semibold text-matchup">{t("tour.plEdit")}</span>}
      </button>
      {open && <div className="border-t border-black/[0.06] px-5 py-4">{children}</div>}
    </section>
  );
}
