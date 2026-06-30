"use client";

import { useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { compressImage } from "@/lib/utils/imageCompress";
import { skillLabel, sportLabel } from "@/lib/utils/formatters";
import type { Sport, SkillLevel } from "@/lib/types";
import { useAppNav } from "../appNav";
import { SubViewHeader } from "../shared/ui";
import ClubPicker from "../shared/ClubPicker";

const MAX_PHOTOS = 4;

const SPORTS: Sport[] = ["tennis", "padel", "pickleball"];
const SKILLS: SkillLevel[] = ["beginner", "intermediate", "advanced", "competitive"];
const GOALS = ["fun", "competitive", "training", "social", "fitness", "regular"];

export default function EditProfile() {
  const t = useT();
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
  const [clubId, setClubId] = useState<string | null>(profile.club_id);
  const [clubName, setClubName] = useState<string | null>(
    profile.club_name_manual,
  );
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
        club_id: clubId,
        club_name_manual: clubId ? null : clubName,
      })
      .eq("id", profile.id);
    await refreshProfile();
    setSaving(false);
    closeSubView();
  }

  return (
    <div className="flex h-full flex-col">
      <SubViewHeader title={t("profile.editTitle")} />
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        onChange={onFilePicked}
        className="hidden"
      />
      <div className="flex-1 space-y-6 overflow-y-auto p-5">
        <Field label={t("profile.photos")}>
          <div className="grid grid-cols-3 gap-3">
            {photos.map((url, i) => (
              <div
                key={url + i}
                className="relative aspect-square overflow-hidden rounded-xl bg-zinc-800"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={t("profile.photoAlt", { index: i + 1 })} className="h-full w-full object-cover" />
                {uploadingIdx === i && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs text-white">
                    {t("profile.photosUploading")}
                  </div>
                )}
                {i === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-matchup px-2 py-0.5 text-[10px] font-bold text-white">
                    {t("profile.mainPhoto")}
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 flex divide-x divide-white/15 bg-black/55 text-[11px] font-semibold text-white backdrop-blur-sm">
                  <button
                    type="button"
                    onClick={() => openPicker(i)}
                    className="flex-1 py-1.5"
                  >
                    {t("profile.changePhoto")}
                  </button>
                  {i !== 0 && (
                    <button type="button" onClick={() => makeMain(i)} className="flex-1 py-1.5">
                      {t("profile.makeMain")}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="flex-1 py-1.5 text-zinc-300"
                  >
                    {t("profile.deletePhoto")}
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
                  <span className="text-xs">{t("profile.photosUploading")}</span>
                ) : (
                  <>
                    <span className="text-2xl leading-none">+</span>
                    <span className="text-[11px]">{t("profile.addPhoto")}</span>
                  </>
                )}
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            {t("profile.photosHint", { max: MAX_PHOTOS })}
          </p>
        </Field>

        <Field label={t("profile.aboutMe")}>
          <textarea
            rows={3}
            maxLength={300}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-sm outline-none"
          />
        </Field>

        <Field label={t("profile.sports")}>
          <Chips
            options={SPORTS.map((s) => ({ value: s, label: sportLabel(s) }))}
            selected={sports}
            onToggle={(v) => setSports(toggle(sports, v as Sport))}
          />
        </Field>

        <Field label={t("profile.skillLevel")}>
          <Chips
            options={SKILLS.map((s) => ({ value: s, label: skillLabel(s) }))}
            selected={[skill]}
            onToggle={(v) => setSkill(v as SkillLevel)}
          />
        </Field>

        <Field label={t("profile.club")}>
          <ClubPicker
            clubId={clubId}
            clubName={clubName}
            country={profile.country}
            lat={profile.latitude}
            lng={profile.longitude}
            onChange={(id, name) => {
              setClubId(id);
              setClubName(name);
            }}
          />
        </Field>

        <Field label={t("profile.officialRating")}>
          <input
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            placeholder={t("profile.ratingPlaceholder")}
            className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-sm outline-none"
          />
        </Field>

        <Field label={t("profile.heightLabel", { height: height ?? 178 })}>
          <input
            type="range"
            min={140}
            max={220}
            value={height ?? 178}
            onChange={(e) => setHeight(Number(e.target.value))}
            className="w-full accent-matchup"
          />
        </Field>

        <Field label={t("profile.goals")}>
          <Chips
            options={GOALS.map((g) => ({ value: g, label: g }))}
            selected={goals}
            onToggle={(v) => setGoals(toggle(goals, v))}
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
          {saving ? t("profile.saving") : t("common.save")}
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
