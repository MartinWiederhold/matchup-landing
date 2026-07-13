"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useT } from "@/lib/i18n";
import { sportLabel } from "@/lib/utils/formatters";
import { useAppNav } from "../appNav";
import { SubViewHeader } from "../shared/ui";

type Row = {
  id: string; first_name: string | null; age: number | null; city: string | null;
  skill_level: string | null; sports: string[] | null; bio: string | null;
  profile_image: string | null; additional_images: string[] | null;
  match_score: number | null; height_cm: number | null;
};

const SKILL: Record<string, string> = {
  beginner: "Anfänger", intermediate: "Mittel", advanced: "Fortgeschritten",
  competitive: "Turnierspieler", pro: "Profi",
};

export default function SelectProfileBrowse() {
  const t = useT();
  const { profile } = useAppNav();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [sel, setSel] = useState<Row | null>(null);
  const [connected, setConnected] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id,first_name,age,city,skill_level,sports,bio,profile_image,additional_images,match_score,height_cm")
      .eq("is_paused", false).eq("is_banned", false).neq("id", profile.id)
      .not("profile_image", "is", null)
      .order("last_active", { ascending: false })
      .limit(40)
      .then(({ data }) => setRows((data as Row[]) ?? []));
  }, [profile.id]);

  const levelLabel = (s: string | null) => (s ? SKILL[s] ?? s : "");

  return (
    <div className="flex h-full flex-col bg-white text-neutral-900">
      <SubViewHeader light title={t("discover.findPartner")} />
      <div className="flex-1 overflow-y-auto">
        <h1 className="px-5 pt-4 text-[40px] font-extrabold leading-[0.95] tracking-tight text-neutral-900">Select<br />Profile</h1>

        {rows === null ? (
          <p className="p-8 text-center text-sm text-neutral-400">…</p>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-neutral-400">{t("discover.noResults")}</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-7 px-5 pb-10 pt-7">
            {rows.map((p) => (
              <button key={p.id} type="button" onClick={() => { setSel(p); setConnected(false); setExpanded(false); }} className="flex flex-col items-center">
                <img src={p.profile_image ?? ""} alt="" loading="lazy" className="aspect-square w-full rounded-full object-cover" />
                <span className="mt-3 text-[15px] font-semibold text-neutral-900">@{(p.first_name ?? "spieler").toLowerCase()}</span>
                <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400">
                  {(p.sports?.[0] ? sportLabel(p.sports[0]) : "")}{p.skill_level ? ` · ${levelLabel(p.skill_level)}` : ""}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Schwarze Detailkarte (Popup) */}
      {sel && (() => {
        const gallery = (sel.additional_images ?? []).filter((g) => g && g !== sel.profile_image);
        const rowsData = [
          { label: "Username", value: `@${(sel.first_name ?? "spieler").toLowerCase()}` },
          ...(sel.age != null ? [{ label: "Alter", value: `${sel.age}` }] : []),
          ...(sel.height_cm != null ? [{ label: "Grösse", value: `${sel.height_cm} cm` }] : []),
          ...(sel.skill_level ? [{ label: "Level", value: levelLabel(sel.skill_level) }] : []),
          ...(sel.sports?.length ? [{ label: "Sportarten", value: sel.sports.map(sportLabel).join(", ") }] : []),
          ...(sel.city ? [{ label: "Stadt", value: sel.city }] : []),
          ...(sel.match_score != null ? [{ label: "Matchscore", value: `${sel.match_score}` }] : []),
        ];
        return (
          <div className="fixed inset-0 z-[70] mx-auto flex max-w-[430px] flex-col justify-end bg-black/50 backdrop-blur-sm" onClick={() => setSel(null)}>
            <div className="max-h-[86vh] overflow-hidden p-3.5" onClick={(e) => e.stopPropagation()}>
              <div className="max-h-[calc(86vh-28px)] overflow-y-auto rounded-[26px] bg-neutral-950 p-5 pb-4 text-white shadow-2xl ring-1 ring-white/10">
                <div className="flex items-start justify-between">
                  <h2 className="text-[40px] font-extrabold leading-none tracking-tight">{sel.first_name}</h2>
                  {sel.profile_image && <img src={sel.profile_image} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-white/15" />}
                </div>

                <div className="mt-5 space-y-3">
                  {rowsData.map((r) => (
                    <div key={r.label} className="flex items-center justify-between">
                      <span className="text-[15px] text-white/45">{r.label}</span>
                      <span className="text-[15px] font-semibold text-white">{r.value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex gap-2.5">
                  <button type="button" onClick={() => setConnected(true)} className={`flex-1 rounded-full py-3.5 text-[15px] font-bold ${connected ? "bg-emerald-500/20 text-emerald-300" : "bg-white text-neutral-900"}`}>
                    {connected ? t("services.requested") : t("discover.connect")}
                  </button>
                  {(sel.bio || gallery.length > 0) && (
                    <button type="button" onClick={() => setExpanded((v) => !v)} className="flex-1 rounded-full border border-white/25 py-3.5 text-[15px] font-bold text-white">
                      {expanded ? t("discover.less") : t("discover.more")}
                    </button>
                  )}
                </div>
                <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">Matchup</p>

                {/* Aufklappbar: Beschreibung + Galerie */}
                {expanded && (
                  <div className="mt-4 border-t border-white/10 pt-4">
                    {sel.bio && <p className="text-[13.5px] leading-relaxed text-white/60">{sel.bio}</p>}
                    {gallery.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/40">{t("discover.photos")}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {gallery.map((g, i) => (
                            <img key={i} src={g} alt="" loading="lazy" className="aspect-square w-full rounded-2xl object-cover" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
