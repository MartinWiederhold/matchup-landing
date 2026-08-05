"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT, useLocale } from "@/lib/i18n";
import { scorePoints, type ScoredResult } from "@/domain/tour/points";
import { loadPointsData, type PointsData } from "@/lib/tourPoints";

type LoadState = "loading" | "error" | "done";

// Runden-Codes mit eigenem Label; alles andere (unbekannte Runde) zeigt den Rohtext.
const KNOWN_ROUNDS = new Set(["W", "F", "SF", "QF", "R16", "R32"]);

/**
 * Punktestand aus erfassten Matches. Auth-Gate wie in SeasonView (Session im
 * Browser). Der Stichtag (heute) wird HIER erzeugt und an scorePoints gereicht —
 * das Domain-Modul kennt keine Systemzeit. Nichts wird still weggelassen:
 * Ergebnisse ohne Punkte und nicht wertbare Matches erscheinen mit Grund.
 */
export default function PointsView() {
  const { user, loading: authLoading } = useAuth();
  const t = useT();
  const { locale } = useLocale();

  const [data, setData] = useState<PointsData>({ rows: [], issues: [] });
  const [state, setState] = useState<LoadState>("loading");

  // Stichtag = heute, einmal beim Mounten erzeugt (lokaler Kalendertag).
  const [asOf] = useState(() => {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  });

  useEffect(() => {
    if (authLoading || !user) return;
    let cancel = false;
    setState("loading");
    loadPointsData(user.id)
      .then((d) => { if (!cancel) { setData(d); setState("done"); } })
      .catch(() => { if (!cancel) setState("error"); });
    return () => { cancel = true; };
  }, [authLoading, user]);

  // Bewertung: reine Domain-Funktion, Stichtag von außen.
  const scored = useMemo(() => scorePoints(data.rows.map((r) => r.result), asOf), [data, asOf]);

  // ── Anzeige-Helfer ─────────────────────────────────────────────────────────
  const fmt = (iso: string) => {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return locale === "de" ? `${d}.${m}.${y}` : `${m}/${d}/${y}`;
  };
  const roundLabel = (code: string, raw: string | null) =>
    KNOWN_ROUNDS.has(code) ? t(`tour.round_${code}`) : raw ?? code;
  const tagFor = (s: ScoredResult): string | null => {
    if (s.notes.includes("noch_nicht_im_system")) return t("tour.pointsNotYet", { date: fmt(s.effectiveDate) });
    if (!s.counts) return t("tour.pointsNotCounting");
    return null;
  };
  const reasonFor = (s: ScoredResult): string => {
    if (s.notes.includes("verfallen")) return t("tour.pointsReasonExpired", { date: fmt(s.expiresOn) });
    if (s.notes.includes("unbekannte_kategorie")) return t("tour.pointsReasonUnknownCategory");
    if (s.notes.includes("unbekannte_runde")) return t("tour.pointsReasonUnknownRound");
    if (s.notes.includes("kein_punkt_erstrunde")) return t("tour.pointsReasonFirstRound");
    if (s.notes.includes("kein_quali_itf")) return t("tour.pointsReasonItfQuali");
    return t("tour.pointsReasonNone");
  };

  // ── Auth-Gate (identisch zu SeasonView) ─────────────────────────────────────
  if (authLoading) return <p className="mt-10 text-sm text-neutral-500">{t("tour.loading")}</p>;
  if (!user) {
    return (
      <div className="mt-10 rounded-2xl border border-black/[0.08] bg-black/[0.02] px-6 py-10 text-center">
        <h2 className="text-lg font-bold text-neutral-900">{t("tour.loginRequiredTitle")}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">{t("tour.loginRequiredText")}</p>
        <Link
          href="/app"
          className="mt-6 inline-flex rounded-full bg-neutral-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-neutral-700"
        >
          {t("tour.loginCta")}
        </Link>
      </div>
    );
  }

  // ── Daten ───────────────────────────────────────────────────────────────────
  if (state === "loading") return <p className="mt-8 text-sm text-neutral-500">{t("tour.loading")}</p>;
  if (state === "error") return <p className="mt-8 text-sm text-neutral-500">{t("tour.loadError")}</p>;

  if (data.rows.length === 0 && data.issues.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-black/[0.08] bg-black/[0.02] px-6 py-10 text-center">
        <h2 className="text-lg font-bold text-neutral-900">{t("tour.pointsEmptyTitle")}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">{t("tour.pointsEmptyText")}</p>
        <Link
          href="/tour/calendar"
          className="mt-6 inline-flex rounded-full bg-neutral-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-neutral-700"
        >
          {t("tour.pointsEmptyCta")}
        </Link>
      </div>
    );
  }

  // Ergebnis-Zeilen mit ihrer Bewertung koppeln (Reihenfolge bleibt erhalten).
  const view = data.rows.map((row, i) => ({ row, s: scored.results[i] }));
  const withPoints = view
    .filter((v) => v.s.points > 0 && !v.s.notes.includes("verfallen"))
    .sort((a, b) => b.s.points - a.s.points);
  const noPoints = view.filter((v) => v.s.points === 0 || v.s.notes.includes("verfallen"));
  const expiring = scored.expiringSoon
    .map((e) => ({ e, v: view[e.index] }))
    .filter((x): x is { e: { index: number; expiresOn: string }; v: (typeof view)[number] } => Boolean(x.v));

  return (
    <div className="mt-8 space-y-8">
      {/* Punktestand + Zählgrenze */}
      <div className="rounded-2xl border border-black/[0.08] bg-black/[0.02] px-6 py-6">
        <p className="text-[13px] font-medium text-neutral-500">{t("tour.pointsTotalLabel")}</p>
        <p className="mt-1 text-4xl font-extrabold tracking-tight text-neutral-900">{scored.countingTotal}</p>
        <p className="mt-1 text-[13px] text-neutral-500">{t("tour.pointsLimitLabel", { n: scored.countingLimit })}</p>
      </div>

      {/* Was demnächst verfällt — der eigentliche Nutzen */}
      {expiring.length > 0 && (
        <section>
          <h2 className="text-[15px] font-bold text-neutral-900">{t("tour.pointsExpiringTitle")}</h2>
          <p className="mt-1 text-[13px] text-neutral-500">{t("tour.pointsExpiringHint")}</p>
          <div className="mt-3 space-y-2">
            {expiring.map(({ e, v }) => (
              <div key={`exp-${e.index}`} className="flex items-center justify-between rounded-xl bg-amber-500/[0.08] px-4 py-3">
                <span className="text-sm font-semibold text-neutral-900">{v.row.tournamentName}</span>
                <span className="text-[13px] text-neutral-600">
                  {t("tour.pointsExpiresOn", { points: v.s.points, date: fmt(e.expiresOn) })}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Alle wertenden Ergebnisse */}
      {withPoints.length > 0 && (
        <section>
          <h2 className="text-[15px] font-bold text-neutral-900">{t("tour.pointsResultsTitle")}</h2>
          <div className="mt-3 space-y-2">
            {withPoints.map(({ row, s }, i) => {
              const tag = tagFor(s);
              return (
                <div key={`res-${i}`} className="flex items-center justify-between gap-3 rounded-xl bg-black/[0.03] px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-neutral-900">{row.tournamentName}</p>
                    <p className="text-[12px] text-neutral-500">
                      {roundLabel(s.round, row.rawRound)} · {t("tour.pointsExpiresLabel", { date: fmt(s.expiresOn) })}
                      {tag && <span className="text-neutral-400"> · {tag}</span>}
                      {row.incomplete && <span className="text-neutral-400"> · {t("tour.pointsResultIncomplete")}</span>}
                    </p>
                  </div>
                  <span className={`shrink-0 text-lg font-bold ${s.counts ? "text-matchup" : "text-neutral-400"}`}>
                    {s.points}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Ohne Punkte — mit Grund, nicht stillschweigend weggelassen */}
      {(noPoints.length > 0 || data.issues.length > 0) && (
        <section>
          <h2 className="text-[15px] font-bold text-neutral-900">{t("tour.pointsNoPointsTitle")}</h2>
          <div className="mt-3 space-y-2">
            {noPoints.map(({ row, s }, i) => (
              <div key={`np-${i}`} className="flex items-center justify-between gap-3 rounded-xl bg-black/[0.02] px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-700">{row.tournamentName}</p>
                  <p className="text-[12px] text-neutral-500">
                    {reasonFor(s)}
                    {row.rawRound && <span className="text-neutral-400"> · „{row.rawRound}"</span>}
                  </p>
                </div>
              </div>
            ))}
            {data.issues.map((iss, i) => (
              <div key={`iss-${i}`} className="flex items-center justify-between gap-3 rounded-xl bg-black/[0.02] px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-700">{iss.tournamentName}</p>
                  <p className="text-[12px] text-neutral-500">
                    {t(`tour.pointsIssue_${iss.reason}`)}
                    {iss.rawRound && <span className="text-neutral-400"> · „{iss.rawRound}"</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Ehrlicher Hinweis auf die Unvollständigkeit — sichtbar, ohne Alarm */}
      <p className="rounded-xl bg-black/[0.02] px-4 py-3 text-[12px] leading-relaxed text-neutral-500">
        {t("tour.pointsIncompleteHint")}
      </p>
    </div>
  );
}
