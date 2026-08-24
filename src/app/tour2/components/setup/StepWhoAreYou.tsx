"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useT, useLocale } from "@/lib/i18n";
import { TARGET_REGION } from "@/domain/tour/region";
import { saveWhoAmI, type SetupState } from "@/lib/tourSetup";
import { CARD_SOFT } from "../tourUi";

/**
 * Schritt 1 „Wer bist du". Name, Bild und Wohnort kommen aus /app (profiles) und werden als
 * ÜBERNOMMENER Identitäts-Block angezeigt — keine Eingabe (Änderung erfolgt in /app). Eingabe
 * bleibt NUR, was Matchup Tour zusätzlich braucht: Nationalität (für Visa) und Ranking.
 * Länderwahl als eigenes Dropdown (kein natives select — iOS Safari).
 */
export default function StepWhoAreYou({
  state,
  userId,
  onSaved,
  tone = "light",
}: {
  state: SetupState;
  userId: string;
  onSaved: () => void;
  tone?: "light" | "dark";
}) {
  const t = useT();
  const { locale } = useLocale();
  const dark = tone === "dark";

  const [nationality, setNationality] = useState(state.passports[0] ?? "");
  const [ranking, setRanking] = useState(state.ranking != null ? String(state.ranking) : "");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  const countryName = (code: string) => {
    const n = t(`tour.country.${code}`);
    return n.startsWith("tour.country.") ? code : n;
  };
  const countryOptions = useMemo(() => {
    const set = new Set<string>(TARGET_REGION);
    if (state.country) set.add(state.country);
    if (state.passports[0]) set.add(state.passports[0]);
    return [...set].sort((a, b) => countryName(a).localeCompare(countryName(b), locale));
  }, [state.country, state.passports, locale, t]);

  const q = query.trim().toLowerCase();
  const filtered = countryOptions.filter((c) => q === "" || countryName(c).toLowerCase().includes(q) || c.toLowerCase().includes(q));

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false); };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onEsc); };
  }, [open]);

  const displayName = state.displayName || state.firstName;
  const landName = state.countryName || (state.country ? countryName(state.country) : null);
  const homeLine = [state.city, landName].filter(Boolean).join(", ");

  const inputCls = dark
    ? "w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-[14px] text-white placeholder:text-neutral-500 focus:border-white/30 focus:outline-none"
    : "w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-black/30 focus:outline-none";
  const wrap = dark ? "border border-white/10 bg-black p-5" : `${CARD_SOFT} p-5`;
  const idWrap = dark ? "border border-white/10 bg-black p-3" : "rounded-2xl bg-white p-3 ring-1 ring-black/5";
  const nameCls = dark ? "text-white" : "text-neutral-900";
  const muted = dark ? "text-neutral-400" : "text-neutral-500";
  const lbl = dark ? "text-neutral-400" : "text-neutral-600";
  const drop = dark ? "absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-white/15 bg-[#12161e] p-1 shadow-xl" : "absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-black/10 bg-white p-1 shadow-xl";
  const dropBtn = dark ? "w-full rounded-lg px-3 py-2 text-left text-[13px] text-neutral-200 hover:bg-white/10" : "w-full rounded-lg px-3 py-2 text-left text-[13px] text-neutral-800 hover:bg-black/[0.04]";

  async function save() {
    if (busy) return;
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
    <section className={wrap}>
      <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.setupWhoTitle")}</h2>
      <p className={`mt-2 text-sm ${muted}`}>{t("tour.setupWhoIntro")}</p>

      <div className={`mt-4 flex items-center gap-3 ${idWrap}`}>
        {state.profileImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={state.profileImage} alt="" loading="lazy" decoding="async" className="h-12 w-12 shrink-0 rounded-full bg-matchup/10 object-cover" />
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-matchup/10 text-[17px] font-bold text-matchup">{(displayName?.[0] ?? "?").toUpperCase()}</span>
        )}
        <div className="min-w-0">
          <p className={`truncate text-[15px] font-bold ${nameCls}`}>{displayName || t("tour.fieldMissing")}</p>
          <p className={`truncate text-[12px] ${muted}`}>{homeLine || t("tour.setupHomeMissing")}</p>
        </div>
        <span className={`ml-auto shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${dark ? "bg-white/10 text-neutral-400" : "bg-black/[0.04] text-neutral-500"}`}>{t("tour.setupFromApp")}</span>
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-400">{t("tour.setupFromAppNote")}</p>

      <p className="mt-5 text-[12px] font-bold uppercase tracking-[0.12em] text-neutral-400">{t("tour.setupTourNeeds")}</p>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <div className="block">
          <span className={`mb-1 block text-[12px] font-semibold ${lbl}`}>{t("tour.setupNationality")}</span>
          <div className="relative" ref={boxRef}>
            <button type="button" onClick={() => setOpen((o) => !o)} className={`${inputCls} flex items-center justify-between text-left`}>
              <span>{nationality ? countryName(nationality) : "—"}</span>
              <span className={`text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
            </button>
            {open && (
              <div className={drop}>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("tour.t2search")}
                  className={`${inputCls} mb-1`}
                />
                <button type="button" className={dropBtn} onClick={() => { setNationality(""); setStatus("idle"); setOpen(false); setQuery(""); }}>—</button>
                {filtered.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={dropBtn}
                    onClick={() => { setNationality(c); setStatus("idle"); setOpen(false); setQuery(""); }}
                  >
                    {countryName(c)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <label className="block">
          <span className={`mb-1 block text-[12px] font-semibold ${lbl}`}>
            {t("tour.setupRanking")} <span className="font-normal text-neutral-400">· {t("tour.setupOptional")}</span>
          </span>
          <input type="text" inputMode="numeric" value={ranking} onChange={(e) => { setRanking(e.target.value); setStatus("idle"); }} placeholder="—" className={inputCls} />
        </label>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={save} disabled={busy} className={`rounded-full px-5 py-2 text-[13px] font-bold text-white transition-colors disabled:opacity-50 ${dark ? "bg-white text-neutral-900 hover:bg-neutral-200" : "bg-neutral-900 hover:bg-neutral-700"}`}>
          {t("tour.setupSave")}
        </button>
        {status === "saved" && <span className="text-[12px] text-emerald-500">{t("tour.setupSaved")}</span>}
        {status === "error" && <span className={`text-[12px] ${muted}`}>{t("tour.setupSaveError")}</span>}
      </div>
    </section>
  );
}
