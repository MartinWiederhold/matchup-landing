"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { skillLabel, sportLabel } from "@/lib/utils/formatters";
import { SportIcon, MapPinIcon } from "../shared/icons";
import { ACHIEVEMENT_DEFS } from "@/lib/types";
import type { PlayerStats, Achievement } from "@/lib/types";
import { useAppNav } from "../appNav";
import Avatar from "../shared/Avatar";
import ProfileStats from "../ProfileStats";

function PencilIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
function GearIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

type GameReviewRow = {
  id: string;
  what_good: string | null;
  work_on: string | null;
  created_at: string;
};

export default function ProfileTab() {
  const t = useT();
  const { profile, openSubView } = useAppNav();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [reviews, setReviews] = useState<GameReviewRow[]>([]);

  useEffect(() => {
    supabase
      .from("player_stats")
      .select("*")
      .eq("user_id", profile.id)
      .maybeSingle()
      .then(({ data }) => setStats(data as PlayerStats | null));
    supabase
      .from("achievements")
      .select("*")
      .eq("user_id", profile.id)
      .then(({ data }) => setAchievements((data as Achievement[]) ?? []));
    supabase
      .from("game_reviews")
      .select("id, what_good, work_on, created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(3)
      .then(({ data }) => setReviews((data as GameReviewRow[]) ?? []));
  }, [profile.id]);

  const images = [profile.profile_image, ...(profile.additional_images ?? [])].filter(
    Boolean,
  ) as string[];

  return (
    <div className="h-full overflow-y-auto pb-6">
      <div className="flex items-center justify-end gap-2 px-4 pt-4">
        <button
          type="button"
          onClick={() => openSubView({ type: "edit-profile" })}
          aria-label={t("profile.editAria")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white transition-colors hover:bg-zinc-800"
        >
          <PencilIcon size={18} />
        </button>
        <button
          type="button"
          onClick={() => openSubView({ type: "settings" })}
          aria-label={t("profile.settingsAria")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white transition-colors hover:bg-zinc-800"
        >
          <GearIcon size={18} />
        </button>
      </div>
      <div className="flex flex-col items-center px-6 pt-2 text-center">
        <Avatar src={profile.profile_image} alt={profile.first_name} size="xl" />
        <h1 className="mt-4 text-2xl font-bold">
          {profile.first_name}, {profile.age}
        </h1>
        {profile.city && (
          <p className="flex items-center justify-center gap-1 text-sm text-zinc-400">
            <MapPinIcon size={14} /> {profile.city}
          </p>
        )}
        <p className="mt-1 text-sm text-zinc-400">
          <SportIcon sport={profile.sports[0]} size={14} className="mr-0.5 inline-block align-[-2px]" /> {profile.sports.map(sportLabel).join(", ")} ·{" "}
          {skillLabel(profile.skill_level)}
        </p>
        {profile.is_verified && (
          <p className="mt-1 text-xs text-matchup">{t("profile.verified")}</p>
        )}
      </div>

      <div className="space-y-6 px-5 pt-8">
        {profile.bio && (
          <Section title={t("profile.aboutMe")}>
            <p className="text-sm text-zinc-300">{profile.bio}</p>
          </Section>
        )}

        <Section title={t("profile.sports")}>
          <div className="flex flex-wrap gap-2">
            {profile.sports.map((s) => (
              <span
                key={s}
                className="rounded-full bg-zinc-800 px-4 py-1.5 text-sm"
              >
                <SportIcon sport={s} size={14} className="mr-0.5 inline-block align-[-2px]" /> {sportLabel(s)}
              </span>
            ))}
          </div>
        </Section>

        <Section title={t("profile.stats")}>
          <ProfileStats profile={profile} stats={stats} />
        </Section>

        {reviews.length > 0 && (
          <Section title={t("profile.progressNotes")}>
            <div className="space-y-2">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-xl bg-zinc-900 p-3">
                  {r.work_on && (
                    <p className="text-sm text-white">
                      <span className="font-semibold text-sky-400">→ </span>
                      {r.work_on}
                    </p>
                  )}
                  {r.what_good && (
                    <p className="mt-1 text-xs text-zinc-400">
                      <span className="text-emerald-400">+ </span>
                      {r.what_good}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {achievements.length > 0 && (
          <Section title={t("profile.achievements")}>
            <div className="flex flex-wrap gap-2">
              {achievements.map((a) => {
                const def = ACHIEVEMENT_DEFS[a.achievement_key];
                if (!def) return null;
                return (
                  <span
                    key={a.id}
                    className="rounded-full bg-zinc-800 px-3 py-1.5 text-sm"
                    title={def.description}
                  >
                    {def.icon} {def.label}
                  </span>
                );
              })}
            </div>
          </Section>
        )}

        {images.length > 0 && (
          <Section title={t("profile.photos")}>
            <div className="grid grid-cols-4 gap-2">
              {images.map((src, i) => (
                <div
                  key={i}
                  className="aspect-square overflow-hidden rounded-xl bg-zinc-800"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </Section>
        )}

      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
        {title}
      </h2>
      {children}
    </div>
  );
}
