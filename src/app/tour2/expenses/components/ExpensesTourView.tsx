"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT, useLocale } from "@/lib/i18n";
import { CURRENCIES, euroToMinor, minorToEuro } from "@/lib/tourCosts";
import { loadSeason, type SeasonEntry } from "@/lib/tourSeason";
import {
  amountToMinor,
  isTourTournamentId,
  loadExpenses,
  loadPrizes,
  removeExpense,
  savePrize,
  type TourExpense,
} from "@/lib/tourExpenses";
import ExpenseForm from "./ExpenseForm";
import ReceiptLink from "./ReceiptLink";

type LoadState = "loading" | "error" | "done";

// Betrag (Cent) + Währung → Anzeige. Nie währungsübergreifend addiert.
const money = (cents: number, currency: string) => `${minorToEuro(cents)} ${currency}`;

export default function ExpensesTourView() {
  const { user, loading: authLoading } = useAuth();
  const t = useT();
  const { locale } = useLocale();

  const [season, setSeason] = useState<SeasonEntry[]>([]);
  const [rows, setRows] = useState<TourExpense[]>([]);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [prizeInputs, setPrizeInputs] = useState<Record<string, { amount: string; currency: string }>>({});
  const [state, setState] = useState<LoadState>("loading");
  const [actionError, setActionError] = useState<"" | "receipt" | "remove">("");

  const reloadExpenses = useCallback(async (userId: string) => {
    const { rows: r, names: n } = await loadExpenses(userId);
    setRows(r);
    setNames(n);
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancel = false;
    setState("loading");
    Promise.all([loadSeason(), loadExpenses(user.id), loadPrizes(user.id)])
      .then(([s, ex, pz]) => {
        if (cancel) return;
        setSeason(s);
        setRows(ex.rows);
        setNames(ex.names);
        // Preisgeld-Eingaben aus den gespeicherten Werten vorbelegen.
        const pi: Record<string, { amount: string; currency: string }> = {};
        for (const [tid, p] of pz) pi[tid] = { amount: p.amount ?? "", currency: p.currency ?? "EUR" };
        setPrizeInputs(pi);
        setState("done");
      })
      .catch(() => { if (!cancel) setState("error"); });
    return () => { cancel = true; };
  }, [authLoading, user]);

  // Ausgabe löschen — Datei-Fehler sichtbar machen (kein stiller Fehlschlag).
  const handleRemove = useCallback(async (exp: TourExpense) => {
    if (!user) return;
    setActionError("");
    try {
      await removeExpense(exp);
      await reloadExpenses(user.id);
    } catch (e) {
      setActionError(e instanceof Error && e.message === "receipt_delete_failed" ? "receipt" : "remove");
    }
  }, [user, reloadExpenses]);

  // Preisgeld speichern (onBlur). Leerer/ungültiger Betrag → geleert.
  const handlePrizeSave = useCallback(async (uuid: string) => {
    if (!user) return;
    const pi = prizeInputs[uuid] ?? { amount: "", currency: "EUR" };
    try { await savePrize(user.id, uuid, pi.amount, pi.currency); } catch { /* still, aber unkritisch */ }
  }, [user, prizeInputs]);

  // ── Auth-Gate (wie SeasonView) ───────────────────────────────────────────
  if (authLoading) return <p className="mt-10 t2-fs-body text-[var(--t2-muted)]">{t("tour.loading")}</p>;
  if (!user) {
    return (
      <div className="t2-panel mt-10 text-center">
        <h2 className="t2-fs-h3 font-bold">{t("tour.loginRequiredTitle")}</h2>
        <p className="mx-auto mt-2 max-w-sm t2-fs-body text-[var(--t2-muted)]">{t("tour.loginRequiredText")}</p>
        <Link href="/app" className="mt-6 t2-cta">{t("tour.loginCta")}</Link>
      </div>
    );
  }
  if (state === "loading") return <p className="mt-8 t2-fs-body text-[var(--t2-muted)]">{t("tour.loading")}</p>;
  if (state === "error") return <p className="mt-8 t2-fs-body text-[var(--t2-muted)]">{t("tour.loadError")}</p>;

  // Summen je Währung über ALLE Ausgaben.
  const totals = new Map<string, number>();
  for (const r of rows) {
    if (!r.currency) continue;
    totals.set(r.currency, (totals.get(r.currency) ?? 0) + amountToMinor(r.amount));
  }

  const dateFmt = (iso: string | null) =>
    iso ? new Date(iso + "T00:00:00Z").toLocaleDateString(locale === "de" ? "de-CH" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "—";

  return (
    <div className="mt-8 space-y-6">
      <ExpenseForm userId={user.id} season={season} onAdded={() => reloadExpenses(user.id)} />

      {/* Summen je Währung */}
      {totals.size > 0 && (
        <section className="t2-panel">
          <h2 className="t2-kicker">{t("tour.expTotals")}</h2>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
            {[...totals.entries()].sort().map(([c, v]) => (
              <span key={c} className="t2-fs-h2 font-extrabold tracking-tight text-[var(--t2-text)] tabular-nums">{money(v, c)}</span>
            ))}
          </div>
          <p className="mt-1 t2-fs-meta text-[var(--t2-faint)]">{t("tour.expTotalsNote")}</p>
        </section>
      )}

      {/* Preisgeld / Netto je Turnier (nur eigene Saison) */}
      {season.length > 0 && (
        <section>
          <h2 className="t2-kicker">{t("tour.expPerTournament")}</h2>
          <div className="mt-3 space-y-3">
            {season.map((e) => {
              const uuid = e.tournament.id;
              const cost = new Map<string, number>();
              for (const r of rows) {
                if (r.tournament_id !== uuid || !r.currency) continue;
                cost.set(r.currency, (cost.get(r.currency) ?? 0) + amountToMinor(r.amount));
              }
              const pi = prizeInputs[uuid] ?? { amount: "", currency: "EUR" };
              const prizeCents = euroToMinor(pi.amount) ?? 0;
              const prizeCur = pi.currency.toUpperCase().slice(0, 3);
              const curs = new Set<string>(cost.keys());
              if (prizeCents > 0) curs.add(prizeCur);
              const netLines = [...curs].sort().map((c) => ({ c, net: (prizeCur === c ? prizeCents : 0) - (cost.get(c) ?? 0) }));

              return (
                <article key={uuid} className="t2-panel">
                  <p className="truncate t2-fs-body font-bold text-[var(--t2-text)]">
                    {e.tournament.city || t("tour.fieldMissing")}
                    {e.tournament.country ? <span className="text-[var(--t2-muted)]">, {e.tournament.country}</span> : null}
                  </p>

                  <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-2">
                    <label className="block">
                      <span className="mb-1 block t2-kicker">{t("tour.expPrize")}</span>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={pi.amount}
                          onChange={(ev) => setPrizeInputs({ ...prizeInputs, [uuid]: { ...pi, amount: ev.target.value } })}
                          onBlur={() => handlePrizeSave(uuid)}
                          placeholder="0"
                          className="w-28 t2-input"
                        />
                        <select
                          value={pi.currency}
                          onChange={(ev) => { const next = { ...prizeInputs, [uuid]: { ...pi, currency: ev.target.value } }; setPrizeInputs(next); }}
                          onBlur={() => handlePrizeSave(uuid)}
                          className="t2-input"
                        >
                          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </label>

                    <div>
                      <span className="mb-1 block t2-kicker">{t("tour.expExpenses")}</span>
                      <p className="t2-fs-body font-bold text-[var(--t2-text)]">
                        {cost.size ? [...cost.entries()].sort().map(([c, v]) => money(v, c)).join(" · ") : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Netto je Währung — nie gemischt */}
                  {netLines.length > 0 && (
                    <div className="mt-2 border-t border-[var(--t2-line)] pt-2">
                      {netLines.map(({ c, net }) => (
                        <p key={c} className={`t2-fs-body-sm font-bold ${net >= 0 ? "text-[var(--t2-success)]" : "text-[var(--t2-danger)]"}`}>
                          {t("tour.expNet")}: {money(net, c)}
                        </p>
                      ))}
                      {curs.size > 1 && <p className="mt-1 t2-fs-meta text-[var(--t2-faint)]">{t("tour.expMixedNote")}</p>}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Ausgabenliste */}
      <section>
        <h2 className="t2-kicker">{t("tour.expListTitle")}</h2>
        {actionError && (
          <p className="mt-2 t2-fs-micro text-[var(--t2-muted)]">
            {actionError === "receipt" ? t("tour.expRemoveReceiptFailed") : t("tour.expRemoveError")}
          </p>
        )}
        {rows.length === 0 ? (
          <p className="mt-6 rounded-xl bg-[var(--t2-surface)] px-5 py-8 text-center t2-fs-body text-[var(--t2-muted)]">{t("tour.expEmpty")}</p>
        ) : (
          <div className="mt-3 divide-y divide-[var(--t2-line)]">
            {rows.map((r) => {
              // Name nur für uuid-Turniere (Diskriminator); Slug → ohne Namen, kein Absturz.
              const tname = isTourTournamentId(r.tournament_id) ? names.get(r.tournament_id!) : null;
              return (
                <div key={r.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate t2-fs-body font-semibold text-[var(--t2-text)]">{r.merchant || t(`tour.expCat_${r.category ?? "other"}`)}</p>
                    <p className="t2-fs-meta text-[var(--t2-muted)]">
                      {t(`tour.expCat_${r.category ?? "other"}`)} · {dateFmt(r.spent_on)}
                      {tname ? ` · ${tname}` : ""}
                    </p>
                    {r.receipt_path && <div className="mt-1"><ReceiptLink path={r.receipt_path} /></div>}
                  </div>
                  <span className="shrink-0 t2-fs-body font-bold text-[var(--t2-text)] tabular-nums">
                    {r.amount != null ? money(amountToMinor(r.amount), r.currency ?? "") : "—"}
                  </span>
                  <button type="button" onClick={() => handleRemove(r)} className="shrink-0 t2-fs-micro font-semibold text-[var(--t2-faint)] hover:text-[var(--t2-ink)]">
                    {t("tour.expRemove")}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
