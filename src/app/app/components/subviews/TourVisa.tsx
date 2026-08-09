"use client";

import { useEffect, useState } from "react";
import { useT, useLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { loadTourPlan, loadTourProfile, loadTravelDocs, saveTravelDoc, removeTravelDoc, type TravelDoc } from "@/lib/tour";
import { visaCases, hasSchengenPassport, regimeFacts, type VisaCase, type VisaRegime } from "@/lib/visa";
import { loadEffectiveVisa, type NatVisaInfo } from "@/lib/tourVisaRequirements";
import { isoFromCountry } from "@/lib/flags";
import { useAppNav } from "../appNav";
import { SubViewHeader } from "../shared/ui";

const DOC_KINDS: VisaRegime[] = ["esta", "uk_eta", "canada_eta", "au_408", "schengen", "japan"];
type Draft = { id?: string; kind: string; country: string; expiry: string; ref: string };
const emptyDraft = (kind = "esta"): Draft => ({ kind, country: "", expiry: "", ref: "" });

const MS_DAY = 86_400_000;
function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const t0 = Date.parse(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
  return Math.round((Date.parse(iso + "T00:00:00Z") - t0) / MS_DAY);
}

const inp = "w-full rounded-xl bg-black/[0.04] px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-matchup";

export default function TourVisa() {
  const t = useT();
  const { locale } = useLocale();
  const { profile } = useAppNav();
  const [cases, setCases] = useState<VisaCase[] | null>(null);
  const [natVisa, setNatVisa] = useState<Map<string, NatVisaInfo>>(new Map());
  const [hasPassport, setHasPassport] = useState(true);
  const [docs, setDocs] = useState<TravelDoc[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setDocs(await loadTravelDocs(profile.id));
    const ids = await loadTourPlan(profile.id);
    const tp = await loadTourProfile(profile.id);
    const passports = tp?.passports ?? [];
    setHasPassport(passports.length > 0);
    // Nationalitätsabhängiger Bestand (neben visa.ts): günstigste Klasse über alle Pässe.
    setNatVisa(await loadEffectiveVisa(passports));
    const schengenPass = hasSchengenPassport(passports);
    if (!ids.length) { setCases([]); return; }
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase.from("tournaments").select("country,end_date").in("id", ids);
    const countries = ((data as { country: string | null; end_date: string }[]) ?? [])
      .filter((r) => r.end_date >= today)
      .map((r) => r.country);
    setCases(visaCases(countries, schengenPass));
  }
  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    if (!draft) return;
    setSaving(true);
    await saveTravelDoc(profile.id, {
      id: draft.id,
      kind: draft.kind,
      country: draft.country.trim() || null,
      status: "valid",
      expiry: draft.expiry || null,
      ref: draft.ref.trim() || null,
    });
    setSaving(false);
    setDraft(null);
    void load();
  }
  async function del(id: string) {
    await removeTravelDoc(id);
    void load();
  }

  const regLabel = (r: string) => t(`mode.visa_reg_${r}`);
  const fmtDate = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="flex h-full flex-col bg-white text-neutral-900">
      <SubViewHeader
        light
        title={t("mode.visaTitle")}
        rightActions={<button type="button" onClick={() => setDraft(emptyDraft())} className="text-[13px] font-bold text-matchup">+ {t("mode.visaAddDoc")}</button>}
      />

      <div className="flex-1 overflow-y-auto p-4 pb-28">
        {/* Deine Reise-Autorisierungen */}
        <p className="mb-2 px-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-neutral-400">{t("mode.visaMyDocs")}</p>
        {docs.length === 0 ? (
          <p className="mb-5 rounded-2xl bg-black/[0.035] p-4 text-center text-[13px] text-neutral-400">{t("mode.visaNoDocs")}</p>
        ) : (
          <div className="mb-5 space-y-2">
            {docs.map((d) => {
              const dl = daysUntil(d.expiry);
              const urgent = dl != null && dl <= 30;
              const expired = dl != null && dl < 0;
              return (
                <div key={d.id} className="flex items-center gap-3 rounded-2xl bg-black/[0.035] p-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold text-neutral-900">{regLabel(d.kind)}{d.country ? ` · ${d.country}` : ""}</p>
                    <p className="text-[11.5px] text-neutral-500">
                      {d.expiry ? (expired ? t("mode.visaExpired") : t("mode.visaExpiresOn", { date: fmtDate(d.expiry) })) : t("mode.visaNoExpiry")}
                      {d.ref ? ` · ${d.ref}` : ""}
                    </p>
                  </div>
                  {dl != null && !expired && (
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${urgent ? "bg-amber-500/10 text-amber-600" : "bg-black/[0.05] text-neutral-500"}`}>{t("mode.inDays", { n: dl })}</span>
                  )}
                  {expired && <span className="shrink-0 rounded-full bg-red-500/10 px-2.5 py-1 text-[11px] font-bold text-red-600">{t("mode.visaExpiredShort")}</span>}
                  <button type="button" onClick={() => setDraft({ id: d.id, kind: d.kind, country: d.country ?? "", expiry: d.expiry ?? "", ref: d.ref ?? "" })} aria-label="edit" className="shrink-0 text-neutral-300">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Länder in deinem Plan */}
        <p className="mb-2 px-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-neutral-400">{t("mode.visaPlanCountries")}</p>
        {!hasPassport && (
          <p className="mb-2.5 rounded-2xl bg-amber-50 p-3.5 text-[12px] leading-relaxed text-amber-800 ring-1 ring-amber-200">{t("mode.visaNatNoPassport")}</p>
        )}
        {cases === null ? null : cases.length === 0 ? (
          <p className="rounded-2xl bg-black/[0.035] p-4 text-center text-[13px] text-neutral-400">{t("mode.visaNoCountries")}</p>
        ) : (
          <div className="space-y-2.5">
            {cases.map((c, i) => {
              const f = regimeFacts(c.regime);
              const iso = isoFromCountry(c.country);
              const nat = iso ? natVisa.get(iso) : undefined;
              const refused = nat?.requirementClass === "admission_refused";
              // Datenstand + Quelle + Konsulats-Hinweis stehen an JEDER Aussage (auch visumfrei / keine Angabe).
              const provenance = (
                <div className="mt-2 border-t border-black/[0.06] pt-2 text-[10.5px] leading-relaxed text-neutral-400">
                  {nat ? (
                    <p>
                      {t("mode.visaNatSource", { date: nat.sourceRevisedAt ? fmtDate(nat.sourceRevisedAt.slice(0, 10)) : "—" })}
                      {" · "}
                      <a href={nat.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-neutral-500 underline">{t("mode.visaNatSourceLink")}</a>
                    </p>
                  ) : (
                    <p>{t("mode.visaNatNoData")}</p>
                  )}
                  <p className="mt-0.5 font-semibold text-neutral-500">{t("mode.visaNatConsulate")}</p>
                </div>
              );

              if (refused) {
                return (
                  <div key={i} className="rounded-2xl border border-red-200 bg-red-50 p-3.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-[14px] font-bold text-red-700">{c.country}</p>
                      <span className="shrink-0 rounded-full bg-red-500/10 px-2.5 py-0.5 text-[11px] font-bold text-red-600">{t("mode.visaNatClass_admission_refused")}</span>
                    </div>
                    <p className="mt-1.5 text-[13px] font-bold text-red-700">{t("mode.visaNatRefusedTitle")}</p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-red-800">{t("mode.visaNatRefusedBody", { nat: nat!.nationality, country: c.country })}</p>
                    {provenance}
                  </div>
                );
              }

              return (
                <div key={i} className="rounded-2xl border border-black/[0.07] p-3.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[14px] font-bold text-neutral-900">{c.country}</p>
                    <span className="shrink-0 rounded-full bg-matchup/10 px-2.5 py-0.5 text-[11px] font-bold text-matchup">{nat ? t(`mode.visaNatClass_${nat.requirementClass}`) : regLabel(c.regime)}</span>
                  </div>
                  {nat && (
                    <p className="mt-1.5 text-[12px] font-semibold text-neutral-700">
                      {t("mode.visaNatForPassport", { nat: nat.nationality })}: {t(`mode.visaNatClass_${nat.requirementClass}`)}
                      {nat.allowedStayDays != null ? ` · ${t("mode.visaNatStay", { n: nat.allowedStayDays })}` : ""}
                    </p>
                  )}
                  <p className="mt-1.5 text-[12px] leading-relaxed text-neutral-600">{t(`mode.visa_docs_${c.regime}`)}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-500">
                    {f.maxStayDays != null && <span>{t("mode.visaMaxStay", { n: f.maxStayDays })}</span>}
                    {f.cost !== "—" && <span>{t("mode.visaCost")}: {f.cost}</span>}
                    {f.officialUrl && (
                      <a href={f.officialUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-matchup">{t("mode.visaOfficialLink")} →</a>
                    )}
                  </div>
                  {provenance}
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-4 px-1 text-[10px] leading-relaxed text-neutral-400">{t("mode.visaDisclaimerLegal")}</p>
      </div>

      {draft && (
        <div className="fixed inset-0 z-[70] mx-auto flex max-w-[430px] items-end bg-black/40 backdrop-blur-sm" onClick={() => setDraft(null)}>
          <div className="w-full rounded-t-[28px] bg-white p-5 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-base font-bold text-neutral-900">{draft.id ? t("mode.visaEditDoc") : t("mode.visaAddDoc")}</span>
              <button type="button" onClick={() => setDraft(null)} className="text-sm font-medium text-neutral-500">{t("common.cancel")}</button>
            </div>
            <div className="space-y-2.5">
              <div className="flex flex-wrap gap-1.5">
                {DOC_KINDS.map((k) => (
                  <button key={k} type="button" onClick={() => setDraft({ ...draft, kind: k })} className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${draft.kind === k ? "bg-matchup text-white" : "bg-black/[0.05] text-neutral-600"}`}>
                    {regLabel(k)}
                  </button>
                ))}
              </div>
              <input value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} placeholder={t("mode.visaCountryPlaceholder")} className={inp} />
              <div>
                <p className="mb-1.5 px-1 text-[12px] text-neutral-500">{t("mode.visaExpiryLabel")}</p>
                <input type="date" value={draft.expiry} onChange={(e) => setDraft({ ...draft, expiry: e.target.value })} className={inp} />
              </div>
              <input value={draft.ref} onChange={(e) => setDraft({ ...draft, ref: e.target.value })} placeholder={t("mode.visaRefPlaceholder")} className={inp} />
              <div className="flex gap-2 pt-1">
                {draft.id && (
                  <button type="button" onClick={() => { void del(draft.id!); setDraft(null); }} className="shrink-0 rounded-full bg-black/[0.05] px-4 py-3.5 text-sm font-bold text-red-500">{t("mode.remove")}</button>
                )}
                <button type="button" onClick={save} disabled={saving} className="flex-1 rounded-full bg-matchup py-3.5 text-sm font-bold text-white disabled:opacity-50">
                  {saving ? t("mode.saving") : t("common.save")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
