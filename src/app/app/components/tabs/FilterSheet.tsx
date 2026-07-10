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
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-neutral-400">
                <span>{t("discover.ageFrom")}</span>
                <span className="text-sm font-bold text-matchup">{draft.ageMin}</span>
              </div>
              <input
                type="range"
                min={AGE_MIN}
                max={AGE_MAX}
                value={draft.ageMin}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setDraft((d) => ({ ...d, ageMin: v, ageMax: Math.max(d.ageMax, v) }));
                }}
                className="w-full accent-matchup"
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-neutral-400">
                <span>{t("discover.ageTo")}</span>
                <span className="text-sm font-bold text-matchup">{draft.ageMax}</span>
              </div>
              <input
                type="range"
                min={AGE_MIN}
                max={AGE_MAX}
                value={draft.ageMax}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setDraft((d) => ({ ...d, ageMax: v, ageMin: Math.min(d.ageMin, v) }));
                }}
                className="w-full accent-matchup"
              />
            </div>
          </div>
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
