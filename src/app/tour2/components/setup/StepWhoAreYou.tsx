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
    ? "w-full rounded-xl border border-[var(--t2-on-accent)]/15 bg-[var(--t2-on-accent)]/[0.04] px-3 py-2 t2-fs-body text-[var(--t2-on-accent)] placeholder:text-[var(--t2-text-soft)] focus:border-[var(--t2-on-accent)]/30 focus:outline-none"
    : "t2-input";
  const wrap = dark ? "border border-[var(--t2-on-accent)]/10 bg-[var(--t2-text)] p-5" : "t2-panel";
  const idWrap = dark ? "border border-[var(--t2-on-accent)]/10 bg-[var(--t2-text)] p-3" : "rounded-xl border border-[var(--t2-line)] bg-[var(--t2-surface)] p-3";
  const nameCls = dark ? "text-[var(--t2-on-accent)]" : "text-[var(--t2-ink)]";
  const muted = dark ? "text-[var(--t2-text-soft)]" : "text-[var(--t2-muted)]";
  const lbl = dark ? "text-[var(--t2-text-soft)]" : "text-[var(--t2-muted)]";
  const drop = dark ? "absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-[var(--t2-line)] bg-[var(--t2-paper)] p-1 shadow-xl" : "absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-[var(--t2-line)] bg-[var(--t2-on-accent)] p-1 shadow-xl";
  const dropBtn = dark ? "w-full rounded-lg px-3 py-2 text-left t2-fs-body-sm text-[var(--t2-text-faint)] hover:bg-[var(--t2-on-accent)]/10" : "w-full rounded-lg px-3 py-2 text-left t2-fs-body-sm text-[var(--t2-text-muted)] hover:bg-[var(--t2-surface)]";

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
      <h2 className="t2-section-title">{t("tour.setupWhoTitle")}</h2>
      <p className={`mt-2 t2-fs-body ${muted}`}>{t("tour.setupWhoIntro")}</p>

      <div className={`mt-4 flex items-center gap-3 ${idWrap}`}>
        {state.profileImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={state.profileImage} alt="" loading="lazy" decoding="async" className="h-12 w-12 shrink-0 rounded-full bg-[var(--t2-accent)]/10 object-cover" />
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--t2-accent)]/10 t2-fs-h3 font-bold text-[var(--t2-accent)]">{(displayName?.[0] ?? "?").toUpperCase()}</span>
        )}
        <div className="min-w-0">
          <p className={`truncate t2-fs-body font-bold ${nameCls}`}>{displayName || t("tour.fieldMissing")}</p>
          <p className={`truncate t2-fs-micro ${muted}`}>
            {[homeLine || t("tour.setupHomeMissing"), state.age != null ? t("tour.t2profAge", { n: state.age }) : null].filter(Boolean).join(" · ")}
          </p>
        </div>
        <span className={`ml-auto shrink-0 rounded-full px-2.5 py-1 t2-fs-meta font-semibold ${dark ? "bg-[var(--t2-on-accent)]/10 text-[var(--t2-text-soft)]" : "bg-[var(--t2-surface)] text-[var(--t2-muted)]"}`}>{t("tour.setupFromApp")}</span>
      </div>
      <p className="mt-1.5 t2-fs-meta leading-relaxed text-[var(--t2-faint)]">{t("tour.setupFromAppNote")}</p>

      <p className="mt-5 t2-section-title">{t("tour.t2profTennis")}</p>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <div className="block">
          <span className={`mb-1 block t2-fs-micro font-semibold ${lbl}`}>{t("tour.wsPassports")}</span>
          {passports.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {passports.map((iso) => (
                <button key={iso} type="button" onClick={() => { setPassports(passports.filter((p) => p !== iso)); setStatus("idle"); }} className="flex items-center gap-1 rounded-full bg-[var(--t2-accent)]/10 px-2.5 py-1 t2-fs-micro font-semibold text-[var(--t2-accent)]">
                  {countryName(iso)} <span className="text-[var(--t2-accent)]/60">✕</span>
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
          <span className={`mb-1 block t2-fs-micro font-semibold ${lbl}`}>
            {t("tour.setupRanking")} <span className="font-normal text-[var(--t2-faint)]">· {t("tour.setupOptional")}</span>
          </span>
          <input type="text" inputMode="numeric" value={ranking} onChange={(e) => { setRanking(e.target.value); setStatus("idle"); }} placeholder="—" className={inputCls} />
        </label>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={save} disabled={busy} className={dark ? "rounded-full px-5 py-2 t2-fs-body-sm font-bold text-[var(--t2-text)] transition-colors disabled:opacity-50 bg-[var(--t2-on-accent)] hover:bg-[var(--t2-surface-muted)]" : "t2-cta"}>
          {t("tour.setupSave")}
        </button>
        {status === "saved" && <span className="t2-fs-micro text-[var(--t2-success)]">{t("tour.setupSaved")}</span>}
        {status === "error" && <span className={`t2-fs-micro ${muted}`}>{t("tour.setupSaveError")}</span>}
      </div>
    </section>
  );
}
