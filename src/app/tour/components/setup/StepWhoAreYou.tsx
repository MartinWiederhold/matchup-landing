"use client";

import { useMemo, useState } from "react";
import { useT, useLocale } from "@/lib/i18n";
import { TARGET_REGION } from "@/domain/tour/region";
import { saveWhoAmI, type SetupState } from "@/lib/tourSetup";
import { CARD_SOFT } from "../tourUi";

const inputCls =
  "w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-black/30 focus:outline-none";

/**
 * Schritt 1 „Wer bist du". Name, Bild und Wohnort kommen aus /app (profiles) und werden als
 * ÜBERNOMMENER Identitäts-Block angezeigt — keine Eingabe (Änderung erfolgt in /app). Eingabe
 * bleibt NUR, was Matchup Tour zusätzlich braucht: Nationalität (für Visa) und Ranking. Es
 * wird spaltengenau nur das gespeichert, was sich geändert hat (tour_profiles).
 */
export default function StepWhoAreYou({ state, userId, onSaved }: { state: SetupState; userId: string; onSaved: () => void }) {
  const t = useT();
  const { locale } = useLocale();

  const [nationality, setNationality] = useState(state.passports[0] ?? "");
  const [ranking, setRanking] = useState(state.ranking != null ? String(state.ranking) : "");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  // Länder-Klartext (wie im TourBrowser).
  const countryName = (code: string) => {
    const n = t(`tour.country.${code}`);
    return n.startsWith("tour.country.") ? code : n;
  };
  // Auswahl: Zielregion + der bereits gespeicherte Wert (falls außerhalb der Region),
  // damit ein Vorbefüllwert nie unsichtbar wird. Nach Klartext sortiert.
  const countryOptions = useMemo(() => {
    const set = new Set<string>(TARGET_REGION);
    if (state.country) set.add(state.country);
    if (state.passports[0]) set.add(state.passports[0]);
    return [...set].sort((a, b) => countryName(a).localeCompare(countryName(b), locale));
  }, [state.country, state.passports, locale]);

  // Übernommene Identität (aus /app). Ländername lesbar (country_name) oder aus dem Code.
  const displayName = state.displayName || state.firstName;
  const landName = state.countryName || (state.country ? countryName(state.country) : null);
  const homeLine = [state.city, landName].filter(Boolean).join(", ");

  async function save() {
    if (busy) return;
    // Nur die tour-spezifischen Felder (Nationalität/Ranking) — Identität bleibt unangetastet.
    const patch: Parameters<typeof saveWhoAmI>[1] = {};
    const nat = nationality ? [nationality] : [];
    if (JSON.stringify(nat) !== JSON.stringify(state.passports)) patch.passports = nat;
    const rankNum = ranking.trim() === "" ? null : parseInt(ranking.trim(), 10);
    const rankValue = rankNum != null && Number.isFinite(rankNum) && rankNum > 0 ? rankNum : null;
    if (rankValue !== state.ranking) patch.ranking = rankValue;

    setBusy(true);
    setStatus("idle");
    try {
      if (Object.keys(patch).length > 0) await saveWhoAmI(userId, patch);
      setStatus("saved");
      onSaved();
    } catch {
      setStatus("error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`${CARD_SOFT} p-5`}>
      <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.setupWhoTitle")}</h2>
      <p className="mt-2 text-sm text-neutral-500">{t("tour.setupWhoIntro")}</p>

      {/* Identität aus /app — übernommen, keine Eingabe. */}
      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-black/5">
        {state.profileImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={state.profileImage} alt="" loading="lazy" decoding="async" className="h-12 w-12 shrink-0 rounded-full bg-matchup/10 object-cover" />
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-matchup/10 text-[17px] font-bold text-matchup">{(displayName?.[0] ?? "?").toUpperCase()}</span>
        )}
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold text-neutral-900">{displayName || t("tour.fieldMissing")}</p>
          <p className="truncate text-[12px] text-neutral-500">{homeLine || t("tour.setupHomeMissing")}</p>
        </div>
        <span className="ml-auto shrink-0 rounded-full bg-black/[0.04] px-2.5 py-1 text-[11px] font-semibold text-neutral-500">{t("tour.setupFromApp")}</span>
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-400">{t("tour.setupFromAppNote")}</p>

      {/* Was Matchup Tour zusätzlich braucht — die einzigen Eingaben hier. */}
      <p className="mt-5 text-[12px] font-bold uppercase tracking-[0.12em] text-neutral-400">{t("tour.setupTourNeeds")}</p>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.setupNationality")}</span>
          <select value={nationality} onChange={(e) => { setNationality(e.target.value); setStatus("idle"); }} className={inputCls}>
            <option value="">—</option>
            {countryOptions.map((c) => <option key={c} value={c}>{countryName(c)}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-neutral-600">
            {t("tour.setupRanking")} <span className="font-normal text-neutral-400">· {t("tour.setupOptional")}</span>
          </span>
          <input type="text" inputMode="numeric" value={ranking} onChange={(e) => { setRanking(e.target.value); setStatus("idle"); }} placeholder="—" className={inputCls} />
        </label>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={save} disabled={busy} className="rounded-full bg-neutral-900 px-5 py-2 text-[13px] font-bold text-white transition-colors hover:bg-neutral-700 disabled:opacity-50">
          {t("tour.setupSave")}
        </button>
        {status === "saved" && <span className="text-[12px] text-emerald-600">{t("tour.setupSaved")}</span>}
        {status === "error" && <span className="text-[12px] text-neutral-500">{t("tour.setupSaveError")}</span>}
      </div>
    </section>
  );
}
