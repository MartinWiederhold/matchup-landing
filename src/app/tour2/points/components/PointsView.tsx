"use client";

/**
 * /tour2 Ranking & Punkte: Punktestand, Zählgrenze (MU-047), Ausblick 4/8/12
 * aus pointsForecast. Kein Rangplatz, keine Projected Ranking.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT, useLocale } from "@/lib/i18n";
import { scorePoints, type ScoredResult } from "@/domain/tour/points";
import { pointsForecast } from "@/domain/tour/pointsForecast";
import { loadResultHistory, toMatchResults, addResult, deleteResult, type ResultHistoryRow } from "@/lib/tourResultHistory";
import TourLoginCard from "@/app/tour2/components/TourLoginCard";
import Tour2Area, { T2Kpi, T2AsideBlock } from "@/app/tour2/components/Tour2Area";
import { t2markArea } from "@/app/tour2/t2mark";

type LoadState = "loading" | "error" | "done";

const KNOWN_ROUNDS = new Set(["W", "F", "SF", "QF", "R16", "R32", "Q", "Q2"]);
const CAT_OPTIONS: { code: string; label: string }[] = [
  { code: "challenger_175", label: "Challenger 175" },
  { code: "challenger_125", label: "Challenger 125" },
  { code: "challenger_100", label: "Challenger 100" },
  { code: "challenger_75", label: "Challenger 75" },
  { code: "challenger_50", label: "Challenger 50" },
  { code: "m25", label: "M25" },
  { code: "m15", label: "M15" },
];
const ROUND_OPTIONS = ["W", "F", "SF", "QF", "R16", "R32", "Q", "Q2"];

export default function PointsView() {
  const { user, loading: authLoading } = useAuth();
  const t = useT();
  const { locale } = useLocale();

  const [rows, setRows] = useState<ResultHistoryRow[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [asOf] = useState(() => {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  });
  const [fName, setFName] = useState("");
  const [fCat, setFCat] = useState("m25");
  const [fRound, setFRound] = useState("R16");
  const [fDate, setFDate] = useState(asOf);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    if (!user) return;
    setRows(await loadResultHistory(user.id));
  }, [user]);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancel = false;
    setState("loading");
    reload().then(() => { if (!cancel) { setState("done"); t2markArea("ranking"); } }).catch(() => { if (!cancel) setState("error"); });
    return () => { cancel = true; };
  }, [authLoading, user, reload]);

  const matchResults = useMemo(() => toMatchResults(rows), [rows]);
  const forecast = useMemo(() => pointsForecast(matchResults, asOf), [matchResults, asOf]);
  const scored = useMemo(() => scorePoints(matchResults, asOf), [matchResults, asOf]);

  const fmt = (iso: string) => {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return locale === "de" ? `${d}.${m}.${y}` : `${m}/${d}/${y}`;
  };
  const roundLabel = (code: string, raw: string | null) => (KNOWN_ROUNDS.has(code) ? t(`tour.round_${code}`) : raw ?? code);
  const catLabel = (code: string) => CAT_OPTIONS.find((c) => c.code === code)?.label ?? code;
  const tagFor = (s: ScoredResult): string | null => {
    if (s.notes.includes("noch_nicht_im_system")) return t("tour.pointsNotYet", { date: fmt(s.effectiveDate) });
    if (!s.counts) return t("tour.pointsNotCounting");
    return null;
  };
  const reasonFor = (s: ScoredResult): string => {
    if (s.notes.includes("verfallen")) return t("tour.pointsReasonExpired", { date: fmt(s.expiresOn) });
    if (s.notes.includes("kein_punkt_erstrunde")) return t("tour.pointsReasonFirstRound");
    if (s.notes.includes("kein_quali_itf")) return t("tour.pointsReasonItfQuali");
    return t("tour.pointsReasonNone");
  };

  const submit = async () => {
    if (!user || fName.trim() === "") return;
    setSaving(true);
    try {
      await addResult(user.id, { tournamentName: fName, category: fCat, round: fRound, date: fDate });
      setFName("");
      await reload();
    } finally { setSaving(false); }
  };
  const del = async (id: string) => { await deleteResult(id); await reload(); };

  if (authLoading) return <p className="px-4 py-16 t2-fs-body text-[var(--t2-muted)]">{t("tour.t2authChecking")}</p>;
  if (!user) return <TourLoginCard />;
  if (state === "loading") return <p className="px-4 py-16 t2-fs-body text-[var(--t2-muted)]">{t("tour.t2dataLoading")}</p>;
  if (state === "error") return <p className="px-4 py-16 t2-fs-body text-[var(--t2-muted)]">{t("tour.loadError")}</p>;

  const inp = "t2-input";
  const lbl = "mb-1 block t2-fs-micro font-semibold text-[var(--t2-muted)]";
  const view = rows.map((row, i) => ({ row, s: scored.results[i] }));
  const withPoints = view.filter((v) => v.s && v.s.points > 0 && !v.s.notes.includes("verfallen")).sort((a, b) => b.s.points - a.s.points);
  const noPoints = view.filter((v) => v.s && (v.s.points === 0 || v.s.notes.includes("verfallen")));
  const next = forecast.schedule[0] ?? null;
  const step = (w: number) => forecast.steps.find((s) => s.weeks === w);

  const kpis = (
    <>
      <T2Kpi label={t("tour.pointsTotalLabel")} note={t("tour.t2rkLimit", { n: forecast.countingLimit })}>
        {forecast.currentTotal}
      </T2Kpi>
      {([4, 8, 12] as const).map((w) => {
        const s = step(w);
        return (
          <T2Kpi
            key={w}
            label={t("tour.pointsForecastWeeks", { n: w })}
            note={s && s.delta < 0 ? t("tour.pointsForecastFalls", { n: -s.delta }) : t("tour.pointsForecastStable")}
          >
            {s ? s.total : "—"}
          </T2Kpi>
        );
      })}
    </>
  );

  const aside = (
    <>
      <T2AsideBlock title={t("tour.t2rkNext")}>
        {next ? (
          <p>
            <span className="block font-semibold">{rows[next.index]?.tournament_name ?? "—"}</span>
            <span className="mt-1 block t2-fs-micro text-[var(--t2-muted)]">{t("tour.pointsExpiresOn", { points: next.points, date: fmt(next.expiresOn) })}</span>
          </p>
        ) : (
          <p className="text-[var(--t2-muted)]">{t("tour.t2rkNextEmpty")}</p>
        )}
      </T2AsideBlock>
      <T2AsideBlock title={t("tour.t2rkHow")}>
        <p className="text-[var(--t2-muted)]">{t("tour.t2rkLead")}</p>
        <Link href="/tour2/form" className="mt-2 inline-block font-semibold text-[var(--t2-accent)] hover:underline">{t("tour.formTitle")} →</Link>
      </T2AsideBlock>
    </>
  );

  return (
    <Tour2Area title={t("tour.t2rkTitle")} lead={t("tour.t2rkLead")} kpis={kpis} aside={aside}>
      {forecast.schedule.length > 0 && (
        <section className="mb-10">
          <h2 className="t2-fs-body font-bold">{t("tour.pointsDefendTitle")}</h2>
          <p className="mt-1 t2-fs-body-sm text-[var(--t2-muted)]">{t("tour.pointsDefendHint")}</p>
          <div className="mt-3 space-y-2">
            {forecast.schedule.map((e) => (
              <div key={`def-${e.index}`} className="flex items-center justify-between border-b border-[var(--t2-line)] py-3">
                <span className="min-w-0 truncate t2-fs-body font-semibold">{rows[e.index]?.tournament_name ?? "—"}</span>
                <span className="shrink-0 t2-fs-body-sm text-[var(--t2-muted)]">{t("tour.pointsExpiresOn", { points: e.points, date: fmt(e.expiresOn) })}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="t2-panel mb-10">
        <h2 className="t2-section-title">{t("tour.pointsCaptureTitle")}</h2>
        <p className="mt-1 t2-fs-micro text-[var(--t2-muted)]">{t("tour.pointsCaptureHint")}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block sm:col-span-2 lg:col-span-1"><span className={lbl}>{t("tour.pointsFieldTournament")}</span><input value={fName} onChange={(e) => setFName(e.target.value)} className={inp} /></label>
          <label className="block"><span className={lbl}>{t("tour.pointsFieldCategory")}</span>
            <select value={fCat} onChange={(e) => setFCat(e.target.value)} className={inp}>{CAT_OPTIONS.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}</select>
          </label>
          <label className="block"><span className={lbl}>{t("tour.pointsFieldRound")}</span>
            <select value={fRound} onChange={(e) => setFRound(e.target.value)} className={inp}>{ROUND_OPTIONS.map((r) => <option key={r} value={r}>{roundLabel(r, r)}</option>)}</select>
          </label>
          <label className="block"><span className={lbl}>{t("tour.pointsFieldDate")}</span><input type="date" value={fDate} onChange={(e) => setFDate(e.target.value)} className={inp} /></label>
        </div>
        <button type="button" onClick={submit} disabled={saving || fName.trim() === ""} className="t2-cta mt-3 disabled:opacity-50">{t("tour.pointsAdd")}</button>
      </section>

      {withPoints.length > 0 && (
        <section className="mb-10">
          <h2 className="t2-fs-body font-bold">{t("tour.t2rkTable")}</h2>
          <p className="mt-1 t2-fs-body-sm text-[var(--t2-muted)]">{t("tour.t2rkLimit", { n: forecast.countingLimit })}</p>
          <div className="mt-3 space-y-2">
            {withPoints.map(({ row, s }) => {
              const tag = tagFor(s);
              return (
                <div key={`res-${row.id}`} className="flex items-center justify-between gap-3 border-b border-[var(--t2-line)] py-3">
                  <div className="min-w-0">
                    <p className="truncate t2-fs-body font-semibold">{row.tournament_name} <span className="font-normal text-[var(--t2-faint)]">· {catLabel(row.category)}</span></p>
                    <p className="t2-fs-micro text-[var(--t2-muted)]">
                      {roundLabel(s.round, row.round)} · {t("tour.pointsExpiresLabel", { date: fmt(s.expiresOn) })}
                      {tag && <span className="text-[var(--t2-faint)]"> · {tag}</span>}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className={`t2-fs-h3 font-bold ${s.counts ? "text-[var(--t2-accent)]" : "text-[var(--t2-faint)]"}`}>{s.points}</span>
                    <button type="button" onClick={() => del(row.id)} aria-label={t("tour.pointsDeleteResult")} className="text-[var(--t2-faint)] hover:text-[var(--t2-danger)]">✕</button>
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {noPoints.length > 0 && (
        <section className="mb-10">
          <h2 className="t2-fs-body font-bold">{t("tour.pointsNoPointsTitle")}</h2>
          <div className="mt-3 space-y-2">
            {noPoints.map(({ row, s }) => (
              <div key={`np-${row.id}`} className="flex items-center justify-between gap-3 border-b border-[var(--t2-line)] py-3">
                <div className="min-w-0">
                  <p className="truncate t2-fs-body font-medium">{row.tournament_name} <span className="text-[var(--t2-faint)]">· {catLabel(row.category)} · {roundLabel(s.round, row.round)}</span></p>
                  <p className="t2-fs-micro text-[var(--t2-muted)]">{reasonFor(s)}</p>
                </div>
                <button type="button" onClick={() => del(row.id)} aria-label={t("tour.pointsDeleteResult")} className="shrink-0 text-[var(--t2-faint)] hover:text-[var(--t2-danger)]">✕</button>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="t2-fs-micro leading-relaxed text-[var(--t2-muted)]">{t("tour.pointsIncompleteHint")}</p>
    </Tour2Area>
  );
}
