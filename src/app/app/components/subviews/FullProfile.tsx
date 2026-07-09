"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { skillLabel, sportLabel } from "@/lib/utils/formatters";
import {
  SportIcon,
  FlagIcon,
  BanIcon,
  MapPinIcon,
  CheckIcon,
  StatsIcon,
  MedalIcon,
  RulerIcon,
  TargetIcon,
  TrophyIcon,
  FlameIcon,
  StarIcon,
} from "../shared/icons";
import type { Profile, PlayerStats } from "@/lib/types";
import { ensureMatch } from "@/lib/matchmaking";
import { useAppNav } from "../appNav";
import { FullLoading } from "../shared/ui";

function ConnectIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6M22 11h-6" />
    </svg>
  );
}

export default function FullProfile({
  userId,
  viewOnly,
}: {
  userId: string;
  viewOnly?: boolean;
}) {
  const t = useT();
  const { profile: me, closeSubView, refreshBadges, openSubView } = useAppNav();
  const [p, setP] = useState<Profile | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [imgIndex, setImgIndex] = useState(0);
  const [sent, setSent] = useState(false);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => setP(data as Profile | null));
    supabase
      .from("player_stats")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => setStats(data as PlayerStats | null));
  }, [userId]);

  if (!p) return <FullLoading />;

  const images = [p.profile_image, ...(p.additional_images ?? [])].filter(
    Boolean,
  ) as string[];

  const next = () => setImgIndex((i) => (i + 1) % images.length);
  const prev = () => setImgIndex((i) => (i - 1 + images.length) % images.length);

  async function report() {
    const reason = window.prompt(t("profile.reportPrompt"));
    if (!reason) return;
    await supabase.from("reports").insert({
      reporter_id: me.id,
      reported_user_id: userId,
      reason,
      status: "pending",
    });
    window.alert(t("profile.reportThanks"));
  }

  async function block() {
    if (!window.confirm(t("profile.blockConfirm"))) return;
    await supabase
      .from("blocks")
      .insert({ blocker_id: me.id, blocked_id: userId });
    closeSubView();
  }

  async function connect() {
    setSent(true);
    await supabase
      .from("likes")
      .upsert(
        { from_user_id: me.id, to_user_id: userId },
        { onConflict: "from_user_id,to_user_id" },
      );
    const { data: reverse } = await supabase
      .from("likes")
      .select("id")
      .eq("from_user_id", userId)
      .eq("to_user_id", me.id)
      .maybeSingle();
    if (reverse) {
      await ensureMatch(me.id, userId);
      const [u1, u2] = [me.id, userId].sort();
      const { data: m } = await supabase
        .from("matches")
        .select("id")
        .eq("user1_id", u1)
        .eq("user2_id", u2)
        .maybeSingle();
      refreshBadges();
      if (m) openSubView({ type: "chat", matchId: m.id });
      return;
    }
    refreshBadges();
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-3">
        <button type="button" onClick={closeSubView} className="text-xl" aria-label={t("profile.back")}>
          ←
        </button>
        <div className="flex gap-4 text-zinc-300">
          <button type="button" onClick={report} aria-label={t("profile.report")}>
            <FlagIcon size={20} />
          </button>
          <button type="button" onClick={block} aria-label={t("profile.block")}>
            <BanIcon size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div
          className="relative aspect-[3/4] w-full select-none overflow-hidden bg-zinc-800"
          onTouchStart={(e) => {
            touchX.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            if (touchX.current == null || images.length < 2) return;
            const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current;
            touchX.current = null;
            if (Math.abs(dx) < 40) return;
            if (dx > 0) prev();
            else next();
          }}
        >
          {images[imgIndex] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={images[imgIndex]}
              alt={p.first_name}
              className="h-full w-full object-cover"
              draggable={false}
            />
          )}

          {images.length > 1 && (
            <>
              {/* Pfeile zum Klicken */}
              <button
                type="button"
                onClick={prev}
                aria-label={t("profile.prevImage")}
                className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/65"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M15 6l-6 6 6 6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={next}
                aria-label={t("profile.nextImage")}
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/65"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>

              {/* Punkte */}
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === imgIndex ? "w-4 bg-white" : "w-1.5 bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="space-y-5 p-5">
          <div>
            <h1 className="text-2xl font-bold">
              {p.first_name}, {p.age}
            </h1>
            {p.city && (
              <p className="flex items-center gap-1 text-sm text-zinc-400">
                <MapPinIcon size={14} /> {p.city}
              </p>
            )}
            {p.is_verified && (
              <p className="flex items-center gap-1 text-xs text-matchup">
                <CheckIcon size={14} /> {t("profile.verifiedPlain")}
              </p>
            )}
          </div>

          {p.bio && (
            <div>
              <h2 className="mb-1 text-xs font-bold uppercase text-zinc-500">
                {t("profile.aboutMe")}
              </h2>
              <p className="text-sm text-zinc-300">{p.bio}</p>
            </div>
          )}

          <div>
            <h2 className="mb-1 text-xs font-bold uppercase text-zinc-500">
              {t("profile.details")}
            </h2>
            <ul className="space-y-1 text-sm text-zinc-300">
              <li>
                <SportIcon sport={p.sports[0]} size={14} className="mr-0.5 inline-block align-[-2px]" /> {p.sports.map(sportLabel).join(", ")}
              </li>
              <li className="flex items-center gap-2">
                <StatsIcon size={15} /> {skillLabel(p.skill_level)}
                <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">{t("profile.selfRated")}</span>
              </li>
              {p.official_rating && (
                <li className="flex items-center gap-2">
                  <MedalIcon size={15} /> {p.official_rating}
                </li>
              )}
              {p.height_cm && (
                <li className="flex items-center gap-2">
                  <RulerIcon size={15} /> {p.height_cm} cm
                </li>
              )}
              {p.goals?.length > 0 && (
                <li className="flex items-center gap-2">
                  <TargetIcon size={15} /> {p.goals.join(", ")}
                </li>
              )}
            </ul>
          </div>

          {stats && (
            <div>
              <h2 className="mb-1 text-xs font-bold uppercase text-zinc-500">
                {t("profile.stats")}
              </h2>
              <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-zinc-300">
                <TrophyIcon size={14} /> {t("profile.matchesCount", { count: stats.total_matches })} ·{" "}
                <FlameIcon size={14} /> {t("profile.streakDays", { count: stats.current_streak })} ·{" "}
                <StarIcon size={14} /> {t("profile.levelValue", { level: stats.level })}
              </p>
            </div>
          )}
        </div>
      </div>

      {!viewOnly && (
        <div className="shrink-0 border-t border-zinc-800 p-4">
          <button
            type="button"
            onClick={connect}
            disabled={sent}
            className={`flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold transition-colors ${
              sent
                ? "bg-zinc-800 text-zinc-400"
                : "bg-matchup text-white hover:bg-matchup-hover"
            }`}
          >
            {sent ? (
              <>
                <CheckIcon size={18} /> {t("profile.requestSent")}
              </>
            ) : (
              <>
                <ConnectIcon size={18} /> {t("profile.connect")}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
