"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT, useLocale } from "@/lib/i18n";
import { loadExpenses, loadPrizes, amountToMinor, isTourTournamentId } from "@/lib/tourExpenses";
import { loadIncome, addIncome, removeIncome, type TourIncomeRow, type IncomeKind } from "@/lib/tourIncome";
import { loadSeasonPlanRows, loadTournamentsByIds } from "@/lib/tourSeason";
import { loadPointsData } from "@/lib/tourPoints";
import { euroToMinor } from "@/lib/tourCosts";
import { scorePoints } from "@/domain/tour/points";
import { tournamentBalances, seasonMetrics, type Money, type TournamentBalance, type SeasonMetrics } from "@/domain/tour/finance";

const INCOME_KINDS: IncomeKind[] = ["sponsor", "federation", "club", "bonus", "other"];

/** amount kann als String oder Zahl aus PostgREST kommen → auf String bringen, dann in Cent. */
const toMinor = (a: string | number | null): number => amountToMinor(a == null ? null : String(a));

/**
 * Turnier-Bilanz: Kosten gegen Einnahmen je Turnier (Saldo je Währung, NIE kreuzweise) plus
 * Saison-Kennzahlen. Ausgaben/Preisgeld kommen aus den geteilten Tabellen (nur gelesen), die
 * Zusatzeinnahmen aus web.tour_income. Die Rechnung liegt in der reinen Domain (finance.ts).
 */
export default function FinanceView() {
  const { user, loading: authLoading } = useAuth();
  const t = useT();
  const { locale } = useLocale();
  const intl = locale === "en" ? "en-GB" : "de-DE";
  const [nowMs] = useState(() => Date.now());

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [balances, setBalances] = useState<TournamentBalance[]>([]);
  const [metrics, setMetrics] = useState<SeasonMetrics | null>(null);
  const [nameById, setNameById] = useState<Map<string, string>>(new Map());
  const [seasonTours, setSeasonTours] = useState<{ id: string; name: string }[]>([]);
  const [income, setIncome] = useState<TourIncomeRow[]>([]);

  // Formular „Einnahme erfassen".
  const [fKind, setFKind] = useState<IncomeKind>("sponsor");
  const [fAmount, setFAmount] = useState("");
  const [fCurrency, setFCurrency] = useState("EUR");
  const [fTour, setFTour] = useState("");
  const [fDate, setFDate] = useState(() => new Date(Date.now()).toISOString().slice(0, 10));
  const [fNote, setFNote] = useState("");
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    if (!user) return;
    const [exp, prizeMap, inc, plans, pts] = await Promise.all([
      loadExpenses(user.id), loadPrizes(user.id), loadIncome(user.id), loadSeasonPlanRows(), loadPointsData(user.id),
    ]);
    setIncome(inc);

    // Namen + Montage der beteiligten (und Saison-)Turniere.
    const ids = new Set<string>();
    exp.rows.forEach((r) => r.tournament_id && ids.add(r.tournament_id));
    prizeMap.forEach((_, k) => ids.add(k));
    inc.forEach((i) => i.tournament_id && ids.add(i.tournament_id));
    plans.forEach((p) => ids.add(p.tournament_id));
    const uuidIds = [...ids].filter(isTourTournamentId);
    const tours = await loadTournamentsByIds(uuidIds);
    const nm = new Map<string, string>(exp.names); // uuid → „Stadt, Land"
    const mondayById: Record<string, string> = {};
    for (const t2 of tours) {
      nm.set(t2.id, t2.city ? `${t2.city}${t2.country ? ", " + t2.country : ""}` : t2.name ?? t2.id);
      mondayById[t2.id] = t2.tournament_monday;
    }
    setNameById(nm);
    setSeasonTours(plans.map((p) => ({ id: p.tournament_id, name: nm.get(p.tournament_id) ?? p.tournament_id })));

    // Domain-Eingabe (Cent, Währung groß). amount kann als String ODER Zahl kommen
    // (PostgREST-Numeric ist meist String, für dieses Konto aber teils Zahl) → toMinor coerct.
    const cur = (c: string | null) => (c || "EUR").toUpperCase().slice(0, 3);
    const expenses = exp.rows.map((r) => ({ tournamentId: r.tournament_id, amountMinor: toMinor(r.amount), currency: cur(r.currency), category: r.category || "other" }));
    const prizes = [...prizeMap.entries()].map(([tid, v]) => ({ tournamentId: tid, amountMinor: toMinor(v.amount), currency: cur(v.currency) }));
    const incomeItems = inc.map((i) => ({ tournamentId: i.tournament_id, amountMinor: toMinor(i.amount), currency: cur(i.currency), kind: i.kind }));

    const asOf = new Date(nowMs).toISOString().slice(0, 10);
    const scored = scorePoints(pts.rows.map((r) => r.result), asOf);
    setBalances(tournamentBalances({ expenses, prizes, income: incomeItems }));
    setMetrics(seasonMetrics({ expenses, prizes, income: incomeItems, mondayByTournament: mondayById, points: scored.countingTotal, hasResults: pts.rows.length > 0 }));
  }, [user, nowMs]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    reload().then(() => { if (alive) setStatus("ready"); }).catch(() => { if (alive) setStatus("error"); });
    return () => { alive = false; };
  }, [user, reload]);

  const submitIncome = async () => {
    if (!user) return;
    const cents = euroToMinor(fAmount);
    if (cents == null) return; // leer/ungültig → nichts tun
    setSaving(true);
    try {
      await addIncome(user.id, { amountMinor: cents, currency: fCurrency, kind: fKind, tournament_id: fTour || null, received_on: fDate, note: fNote.trim() || null });
      setFAmount(""); setFNote("");
      await reload();
    } finally { setSaving(false); }
  };
  const delIncome = async (id: string) => { await removeIncome(id); await reload(); };

  const money = (minor: number, cur: string) => new Intl.NumberFormat(intl, { style: "currency", currency: cur, maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(minor / 100);
  const fmtMoney = (m: Money) => { const es = Object.entries(m); return es.length ? es.map(([c, v]) => money(v, c)).join(" · ") : "—"; };
  const inp = "t2-input";

  if (authLoading) return <p className="mt-6 text-sm text-[var(--t2-muted)]">{t("tour.loading")}</p>;
  if (!user) {
    return (
      <div className="t2-panel mt-6 text-center">
        <p className="text-sm text-[var(--t2-muted)]">{t("tour.loginRequiredText")}</p>
        <Link href="/app" className="t2-cta mt-3">{t("tour.loginCta")}</Link>
      </div>
    );
  }
  if (status === "loading") return <p className="mt-6 text-sm text-[var(--t2-muted)]">{t("tour.loading")}</p>;
  if (status === "error") return <p className="mt-6 text-sm text-[var(--t2-muted)]">{t("tour.loadError")}</p>;

  const m = metrics!;
  const tile = "border-t border-[var(--t2-line)] py-4";
  const tileLabel = "t2-kicker";

  return (
    <div className="mt-8 space-y-8">
      {/* ── Kennzahlen ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <div className={tile}>
          <p className={tileLabel}>{t("tour.finBalance")}</p>
          <p className="mt-1 text-[17px] font-extrabold tabular-nums text-neutral-900">{fmtMoney(m.balance)}</p>
          <p className="mt-1 text-[11px] text-neutral-400">{t("tour.finExpenses")}: {fmtMoney(m.expensesTotal)} · {t("tour.finIncome")}: {fmtMoney(m.incomeTotal)}</p>
        </div>
        <div className={tile}>
          <p className={tileLabel}>{t("tour.finCostPerPoint")}</p>
          {m.costPerPoint ? (
            <>
              <p className="mt-1 text-[17px] font-extrabold tabular-nums text-neutral-900">{fmtMoney(m.costPerPoint)}</p>
              <p className="mt-1 text-[11px] text-neutral-400">{m.points} P · {t("tour.finBasis", { n: m.tournamentsWithExpenses })}</p>
            </>
          ) : (
            <p className="mt-1 text-[13px] font-semibold text-neutral-500">{m.hasResults ? t("tour.finNoCountingPoints") : t("tour.finNoResults")}</p>
          )}
        </div>
        <div className={tile}>
          <p className={tileLabel}>{t("tour.finCostPerTournament")}</p>
          <p className="mt-1 text-[17px] font-extrabold tabular-nums text-neutral-900">{m.tournamentsWithExpenses > 0 ? fmtMoney(m.costPerTournament) : "—"}</p>
          <p className="mt-1 text-[11px] text-neutral-400">{t("tour.finBasis", { n: m.tournamentsWithExpenses })}</p>
        </div>
        <div className={tile}>
          <p className={tileLabel}>{t("tour.finCostPerWeek")}</p>
          <p className="mt-1 text-[17px] font-extrabold tabular-nums text-neutral-900">{m.weeksWithExpenses > 0 ? fmtMoney(m.costPerWeek) : "—"}</p>
        </div>
        <div className={tile}>
          <p className={tileLabel}>{t("tour.finPrizeToCost")}</p>
          <p className="mt-1 text-[17px] font-extrabold tabular-nums text-neutral-900">{Object.keys(m.prizeToCost).length ? Object.entries(m.prizeToCost).map(([c, v]) => `${c} ${v.toFixed(2)}`).join(" · ") : "—"}</p>
          <p className="mt-1 text-[11px] text-neutral-400">{t("tour.finPrize")}: {fmtMoney(m.prizeTotal)}</p>
        </div>
      </div>

      {/* ── Bilanz je Turnier ──────────────────────────────────────────────── */}
      {balances.length === 0 ? (
        <p className="rounded-xl bg-black/[0.02] px-4 py-4 text-[14px] text-neutral-500">{t("tour.finEmpty")}</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {balances.map((b) => (
            <div key={b.tournamentId} className="border-t border-[var(--t2-line)] py-4">
              <p className="text-[14px] font-bold text-neutral-900">{nameById.get(b.tournamentId) ?? b.tournamentId}</p>
              {/* Ausgaben nach Posten */}
              <div className="mt-2 space-y-0.5">
                {b.expensesByCategory.map((c) => (
                  <p key={c.category} className="flex justify-between text-[12px] text-neutral-500"><span>{t(`tour.expCat_${c.category}`).startsWith("tour.") ? c.category : t(`tour.expCat_${c.category}`)}</span><span className="tabular-nums">{fmtMoney(c.byCurrency)}</span></p>
                ))}
                {b.incomeByKind.map((k) => (
                  <p key={k.kind} className="flex justify-between text-[12px] text-emerald-600"><span>{t(`tour.income_${k.kind}`)}</span><span className="tabular-nums">+{fmtMoney(k.byCurrency)}</span></p>
                ))}
                {Object.keys(b.prize).length > 0 && <p className="flex justify-between text-[12px] text-emerald-600"><span>{t("tour.finPrize")}</span><span className="tabular-nums">+{fmtMoney(b.prize)}</span></p>}
              </div>
              <div className="mt-2 flex justify-between border-t border-black/[0.06] pt-2 text-[13px] font-bold">
                <span className="text-neutral-500">{t("tour.finBalance")}</span>
                <span className={`tabular-nums ${Object.values(b.balance).some((v) => v < 0) ? "text-amber-700" : "text-emerald-700"}`}>{fmtMoney(b.balance)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Einnahme erfassen + Liste ──────────────────────────────────────── */}
      <section className="t2-panel">
        <h2 className="t2-kicker">{t("tour.finAddIncome")}</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block"><span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.finKind")}</span>
            <select value={fKind} onChange={(e) => setFKind(e.target.value as IncomeKind)} className={inp}>{INCOME_KINDS.map((k) => <option key={k} value={k}>{t(`tour.income_${k}`)}</option>)}</select>
          </label>
          <label className="block"><span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.finAmount")}</span>
            <input value={fAmount} onChange={(e) => setFAmount(e.target.value)} inputMode="decimal" placeholder="0.00" className={inp} />
          </label>
          <label className="block"><span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.finCurrency")}</span>
            <input value={fCurrency} onChange={(e) => setFCurrency(e.target.value.toUpperCase().slice(0, 3))} className={inp} />
          </label>
          <label className="block"><span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.finTournament")}</span>
            <select value={fTour} onChange={(e) => setFTour(e.target.value)} className={inp}>
              <option value="">{t("tour.finTournamentNone")}</option>
              {seasonTours.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="block"><span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.finReceivedOn")}</span>
            <input type="date" value={fDate} onChange={(e) => setFDate(e.target.value)} className={inp} />
          </label>
          <label className="block"><span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.finNote")}</span>
            <input value={fNote} onChange={(e) => setFNote(e.target.value)} className={inp} />
          </label>
        </div>
        <button type="button" onClick={submitIncome} disabled={saving || euroToMinor(fAmount) == null} className="t2-cta mt-3 disabled:opacity-50">
          {t("tour.finSave")}
        </button>

        {income.length > 0 && (
          <ul className="mt-4 space-y-1.5 border-t border-black/[0.06] pt-3">
            {income.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-2 text-[13px]">
                <span className="min-w-0 truncate text-neutral-700">
                  <span className="font-semibold">{t(`tour.income_${i.kind}`)}</span>
                  {i.tournament_id ? ` · ${nameById.get(i.tournament_id) ?? i.tournament_id}` : ""}
                  {i.received_on ? ` · ${i.received_on}` : ""}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="tabular-nums font-semibold text-emerald-700">{i.amount != null ? money(toMinor(i.amount), (i.currency || "EUR").toUpperCase()) : "—"}</span>
                  <button type="button" onClick={() => delIncome(i.id)} aria-label={t("tour.finDeleteIncome")} className="text-neutral-300 transition-colors hover:text-red-500">✕</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
