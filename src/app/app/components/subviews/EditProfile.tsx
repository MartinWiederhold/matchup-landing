"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { compressImage } from "@/lib/utils/imageCompress";
import { skillLabel, sportLabel } from "@/lib/utils/formatters";
import type { Sport, SkillLevel } from "@/lib/types";
import { useAppNav } from "../appNav";
import { SubViewHeader } from "../shared/ui";

const MAX_PHOTOS = 4;

const SPORTS: Sport[] = ["tennis", "padel", "pickleball"];
const SKILLS: SkillLevel[] = ["beginner", "intermediate", "advanced", "competitive"];
const GOALS = ["fun", "competitive", "training", "social", "fitness", "regular"];

export default function EditProfile() {
  const { profile } = useAppNav();
  const { refreshProfile } = useAuth();
  const [photos, setPhotos] = useState<string[]>(
    [profile.profile_image, ...(profile.additional_images ?? [])].filter(
      (u): u is string => !!u,
    ),
  );
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const pickIdx = useRef<number | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
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

  // index === photos.length  → neues Bild hinzufügen; sonst ersetzen
  function openPicker(index: number) {
    pickIdx.current = index;
    fileInput.current?.click();
  }

  async function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // erlaubt erneutes Wählen derselben Datei
    const idx = pickIdx.current;
    if (!file || idx === null) return;
    setUploadingIdx(idx);
    try {
      const compressed = await compressImage(file);
      const path = `${profile.id}/avatar_${Date.now()}_${idx}.jpg`;
      const { error } = await supabase.storage
        .from("web-avatars")
        .upload(path, compressed, { contentType: "image/jpeg" });
      if (error) throw error;
      const {
        data: { publicUrl },
      } = supabase.storage.from("web-avatars").getPublicUrl(path);
      setPhotos((prev) => {
        const next = [...prev];
        if (idx >= next.length) next.push(publicUrl);
        else next[idx] = publicUrl;
        return next;
      });
    } catch {
      // still – Upload fehlgeschlagen, Slot bleibt unverändert
    } finally {
      setUploadingIdx(null);
    }
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function makeMain(index: number) {
    setPhotos((prev) => {
      const next = [...prev];
      const [pick] = next.splice(index, 1);
      next.unshift(pick);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    await supabase
      .from("profiles")
      .update({
        profile_image: photos[0] ?? null,
        additional_images: photos.slice(1),
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
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        onChange={onFilePicked}
        className="hidden"
      />
      <div className="flex-1 space-y-6 overflow-y-auto p-5">
        <Field label="Fotos">
          <div className="grid grid-cols-3 gap-3">
            {photos.map((url, i) => (
              <div
                key={url + i}
                className="relative aspect-square overflow-hidden rounded-xl bg-zinc-800"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                {uploadingIdx === i && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs text-white">
                    Lädt…
                  </div>
                )}
                {i === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-matchup px-2 py-0.5 text-[10px] font-bold text-white">
                    Hauptbild
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 flex divide-x divide-white/15 bg-black/55 text-[11px] font-semibold text-white backdrop-blur-sm">
                  <button
                    type="button"
                    onClick={() => openPicker(i)}
                    className="flex-1 py-1.5"
                  >
                    Ändern
                  </button>
                  {i !== 0 && (
                    <button type="button" onClick={() => makeMain(i)} className="flex-1 py-1.5">
                      Haupt
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="flex-1 py-1.5 text-red-300"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => openPicker(photos.length)}
                disabled={uploadingIdx !== null}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-zinc-600 text-zinc-400 disabled:opacity-50"
              >
                {uploadingIdx === photos.length ? (
                  <span className="text-xs">Lädt…</span>
                ) : (
                  <>
                    <span className="text-2xl leading-none">+</span>
                    <span className="text-[11px]">Bild</span>
                  </>
                )}
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Bis zu {MAX_PHOTOS} Fotos. Das Hauptbild erscheint zuerst.
          </p>
        </Field>

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
          disabled={saving || sports.length === 0 || uploadingIdx !== null}
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
