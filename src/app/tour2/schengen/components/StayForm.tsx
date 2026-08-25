"use client";

import { useMemo, useState } from "react";
import { useT, useLocale } from "@/lib/i18n";
import { SCHENGEN_AREA } from "@/domain/tour/schengen";
import { addStay } from "@/lib/tourStays";

const inputCls =
  "w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-black/30 focus:outline-none";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/** Manuelles Anlegen eines Aufenthalts. Das Häkchen „zählt für die Rechnung" ist
 *  vorausgewählt (bewusste Zustimmung), aber abwählbar — es bedeutet durchgehend
 *  dasselbe wie das Bestätigen eines Vorschlags: gilt für die 90/180-Rechnung oder nicht. */
export default function StayForm({ userId, onAdded }: { userId: string; onAdded: () => void }) {
  const t = useT();
  const { locale } = useLocale();

  const countryName = (code: string) => {
    const n = t(`tour.country.${code}`);
    return n.startsWith("tour.country.") ? code : n;
  };
  // Schengen-Länder als Klartext, alphabetisch nach übersetztem Namen.
  const countries = useMemo(
    () => [...SCHENGEN_AREA].sort((a, b) => countryName(a).localeCompare(countryName(b), locale)),
    [locale], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const [country, setCountry] = useState("");
  const [entry, setEntry] = useState(todayISO());
  const [exit, setExit] = useState("");
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(true); // vorausgewählt
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<"" | "fields" | "save">("");

  async function save() {
    if (busy) return;
    setError("");
    if (!country || !entry) { setError("fields"); return; }
    setBusy(true);
    try {
      await addStay(userId, {
        country,
        entry_date: entry,
        exit_date: exit.trim() === "" ? null : exit, // leer = läuft noch
        note: note.trim() === "" ? null : note.trim(),
        confirmed,
      });
      setCountry(""); setEntry(todayISO()); setExit(""); setNote(""); setConfirmed(true);
      onAdded();
    } catch {
      setError("save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="t2-panel">
      <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.schengenAddTitle")}</h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.schengenCountry")}</span>
          <select value={country} onChange={(e) => { setCountry(e.target.value); setError(""); }} className={inputCls}>
            <option value="">—</option>
            {countries.map((c) => <option key={c} value={c}>{countryName(c)}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.schengenEntry")}</span>
          <input type="date" value={entry} onChange={(e) => { setEntry(e.target.value); setError(""); }} className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-neutral-600">
            {t("tour.schengenExit")} <span className="font-normal text-neutral-400">({t("tour.schengenExitHint")})</span>
          </span>
          <input type="date" value={exit} onChange={(e) => setExit(e.target.value)} className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.schengenNote")}</span>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
        </label>
      </div>

      {/* Häkchen: zählt für die Rechnung (vorausgewählt, abwählbar) */}
      <label className="mt-3 flex items-start gap-2 text-[13px] text-neutral-700">
        <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5" />
        <span>{t("tour.schengenConfirmedCheck")}</span>
      </label>

      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={save} disabled={busy} className="t2-cta disabled:opacity-50">
          {t("tour.schengenSave")}
        </button>
        {error === "fields" && <span className="text-[12px] text-neutral-500">{t("tour.schengenNeedFields")}</span>}
        {error === "save" && <span className="text-[12px] text-neutral-500">{t("tour.schengenSaveError")}</span>}
      </div>
    </section>
  );
}
