"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useT, useLocale } from "@/lib/i18n";
import { saveWhoAmI, type SetupState } from "@/lib/tourSetup";
import { COUNTRY_CODES } from "@/lib/i18n/messages/tour";

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

  const [passports, setPassports] = useState<string[]>(state.passports);
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
    const set = new Set<string>(COUNTRY_CODES);
    if (state.country) set.add(state.country);
    for (const p of passports) set.add(p);
    return [...set].sort((a, b) => countryName(a).localeCompare(countryName(b), locale));
  }, [state.country, passports, locale, t]);

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
    : "t2-input";
  const wrap = dark ? "border border-white/10 bg-black p-5" : "t2-panel";
  const idWrap = dark ? "border border-white/10 bg-black p-3" : "rounded-2xl border border-[var(--t2-line)] bg-[var(--t2-surface)] p-3";
  const nameCls = dark ? "text-white" : "text-[var(--t2-ink)]";
  const muted = dark ? "text-neutral-400" : "text-[var(--t2-muted)]";
  const lbl = dark ? "text-neutral-400" : "text-[var(--t2-muted)]";
  const drop = dark ? "absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-[var(--t2-line)] bg-[var(--t2-paper)] p-1 shadow-xl" : "absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-[var(--t2-line)] bg-white p-1 shadow-xl";
  const dropBtn = dark ? "w-full rounded-lg px-3 py-2 text-left text-[13px] text-neutral-200 hover:bg-white/10" : "w-full rounded-lg px-3 py-2 text-left text-[13px] text-neutral-800 hover:bg-[var(--t2-surface)]";

  async function save() {
    if (busy) return;
    const patch: Parameters<typeof saveWhoAmI>[1] = {};
    const nat = passports;
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
      <h2 className="t2-kicker">{t("tour.setupWhoTitle")}</h2>
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
          <p className={`truncate text-[12px] ${muted}`}>
            {[homeLine || t("tour.setupHomeMissing"), state.age != null ? t("tour.t2profAge", { n: state.age }) : null].filter(Boolean).join(" · ")}
          </p>
        </div>
        <span className={`ml-auto shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${dark ? "bg-white/10 text-neutral-400" : "bg-[var(--t2-surface)] text-[var(--t2-muted)]"}`}>{t("tour.setupFromApp")}</span>
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--t2-faint)]">{t("tour.setupFromAppNote")}</p>

      <p className="mt-5 t2-kicker">{t("tour.t2profTennis")}</p>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <div className="block">
          <span className={`mb-1 block text-[12px] font-semibold ${lbl}`}>{t("tour.wsPassports")}</span>
          {passports.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {passports.map((iso) => (
                <button key={iso} type="button" onClick={() => { setPassports(passports.filter((p) => p !== iso)); setStatus("idle"); }} className="flex items-center gap-1 rounded-full bg-matchup/10 px-2.5 py-1 text-[12px] font-semibold text-matchup">
                  {countryName(iso)} <span className="text-matchup/60">✕</span>
                </button>
              ))}
            </div>
          )}
          <div className="relative" ref={boxRef}>
            <button type="button" onClick={() => setOpen((o) => !o)} className={`${inputCls} flex items-center justify-between text-left`}>
              <span>{t("tour.setupNationality")}</span>
              <span className={`text-[var(--t2-faint)] transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
            </button>
            {open && (
              <div className={drop}>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("tour.t2search")}
                  className={`${inputCls} mb-1`}
                />
                {filtered.filter((c) => !passports.includes(c)).map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={dropBtn}
                    onClick={() => { setPassports([...passports, c]); setStatus("idle"); setOpen(false); setQuery(""); }}
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
            {t("tour.setupRanking")} <span className="font-normal text-[var(--t2-faint)]">· {t("tour.setupOptional")}</span>
          </span>
          <input type="text" inputMode="numeric" value={ranking} onChange={(e) => { setRanking(e.target.value); setStatus("idle"); }} placeholder="—" className={inputCls} />
        </label>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={save} disabled={busy} className={dark ? "rounded-full px-5 py-2 text-[13px] font-bold text-neutral-900 transition-colors disabled:opacity-50 bg-white hover:bg-neutral-200" : "t2-cta"}>
          {t("tour.setupSave")}
        </button>
        {status === "saved" && <span className="text-[12px] text-emerald-500">{t("tour.setupSaved")}</span>}
        {status === "error" && <span className={`text-[12px] ${muted}`}>{t("tour.setupSaveError")}</span>}
      </div>
    </section>
  );
}
