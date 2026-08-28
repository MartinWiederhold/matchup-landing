"use client";

import { useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import { CURRENCIES, euroToMinor } from "@/lib/tourCosts";
import { addExpense, uploadReceipt, type ExpenseCategory, type ExpenseInput } from "@/lib/tourExpenses";
import type { SeasonEntry } from "@/lib/tourSeason";

const CATS: ExpenseCategory[] = ["hotel", "flight", "coach", "physio", "stringing", "entry_fee", "taxi", "food", "other"];

const inputCls = "t2-input";

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
      <h2 className="t2-kicker">{t("tour.expAddTitle")}</h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block t2-fs-micro font-semibold text-[var(--t2-text-muted)]">{t("tour.expAmount")}</span>
          <input type="text" inputMode="decimal" value={amount} onChange={(e) => { setAmount(e.target.value); setError(""); }} placeholder="49.50" className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block t2-fs-micro font-semibold text-[var(--t2-text-muted)]">{t("tour.expCurrency")}</span>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputCls}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block t2-fs-micro font-semibold text-[var(--t2-text-muted)]">{t("tour.expMerchant")}</span>
          <input type="text" value={merchant} onChange={(e) => { setMerchant(e.target.value); setError(""); }} className={inputCls} />
        </label>
      </div>

      {/* Kategorie als Chips */}
      <div className="mt-3">
        <span className="mb-1.5 block t2-fs-micro font-semibold text-[var(--t2-text-muted)]">{t("tour.expCategory")}</span>
        <div className="flex flex-wrap gap-1.5">
          {CATS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`t2-chip ${category === c ? "is-on" : ""}`}
            >
              {t(`tour.expCat_${c}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block t2-fs-micro font-semibold text-[var(--t2-text-muted)]">{t("tour.expDate")}</span>
          <input type="date" value={spentOn} onChange={(e) => setSpentOn(e.target.value)} className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block t2-fs-micro font-semibold text-[var(--t2-text-muted)]">{t("tour.expTournament")}</span>
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
          <span className="mb-1 block t2-fs-micro font-semibold text-[var(--t2-text-muted)]">{t("tour.expNote")}</span>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
        </label>
      </div>

      {/* Beleg */}
      <div className="mt-3">
        <span className="mb-1.5 block t2-fs-micro font-semibold text-[var(--t2-text-muted)]">{t("tour.expReceipt")}</span>
        <input ref={fileInput} type="file" accept="image/*,application/pdf" onChange={onFilePicked} className="hidden" />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="t2-ghost disabled:opacity-50"
          >
            {t("tour.expReceiptPick")}
          </button>
          {uploading && <span className="t2-fs-micro text-[var(--t2-muted)]">{t("tour.expReceiptUploading")}</span>}
          {receiptPath && !uploading && (
            <span className="inline-flex items-center gap-2 t2-fs-micro text-[var(--t2-success)]">
              {t("tour.expReceiptAttached")}
              <button type="button" onClick={() => setReceiptPath(null)} className="text-[var(--t2-faint)] hover:text-[var(--t2-ink)]">{t("tour.expReceiptRemove")}</button>
            </span>
          )}
          {uploadError && <span className="t2-fs-micro text-[var(--t2-muted)]">{t("tour.expUploadError")}</span>}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={save} disabled={saving || uploading} className="t2-cta disabled:opacity-50">
          {saving ? t("tour.expSaving") : t("tour.expSave")}
        </button>
        {error === "invalid" && <span className="t2-fs-micro text-[var(--t2-muted)]">{t("tour.expInvalidAmount")}</span>}
        {error === "fields" && <span className="t2-fs-micro text-[var(--t2-muted)]">{t("tour.expNeedFields")}</span>}
        {error === "save" && <span className="t2-fs-micro text-[var(--t2-muted)]">{t("tour.expSaveError")}</span>}
      </div>
    </section>
  );
}
