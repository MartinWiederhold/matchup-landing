"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { skillLabel, sportLabel } from "@/lib/utils/formatters";
import {
  SportIcon,
  TrophyIcon,
  FlameIcon,
  StarIcon,
  GemIcon,
  UsersIcon,
  MapPinIcon,
} from "../shared/icons";
import { ACHIEVEMENT_DEFS } from "@/lib/types";
import type { PlayerStats, Achievement } from "@/lib/types";
import { useAppNav } from "../appNav";
import Avatar from "../shared/Avatar";

export default function ProfileTab() {
  const t = useT();
  const { profile, openSubView } = useAppNav();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

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
  }, [profile.id]);

  const images = [profile.profile_image, ...(profile.additional_images ?? [])].filter(
    Boolean,
  ) as string[];

  return (
    <div className="h-full overflow-y-auto pb-6">
      <div className="flex flex-col items-center px-6 pt-8 text-center">
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
          <div className="grid grid-cols-2 gap-3">
            <Stat icon={<TrophyIcon size={14} />} label={t("profile.statMatches")} value={stats?.total_matches ?? 0} />
            <Stat icon={<FlameIcon size={14} />} label={t("profile.statStreak")} value={t("profile.statStreakValue", { count: stats?.current_streak ?? 0 })} />
            <Stat icon={<StarIcon size={14} />} label={t("profile.statLevel")} value={stats?.level ?? 1} />
            <Stat icon={<GemIcon size={14} />} label={t("profile.statXp")} value={stats?.xp_points ?? 0} />
            <Stat icon={<UsersIcon size={14} />} label={t("profile.statPartners")} value={stats?.different_partners ?? 0} />
          </div>
        </Section>

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

        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={() => openSubView({ type: "edit-profile" })}
            className="w-full rounded-full bg-matchup py-3.5 text-sm font-bold text-white hover:bg-matchup-hover"
          >
            {t("profile.editProfile")}
          </button>
          <button
            type="button"
            onClick={() => openSubView({ type: "settings" })}
            className="w-full rounded-full border border-zinc-700 py-3.5 text-sm font-semibold"
          >
            {t("profile.settings")}
          </button>
        </div>
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

function Stat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl bg-zinc-900 px-4 py-3">
      <p className="flex items-center gap-1.5 text-xs text-zinc-400">
        {icon} {label}
      </p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
