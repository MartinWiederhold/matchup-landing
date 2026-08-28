"use client";

/**
 * Fläche Dokumente: Ablauf und Checkliste. Keine Dokumentnummern.
 * Sechs-Monats-Regel als Faustregel (documentWarnings.ruleOfThumb).
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT, useLocale } from "@/lib/i18n";
import { documentWarnings } from "@/domain/tour/documentWarnings";
import { visaLeadWarnings } from "@/domain/tour/visaLeadWarnings";
import { schengenUsage, isSchengenCode, type Stay } from "@/domain/tour/schengen";
import { loadPlayerMaster, type PlayerDocs } from "@/lib/tourPlayerMaster";
import { loadTravelDocuments } from "@/lib/tourTravelDocuments";
import { loadSeason, type SeasonEntry } from "@/lib/tourSeason";
import { loadPlannerProfile, type PlannerProfile } from "@/lib/tourPlanner";
import { loadStays } from "@/lib/tourStays";
import { hasSchengenPassport } from "@/lib/visa";
import type { TourTravelDocument } from "@/lib/types";
import TourLoginCard from "@/app/tour2/components/TourLoginCard";
import Tour2Area, { T2Kpi, T2AsideBlock } from "@/app/tour2/components/Tour2Area";
import PlayerMasterForm from "../setup/PlayerMasterForm";
import TravelDocsCard from "../setup/TravelDocsCard";
import { t2markArea } from "../t2mark";

const DAY = 86_400_000;

type Paper = { key: string; cat: "passport" | "insurance" | "travel"; label: string; scope: string | null; until: string | null; status: string | null };

export default function DocumentsView() {
  const { user, loading: authLoading } = useAuth();
  const t = useT();
  const { locale } = useLocale();
  const loc = locale === "en" ? "en-GB" : "de-DE";

  const [state, setState] = useState<"loading" | "error" | "done">("loading");
  const [docs, setDocs] = useState<PlayerDocs | null>(null);
  const [travelDocs, setTravelDocs] = useState<TourTravelDocument[]>([]);
  const [season, setSeason] = useState<SeasonEntry[]>([]);
  const [profile, setProfile] = useState<PlannerProfile | null>(null);
  const [stays, setStays] = useState<Stay[]>([]);
  const [nowMs] = useState(() => Date.now());
  const todayISO = new Date(nowMs).toISOString().slice(0, 10);

  useEffect(() => {
    if (authLoading || !user) return;
    let alive = true;
    Promise.all([loadPlayerMaster(user.id), loadTravelDocuments(user.id), loadSeason(), loadPlannerProfile(user.id), loadStays(user.id)])
      .then(([master, tdocs, s, p, stayRows]) => {
        if (!alive) return;
        setDocs(master.docs);
        setTravelDocs(tdocs);
        setSeason(s);
        setProfile(p);
        setStays(stayRows.filter((x) => x.confirmed).map((x) => ({ country: x.country, entry: x.entry_date, exit: x.exit_date })));
        setState("done");
        t2markArea("documents");
      })
      .catch(() => { if (alive) setState("error"); });
    return () => { alive = false; };
  }, [authLoading, user]);

  const fmtDate = (iso: string) => new Intl.DateTimeFormat(loc, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z"));
  const countryName = (c: string | null) => (c && !t(`tour.country.${c}`).startsWith("tour.country.") ? t(`tour.country.${c}`) : (c ?? ""));

  const nextTrip = useMemo(() => {
    const upcoming = [...season.filter((s) => !s.tournamentInactive && s.tournament.tournament_monday >= todayISO)]
      .sort((a, b) => a.tournament.tournament_monday.localeCompare(b.tournament.tournament_monday))[0];
    return upcoming ? { destination: upcoming.tournament.country, entryDate: upcoming.tournament.tournament_monday } : null;
  }, [season, todayISO]);

  const warnings = useMemo(() => {
    if (!docs) return [];
    return documentWarnings({
      passports: [
        { country: docs.passport_country, expiry: docs.passport_expiry },
        { country: docs.passport2_country, expiry: docs.passport2_expiry },
      ],
      insurance: { expiry: docs.insurance_expiry, international: docs.insurance_international },
      nextTrip,
      asOf: todayISO,
    });
  }, [docs, nextTrip, todayISO]);

  const visaLead = useMemo(() => visaLeadWarnings({
    asOf: todayISO,
    tournaments: season.map((s) => ({ id: s.tournament.id, city: s.tournament.city, country: s.tournament.country, monday: s.tournament.tournament_monday })),
    docs: travelDocs.map((d) => ({ scope: d.scope, status: d.status, valid_until: d.valid_until, lead_weeks: d.lead_weeks })),
  }), [todayISO, season, travelDocs]);

  const papers: Paper[] = useMemo(() => {
    const out: Paper[] = [];
    if (docs?.passport_country || docs?.passport_expiry) {
      out.push({ key: "p1", cat: "passport", label: t("tour.t2docCatPassport"), scope: docs.passport_country, until: docs.passport_expiry, status: null });
    }
    if (docs?.passport2_country || docs?.passport2_expiry) {
      out.push({ key: "p2", cat: "passport", label: t("tour.t2docCatPassport"), scope: docs.passport2_country, until: docs.passport2_expiry, status: null });
    }
    if (docs?.insurance_provider || docs?.insurance_expiry) {
      out.push({ key: "ins", cat: "insurance", label: t("tour.t2docCatInsurance"), scope: docs.insurance_provider, until: docs.insurance_expiry, status: null });
    }
    for (const d of travelDocs) {
      out.push({
        key: d.id,
        cat: "travel",
        label: t(`tour.tdKind_${d.kind}`),
        scope: d.scope,
        until: d.valid_until,
        status: d.status,
      });
    }
    return out;
  }, [docs, travelDocs, t]);

  const nextExpiry = useMemo(() => {
    const dates = papers.map((p) => p.until).filter((x): x is string => !!x).filter((x) => x >= todayISO).sort();
    return dates[0] ?? null;
  }, [papers, todayISO]);

  const soonKinds = new Set(["passport_expiring", "insurance_expiring"]);
  const actionN = warnings.filter((w) => w.severity === "error").length + visaLead.length;
  const soonN = warnings.filter((w) => soonKinds.has(w.kind)).length;
  const validN = Math.max(0, papers.length - actionN - soonN);

  const passOk = !warnings.some((w) => w.kind === "passport_too_short" || w.kind === "passport_expired");
  const insOk = !warnings.some((w) => w.kind === "insurance_not_international" || w.kind === "insurance_expired");
  const visaOk = visaLead.length === 0;

  const schengenApplies = !!profile && profile.passports.length > 0 && !hasSchengenPassport(profile.passports);
  const schengen = useMemo(() => {
    if (!schengenApplies) return null;
    const seasonStays: Stay[] = season
      .filter((s) => !s.tournamentInactive && s.tournament.country && isSchengenCode(s.tournament.country))
      .map((s) => {
        const entry = s.tournament.tournament_monday;
        const exit = new Date(Date.parse(entry + "T00:00:00Z") + 7 * DAY).toISOString().slice(0, 10);
        return { country: s.tournament.country as string, entry, exit };
      });
    return schengenUsage([...stays, ...seasonStays], todayISO);
  }, [schengenApplies, season, stays, todayISO]);

  if (authLoading || (user && state === "loading")) {
    return <p className="px-4 py-16 t2-fs-body text-[var(--t2-muted)]">{t("tour.loading")}</p>;
  }
  if (!user) return <TourLoginCard />;
  if (state === "error") return <p className="px-4 py-16 t2-fs-body text-[var(--t2-muted)]">{t("tour.loadError")}</p>;

  const kpis = (
    <>
      <T2Kpi label={t("tour.t2docValid")}>{validN}</T2Kpi>
      <T2Kpi label={t("tour.t2docSoon")}>{soonN}</T2Kpi>
      <T2Kpi label={t("tour.t2docAction")}>{actionN}</T2Kpi>
      <T2Kpi label={t("tour.t2docTotal")}>{papers.length}</T2Kpi>
    </>
  );

  const aside = (
    <>
      <T2AsideBlock title={t("tour.t2docCheck")}>
        <ul className="space-y-3">
          <li>
            <p className="font-semibold">{passOk ? "✓ " : "○ "}{t("tour.t2docCheckPass")}</p>
            <p className="mt-0.5 t2-fs-micro text-[var(--t2-muted)]">{t("tour.t2docCheckPassHint")}</p>
          </li>
          <li className="font-semibold">{visaOk ? "✓ " : "○ "}{t("tour.t2docCheckVisa")}</li>
          <li className="font-semibold">{insOk ? "✓ " : "○ "}{t("tour.t2docCheckIns")}</li>
        </ul>
      </T2AsideBlock>
      <T2AsideBlock title={t("tour.t2docNext")}>
        <p className="text-[var(--t2-muted)]">{nextExpiry ? fmtDate(nextExpiry) : "—"}</p>
      </T2AsideBlock>
      {schengenApplies && schengen && (
        <T2AsideBlock title={t("tour.schengenTitle")}>
          <p className="text-[var(--t2-muted)]">{t("tour.t2ovSchengen", { used: schengen.used, left: schengen.left })}</p>
        </T2AsideBlock>
      )}
    </>
  );

  const warnText = (w: { kind: string; date?: string; days?: number; destination?: string | null; ruleOfThumb: boolean }) => {
    const dest = w.destination ? countryName(w.destination) : "";
    const date = w.date ? fmtDate(w.date) : "";
    const key = `tour.docWarn_${w.kind}`;
    return t(key, { date, days: w.days ?? 0, dest });
  };

  return (
    <Tour2Area title={t("tour.t2navDocs")} lead={t("tour.t2docsLead")} kpis={kpis} aside={aside}>
      {warnings.length > 0 && (
        <ul className="mb-4 space-y-2 t2-dash-card t2-fs-body-sm">
          {warnings.map((w, i) => (
            <li key={`${w.kind}-${i}`} className={w.severity === "error" ? "font-semibold text-[var(--t2-danger)]" : "text-[var(--t2-ink)]"}>
              {warnText(w)}
              {w.ruleOfThumb && <span className="mt-0.5 block t2-fs-micro font-normal text-[var(--t2-muted)]">{t("tour.docWarnRuleOfThumb")}</span>}
            </li>
          ))}
        </ul>
      )}
      <section className="t2-dash-card mt-4">
        <h2 className="t2-kicker">{t("tour.t2docTable")}</h2>
        {papers.length === 0 ? (
          <p className="mt-4 t2-fs-body text-[var(--t2-muted)]">{t("tour.t2docNone")}</p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--t2-line)] border-y border-[var(--t2-line)]">
            {papers.map((p) => (
              <li key={p.key} className="flex items-baseline justify-between gap-4 py-3">
                <span>
                  <span className="block t2-fs-body font-semibold">{p.label}</span>
                  <span className="mt-0.5 block t2-fs-micro text-[var(--t2-muted)]">
                    {[p.scope ? `${t("tour.t2docScope")} ${p.scope === "SCHENGEN" ? t("tour.tdSchengen") : countryName(p.scope) || p.scope}` : null, p.status ? t(`tour.tdStatus_${p.status}`) : null].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="shrink-0 t2-fs-body-sm tabular-nums text-[var(--t2-muted)]">{p.until ? fmtDate(p.until) : "—"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <PlayerMasterForm tone="light" hideIds />
      <TravelDocsCard tone="light" />
      <p className="mt-6 t2-fs-body-sm">
        <Link href="/tour2/schengen" className="font-semibold text-[var(--t2-accent)]">{t("tour.schengenTitle")} →</Link>
      </p>
    </Tour2Area>
  );
}
