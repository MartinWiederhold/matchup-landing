"use client";

import { useEffect, useMemo, useState } from "react";
import { useT, useLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { TOUR_CIRCUITS, AGE_CATEGORIES } from "@/lib/tourCalendars";
import { useAppNav } from "../appNav";
import { SubViewHeader } from "../shared/ui";

export default function TournamentFinder() {
  const t = useT();
  const { locale } = useLocale();
  const lang = locale === "de" ? "de" : "en";
  const { profile } = useAppNav();
  const [circuits, setCircuits] = useState<string[]>([]);
  const [age, setAge] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("tour_profiles").select("circuits, age_category").eq("user_id", profile.id).maybeSingle();
      const d = data as { circuits: string[] | null; age_category: string | null } | null;
      setCircuits(d?.circuits ?? []);
      setAge(d?.age_category ?? null);
      setLoaded(true);
    })();
  }, [profile.id]);

  async function persist(next: { circuits?: string[]; age?: string | null }) {
    const c = next.circuits ?? circuits;
    const a = next.age !== undefined ? next.age : age;
    setSaved(false);
    await supabase.from("tour_profiles").upsert(
      { user_id: profile.id, circuits: c, age_category: a, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
    setSaved(true);
  }
  function toggleCircuit(id: string) {
    const next = circuits.includes(id) ? circuits.filter((x) => x !== id) : [...circuits, id];
    setCircuits(next); void persist({ circuits: next });
  }
  function pickAge(a: string) {
    const next = age === a ? null : a;
    setAge(next); void persist({ age: next });
  }

  // Anzeige: gewählte Circuits zuerst; ohne Auswahl alle.
  const shown = useMemo(() => {
    const sel = TOUR_CIRCUITS.filter((c) => circuits.includes(c.id));
    return sel.length ? sel : TOUR_CIRCUITS;
  }, [circuits]);

  const chip = (active: boolean) => `shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold ${active ? "bg-matchup text-white" : "bg-black/[0.05] text-neutral-600"}`;

  return (
    <div className="flex h-full flex-col bg-white text-neutral-900">
      <SubViewHeader light title={t("tourCal.title")} />
      <div className="flex-1 overflow-y-auto p-4 pb-28">
        <p className="rounded-2xl bg-matchup/[0.06] p-3 text-[12.5px] leading-snug text-neutral-600">{t("tourCal.intro")}</p>

        {/* Circuit-Auswahl */}
        <p className="mb-2 mt-5 px-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">{t("tourCal.yourCircuits")}</p>
        <div className="flex flex-wrap gap-2">
          {TOUR_CIRCUITS.map((c) => (
            <button key={c.id} type="button" onClick={() => toggleCircuit(c.id)} className={chip(circuits.includes(c.id))}>{c.label[lang]}</button>
          ))}
        </div>

        {/* Alterskategorie */}
        <p className="mb-2 mt-5 px-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">{t("tourCal.ageCategory")}</p>
        <div className="flex flex-wrap gap-2">
          {AGE_CATEGORIES.map((a) => (
            <button key={a} type="button" onClick={() => pickAge(a)} className={chip(age === a)}>{a === "Open" ? t("tourCal.ageOpen") : a}</button>
          ))}
        </div>
        {loaded && saved && <p className="mt-2 px-1 text-[11px] text-emerald-600">{t("tourCal.saved")}</p>}

        {/* Kalender je Circuit */}
        <p className="mb-2 mt-6 px-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">{t("tourCal.calendars")}</p>
        <div className="space-y-3">
          {shown.map((c) => {
            const band = c.ageBands?.find((b) => b.id === age);
            return (
              <div key={c.id} className="rounded-2xl border border-black/[0.08] p-3.5">
                <p className="text-[14px] font-bold">{c.label[lang]}</p>
                <p className="mt-0.5 text-[12px] leading-snug text-neutral-500">{c.who[lang]}</p>
                {band && (
                  <a href={band.url} target="_blank" rel="noopener noreferrer" className="mt-2.5 flex items-center justify-between rounded-xl bg-matchup px-3.5 py-2.5 text-[13px] font-bold text-white">
                    <span>{t("tourCal.openFor", { cat: band.label })}</span>
                    <span aria-hidden>↗</span>
                  </a>
                )}
                <div className="mt-2 space-y-1.5">
                  {c.links.map((l) => (
                    <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-xl bg-black/[0.04] px-3.5 py-2.5 text-[13px] font-semibold text-neutral-800">
                      <span className="min-w-0">
                        <span className="block truncate">{l.label}</span>
                        {l.note && <span className="block truncate text-[11px] font-normal text-neutral-400">{l.note[lang]}</span>}
                      </span>
                      <span className="shrink-0 text-neutral-400" aria-hidden>↗</span>
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-4 px-1 text-[11px] leading-snug text-neutral-400">{t("tourCal.disclaimer")}</p>
      </div>
    </div>
  );
}
