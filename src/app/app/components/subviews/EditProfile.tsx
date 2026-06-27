"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { skillLabel, sportLabel } from "@/lib/utils/formatters";
import type { Sport, SkillLevel } from "@/lib/types";
import { useAppNav } from "../appNav";
import { SubViewHeader } from "../shared/ui";

const SPORTS: Sport[] = ["tennis", "padel", "pickleball"];
const SKILLS: SkillLevel[] = ["beginner", "intermediate", "advanced", "competitive"];
const GOALS = ["fun", "competitive", "training", "social", "fitness", "regular"];

export default function EditProfile() {
  const { profile } = useAppNav();
  const { refreshProfile } = useAuth();
  const [bio, setBio] = useState(profile.bio ?? "");
  const [sports, setSports] = useState<Sport[]>(profile.sports);
  const [skill, setSkill] = useState<SkillLevel>(profile.skill_level);
  const [rating, setRating] = useState(profile.official_rating ?? "");
  const [height, setHeight] = useState<number | null>(profile.height_cm);
  const [goals, setGoals] = useState<string[]>(profile.goals ?? []);
  const [radius, setRadius] = useState(profile.search_radius_km);
  const [visGender, setVisGender] = useState<string[]>(profile.visibility_gender);
  const [saving, setSaving] = useState(false);
  const { closeSubView } = useAppNav();

  function toggle<T>(arr: T[], v: T): T[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

  async function save() {
    setSaving(true);
    await supabase
      .from("profiles")
      .update({
        bio: bio || null,
        sports,
        skill_level: skill,
        official_rating: rating || null,
        height_cm: height,
        goals,
        search_radius_km: radius,
        visibility_gender: visGender,
      })
      .eq("id", profile.id);
    await refreshProfile();
    setSaving(false);
    closeSubView();
  }

  return (
    <div className="flex h-full flex-col">
      <SubViewHeader title="Profil bearbeiten" />
      <div className="flex-1 space-y-6 overflow-y-auto p-5">
        <Field label="Über mich">
          <textarea
            rows={3}
            maxLength={300}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-sm outline-none"
          />
        </Field>

        <Field label="Sportarten">
          <Chips
            options={SPORTS.map((s) => ({ value: s, label: sportLabel(s) }))}
            selected={sports}
            onToggle={(v) => setSports(toggle(sports, v as Sport))}
          />
        </Field>

        <Field label="Skill-Level">
          <Chips
            options={SKILLS.map((s) => ({ value: s, label: skillLabel(s) }))}
            selected={[skill]}
            onToggle={(v) => setSkill(v as SkillLevel)}
          />
        </Field>

        <Field label="Offizielles Rating">
          <input
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            placeholder="z.B. R5, LK 12, UTR 8"
            className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-sm outline-none"
          />
        </Field>

        <Field label={`Grösse: ${height ?? 178} cm`}>
          <input
            type="range"
            min={140}
            max={220}
            value={height ?? 178}
            onChange={(e) => setHeight(Number(e.target.value))}
            className="w-full accent-matchup"
          />
        </Field>

        <Field label="Ziele">
          <Chips
            options={GOALS.map((g) => ({ value: g, label: g }))}
            selected={goals}
            onToggle={(v) => setGoals(toggle(goals, v))}
          />
        </Field>

        <Field label={`Suchradius: ${radius} km`}>
          <input
            type="range"
            min={5}
            max={200}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full accent-matchup"
          />
        </Field>

        <Field label="Sichtbar für">
          <Chips
            options={[
              { value: "male", label: "Männer" },
              { value: "female", label: "Frauen" },
            ]}
            selected={visGender}
            onToggle={(v) => setVisGender(toggle(visGender, v))}
          />
        </Field>
      </div>

      <div className="shrink-0 border-t border-zinc-800 p-5">
        <button
          type="button"
          onClick={save}
          disabled={saving || sports.length === 0}
          className="w-full rounded-full bg-matchup py-3.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {saving ? "Speichern…" : "Speichern"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-zinc-300">{label}</p>
      {children}
    </div>
  );
}

function Chips({
  options,
  selected,
  onToggle,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onToggle(o.value)}
          className={`rounded-full px-4 py-2 text-sm capitalize ${
            selected.includes(o.value)
              ? "bg-matchup/20 text-white ring-2 ring-matchup"
              : "bg-zinc-800 text-zinc-300 ring-1 ring-zinc-700"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
