"use client";

import { useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import { CURRENCIES, euroToMinor } from "@/lib/tourCosts";
import { addExpense, uploadReceipt, type ExpenseCategory, type ExpenseInput } from "@/lib/tourExpenses";
import type { SeasonEntry } from "@/lib/tourSeason";

const CATS: ExpenseCategory[] = ["hotel", "flight", "coach", "physio", "stringing", "entry_fee", "taxi", "food", "other"];

const inputCls =
  "w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-black/30 focus:outline-none";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/** Kompaktes Erfassen-Formular. KEINE Texterkennung — der Nutzer tippt selbst,
 *  das Foto ist der Beleg, nicht die Datenquelle. */
export default function ExpenseForm({
  userId,
  season,
  onAdded,
}: {
  userId: string;
  season: SeasonEntry[];
  onAdded: () => void;
}) {
  const t = useT();
  const fileInput = useRef<HTMLInputElement>(null);

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("other");
  const [spentOn, setSpentOn] = useState(todayISO());
  const [tournamentId, setTournamentId] = useState("");
  const [note, setNote] = useState("");

  const [receiptPath, setReceiptPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<"" | "invalid" | "fields" | "save">("");

  async function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadError(false);
    setUploading(true);
    try {
      const path = await uploadReceipt(userId, file);
      setReceiptPath(path);
    } catch {
      setUploadError(true);
    } finally {
      setUploading(false);
    }
  }

  function reset() {
    setAmount(""); setCurrency("EUR"); setMerchant(""); setCategory("other");
    setSpentOn(todayISO()); setTournamentId(""); setNote(""); setReceiptPath(null);
  }

  async function save() {
    if (saving) return;
    setError("");
    const trimmed = amount.trim();
    const cents = euroToMinor(trimmed);
    if (trimmed !== "" && cents === null) { setError("invalid"); return; }
    if (cents === null || !merchant.trim()) { setError("fields"); return; }

    const input: ExpenseInput = {
      amountMinor: cents,
      currency: currency.toUpperCase().slice(0, 3),
      merchant: merchant.trim(),
      category,
      spent_on: spentOn,
      tournament_id: tournamentId || null, // uuid aus der Saison oder null
      note: note.trim() === "" ? null : note.trim(),
      receipt_path: receiptPath,
    };
    setSaving(true);
    try {
      await addExpense(userId, input);
      reset();
      onAdded();
    } catch {
      setError("save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="t2-panel">
      <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.expAddTitle")}</h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.expAmount")}</span>
          <input type="text" inputMode="decimal" value={amount} onChange={(e) => { setAmount(e.target.value); setError(""); }} placeholder="49.50" className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.expCurrency")}</span>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputCls}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.expMerchant")}</span>
          <input type="text" value={merchant} onChange={(e) => { setMerchant(e.target.value); setError(""); }} className={inputCls} />
        </label>
      </div>

      {/* Kategorie als Chips */}
      <div className="mt-3">
        <span className="mb-1.5 block text-[12px] font-semibold text-neutral-600">{t("tour.expCategory")}</span>
        <div className="flex flex-wrap gap-1.5">
          {CATS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                category === c ? "border-matchup bg-matchup text-white" : "border-black/15 text-neutral-600 hover:border-black/30"
              }`}
            >
              {t(`tour.expCat_${c}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.expDate")}</span>
          <input type="date" value={spentOn} onChange={(e) => setSpentOn(e.target.value)} className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.expTournament")}</span>
          <select value={tournamentId} onChange={(e) => setTournamentId(e.target.value)} className={inputCls}>
            <option value="">{t("tour.expTournamentNone")}</option>
            {season.map((e) => (
              <option key={e.tournament.id} value={e.tournament.id}>
                {e.tournament.city || e.tournament.id}{e.tournament.country ? `, ${e.tournament.country}` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.expNote")}</span>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
        </label>
      </div>

      {/* Beleg */}
      <div className="mt-3">
        <span className="mb-1.5 block text-[12px] font-semibold text-neutral-600">{t("tour.expReceipt")}</span>
        <input ref={fileInput} type="file" accept="image/*,application/pdf" onChange={onFilePicked} className="hidden" />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="rounded-full border border-black/15 px-3.5 py-1.5 text-[12px] font-semibold text-neutral-700 transition-colors hover:border-black/30 disabled:opacity-50"
          >
            {t("tour.expReceiptPick")}
          </button>
          {uploading && <span className="text-[12px] text-neutral-500">{t("tour.expReceiptUploading")}</span>}
          {receiptPath && !uploading && (
            <span className="inline-flex items-center gap-2 text-[12px] text-emerald-600">
              {t("tour.expReceiptAttached")}
              <button type="button" onClick={() => setReceiptPath(null)} className="text-neutral-400 hover:text-neutral-700">{t("tour.expReceiptRemove")}</button>
            </span>
          )}
          {uploadError && <span className="text-[12px] text-neutral-500">{t("tour.expUploadError")}</span>}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={save} disabled={saving || uploading} className="t2-cta disabled:opacity-50">
          {saving ? t("tour.expSaving") : t("tour.expSave")}
        </button>
        {error === "invalid" && <span className="text-[12px] text-neutral-500">{t("tour.expInvalidAmount")}</span>}
        {error === "fields" && <span className="text-[12px] text-neutral-500">{t("tour.expNeedFields")}</span>}
        {error === "save" && <span className="text-[12px] text-neutral-500">{t("tour.expSaveError")}</span>}
      </div>
    </section>
  );
}
