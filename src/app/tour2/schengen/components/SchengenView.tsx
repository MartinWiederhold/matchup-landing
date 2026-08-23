"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT, useLocale } from "@/lib/i18n";
import { schengenUsage } from "@/domain/tour/schengen";
import { confirmStay, generateSuggestions, loadStays, removeStay, updateStay, type StayPatch } from "@/lib/tourStays";
import type { TourStay } from "@/lib/types";
import StayForm from "./StayForm";
import StayRow from "./StayRow";

type LoadState = "loading" | "error" | "done";

// Kalendertag in UTC formatieren.
function fmtDate(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "de" ? "de-CH" : "en-GB", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  }).format(new Date(iso + "T00:00:00Z"));
}

// Überlappen zwei Datumsspannen? Offenes Ende (null) → weit in die Zukunft.
function rangesOverlap(aStart: string, aEnd: string | null, bStart: string, bEnd: string | null): boolean {
  const OPEN = "9999-12-31";
  return aStart <= (bEnd ?? OPEN) && bStart <= (aEnd ?? OPEN);
}

export default function SchengenView() {
  const { user, loading: authLoading } = useAuth();
  const t = useT();
  const { locale } = useLocale();

  const [stays, setStays] = useState<TourStay[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [genMsg, setGenMsg] = useState("");
  const [warn, setWarn] = useState("");
  const [actionError, setActionError] = useState(false);
  const [generating, setGenerating] = useState(false);

  const reload = useCallback(async (userId: string) => {
    setStays(await loadStays(userId));
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancel = false;
    setState("loading");
    loadStays(user.id)
      .then((s) => { if (!cancel) { setStays(s); setState("done"); } })
      .catch(() => { if (!cancel) setState("error"); });
    return () => { cancel = true; };
  }, [authLoading, user]);

  const confirmed = stays.filter((s) => s.confirmed);
  const suggestions = stays.filter((s) => !s.confirmed);

  // Auslastung NUR aus bestätigten Aufenthalten. Stichtag entsteht HIER (Client)
  // und wird als Parameter in die reine Domain-Funktion gereicht.
  const asOf = new Date().toISOString().slice(0, 10);
  const usage = schengenUsage(confirmed.map((s) => ({ country: s.country, entry: s.entry_date, exit: s.exit_date })), asOf);

  const handleGenerate = useCallback(async () => {
    if (!user || generating) return;
    setGenerating(true);
    setGenMsg("");
    try {
      const n = await generateSuggestions(user.id);
      setGenMsg(n > 0 ? t("tour.schengenGenerated", { n }) : t("tour.schengenGeneratedNone"));
      await reload(user.id);
    } catch {
      setGenMsg(t("tour.schengenGenerateError"));
    } finally {
      setGenerating(false);
    }
  }, [user, generating, reload, t]);

  const handleConfirm = useCallback(async (stay: TourStay) => {
    if (!user) return;
    setActionError(false); setWarn("");
    // Überlappung mit bestehenden BESTÄTIGTEN Aufenthalten: Hinweis, aber kein Block.
    const overlap = confirmed.some((c) => rangesOverlap(stay.entry_date, stay.exit_date, c.entry_date, c.exit_date));
    try {
      await confirmStay(stay.id);
      if (overlap) setWarn(t("tour.schengenOverlapWarn"));
      await reload(user.id);
    } catch { setActionError(true); }
  }, [user, confirmed, reload, t]);

  const handleSave = useCallback(async (id: string, patch: StayPatch) => {
    if (!user) return;
    setActionError(false);
    try { await updateStay(id, patch); await reload(user.id); } catch { setActionError(true); }
  }, [user, reload]);

  const handleRemove = useCallback(async (id: string) => {
    if (!user) return;
    setActionError(false);
    try { await removeStay(id); await reload(user.id); } catch { setActionError(true); }
  }, [user, reload]);

  // ── Auth-Gate (wie SeasonView) ───────────────────────────────────────────
  if (authLoading) return <p className="mt-10 text-sm text-neutral-500">{t("tour.loading")}</p>;
  if (!user) {
    return (
      <div className="mt-10 rounded-2xl bg-black/[0.02] ring-1 ring-black/5 px-6 py-10 text-center">
        <h2 className="text-lg font-bold text-neutral-900">{t("tour.loginRequiredTitle")}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">{t("tour.loginRequiredText")}</p>
        <Link href="/app" className="mt-6 inline-flex rounded-full bg-matchup px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-matchup-hover">{t("tour.loginCta")}</Link>
      </div>
    );
  }
  if (state === "loading") return <p className="mt-8 text-sm text-neutral-500">{t("tour.loading")}</p>;
  if (state === "error") return <p className="mt-8 text-sm text-neutral-500">{t("tour.loadError")}</p>;

  return (
    <div className="mt-8 space-y-6">
      {/* Auslastung — nur bestätigt, sachlich ohne Alarmfarben */}
      <section className="rounded-2xl bg-black/[0.02] ring-1 ring-black/5 p-5">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.schengenUsageTitle")}</h2>
        {confirmed.length === 0 ? (
          <p className="mt-2 text-[13px] text-neutral-500">{t("tour.schengenNoConfirmed")}</p>
        ) : (
          <>
            <div className="mt-2 flex flex-wrap items-end gap-x-8 gap-y-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{t("tour.schengenUsed")}</p>
                <p className="text-[26px] font-extrabold tracking-tight text-neutral-900">{usage.used} <span className="text-[13px] font-semibold text-neutral-400">/ 90 {t("tour.schengenDaysUnit")}</span></p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{t("tour.schengenLeft")}</p>
                <p className="text-[26px] font-extrabold tracking-tight text-neutral-900">{usage.left} <span className="text-[13px] font-semibold text-neutral-400">{t("tour.schengenDaysUnit")}</span></p>
              </div>
              {usage.peakWindowEnd && (
                <p className="text-[12px] text-neutral-500">{t("tour.schengenPeak")} {fmtDate(usage.peakWindowEnd, locale)}</p>
              )}
            </div>
            {usage.exceeds && (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[12px] leading-relaxed text-amber-800">
                {t("tour.schengenExceedNote")}
                {usage.exceedOn ? ` ${t("tour.schengenExceedOn")} ${fmtDate(usage.exceedOn, locale)}.` : ""}
              </p>
            )}
          </>
        )}
      </section>

      {stays.length === 0 && (
        <p className="rounded-2xl bg-black/[0.035] px-5 py-8 text-center text-sm text-neutral-500">{t("tour.schengenEmpty")}</p>
      )}

      {/* Bestätigte Aufenthalte */}
      {confirmed.length > 0 && (
        <section>
          <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.schengenConfirmedTitle")}</h2>
          {actionError && <p className="mt-1 text-[12px] text-neutral-500">{t("tour.schengenSaveError")}</p>}
          <div className="mt-2 divide-y divide-black/[0.06]">
            {confirmed.map((s) => (
              <StayRow key={s.id} stay={s} isSuggestion={false} onSave={(p) => handleSave(s.id, p)} onRemove={() => handleRemove(s.id)} />
            ))}
          </div>
        </section>
      )}

      {/* Vorschläge — getrennt, zählen noch nicht */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.schengenSuggestionsTitle")}</h2>
          <button type="button" onClick={handleGenerate} disabled={generating} className="rounded-full border border-black/15 px-3.5 py-1.5 text-[12px] font-semibold text-neutral-700 transition-colors hover:border-black/30 disabled:opacity-50">
            {generating ? t("tour.schengenGenerating") : t("tour.schengenGenerate")}
          </button>
        </div>
        {genMsg && <p className="mt-1 text-[12px] text-neutral-500">{genMsg}</p>}
        {warn && <p className="mt-1 text-[12px] text-amber-700">{warn}</p>}
        {suggestions.length > 0 ? (
          <>
            <p className="mt-2 text-[12px] text-neutral-500">{t("tour.schengenSuggestionsNote")}</p>
            <div className="mt-1 divide-y divide-black/[0.06]">
              {suggestions.map((s) => (
                <StayRow key={s.id} stay={s} isSuggestion onConfirm={() => handleConfirm(s)} onSave={(p) => handleSave(s.id, p)} onRemove={() => handleRemove(s.id)} />
              ))}
            </div>
          </>
        ) : (
          <p className="mt-2 text-[12px] text-neutral-400">{t("tour.schengenGeneratedNone")}</p>
        )}
      </section>

      {/* Manuell anlegen */}
      <StayForm userId={user.id} onAdded={() => reload(user.id)} />
    </div>
  );
}
