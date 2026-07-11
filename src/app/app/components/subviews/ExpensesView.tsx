"use client";

import { useEffect, useRef, useState } from "react";
import { useT, useLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { loadTourPlan } from "@/lib/tour";
import { useAppNav } from "../appNav";
import { SubViewHeader } from "../shared/ui";

const CATS = ["hotel", "flight", "coach", "physio", "stringing", "entry_fee", "taxi", "food", "other"] as const;
type Cat = (typeof CATS)[number];

type Expense = {
  id: string;
  tournament_id: string | null;
  merchant: string | null;
  amount: number | null;
  currency: string | null;
  category: string | null;
  spent_on: string | null;
};
type Draft = {
  merchant: string; amount: string; currency: string; category: Cat; spent_on: string; tournament_id: string;
};
type Tourn = { id: string; name: string };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
const emptyDraft = (): Draft => ({ merchant: "", amount: "", currency: "EUR", category: "other", spent_on: todayISO(), tournament_id: "" });

/** Zahl aus Beleg-String (unterstützt 1.234,56 / 12,50 / 12.50). */
function toNumber(s: string): number {
  const clean = s.replace(/\s/g, "");
  const dec = Math.max(clean.lastIndexOf(","), clean.lastIndexOf("."));
  if (dec < 0) return parseFloat(clean);
  const intPart = clean.slice(0, dec).replace(/[.,]/g, "");
  return parseFloat(`${intPart}.${clean.slice(dec + 1)}`);
}

/** Heuristische Beleg-Erkennung aus OCR-Text (kostenlos, im Browser). */
function parseReceipt(text: string): { merchant: string; amount: string; currency: string; date: string | null } {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  let currency = "EUR";
  if (/chf|sfr|fr\./i.test(text)) currency = "CHF";
  else if (/\$|usd/i.test(text)) currency = "USD";
  else if (/£|gbp/i.test(text)) currency = "GBP";
  else if (/€|eur/i.test(text)) currency = "EUR";

  const amtRe = /\d{1,3}(?:[.\s]\d{3})*[.,]\d{2}/g;
  const all: number[] = [];
  let totalVal: number | null = null;
  for (const l of lines) {
    const ms = l.match(amtRe);
    if (!ms) continue;
    const vals = ms.map(toNumber).filter((v) => !isNaN(v));
    all.push(...vals);
    if (/total|summe|betrag|gesamt|amount|zu zahlen|balance|to pay/i.test(l) && vals.length) {
      totalVal = Math.max(...vals, totalVal ?? 0);
    }
  }
  const amount = totalVal ?? (all.length ? Math.max(...all) : null);

  let date: string | null = null;
  const dm = text.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})/);
  if (dm) {
    let [, d, m, y] = dm;
    if (y.length === 2) y = "20" + y;
    const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    if (!isNaN(Date.parse(iso))) date = iso;
  }
  const merchant = lines.find((l) => (l.match(/[A-Za-zÀ-ÿ]/g)?.length ?? 0) >= 3) ?? "";
  return { merchant, amount: amount != null ? String(Math.round(amount * 100) / 100) : "", currency, date };
}

export default function ExpensesView() {
  const t = useT();
  const { locale } = useLocale();
  const { profile } = useAppNav();
  const [rows, setRows] = useState<Expense[]>([]);
  const [plan, setPlan] = useState<Tourn[]>([]);
  const [prizes, setPrizes] = useState<Record<string, { amount: string; currency: string }>>({});
  const [draft, setDraft] = useState<Draft | null>(null);
  const [scanning, setScanning] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const catLabel = (c: string) => t(`mode.cat_${c}`);

  async function load() {
    const { data } = await supabase
      .from("tour_expenses")
      .select("id,tournament_id,merchant,amount,currency,category,spent_on")
      .eq("user_id", profile.id)
      .order("spent_on", { ascending: false });
    setRows((data as Expense[]) ?? []);
    const ids = await loadTourPlan(profile.id);
    if (ids.length) {
      const { data: ts } = await supabase.from("tournaments").select("id,name").in("id", ids);
      setPlan((ts as Tourn[]) ?? []);
    }
    const { data: pz } = await supabase.from("tour_prize").select("tournament_id,amount,currency").eq("user_id", profile.id);
    const pmap: Record<string, { amount: string; currency: string }> = {};
    for (const p of (pz as { tournament_id: string; amount: number | null; currency: string | null }[]) ?? []) {
      pmap[p.tournament_id] = { amount: p.amount != null ? String(p.amount) : "", currency: p.currency ?? "EUR" };
    }
    setPrizes(pmap);
  }

  async function savePrize(tid: string, amount: string, currency: string) {
    const val = amount.trim() === "" ? null : Number(amount.replace(",", "."));
    await supabase.from("tour_prize").upsert(
      { user_id: profile.id, tournament_id: tid, amount: val, currency: currency.toUpperCase().slice(0, 3), updated_at: new Date().toISOString() },
      { onConflict: "user_id,tournament_id" },
    );
  }
  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setScanning(true);
    setMsg(null);
    try {
      // Kostenloser Scan direkt im Browser (Tesseract.js) — keine API, keine Kosten.
      const Tesseract = (await import("tesseract.js")).default;
      const { data } = await Tesseract.recognize(file, "eng");
      const p = parseReceipt(data.text || "");
      setDraft({ merchant: p.merchant, amount: p.amount, currency: p.currency, category: "other", spent_on: p.date ?? todayISO(), tournament_id: "" });
      if (!p.amount) setMsg(t("mode.scanHint"));
    } catch {
      setMsg(t("mode.scanFailed"));
      setDraft(emptyDraft());
    } finally {
      setScanning(false);
    }
  }

  async function save() {
    if (!draft) return;
    const amount = Number(draft.amount.replace(",", "."));
    if (!draft.merchant.trim() || !amount) { setMsg(t("mode.expenseNeedFields")); return; }
    setSaving(true);
    await supabase.from("tour_expenses").insert({
      user_id: profile.id,
      tournament_id: draft.tournament_id || null,
      merchant: draft.merchant.trim(),
      amount,
      currency: draft.currency.toUpperCase().slice(0, 3),
      category: draft.category,
      spent_on: draft.spent_on || null,
    });
    setSaving(false);
    setDraft(null);
    setMsg(null);
    void load();
  }

  async function remove(id: string) {
    await supabase.from("tour_expenses").delete().eq("id", id);
    void load();
  }

  function exportCsv() {
    const head = ["date", "merchant", "amount", "currency", "category", "tournament"];
    const lines = rows.map((r) => [
      r.spent_on ?? "",
      (r.merchant ?? "").replace(/;/g, ","),
      r.amount ?? "",
      r.currency ?? "",
      r.category ?? "",
      plan.find((p) => p.id === r.tournament_id)?.name ?? "",
    ].join(";"));
    const csv = [head.join(";"), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `matchup-expenses-${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // DATEV-tauglicher Export: Buchungsstapel-CSV mit Standard-Sachkonten (SKR03,
  // Vorschlag — mit Steuerberater abstimmen). Belegdatum DD.MM.JJJJ, Betrag mit Komma.
  const DATEV_ACCT: Record<string, string> = {
    hotel: "4670", flight: "4670", travel: "4670", taxi: "4673", food: "4674",
    coach: "4900", physio: "4900", stringing: "4980", entry_fee: "4900", other: "4900",
  };
  function exportDatev() {
    const head = ["Belegdatum", "Betrag", "WKZ", "Konto", "Gegenkonto", "Buchungstext"];
    const lines = rows.map((r) => {
      const d = r.spent_on ? r.spent_on.split("-").reverse().join(".") : "";
      const amt = r.amount != null ? String(r.amount).replace(".", ",") : "";
      const text = `${catLabel(r.category ?? "other")}: ${(r.merchant ?? "").replace(/;/g, ",")}`;
      return [d, amt, r.currency ?? "EUR", DATEV_ACCT[r.category ?? "other"] ?? "4900", "1200", text].join(";");
    });
    const csv = [head.join(";"), ...lines].join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `matchup-datev-${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Summen je Währung
  const totals = new Map<string, number>();
  for (const r of rows) {
    if (r.amount == null) continue;
    const c = r.currency ?? "?";
    totals.set(c, (totals.get(c) ?? 0) + Number(r.amount));
  }
  const dateFmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short" }) : "—");

  return (
    <div className="flex h-full flex-col bg-white text-neutral-900">
      <SubViewHeader
        light
        title={t("mode.financeTitle")}
        rightActions={
          rows.length > 0 ? (
            <div className="flex items-center gap-3">
              <button type="button" onClick={exportCsv} className="text-[13px] font-bold text-matchup">CSV</button>
              <button type="button" onClick={exportDatev} className="text-[13px] font-bold text-matchup">DATEV</button>
            </div>
          ) : undefined
        }
      />
      <input ref={fileInput} type="file" accept="image/*" capture="environment" onChange={onFilePicked} className="hidden" />

      <div className="flex-1 space-y-5 overflow-y-auto p-4 pb-28">
        {/* Summen */}
        {totals.size > 0 && (
          <div className="rounded-2xl bg-black/[0.035] p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">{t("mode.expensesTotal")}</p>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
              {[...totals.entries()].map(([c, v]) => (
                <span key={c} className="text-[20px] font-extrabold tracking-tight text-neutral-900">
                  {v.toLocaleString(locale, { maximumFractionDigits: 0 })} {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Pro Turnier: Preisgeld vs. Kosten */}
        {plan.length > 0 && (
          <div>
            <p className="mb-2 px-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">{t("mode.perTournament")}</p>
            <div className="space-y-2">
              {plan.map((p) => {
                const cost = new Map<string, number>();
                for (const r of rows) {
                  if (r.tournament_id !== p.id || r.amount == null) continue;
                  const c = r.currency ?? "?";
                  cost.set(c, (cost.get(c) ?? 0) + Number(r.amount));
                }
                const pr = prizes[p.id] ?? { amount: "", currency: "EUR" };
                return (
                  <div key={p.id} className="rounded-2xl bg-black/[0.035] p-3.5">
                    <p className="truncate text-[13.5px] font-bold text-neutral-900">{p.name}</p>
                    <div className="mt-2 flex items-end gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">{t("mode.prizeMoney")}</label>
                        <div className="mt-1 flex gap-1.5">
                          <input
                            value={pr.amount}
                            onChange={(e) => setPrizes({ ...prizes, [p.id]: { ...pr, amount: e.target.value } })}
                            onBlur={() => savePrize(p.id, pr.amount, pr.currency)}
                            inputMode="decimal"
                            placeholder="0"
                            className="w-full rounded-lg bg-white px-2.5 py-2 text-[13px] outline-none ring-1 ring-black/[0.06]"
                          />
                          <input
                            value={pr.currency}
                            onChange={(e) => setPrizes({ ...prizes, [p.id]: { ...pr, currency: e.target.value } })}
                            onBlur={() => savePrize(p.id, pr.amount, pr.currency)}
                            className="w-16 rounded-lg bg-white px-2 py-2 text-center text-[13px] uppercase outline-none ring-1 ring-black/[0.06]"
                          />
                        </div>
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">{t("mode.financeExpenses")}</p>
                        <p className="mt-1 py-2 text-[14px] font-bold text-neutral-900">
                          {cost.size ? [...cost.entries()].map(([c, v]) => `${v.toLocaleString(locale, { maximumFractionDigits: 0 })} ${c}`).join(" · ") : "—"}
                        </p>
                      </div>
                    </div>
                    {(() => {
                      const cur = pr.currency.toUpperCase().slice(0, 3);
                      const costSame = cost.get(cur) ?? 0;
                      const prizeNum = Number((pr.amount || "0").replace(",", ".")) || 0;
                      if (!prizeNum && !costSame) return null;
                      const net = prizeNum - costSame;
                      return (
                        <p className={`mt-1.5 text-right text-[12px] font-bold ${net >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {t("mode.net")}: {net.toLocaleString(locale, { maximumFractionDigits: 0 })} {cur}
                        </p>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Aktionen */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={scanning}
            className="flex flex-col items-center gap-2 rounded-2xl bg-matchup py-5 text-white disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" /><circle cx="12" cy="12" r="3" /></svg>
            <span className="text-[13px] font-bold">{scanning ? t("mode.scanning") : t("mode.scanReceipt")}</span>
          </button>
          <button
            type="button"
            onClick={() => setDraft(emptyDraft())}
            className="flex flex-col items-center gap-2 rounded-2xl bg-black/[0.05] py-5 text-neutral-700"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            <span className="text-[13px] font-bold">{t("mode.addManual")}</span>
          </button>
        </div>
        {msg && <p className="text-[12px] text-amber-600">{msg}</p>}

        {/* Liste */}
        {rows.length === 0 ? (
          <p className="pt-6 text-center text-[13px] text-neutral-400">{t("mode.noExpenses")}</p>
        ) : (
          <div className="divide-y divide-black/[0.06]">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-neutral-900">{r.merchant || catLabel(r.category ?? "other")}</p>
                  <p className="text-[11.5px] text-neutral-500">
                    {catLabel(r.category ?? "other")} · {dateFmt(r.spent_on)}
                    {r.tournament_id && plan.find((p) => p.id === r.tournament_id) ? ` · ${plan.find((p) => p.id === r.tournament_id)!.name}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-[14px] font-bold text-neutral-900">
                  {r.amount != null ? `${Number(r.amount).toLocaleString(locale, { maximumFractionDigits: 0 })} ${r.currency ?? ""}` : "—"}
                </span>
                <button type="button" onClick={() => remove(r.id)} aria-label="×" className="shrink-0 text-neutral-300">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bestätigen/Erfassen */}
      {draft && (
        <div className="fixed inset-0 z-[70] mx-auto flex max-w-[430px] items-end bg-black/40 backdrop-blur-sm" onClick={() => setDraft(null)}>
          <div className="w-full rounded-t-[28px] bg-white p-5 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-base font-bold text-neutral-900">{t("mode.confirmExpense")}</span>
              <button type="button" onClick={() => setDraft(null)} className="text-sm font-medium text-neutral-500">{t("common.cancel")}</button>
            </div>
            <div className="space-y-2.5">
              <input value={draft.merchant} onChange={(e) => setDraft({ ...draft, merchant: e.target.value })} placeholder={t("mode.merchant")} className="w-full rounded-xl bg-black/[0.04] px-4 py-3 text-sm outline-none" />
              <div className="flex gap-2">
                <input value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} inputMode="decimal" placeholder={t("mode.amount")} className="flex-1 rounded-xl bg-black/[0.04] px-4 py-3 text-sm outline-none" />
                <input value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value })} placeholder="EUR" className="w-24 rounded-xl bg-black/[0.04] px-4 py-3 text-center text-sm uppercase outline-none" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CATS.map((c) => (
                  <button key={c} type="button" onClick={() => setDraft({ ...draft, category: c })} className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${draft.category === c ? "bg-matchup text-white" : "bg-black/[0.05] text-neutral-600"}`}>
                    {catLabel(c)}
                  </button>
                ))}
              </div>
              <input type="date" value={draft.spent_on} onChange={(e) => setDraft({ ...draft, spent_on: e.target.value })} className="w-full rounded-xl bg-black/[0.04] px-4 py-3 text-sm outline-none" />
              {plan.length > 0 && (
                <select value={draft.tournament_id} onChange={(e) => setDraft({ ...draft, tournament_id: e.target.value })} className="w-full rounded-xl bg-black/[0.04] px-4 py-3 text-sm outline-none">
                  <option value="">{t("mode.noTournament")}</option>
                  {plan.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              )}
              <button type="button" onClick={save} disabled={saving} className="mt-1 w-full rounded-full bg-matchup py-3.5 text-sm font-bold text-white disabled:opacity-50">
                {saving ? t("mode.saving") : t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
