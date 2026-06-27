"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { skillLabel, sportIcon, sportLabel } from "@/lib/utils/formatters";
import { ACHIEVEMENT_DEFS } from "@/lib/types";
import type { PlayerStats, Achievement } from "@/lib/types";
import { useAppNav } from "../appNav";
import Avatar from "../shared/Avatar";

export default function ProfileTab() {
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
        {profile.city && <p className="text-sm text-zinc-400">📍 {profile.city}</p>}
        <p className="mt-1 text-sm text-zinc-400">
          {sportIcon(profile.sports[0])} {profile.sports.map(sportLabel).join(", ")} ·{" "}
          {skillLabel(profile.skill_level)}
        </p>
        {profile.is_verified && (
          <p className="mt-1 text-xs text-matchup">✓ Verifiziert</p>
        )}
      </div>

      <div className="space-y-6 px-5 pt-8">
        {profile.bio && (
          <Section title="Über mich">
            <p className="text-sm text-zinc-300">{profile.bio}</p>
          </Section>
        )}

        <Section title="Sportarten">
          <div className="flex flex-wrap gap-2">
            {profile.sports.map((s) => (
              <span
                key={s}
                className="rounded-full bg-zinc-800 px-4 py-1.5 text-sm"
              >
                {sportIcon(s)} {sportLabel(s)}
              </span>
            ))}
          </div>
        </Section>

        <Section title="Statistiken">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="🏆 Matches" value={stats?.total_matches ?? 0} />
            <Stat label="🔥 Streak" value={`${stats?.current_streak ?? 0} Tage`} />
            <Stat label="⭐ Level" value={stats?.level ?? 1} />
            <Stat label="💎 XP" value={stats?.xp_points ?? 0} />
            <Stat label="👥 Partner" value={stats?.different_partners ?? 0} />
          </div>
        </Section>

        {achievements.length > 0 && (
          <Section title="Achievements">
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
          <Section title="Fotos">
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
            Profil bearbeiten
          </button>
          <button
            type="button"
            onClick={() => openSubView({ type: "settings" })}
            className="w-full rounded-full border border-zinc-700 py-3.5 text-sm font-semibold"
          >
            Einstellungen ⚙️
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

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-zinc-900 px-4 py-3">
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
