"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT, useLocale } from "@/lib/i18n";
import { scorePoints, type ScoredResult } from "@/domain/tour/points";
import { pointsForecast } from "@/domain/tour/pointsForecast";
import { loadResultHistory, toMatchResults, addResult, deleteResult, type ResultHistoryRow } from "@/lib/tourResultHistory";

type LoadState = "loading" | "error" | "done";

const KNOWN_ROUNDS = new Set(["W", "F", "SF", "QF", "R16", "R32", "Q", "Q2"]);
// Kategorien als points.ts-Codes mit Anzeige-Label (Eigennamen, nicht übersetzt).
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

/**
 * Rangprognose: aktueller Punktestand aus den selbst erfassten zählenden Ergebnissen
 * (web.tour_result_history), der Ausblick auf +4/+8/+12 Wochen und der Verfallsplan. Die
 * Rechnung liegt rein in points.ts (Stand/Verfall) und pointsForecast.ts (Ausblick) — der
 * Stichtag (heute) wird HIER erzeugt und hineingereicht. Die App zeigt PUNKTE, keine Ränge.
 */
export default function PointsView() {
  const { user, loading: authLoading } = useAuth();
  const t = useT();
  const { locale } = useLocale();

  const [rows, setRows] = useState<ResultHistoryRow[]>([]);
  const [state, setState] = useState<LoadState>("loading");

  // Stichtag = heute, einmal beim Mounten (lokaler Kalendertag).
  const [asOf] = useState(() => {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  });

  // Erfassungsformular.
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
    reload().then(() => { if (!cancel) setState("done"); }).catch(() => { if (!cancel) setState("error"); });
    return () => { cancel = true; };
  }, [authLoading, user, reload]);

  const matchResults = useMemo(() => toMatchResults(rows), [rows]);
  // Ausblick (Stand + 4/8/12 Wochen + Verfallsplan) und die per-Ergebnis-Bewertung (Notizen/Tags).
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

  if (authLoading) return <p className="mt-10 text-sm text-neutral-500">{t("tour.loading")}</p>;
  if (!user) {
    return (
      <div className="mt-10 rounded-2xl bg-black/[0.02] ring-1 ring-black/5 px-6 py-10 text-center">
        <h2 className="text-lg font-bold text-neutral-900">{t("tour.loginRequiredTitle")}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">{t("tour.loginRequiredText")}</p>
        <Link href="/app" className="mt-6 inline-flex rounded-full bg-matchup px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-matchup-hover">{t("tour.loginCta")}</Link>
      </div>
    );
  }
  if (state === "loading") return <p className="mt-8 text-sm text-neutral-500">{t("tour.loading")}</p>;
  if (state === "error") return <p className="mt-8 text-sm text-neutral-500">{t("tour.loadError")}</p>;

  const inp = "w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:border-black/30 focus:outline-none";
  const lbl = "mb-1 block text-[12px] font-semibold text-neutral-600";
  const view = rows.map((row, i) => ({ row, s: scored.results[i] }));
  const withPoints = view.filter((v) => v.s && v.s.points > 0 && !v.s.notes.includes("verfallen")).sort((a, b) => b.s.points - a.s.points);
  const noPoints = view.filter((v) => v.s && (v.s.points === 0 || v.s.notes.includes("verfallen")));

  return (
    <div className="mt-8 space-y-8">
      {/* Punktestand + Zählgrenze + „keine Ränge" */}
      <div className="rounded-2xl bg-black/[0.02] ring-1 ring-black/5 px-6 py-6">
        <p className="text-[13px] font-medium text-neutral-500">{t("tour.pointsTotalLabel")}</p>
        <p className="mt-1 text-4xl font-extrabold tracking-tight text-neutral-900">{forecast.currentTotal}</p>
        <p className="mt-1 text-[13px] text-neutral-500">{t("tour.pointsLimitLabel", { n: forecast.countingLimit })}</p>
        <p className="mt-3 text-[12px] leading-relaxed text-neutral-400">{t("tour.pointsNoRanksNote")}</p>
      </div>

      {/* Ausblick: heute + 4/8/12 Wochen */}
      {rows.length > 0 && (
        <section>
          <h2 className="text-[15px] font-bold text-neutral-900">{t("tour.pointsForecastTitle")}</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-black/[0.02] p-4 ring-1 ring-black/[0.05]">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-400">{t("tour.pointsForecastToday")}</p>
              <p className="mt-1 text-[22px] font-extrabold tabular-nums text-neutral-900">{forecast.currentTotal}</p>
            </div>
            {forecast.steps.map((s) => (
              <div key={s.weeks} className="rounded-2xl bg-black/[0.02] p-4 ring-1 ring-black/[0.05]">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-400">{t("tour.pointsForecastWeeks", { n: s.weeks })}</p>
                <p className="mt-1 text-[22px] font-extrabold tabular-nums text-neutral-900">{s.total}</p>
                <p className={`mt-1 text-[11px] tabular-nums ${s.delta < 0 ? "text-amber-700" : "text-neutral-400"}`}>
                  {s.delta < 0 ? t("tour.pointsForecastFalls", { n: -s.delta }) : t("tour.pointsForecastStable")}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Muss verteidigt werden — Verfallsplan */}
      {forecast.schedule.length > 0 && (
        <section>
          <h2 className="text-[15px] font-bold text-neutral-900">{t("tour.pointsDefendTitle")}</h2>
          <p className="mt-1 text-[13px] text-neutral-500">{t("tour.pointsDefendHint")}</p>
          <div className="mt-3 space-y-2">
            {forecast.schedule.map((e) => (
              <div key={`def-${e.index}`} className="flex items-center justify-between rounded-xl bg-amber-500/[0.08] px-4 py-3">
                <span className="min-w-0 truncate text-sm font-semibold text-neutral-900">{rows[e.index]?.tournament_name ?? "—"}</span>
                <span className="shrink-0 text-[13px] text-neutral-600">{t("tour.pointsExpiresOn", { points: e.points, date: fmt(e.expiresOn) })}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Ergebnis erfassen */}
      <section className="rounded-2xl ring-1 ring-black/[0.06] p-4">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.pointsCaptureTitle")}</h2>
        <p className="mt-1 text-[12px] text-neutral-500">{t("tour.pointsCaptureHint")}</p>
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
        <button type="button" onClick={submit} disabled={saving || fName.trim() === ""} className="mt-3 rounded-full bg-matchup px-5 py-2 text-[13px] font-bold text-white transition-colors hover:bg-matchup-hover disabled:opacity-50">{t("tour.pointsAdd")}</button>
      </section>

      {/* Erfasste Ergebnisse (wertend) */}
      {withPoints.length > 0 && (
        <section>
          <h2 className="text-[15px] font-bold text-neutral-900">{t("tour.pointsResultsTitle")}</h2>
          <div className="mt-3 space-y-2">
            {withPoints.map(({ row, s }) => {
              const tag = tagFor(s);
              return (
                <div key={`res-${row.id}`} className="flex items-center justify-between gap-3 rounded-xl bg-black/[0.03] px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-neutral-900">{row.tournament_name} <span className="font-normal text-neutral-400">· {catLabel(row.category)}</span></p>
                    <p className="text-[12px] text-neutral-500">
                      {roundLabel(s.round, row.round)} · {t("tour.pointsExpiresLabel", { date: fmt(s.expiresOn) })}
                      {tag && <span className="text-neutral-400"> · {tag}</span>}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className={`text-lg font-bold ${s.counts ? "text-matchup" : "text-neutral-400"}`}>{s.points}</span>
                    <button type="button" onClick={() => del(row.id)} aria-label={t("tour.pointsDeleteResult")} className="text-neutral-300 transition-colors hover:text-red-500">✕</button>
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Ohne Punkte — mit Grund, nicht stillschweigend weggelassen */}
      {noPoints.length > 0 && (
        <section>
          <h2 className="text-[15px] font-bold text-neutral-900">{t("tour.pointsNoPointsTitle")}</h2>
          <div className="mt-3 space-y-2">
            {noPoints.map(({ row, s }) => (
              <div key={`np-${row.id}`} className="flex items-center justify-between gap-3 rounded-xl bg-black/[0.02] px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-700">{row.tournament_name} <span className="text-neutral-400">· {catLabel(row.category)} · {roundLabel(s.round, row.round)}</span></p>
                  <p className="text-[12px] text-neutral-500">{reasonFor(s)}</p>
                </div>
                <button type="button" onClick={() => del(row.id)} aria-label={t("tour.pointsDeleteResult")} className="shrink-0 text-neutral-300 transition-colors hover:text-red-500">✕</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Ehrlicher Hinweis auf die Unvollständigkeit */}
      <p className="rounded-xl bg-black/[0.02] px-4 py-3 text-[12px] leading-relaxed text-neutral-500">{t("tour.pointsIncompleteHint")}</p>
    </div>
  );
}
