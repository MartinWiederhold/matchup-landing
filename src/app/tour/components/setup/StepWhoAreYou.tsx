"use client";

import { useMemo, useState } from "react";
import { useT, useLocale } from "@/lib/i18n";
import { TARGET_REGION } from "@/domain/tour/region";
import { saveWhoAmI, type SetupState } from "@/lib/tourSetup";
import { CARD_SOFT } from "../tourUi";

const inputCls =
  "w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-black/30 focus:outline-none";

/**
 * Schritt 1 „Wer bist du". Vorbefüllt aus dem geladenen Stand (Geschlecht/Ort aus
 * profiles, Nationalität/Ranking aus tour_profiles). Es wird NUR das gespeichert, was
 * sich gegenüber dem Ausgangswert geändert hat (spaltengenau in profiles).
 * Ranking ist optional; Geschlecht kennt nur die von profiles erlaubten Werte.
 */
export default function StepWhoAreYou({ state, userId, onSaved }: { state: SetupState; userId: string; onSaved: () => void }) {
  const t = useT();
  const { locale } = useLocale();

  const [gender, setGender] = useState(state.gender ?? "");
  const [city, setCity] = useState(state.city ?? "");
  const [country, setCountry] = useState(state.country ?? "");
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

  async function save() {
    if (busy) return;
    // Nur geänderte Felder in den patch — sonst nichts schreiben.
    const patch: Parameters<typeof saveWhoAmI>[1] = {};
    if (gender !== (state.gender ?? "")) patch.gender = gender || null;
    if (city.trim() !== (state.city ?? "")) patch.city = city.trim() || null;
    if (country !== (state.country ?? "")) patch.country = country || null;
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

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.setupGender")}</span>
          <select value={gender} onChange={(e) => { setGender(e.target.value); setStatus("idle"); }} className={inputCls}>
            <option value="">—</option>
            <option value="male">{t("tour.setupGenderMale")}</option>
            <option value="female">{t("tour.setupGenderFemale")}</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.setupCity")}</span>
          <input type="text" value={city} onChange={(e) => { setCity(e.target.value); setStatus("idle"); }} className={inputCls} />
        </label>

        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.setupCountry")}</span>
          <select value={country} onChange={(e) => { setCountry(e.target.value); setStatus("idle"); }} className={inputCls}>
            <option value="">—</option>
            {countryOptions.map((c) => <option key={c} value={c}>{countryName(c)}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.setupNationality")}</span>
          <select value={nationality} onChange={(e) => { setNationality(e.target.value); setStatus("idle"); }} className={inputCls}>
            <option value="">—</option>
            {countryOptions.map((c) => <option key={c} value={c}>{countryName(c)}</option>)}
          </select>
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1 block text-[12px] font-semibold text-neutral-600">
            {t("tour.setupRanking")} <span className="font-normal text-neutral-400">· {t("tour.setupOptional")}</span>
          </span>
          <input type="text" inputMode="numeric" value={ranking} onChange={(e) => { setRanking(e.target.value); setStatus("idle"); }} placeholder="—" className={`${inputCls} sm:max-w-[12rem]`} />
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
