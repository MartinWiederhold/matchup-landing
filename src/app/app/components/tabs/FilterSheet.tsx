"use client";

import { useState } from "react";
import type { FilterState, Sport, SkillLevel, Club } from "@/lib/types";
import { defaultFilters } from "@/lib/types";
import { searchClubs as searchClubsApi } from "@/lib/clubs";
import { skillLabel } from "@/lib/utils/formatters";
import WheelPicker from "../shared/WheelPicker";

const SPORTS: Sport[] = ["tennis", "padel", "pickleball"];
const SKILLS: SkillLevel[] = ["beginner", "intermediate", "advanced", "competitive"];
const AGES = Array.from({ length: 99 - 18 + 1 }, (_, i) => 18 + i);

export default function FilterSheet({
  filters,
  onApply,
  onClose,
}: {
  filters: FilterState;
  onApply: (f: FilterState) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<FilterState>(filters);
  const [clubQuery, setClubQuery] = useState("");
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
      <div className="relative max-h-[85vh] overflow-y-auto rounded-t-3xl bg-zinc-900 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Filter</h2>
          <button type="button" onClick={onClose} aria-label="Schliessen">
            ✕
          </button>
        </div>

        <Section label="Sportart">
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

        <Section label="Geschlecht">
          <div className="flex gap-2">
            {[
              { v: null, label: "Alle" },
              { v: "male" as const, label: "Männlich" },
              { v: "female" as const, label: "Weiblich" },
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

        <Section label={`Alter: ${draft.ageMin}–${draft.ageMax}`}>
          <div className="flex items-stretch gap-3">
            <div className="flex-1">
              <p className="mb-1 text-center text-xs text-zinc-500">Von</p>
              <WheelPicker
                values={AGES}
                value={draft.ageMin}
                onChange={(v) =>
                  setDraft((d) => ({
                    ...d,
                    ageMin: v,
                    ageMax: Math.max(d.ageMax, v),
                  }))
                }
              />
            </div>
            <div className="flex-1">
              <p className="mb-1 text-center text-xs text-zinc-500">Bis</p>
              <WheelPicker
                values={AGES}
                value={draft.ageMax}
                onChange={(v) =>
                  setDraft((d) => ({
                    ...d,
                    ageMax: v,
                    ageMin: Math.min(d.ageMin, v),
                  }))
                }
              />
            </div>
          </div>
        </Section>

        <Section
          label={`Umkreis: ${draft.radius > 200 ? "Weltweit" : `${draft.radius} km`}`}
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

        <Section label="Skill-Level">
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

        <Section label="Club">
          <input
            value={clubQuery}
            onChange={(e) => searchClubs(e.target.value)}
            placeholder="Club suchen…"
            className="w-full rounded-xl bg-zinc-800 px-4 py-2.5 text-sm outline-none"
          />
          {clubResults.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setDraft({ ...draft, clubId: c.id });
                setClubQuery(c.name);
                setClubResults([]);
              }}
              className="mt-1 block w-full rounded-lg bg-zinc-800 px-3 py-2 text-left text-sm"
            >
              <span className="block">{c.name}</span>
              {(c.address || c.city) && (
                <span className="mt-0.5 block text-xs text-zinc-400">
                  {c.address || c.city}
                </span>
              )}
            </button>
          ))}
          {draft.clubId && (
            <button
              type="button"
              onClick={() => {
                setDraft({ ...draft, clubId: null });
                setClubQuery("");
              }}
              className="mt-2 text-xs text-zinc-400 underline"
            >
              Club-Filter entfernen
            </button>
          )}
        </Section>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => setDraft(defaultFilters)}
            className="flex-1 rounded-full border border-zinc-700 py-3 text-sm font-semibold"
          >
            Zurücksetzen
          </button>
          <button
            type="button"
            onClick={() => onApply(draft)}
            className="flex-1 rounded-full bg-matchup py-3 text-sm font-bold text-white"
          >
            Filter anwenden
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
      <p className="mb-2 text-sm font-semibold text-zinc-300">{label}</p>
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
          ? "bg-matchup/20 text-white ring-2 ring-matchup"
          : "bg-zinc-800 text-zinc-300 ring-1 ring-zinc-700"
      }`}
    >
      {children}
    </button>
  );
}
