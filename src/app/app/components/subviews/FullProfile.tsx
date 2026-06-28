"use client";

import { useEffect, useState } from "react";
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
  const { profile: me, closeSubView, refreshBadges, openSubView } = useAppNav();
  const [p, setP] = useState<Profile | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [imgIndex, setImgIndex] = useState(0);
  const [sent, setSent] = useState(false);

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

  async function report() {
    const reason = window.prompt("Grund der Meldung?");
    if (!reason) return;
    await supabase.from("reports").insert({
      reporter_id: me.id,
      reported_user_id: userId,
      reason,
      status: "pending",
    });
    window.alert("Danke, die Meldung wurde übermittelt.");
  }

  async function block() {
    if (!window.confirm("Diesen Nutzer blockieren?")) return;
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
        <button type="button" onClick={closeSubView} className="text-xl" aria-label="Zurück">
          ←
        </button>
        <div className="flex gap-4 text-zinc-300">
          <button type="button" onClick={report} aria-label="Melden">
            <FlagIcon size={20} />
          </button>
          <button type="button" onClick={block} aria-label="Blockieren">
            <BanIcon size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="relative aspect-[3/4] w-full bg-zinc-800">
          {images[imgIndex] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={images[imgIndex]}
              alt={p.first_name}
              className="h-full w-full object-cover"
              onClick={() => setImgIndex((i) => (i + 1) % images.length)}
            />
          )}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full ${i === imgIndex ? "bg-white" : "bg-white/40"}`}
                />
              ))}
            </div>
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
                <CheckIcon size={14} /> Verifiziert
              </p>
            )}
          </div>

          {p.bio && (
            <div>
              <h2 className="mb-1 text-xs font-bold uppercase text-zinc-500">
                Über mich
              </h2>
              <p className="text-sm text-zinc-300">{p.bio}</p>
            </div>
          )}

          <div>
            <h2 className="mb-1 text-xs font-bold uppercase text-zinc-500">
              Details
            </h2>
            <ul className="space-y-1 text-sm text-zinc-300">
              <li>
                <SportIcon sport={p.sports[0]} size={14} className="mr-0.5 inline-block align-[-2px]" /> {p.sports.map(sportLabel).join(", ")}
              </li>
              <li className="flex items-center gap-2">
                <StatsIcon size={15} /> {skillLabel(p.skill_level)}
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
                Statistiken
              </h2>
              <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-zinc-300">
                <TrophyIcon size={14} /> {stats.total_matches} Matches ·{" "}
                <FlameIcon size={14} /> {stats.current_streak}-Tage-Streak ·{" "}
                <StarIcon size={14} /> Level {stats.level}
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
                <CheckIcon size={18} /> Anfrage gesendet
              </>
            ) : (
              <>
                <ConnectIcon size={18} /> Verbinden
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
