"use client";

import { useState } from "react";
import type { FilterState, Sport, SkillLevel, Club } from "@/lib/types";
import { defaultFilters } from "@/lib/types";
import { searchClubs as searchClubsApi } from "@/lib/clubs";
import { skillLabel } from "@/lib/utils/formatters";
import { useT } from "@/lib/i18n";

const SPORTS: Sport[] = ["tennis", "padel", "pickleball"];
const SKILLS: SkillLevel[] = ["beginner", "intermediate", "advanced", "competitive"];
const AGE_MIN = 18;
const AGE_MAX = 99;

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

  function toggle<T>(arr: T[], v: T): T[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

  async function searchClubs(q: string) {
    setClubQuery(q);
    setClubResults(await searchClubsApi(q, null, 8));
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{t("discover.filterTitle")}</h2>
          <button type="button" onClick={onClose} aria-label={t("common.close")}>
            ✕
          </button>
        </div>

        <Section label={t("discover.sport")}>
          <div className="flex flex-wrap gap-2">
            {SPORTS.map((s) => (
              <FilterChip
                key={s}
                active={draft.sports.includes(s)}
                onClick={() => setDraft({ ...draft, sports: toggle(draft.sports, s) })}
              >
                {s}
              </FilterChip>
            ))}
          </div>
        </Section>

        <Section label={t("discover.gender")}>
          <div className="flex gap-2">
            {[
              { v: null, label: t("discover.genderAll") },
              { v: "male" as const, label: t("discover.genderMale") },
              { v: "female" as const, label: t("discover.genderFemale") },
            ].map((o) => (
              <FilterChip
                key={o.label}
                active={draft.gender === o.v}
                onClick={() => setDraft({ ...draft, gender: o.v })}
              >
                {o.label}
              </FilterChip>
            ))}
          </div>
        </Section>

        <Section label={t("discover.age", { min: draft.ageMin, max: draft.ageMax })}>
          <AgeRange
            min={AGE_MIN}
            max={AGE_MAX}
            lo={draft.ageMin}
            hi={draft.ageMax}
            onChange={(lo, hi) => setDraft((d) => ({ ...d, ageMin: lo, ageMax: hi }))}
          />
        </Section>

        <Section
          label={t("discover.radiusLabel", {
            value:
              draft.radius > 200
                ? t("discover.worldwide")
                : t("discover.radiusChip", { km: draft.radius }),
          })}
        >
          <input
            type="range"
            min={5}
            max={201}
            value={draft.radius}
            onChange={(e) => setDraft({ ...draft, radius: Number(e.target.value) })}
            className="w-full accent-matchup"
          />
        </Section>

        <Section label={t("discover.skillLevel")}>
          <div className="flex flex-wrap gap-2">
            {SKILLS.map((s) => (
              <FilterChip
                key={s}
                active={draft.skillLevels.includes(s)}
                onClick={() =>
                  setDraft({ ...draft, skillLevels: toggle(draft.skillLevels, s) })
                }
              >
                {skillLabel(s)}
              </FilterChip>
            ))}
          </div>
        </Section>

        <Section label={t("discover.club")}>
          <input
            value={clubQuery}
            onChange={(e) => searchClubs(e.target.value)}
            placeholder={t("discover.clubSearchPlaceholder")}
            className="w-full rounded-xl bg-neutral-100 px-4 py-2.5 text-sm text-neutral-800 outline-none placeholder:text-neutral-400"
          />
          {clubResults.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setDraft({ ...draft, clubId: c.id, clubName: c.name });
                setClubQuery(c.name);
                setClubResults([]);
              }}
              className="mt-1 block w-full rounded-lg bg-neutral-100 px-3 py-2 text-left text-sm"
            >
              <span className="block">{c.name}</span>
              {(c.address || c.city) && (
                <span className="mt-0.5 block text-xs text-neutral-500">
                  {c.address || c.city}
                </span>
              )}
            </button>
          ))}
          {draft.clubId && (
            <button
              type="button"
              onClick={() => {
                setDraft({ ...draft, clubId: null, clubName: null });
                setClubQuery("");
              }}
              className="mt-2 text-xs text-neutral-500 underline"
            >
              {t("discover.removeClubFilter")}
            </button>
          )}
        </Section>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => setDraft(defaultFilters)}
            className="flex-1 rounded-full border border-neutral-300 py-3 text-sm font-semibold"
          >
            {t("discover.reset")}
          </button>
          <button
            type="button"
            onClick={() => onApply(draft)}
            className="flex-1 rounded-full bg-matchup py-3 text-sm font-bold text-white"
          >
            {t("discover.apply")}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Ein Slider mit zwei Griffen (Von/Bis) — gefüllter Balken in Matchup-Lila. */
function AgeRange({ min, max, lo, hi, onChange }: { min: number; max: number; lo: number; hi: number; onChange: (lo: number, hi: number) => void }) {
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  const thumb =
    "pointer-events-none absolute inset-x-0 top-0 h-6 w-full appearance-none bg-transparent " +
    "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-matchup [&::-webkit-slider-thumb]:shadow " +
    "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-matchup";
  return (
    <div className="pt-1">
      <div className="relative h-6">
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-black/10" />
        <div className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-matchup" style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
        <input
          type="range" min={min} max={max} value={lo}
          onChange={(e) => onChange(Math.min(Number(e.target.value), hi), hi)}
          className={`${thumb} z-30`}
        />
        <input
          type="range" min={min} max={max} value={hi}
          onChange={(e) => onChange(lo, Math.max(Number(e.target.value), lo))}
          className={`${thumb} z-20`}
        />
      </div>
      <div className="mt-1 flex justify-between text-xs font-bold text-matchup">
        <span>{lo}</span>
        <span>{hi}</span>
      </div>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <p className="mb-2 text-sm font-semibold text-neutral-600">{label}</p>
      {children}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm capitalize ${
        active
          ? "bg-matchup/10 text-matchup ring-2 ring-matchup"
          : "bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200"
      }`}
    >
      {children}
    </button>
  );
}
