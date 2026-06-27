"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { skillLabel, sportIcon, sportLabel } from "@/lib/utils/formatters";
import type { Profile, PlayerStats } from "@/lib/types";
import { useAppNav } from "../appNav";
import { FullLoading } from "../shared/ui";

export default function FullProfile({
  userId,
  viewOnly,
}: {
  userId: string;
  viewOnly?: boolean;
}) {
  const { profile: me, closeSubView, refreshBadges } = useAppNav();
  const [p, setP] = useState<Profile | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [imgIndex, setImgIndex] = useState(0);

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

  async function like() {
    await supabase
      .from("likes")
      .upsert(
        { from_user_id: me.id, to_user_id: userId },
        { onConflict: "from_user_id,to_user_id" },
      );
    refreshBadges();
    closeSubView();
  }

  async function skip() {
    await supabase
      .from("skips")
      .insert({ user_id: me.id, skipped_user_id: userId });
    closeSubView();
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-3">
        <button type="button" onClick={closeSubView} className="text-xl" aria-label="Zurück">
          ←
        </button>
        <div className="flex gap-4 text-lg">
          <button type="button" onClick={report} aria-label="Melden">
            ⚑
          </button>
          <button type="button" onClick={block} aria-label="Blockieren">
            ⊘
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
            {p.city && <p className="text-sm text-zinc-400">📍 {p.city}</p>}
            {p.is_verified && <p className="text-xs text-matchup">✓ Verifiziert</p>}
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
                {sportIcon(p.sports[0])} {p.sports.map(sportLabel).join(", ")}
              </li>
              <li>📊 {skillLabel(p.skill_level)}</li>
              {p.official_rating && <li>🏅 {p.official_rating}</li>}
              {p.height_cm && <li>📏 {p.height_cm} cm</li>}
              {p.goals?.length > 0 && <li>🎯 {p.goals.join(", ")}</li>}
            </ul>
          </div>

          {stats && (
            <div>
              <h2 className="mb-1 text-xs font-bold uppercase text-zinc-500">
                Statistiken
              </h2>
              <p className="text-sm text-zinc-300">
                🏆 {stats.total_matches} Matches · 🔥 {stats.current_streak}-Tage-Streak
                · ⭐ Level {stats.level}
              </p>
            </div>
          )}
        </div>
      </div>

      {!viewOnly && (
        <div className="flex shrink-0 items-center justify-center gap-12 border-t border-zinc-800 py-4">
          <button
            type="button"
            onClick={skip}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800 text-xl"
            aria-label="Skip"
          >
            ✕
          </button>
          <button
            type="button"
            onClick={like}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-matchup text-xl"
            aria-label="Like"
          >
            ♥
          </button>
        </div>
      )}
    </div>
  );
}
