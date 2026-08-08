"use client";

import { useMemo, useState } from "react";
import { useT, useLocale } from "@/lib/i18n";
import { TARGET_REGION } from "@/domain/tour/region";
import { saveWhoAmI } from "@/lib/tourSetup";
import { savePlannerAge, type PlannerProfile } from "@/lib/tourPlanner";

const inputCls =
  "w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-black/30 focus:outline-none";

/**
 * Schritt 1 „Profil": Wohnort (Startpunkt), Alter, Ranking, Nationalität.
 * Speichert spaltengenau — nur Geändertes — über die bestehenden tourSetup-Helfer
 * (profiles: city/country, tour_profiles: ranking/passports) und savePlannerAge
 * (profiles.age). Ein rohes Geburtsdatum wird bewusst nicht gespeichert.
 */
export default function Step1Profile({
  profile,
  userId,
  onSaved,
}: {
  profile: PlannerProfile;
  userId: string;
  onSaved: () => void;
}) {
  const t = useT();
  const { locale } = useLocale();

  const [city, setCity] = useState(profile.city ?? "");
  const [country, setCountry] = useState(profile.country ?? "");
  const [nationality, setNationality] = useState(profile.passports[0] ?? "");
  const [ranking, setRanking] = useState(profile.ranking != null ? String(profile.ranking) : "");
  const [age, setAge] = useState(profile.age != null ? String(profile.age) : "");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  const countryName = (code: string) => {
    const n = t(`tour.country.${code}`);
    return n.startsWith("tour.country.") ? code : n;
  };
  // Zielregion + bereits gespeicherte Werte (damit ein Vorbefüllwert nie verschwindet).
  const countryOptions = useMemo(() => {
    const set = new Set<string>(TARGET_REGION);
    if (profile.country) set.add(profile.country);
    if (profile.passports[0]) set.add(profile.passports[0]);
    return [...set].sort((a, b) => countryName(a).localeCompare(countryName(b), locale));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.country, profile.passports, locale]);

  async function save() {
    if (busy) return;
    setBusy(true);
    setStatus("idle");
    try {
      // Nur geänderte Felder in den Patch (sonst nichts schreiben).
      const patch: Parameters<typeof saveWhoAmI>[1] = {};
      if (city.trim() !== (profile.city ?? "")) patch.city = city.trim() || null;
      if (country !== (profile.country ?? "")) patch.country = country || null;
      const rk = ranking.trim() === "" ? null : Number(ranking);
      const rankVal = rk != null && Number.isFinite(rk) && rk > 0 ? Math.round(rk) : null;
      if (rankVal !== profile.ranking) patch.ranking = rankVal;
      if (nationality !== (profile.passports[0] ?? "")) patch.passports = nationality ? [nationality] : [];
      if (Object.keys(patch).length > 0) await saveWhoAmI(userId, patch);

      const ageNum = age.trim() === "" ? null : Number(age);
      const ageVal = ageNum != null && Number.isFinite(ageNum) && ageNum >= 18 ? Math.round(ageNum) : null;
      if (ageVal !== profile.age) await savePlannerAge(userId, ageVal);

      setStatus("saved");
      onSaved();
    } catch {
      setStatus("error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.plCity")}</span>
          <input value={city} onChange={(e) => { setCity(e.target.value); setStatus("idle"); }} placeholder="—" className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.plCountry")}</span>
          <select value={country} onChange={(e) => { setCountry(e.target.value); setStatus("idle"); }} className={inputCls}>
            <option value="">—</option>
            {countryOptions.map((c) => <option key={c} value={c}>{countryName(c)}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.plNationality")}</span>
          <select value={nationality} onChange={(e) => { setNationality(e.target.value); setStatus("idle"); }} className={inputCls}>
            <option value="">—</option>
            {countryOptions.map((c) => <option key={c} value={c}>{countryName(c)}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.plRanking")}</span>
          <input type="text" inputMode="numeric" value={ranking} onChange={(e) => { setRanking(e.target.value); setStatus("idle"); }} placeholder="—" className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.plAge")}</span>
          <input type="text" inputMode="numeric" value={age} onChange={(e) => { setAge(e.target.value); setStatus("idle"); }} placeholder="—" className={inputCls} />
          <span className="mt-1 block text-[11px] text-neutral-400">{t("tour.plAgeHint")}</span>
        </label>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button type="button" onClick={save} disabled={busy} className="rounded-full bg-neutral-900 px-5 py-2 text-[13px] font-bold text-white transition-colors hover:bg-neutral-700 disabled:opacity-50">
          {t("tour.setupSave")}
        </button>
        {status === "saved" && <span className="text-[12px] text-emerald-600">{t("tour.setupSaved")}</span>}
        {status === "error" && <span className="text-[12px] text-neutral-500">{t("tour.setupSaveError")}</span>}
      </div>
    </div>
  );
}
