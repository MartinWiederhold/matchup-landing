"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useT } from "@/lib/i18n";
import { sportLabel } from "@/lib/utils/formatters";
import { haversineKm } from "@/lib/utils/haversine";
import type { Sport, FilterState } from "@/lib/types";
import { defaultFilters } from "@/lib/types";
import { useAppNav } from "../appNav";
import { SubViewHeader } from "../shared/ui";
import { FilterIcon } from "../shared/icons";
import FilterSheet from "../tabs/FilterSheet";

type Row = {
  id: string; first_name: string | null; age: number | null; city: string | null;
  skill_level: string | null; sports: string[] | null; bio: string | null;
  profile_image: string | null; additional_images: string[] | null;
  match_score: number | null; height_cm: number | null;
  gender: string | null; latitude: number | null; longitude: number | null;
};

const SKILL: Record<string, string> = {
  beginner: "Anfänger", intermediate: "Mittel", advanced: "Fortgeschritten",
  competitive: "Turnierspieler", pro: "Profi",
};

/** sport: zeigt nur Spieler dieser Sportart — gesetzt, wenn die Ansicht aus einer
 *  Sport-Karte („Tennis Circle" …) statt über „Finden" geöffnet wurde. */
export default function SelectProfileBrowse({ sport }: { sport?: Sport }) {
  const t = useT();
  const { profile } = useAppNav();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [sel, setSel] = useState<Row | null>(null);
  const [connected, setConnected] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  /* Filter — dieselbe Logik wie in der Discover-Uebersicht (FilterSheet), damit
     sich der Nutzer nicht umgewoehnen muss. Kommt die Ansicht aus einer
     Sport-Karte, ist die Sportart vorbelegt; sonst der zuletzt genutzte Filter
     aus dem localStorage. */
  const [filters, setFilters] = useState<FilterState>(() => {
    let base = defaultFilters;
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem("mu_discover_filters");
        if (raw) base = { ...defaultFilters, ...JSON.parse(raw) };
      } catch { /* ignore */ }
    }
    return sport ? { ...base, sports: [sport] } : base;
  });
  const [showFilter, setShowFilter] = useState(false);
  useEffect(() => {
    try { window.localStorage.setItem("mu_discover_filters", JSON.stringify(filters)); } catch { /* ignore */ }
  }, [filters]);

  /* Bottom-Sheet: `sel` haelt den Inhalt, `sheetIn` steuert die Animation. Beim
     Schliessen bleibt `sel` gesetzt, bis die Ausblend-Animation durch ist —
     sonst waere die Karte sofort weg und es gaebe nur ein hartes Verschwinden. */
  const [sheetIn, setSheetIn] = useState(false);
  const [drag, setDrag] = useState(0);        // Zieh-Distanz nach unten (px)
  const [dragging, setDragging] = useState(false);
  const dragFrom = useRef(0);

  useEffect(() => {
    if (!sel) return;
    const id = requestAnimationFrame(() => setSheetIn(true));
    return () => cancelAnimationFrame(id);
  }, [sel]);

  function openSheet(p: Row) {
    setSel(p); setConnected(false); setExpanded(false); setLightbox(null); setDrag(0);
  }
  function closeSheet() {
    setSheetIn(false);
    window.setTimeout(() => { setSel(null); setDrag(0); }, 260);
  }

  useEffect(() => {
    setRows(null);
    let q = supabase
      .from("profiles")
      .select("id,first_name,age,city,skill_level,sports,bio,profile_image,additional_images,match_score,height_cm,gender,latitude,longitude")
      .eq("is_paused", false).eq("is_banned", false).neq("id", profile.id)
      .not("profile_image", "is", null);
    if (filters.sports.length) q = q.overlaps("sports", filters.sports);
    if (filters.skillLevels.length) q = q.in("skill_level", filters.skillLevels);
    if (filters.gender) q = q.eq("gender", filters.gender);
    q = q.gte("age", filters.ageMin).lte("age", filters.ageMax);
    q.order("last_active", { ascending: false })
      .limit(60)
      .then(({ data }) => {
        let list = (data as Row[]) ?? [];
        // Distanz nur clientseitig (Koordinaten liegen nicht als Geo-Index vor).
        // 201 = „weltweit" → kein Limit; sonst Haversine gegen den eigenen Standort.
        const myLat = profile.latitude, myLng = profile.longitude;
        if (filters.radius < 201 && myLat != null && myLng != null) {
          list = list.filter((r) =>
            r.latitude != null && r.longitude != null &&
            haversineKm(myLat, myLng, r.latitude, r.longitude) <= filters.radius,
          );
        }
        setRows(list.slice(0, 40));
      });
  }, [profile.id, profile.latitude, profile.longitude, filters]);

  const levelLabel = (s: string | null) => (s ? SKILL[s] ?? s : "");

  // Punkt am Filter-Icon, sobald irgendein Filter vom Standard abweicht.
  const filterActive =
    filters.sports.length > 0 || filters.skillLevels.length > 0 || filters.gender !== null ||
    filters.ageMin !== defaultFilters.ageMin || filters.ageMax !== defaultFilters.ageMax ||
    filters.radius !== defaultFilters.radius;

  return (
    <div className="flex h-full flex-col bg-white text-neutral-900">
      <SubViewHeader
        light
        title={sport ? sportLabel(sport) : t("discover.findPartner")}
        rightActions={
          <button
            type="button"
            onClick={() => setShowFilter(true)}
            aria-label={t("discover.filter")}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-black/[0.04] text-neutral-700 transition-transform active:scale-95"
          >
            <FilterIcon size={18} />
            {filterActive && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-matchup ring-2 ring-white" />}
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto">
        <h1 className="px-5 pt-4 text-[40px] font-extrabold leading-[0.95] tracking-tight text-neutral-900">Select<br />Profile</h1>

        {rows === null ? (
          <p className="p-8 text-center text-sm text-neutral-400">…</p>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-neutral-400">{t("discover.noResults")}</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-7 px-5 pb-10 pt-7">
            {rows.map((p) => (
              <button key={p.id} type="button" onClick={() => openSheet(p)} className="flex flex-col items-center transition-transform duration-200 active:scale-[0.96]">
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
        // Galerie inkl. Profilbild (zuerst), dupliziert nicht.
        const gallery = [sel.profile_image, ...(sel.additional_images ?? [])].filter((g, i, arr): g is string => !!g && arr.indexOf(g) === i);
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
          <div
            className={`fixed inset-0 z-[70] mx-auto flex max-w-[430px] flex-col justify-end bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-out ${sheetIn ? "opacity-100" : "opacity-0"}`}
            onClick={closeSheet}
          >
            <div
              className="max-h-[86vh] overflow-hidden p-3.5"
              onClick={(e) => e.stopPropagation()}
              style={{
                // Waehrend des Ziehens ohne Transition, sonst haengt die Karte am Finger hinterher.
                transform: sheetIn ? `translateY(${drag}px)` : "translateY(110%)",
                transition: dragging ? "none" : "transform 380ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              <div className="max-h-[calc(86vh-28px)] overflow-y-auto rounded-[26px] bg-neutral-950 px-5 pb-4 pt-2.5 text-white shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.9)] ring-1 ring-white/10">
                {/* Ziehgriff — nur hier reagiert das Wischen, damit es nicht mit dem
                    Scrollen im Karteninhalt kollidiert. */}
                <div
                  className="-mx-5 -mt-2.5 flex cursor-grab justify-center px-5 pb-2 pt-3 active:cursor-grabbing"
                  onTouchStart={(e) => { dragFrom.current = e.touches[0].clientY; setDragging(true); }}
                  onTouchMove={(e) => setDrag(Math.max(0, e.touches[0].clientY - dragFrom.current))}
                  onTouchEnd={() => { setDragging(false); if (drag > 90) closeSheet(); else setDrag(0); }}
                >
                  <span className="h-1 w-9 rounded-full bg-white/25" />
                </div>

                <div className="flex items-start justify-between">
                  <h2 className="text-[40px] font-extrabold leading-none tracking-tight">{sel.first_name}</h2>
                  {sel.profile_image && (
                    <img
                      src={sel.profile_image}
                      alt=""
                      className={`h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-white/15 transition-all duration-500 ease-out ${sheetIn ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}
                      style={{ transitionDelay: "120ms" }}
                    />
                  )}
                </div>

                {/* Zeilen laufen versetzt ein — das gibt dem Aufklappen Richtung. */}
                <div className="mt-5 space-y-3">
                  {rowsData.map((r, i) => (
                    <div
                      key={r.label}
                      className={`flex items-center justify-between transition-all duration-[400ms] ease-out ${sheetIn ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
                      style={{ transitionDelay: `${100 + i * 40}ms` }}
                    >
                      <span className="text-[15px] text-white/45">{r.label}</span>
                      <span className="text-[15px] font-semibold text-white">{r.value}</span>
                    </div>
                  ))}
                </div>

                <div
                  className={`mt-4 flex gap-2.5 transition-all duration-[400ms] ease-out ${sheetIn ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
                  style={{ transitionDelay: `${100 + rowsData.length * 40}ms` }}
                >
                  <button
                    type="button"
                    onClick={() => setConnected(true)}
                    className={`flex-1 rounded-full py-3.5 text-[15px] font-bold transition-all duration-300 active:scale-[0.97] ${connected ? "bg-emerald-500/20 text-emerald-300" : "bg-white text-neutral-900"}`}
                  >
                    <span className="inline-flex items-center justify-center gap-1.5">
                      {connected && (
                        <svg viewBox="0 0 16 16" className="anim-pop h-3.5 w-3.5" fill="none" aria-hidden="true">
                          <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      {connected ? t("services.requested") : t("discover.connect")}
                    </span>
                  </button>
                  {(sel.bio || gallery.length > 0) && (
                    <button
                      type="button"
                      onClick={() => setExpanded((v) => !v)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/25 py-3.5 text-[15px] font-bold text-white transition-all duration-300 active:scale-[0.97]"
                    >
                      {expanded ? t("discover.less") : t("discover.more")}
                      <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-transform duration-[400ms] ease-out ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Aufklappbar: Beschreibung + Galerie (inkl. Profilbild).
                    grid-rows 0fr→1fr animiert die Hoehe weich, ohne sie zu messen —
                    vorher wurde der Block einfach hart ein-/ausgehaengt. */}
                <div className={`grid transition-all duration-500 ease-out ${expanded ? "mt-4 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0"}`}>
                  <div className="overflow-hidden">
                    <div className="border-t border-white/10 pt-4">
                      {sel.bio && <p className="text-[13.5px] leading-relaxed text-white/60">{sel.bio}</p>}
                      {gallery.length > 0 && (
                        <div className="mt-4">
                          <p className="mb-2.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/40">{t("discover.photos")}</p>
                          <div className="grid grid-cols-2 gap-2">
                            {gallery.map((g, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setLightbox(g)}
                                className={`aspect-square w-full overflow-hidden rounded-2xl transition-all duration-500 ease-out active:scale-[0.97] ${expanded ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
                                style={{ transitionDelay: expanded ? `${120 + i * 60}ms` : "0ms" }}
                              >
                                <img src={g} alt="" loading="lazy" className="h-full w-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Lightbox: Bild gross */}
      {lightbox && (
        <div className="fixed inset-0 z-[80] mx-auto flex max-w-[430px] items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" className="max-h-full max-w-full rounded-2xl object-contain" />
          <button type="button" onClick={() => setLightbox(null)} className="absolute right-4 top-[max(16px,env(safe-area-inset-top))] flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
      )}

      {showFilter && (
        <FilterSheet
          filters={filters}
          onApply={(f) => { setFilters(f); setShowFilter(false); }}
          onClose={() => setShowFilter(false)}
        />
      )}
    </div>
  );
}
