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
import RatingHistory from "../RatingHistory";

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
  const [playerCount, setPlayerCount] = useState(0);

  useEffect(() => {
    import("@/lib/tour").then(({ loadMyPlayers }) => loadMyPlayers(profile.id).then((p) => setPlayerCount(p.length)));
  }, [profile.id]);

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
    <div className="pb-6">
      <div className="flex items-center justify-end gap-2 px-4 pt-4">
        <button
          type="button"
          onClick={() => openSubView({ type: "edit-profile" })}
          aria-label={t("profile.editAria")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.05] text-neutral-700 transition-colors hover:bg-black/10"
        >
          <PencilIcon size={18} />
        </button>
        <button
          type="button"
          onClick={() => openSubView({ type: "settings" })}
          aria-label={t("profile.settingsAria")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.05] text-neutral-700 transition-colors hover:bg-black/10"
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
          <p className="flex items-center justify-center gap-1 text-sm text-neutral-500">
            <MapPinIcon size={14} /> {profile.city}
          </p>
        )}
        <p className="mt-1 text-sm text-neutral-500">
          <SportIcon sport={profile.sports[0]} size={14} className="mr-0.5 inline-block align-[-2px]" /> {profile.sports.map(sportLabel).join(", ")} ·{" "}
          {skillLabel(profile.skill_level)}{" "}
          <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 align-[1px] text-[10px] font-medium text-neutral-400">{t("profile.selfRated")}</span>
        </p>

        {/* MatchScore — Elo-Rating (tippen → Rangliste) */}
        <button
          type="button"
          onClick={() => openSubView({ type: "leaderboard" })}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-matchup px-4 py-1.5 text-white shadow-sm transition-colors hover:bg-matchup-hover"
        >
          <span className="text-[11px] font-bold uppercase tracking-wide text-white/80">
            {t("profile.matchScore")}
          </span>
          <span className="text-sm font-bold text-white">
            {profile.match_score ?? 1000}
          </span>
          {(profile.matches_rated ?? 0) < 5 && (
            <span className="text-[10px] font-medium text-white/70">
              · {t("profile.matchScoreProvisional")}
            </span>
          )}
          <svg className="h-3.5 w-3.5 text-white/80" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {profile.is_verified && (
          <p className="mt-1 text-xs text-matchup">{t("profile.verified")}</p>
        )}
      </div>

      <div className="space-y-6 px-5 pt-8">
        {/* Stats-Grid (mockup2-Look) */}
        <div className="grid grid-cols-4 gap-2.5">
          {(() => {
            const games = stats?.total_matches ?? 0;
            const wins = stats?.wins ?? 0;
            const winrate = games ? Math.round((wins / games) * 100) : 0;
            const streak = stats?.current_streak ?? 0;
            const tiles = [
              { label: t("profile.statMatches"), value: `${games}` },
              { label: t("profile.statWins"), value: `${wins}` },
              { label: t("profile.statWinrate"), value: `${winrate}%` },
              { label: t("profile.statStreak"), value: `${streak}` },
            ];
            return tiles.map((s) => (
              <div key={s.label} className="rounded-2xl bg-black/[0.035] py-3 text-center">
                <div className="text-lg font-extrabold text-neutral-900">{s.value}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{s.label}</div>
              </div>
            ));
          })()}
        </div>

        <Section title={t("profile.sports")}>
          <div className="flex flex-wrap gap-2">
            {profile.sports.map((s) => (
              <span
                key={s}
                className="rounded-full bg-black/[0.05] px-4 py-1.5 text-sm font-medium text-neutral-700"
              >
                <SportIcon sport={s} size={14} className="mr-0.5 inline-block align-[-2px]" /> {sportLabel(s)}
              </span>
            ))}
          </div>
        </Section>

        {profile.bio && (
          <Section title={t("profile.aboutMe")}>
            <p className="rounded-2xl bg-black/[0.035] p-4 text-sm leading-relaxed text-neutral-600">{profile.bio}</p>
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
                    className="flex items-center gap-1.5 rounded-full bg-matchup px-3 py-1.5 text-xs font-semibold text-white"
                    title={def.description}
                  >
                    {def.icon} {def.label}
                  </span>
                );
              })}
            </div>
          </Section>
        )}

        <Section title={t("profile.ratingHistoryTitle")}>
          <div className="rounded-2xl bg-black/[0.035] p-4">
            <RatingHistory userId={profile.id} />
          </div>
        </Section>

        {reviews.length > 0 && (
          <Section title={t("profile.progressNotes")}>
            <div className="space-y-2">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-2xl bg-black/[0.035] p-4">
                  {r.work_on && (
                    <p className="text-sm text-neutral-900">
                      <span className="font-semibold text-matchup">→ </span>
                      {r.work_on}
                    </p>
                  )}
                  {r.what_good && (
                    <p className="mt-1 text-xs text-neutral-500">
                      <span className="font-semibold text-emerald-600">✓ </span>
                      {r.what_good}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {images.length > 0 && (
          <Section title={t("profile.photos")}>
            <div className="grid grid-cols-4 gap-2">
              {images.map((src, i) => (
                <div
                  key={i}
                  className="aspect-square overflow-hidden rounded-xl bg-black/[0.05]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Coaching: Spieler, die mich in ihr Team eingeladen haben */}
        {playerCount > 0 && (
          <button
            type="button"
            onClick={() => openSubView({ type: "tour-players" })}
            className="flex w-full items-center gap-3 rounded-2xl bg-black/[0.035] p-4 text-left"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-matchup/10 text-matchup">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-neutral-900">{t("mode.myPlayers")}</p>
              <p className="text-[12px] text-neutral-500">{t("mode.myPlayersCount", { n: playerCount })}</p>
            </div>
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        )}

        {/* Services (Coaches, Hitting, Stringer) */}
        <button
          type="button"
          onClick={() => openSubView({ type: "services" })}
          className="flex w-full items-center gap-3 rounded-2xl bg-black/[0.035] p-4 text-left"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-matchup/10 text-matchup">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l1-5h16l1 5M4 9v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9M3 9h18M9 13h6" /></svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-neutral-900">{t("services.title")}</p>
            <p className="text-[12px] text-neutral-500">{t("services.hubSubtitle")}</p>
          </div>
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg>
        </button>

        {/* Mein Team (Anfragen & Favoriten) */}
        <button
          type="button"
          onClick={() => openSubView({ type: "my-team" })}
          className="flex w-full items-center gap-3 rounded-2xl bg-black/[0.035] p-4 text-left"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-matchup/10 text-matchup">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-neutral-900">{t("services.myTeam")}</p>
            <p className="text-[12px] text-neutral-500">{t("services.myTeamSubtitle")}</p>
          </div>
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg>
        </button>

        {/* Freunde einladen — Matchup-Lila-Karte */}
        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-matchup to-indigo-600 p-4 text-white shadow-sm">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M19 8v6M22 11h-6" /></svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">{t("profile.inviteTitle")}</p>
            <p className="line-clamp-2 text-[12px] text-white/80">{t("profile.inviteText")}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              const url = typeof window !== "undefined" ? window.location.origin : "https://matchup-app.com";
              if (typeof navigator !== "undefined" && navigator.share) navigator.share({ title: "Matchup", url }).catch(() => {});
              else if (typeof navigator !== "undefined" && navigator.clipboard) navigator.clipboard.writeText(url);
            }}
            className="shrink-0 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-matchup"
          >
            {t("profile.inviteShare")}
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
      <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
        {title}
      </h2>
      {children}
    </div>
  );
}
