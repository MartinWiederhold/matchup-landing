"use client";

import { useMemo, useState } from "react";
import { useT, useLocale } from "@/lib/i18n";
import { SCHENGEN_AREA } from "@/domain/tour/schengen";
import type { TourStay } from "@/lib/types";
import type { StayPatch } from "@/lib/tourStays";

const inputCls = "t2-input";

// Kalendertag in UTC formatieren (keine Zeitzonen-Verschiebung).
function fmtDate(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "de" ? "de-CH" : "en-GB", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  }).format(new Date(iso + "T00:00:00Z"));
}

/**
 * Eine Aufenthaltszeile — Anzeige oder Bearbeiten. Vorschläge (isSuggestion) haben
 * zusätzlich „Bestätigen"; bestätigte Aufenthalte sind änder- und löschbar.
 */
export default function StayRow({
  stay,
  isSuggestion,
  onConfirm,
  onSave,
  onRemove,
}: {
  stay: TourStay;
  isSuggestion: boolean;
  onConfirm?: () => void;
  onSave: (patch: StayPatch) => void;
  onRemove: () => void;
}) {
  const t = useT();
  const { locale } = useLocale();

  const countryName = (code: string) => {
    const n = t(`tour.country.${code}`);
    return n.startsWith("tour.country.") ? code : n;
  };
  const countries = useMemo(
    () => [...SCHENGEN_AREA].sort((a, b) => countryName(a).localeCompare(countryName(b), locale)),
    [locale], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const [editing, setEditing] = useState(false);
  const [country, setCountry] = useState(stay.country);
  const [entry, setEntry] = useState(stay.entry_date);
  const [exit, setExit] = useState(stay.exit_date ?? "");
  const [note, setNote] = useState(stay.note ?? "");

  function startEdit() {
    setCountry(stay.country); setEntry(stay.entry_date); setExit(stay.exit_date ?? ""); setNote(stay.note ?? "");
    setEditing(true);
  }
  function save() {
    if (!country || !entry) return;
    onSave({ country, entry_date: entry, exit_date: exit.trim() === "" ? null : exit, note: note.trim() === "" ? null : note.trim() });
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="t2-panel">
        <div className="grid gap-2 sm:grid-cols-2">
          <select value={country} onChange={(e) => setCountry(e.target.value)} className={inputCls}>
            {countries.map((c) => <option key={c} value={c}>{countryName(c)}</option>)}
          </select>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("tour.schengenNote")} className={inputCls} />
          <input type="date" value={entry} onChange={(e) => setEntry(e.target.value)} className={inputCls} />
          <input type="date" value={exit} onChange={(e) => setExit(e.target.value)} className={inputCls} />
        </div>
        <div className="mt-2 flex items-center gap-3">
          <button type="button" onClick={save} className="t2-cta">{t("tour.schengenEditSave")}</button>
          <button type="button" onClick={() => setEditing(false)} className="t2-fs-micro font-semibold text-[var(--t2-muted)] hover:text-[var(--t2-ink)]">{t("tour.schengenCancel")}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="t2-fs-body font-semibold text-[var(--t2-text)]">
          {countryName(stay.country)}
          {!isSuggestion && <span className="ml-2 rounded bg-[var(--t2-success-surface)] px-1.5 py-0.5 t2-fs-meta font-semibold text-[var(--t2-success)]">{t("tour.schengenCounts")}</span>}
        </p>
        <p className="t2-fs-micro text-[var(--t2-muted)]">
          {fmtDate(stay.entry_date, locale)} – {stay.exit_date ? fmtDate(stay.exit_date, locale) : t("tour.schengenRunning")}
          {stay.note ? ` · ${stay.note}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {isSuggestion && onConfirm && (
          <button type="button" onClick={onConfirm} className="t2-cta">{t("tour.schengenConfirm")}</button>
        )}
        <button type="button" onClick={startEdit} className="t2-fs-micro font-semibold text-[var(--t2-muted)] hover:text-[var(--t2-ink)]">{t("tour.schengenEdit")}</button>
        <button type="button" onClick={onRemove} className="t2-fs-micro font-semibold text-[var(--t2-faint)] hover:text-[var(--t2-ink)]">{t("tour.schengenDelete")}</button>
      </div>
    </div>
  );
}
