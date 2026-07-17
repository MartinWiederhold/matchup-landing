"use client";

import { useEffect, useRef, useState } from "react";
import type { FilterState, Sport, SkillLevel, Club } from "@/lib/types";
import { defaultFilters } from "@/lib/types";
import { searchClubs as searchClubsApi } from "@/lib/clubs";
import { skillLabel, sportLabel } from "@/lib/utils/formatters";
import { useT } from "@/lib/i18n";

const SPORTS: Sport[] = ["tennis", "padel", "pickleball"];
const SKILLS: SkillLevel[] = ["beginner", "intermediate", "advanced", "competitive"];
const AGE_MIN = 18;
const AGE_MAX = 99;

/**
 * Filter als dunkles Bottom-Sheet — dieselbe Handschrift wie die Profil-
 * Detailkarte: faehrt weich von unten ein, Ziehgriff zum Schliessen, Sektionen
 * laufen versetzt auf. Wird von Select-Profile und der Discover-Uebersicht genutzt.
 */
export default function FilterSheet({
  filters,
  onApply,
  onClose,
}: {
  filters: FilterState;
  onApply: (f: FilterState) => void;
  onClose: () => void;
}) {
  const t = useT();
  const [draft, setDraft] = useState<FilterState>(filters);
  const [clubQuery, setClubQuery] = useState(filters.clubName ?? "");
  const [clubResults, setClubResults] = useState<Club[]>([]);

  // Ein-/Ausfahr-Animation (Parent unmountet erst nach dem Callback).
  const [shown, setShown] = useState(false);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragFrom = useRef(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);
  function dismiss(cb: () => void) {
    setShown(false);
    window.setTimeout(cb, 260);
  }

  function toggle<T>(arr: T[], v: T): T[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }
  async function searchClubs(q: string) {
    setClubQuery(q);
    setClubResults(await searchClubsApi(q, null, 8));
  }

  const sections: React.ReactNode[] = [
    <Section key="sport" label={t("discover.sport")}>
      <div className="flex flex-wrap gap-2">
        {SPORTS.map((s) => (
          <Chip key={s} active={draft.sports.includes(s)} onClick={() => setDraft({ ...draft, sports: toggle(draft.sports, s) })}>
            {sportLabel(s)}
          </Chip>
        ))}
      </div>
    </Section>,
    <Section key="gender" label={t("discover.gender")}>
      <div className="flex gap-2">
        {[
          { v: null, label: t("discover.genderAll") },
          { v: "male" as const, label: t("discover.genderMale") },
          { v: "female" as const, label: t("discover.genderFemale") },
        ].map((o) => (
          <Chip key={o.label} active={draft.gender === o.v} onClick={() => setDraft({ ...draft, gender: o.v })}>
            {o.label}
          </Chip>
        ))}
      </div>
    </Section>,
    <Section key="age" label={t("discover.age", { min: draft.ageMin, max: draft.ageMax })}>
      <AgeRange min={AGE_MIN} max={AGE_MAX} lo={draft.ageMin} hi={draft.ageMax}
        onChange={(lo, hi) => setDraft((d) => ({ ...d, ageMin: lo, ageMax: hi }))} />
    </Section>,
    <Section key="radius" label={t("discover.radiusLabel", { value: draft.radius > 200 ? t("discover.worldwide") : t("discover.radiusChip", { km: draft.radius }) })}>
      <input type="range" min={5} max={201} value={draft.radius}
        onChange={(e) => setDraft({ ...draft, radius: Number(e.target.value) })}
        className="h-6 w-full cursor-pointer appearance-none rounded-full bg-transparent accent-white
          [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-white/15
          [&::-webkit-slider-thumb]:mt-[-7px] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow" />
    </Section>,
    <Section key="skill" label={t("discover.skillLevel")}>
      <div className="flex flex-wrap gap-2">
        {SKILLS.map((s) => (
          <Chip key={s} active={draft.skillLevels.includes(s)} onClick={() => setDraft({ ...draft, skillLevels: toggle(draft.skillLevels, s) })}>
            {skillLabel(s)}
          </Chip>
        ))}
      </div>
    </Section>,
    <Section key="club" label={t("discover.club")}>
      <input value={clubQuery} onChange={(e) => searchClubs(e.target.value)}
        placeholder={t("discover.clubSearchPlaceholder")}
        className="w-full rounded-xl bg-white/[0.06] px-4 py-3 text-sm text-white outline-none ring-1 ring-white/10 placeholder:text-white/35 focus:ring-matchup" />
      {clubResults.map((c) => (
        <button key={c.id} type="button"
          onClick={() => { setDraft({ ...draft, clubId: c.id, clubName: c.name }); setClubQuery(c.name); setClubResults([]); }}
          className="mt-1.5 block w-full rounded-xl bg-white/[0.06] px-3.5 py-2.5 text-left ring-1 ring-white/10 transition-colors active:bg-white/[0.1]">
          <span className="block text-sm font-semibold text-white">{c.name}</span>
          {(c.address || c.city) && <span className="mt-0.5 block text-xs text-white/40">{c.address || c.city}</span>}
        </button>
      ))}
      {draft.clubId && (
        <button type="button" onClick={() => { setDraft({ ...draft, clubId: null, clubName: null }); setClubQuery(""); }}
          className="mt-2 text-xs text-white/50 underline">
          {t("discover.removeClubFilter")}
        </button>
      )}
    </Section>,
  ];

  return (
    <div
      className={`fixed inset-0 z-[70] mx-auto flex max-w-[430px] flex-col justify-end bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-out ${shown ? "opacity-100" : "opacity-0"}`}
      onClick={() => dismiss(onClose)}
    >
      <div
        className="max-h-[88vh] overflow-hidden p-3.5"
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: shown ? `translateY(${drag}px)` : "translateY(110%)",
          transition: dragging ? "none" : "transform 380ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div className="flex max-h-[calc(88vh-28px)] flex-col overflow-hidden rounded-[26px] bg-neutral-950 text-white shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.9)] ring-1 ring-white/10">
          {/* Ziehgriff + Kopf */}
          <div
            className="shrink-0 px-5 pt-3"
            onTouchStart={(e) => { dragFrom.current = e.touches[0].clientY; setDragging(true); }}
            onTouchMove={(e) => setDrag(Math.max(0, e.touches[0].clientY - dragFrom.current))}
            onTouchEnd={() => { setDragging(false); if (drag > 90) dismiss(onClose); else setDrag(0); }}
          >
            <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-white/25" />
            <div className="flex items-center justify-between">
              <h2 className="text-[22px] font-extrabold tracking-tight">{t("discover.filterTitle")}</h2>
              <button type="button" onClick={() => setDraft(defaultFilters)} className="text-[13px] font-semibold text-white/50 transition-colors hover:text-white">
                {t("discover.reset")}
              </button>
            </div>
          </div>

          {/* Sektionen — laufen versetzt auf */}
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
            {sections.map((node, i) => (
              <div key={i} className={`transition-all duration-[400ms] ease-out ${shown ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`} style={{ transitionDelay: `${80 + i * 45}ms` }}>
                {node}
              </div>
            ))}
          </div>

          {/* Anwenden */}
          <div className="shrink-0 border-t border-white/10 px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <button type="button" onClick={() => dismiss(() => onApply(draft))}
              className="w-full rounded-full bg-matchup py-3.5 text-[15px] font-bold text-white transition-transform active:scale-[0.98]">
              {t("discover.apply")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Alterspanne mit zwei Griffen — weisse Thumbs, Matchup-Füllung auf dunkler Spur. */
function AgeRange({ min, max, lo, hi, onChange }: { min: number; max: number; lo: number; hi: number; onChange: (lo: number, hi: number) => void }) {
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  const thumb =
    "pointer-events-none absolute inset-x-0 top-0 h-6 w-full appearance-none bg-transparent " +
    "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-neutral-950 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow " +
    "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-neutral-950 [&::-moz-range-thumb]:bg-white";
  return (
    <div className="pt-1">
      <div className="relative h-6">
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-white/15" />
        <div className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-matchup" style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
        <input type="range" min={min} max={max} value={lo}
          onChange={(e) => onChange(Math.min(Number(e.target.value), hi), hi)} className={`${thumb} z-30`} />
        <input type="range" min={min} max={max} value={hi}
          onChange={(e) => onChange(lo, Math.max(Number(e.target.value), lo))} className={`${thumb} z-20`} />
      </div>
      <div className="mt-1 flex justify-between text-xs font-bold text-white/70">
        <span>{lo}</span>
        <span>{hi}</span>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">{label}</p>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition-all active:scale-95 ${
        active ? "bg-white text-neutral-900" : "bg-white/[0.08] text-white/70 ring-1 ring-white/10"
      }`}
    >
      {children}
    </button>
  );
}
