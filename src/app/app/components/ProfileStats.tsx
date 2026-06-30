"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useT, useLocale } from "@/lib/i18n";
import type { PlayerStats, Profile } from "@/lib/types";

const WEEK_GOAL = 5; // Ziel-Spiele pro Woche (für den Ring)

export default function ProfileStats({
  profile,
  stats,
}: {
  profile: Profile;
  stats: PlayerStats | null;
}) {
  const t = useT();
  const { locale } = useLocale();
  const [days, setDays] = useState<{ label: string; count: number }[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - 6);
      const [created, joined] = await Promise.all([
        supabase
          .from("game_events")
          .select("date_time")
          .eq("created_by", profile.id)
          .gte("date_time", start.toISOString()),
        supabase
          .from("game_participants")
          .select("game_events(date_time)")
          .eq("user_id", profile.id),
      ]);
      const dates: Date[] = [];
      (created.data ?? []).forEach(
        (g: { date_time: string | null }) =>
          g.date_time && dates.push(new Date(g.date_time)),
      );
      type JoinRow = {
        game_events?: { date_time?: string } | { date_time?: string }[] | null;
      };
      (joined.data as JoinRow[] | null ?? []).forEach((r) => {
        const ge = r.game_events;
        const arr = Array.isArray(ge) ? ge : ge ? [ge] : [];
        arr.forEach((g) => g?.date_time && dates.push(new Date(g.date_time)));
      });

      // 7 Tage (heute zurück) als Buckets
      const fmt = new Intl.DateTimeFormat(locale === "de" ? "de-CH" : "en-US", {
        weekday: "short",
      });
      const buckets: { label: string; count: number; key: string }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - i);
        buckets.push({ label: fmt.format(d), count: 0, key: d.toDateString() });
      }
      dates.forEach((d) => {
        const k = new Date(d);
        k.setHours(0, 0, 0, 0);
        const b = buckets.find((x) => x.key === k.toDateString());
        if (b) b.count += 1;
      });
      if (active) setDays(buckets.map(({ label, count }) => ({ label, count })));
    })();
    return () => {
      active = false;
    };
  }, [profile.id, locale]);

  const weekGames = useMemo(() => days.reduce((s, d) => s + d.count, 0), [days]);
  const maxDay = useMemo(() => Math.max(1, ...days.map((d) => d.count)), [days]);
  const ringPct = Math.min(1, weekGames / WEEK_GOAL);

  const C = 2 * Math.PI * 26;
  const offset = C * (1 - ringPct);

  return (
    <div className="space-y-3">
      {/* Wochen-Aktivität: Ring + Tagesbalken */}
      <div className="flex items-center gap-5 rounded-2xl bg-zinc-900 p-5">
        <div className="relative h-[88px] w-[88px] shrink-0">
          <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
            <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
            <circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke="var(--matchup-blue)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold leading-none">{weekGames}</span>
            <span className="text-[10px] text-zinc-400">{t("profile.gamesShort")}</span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{t("profile.activityTitle")}</p>
          <p className="mt-0.5 text-xs text-zinc-400">
            {t("profile.activitySubtitle", { count: weekGames, goal: WEEK_GOAL })}
          </p>
          <div className="mt-3 flex items-end gap-1.5">
            {days.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-12 w-full items-end">
                  <div
                    className="w-full rounded-md bg-matchup"
                    style={{
                      height: `${(d.count / maxDay) * 100}%`,
                      minHeight: d.count > 0 ? "10%" : "3px",
                      opacity: d.count > 0 ? 1 : 0.18,
                      transition: `height 700ms cubic-bezier(0.22,1,0.36,1) ${i * 60}ms`,
                    }}
                  />
                </div>
                <span className="text-[9px] text-zinc-500">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Kennzahlen-Reihe */}
      <div className="grid grid-cols-4 gap-2">
        <MiniStat label={t("profile.statLevel")} value={stats?.level ?? 1} accent="text-matchup" />
        <MiniStat label={t("profile.statStreak")} value={stats?.current_streak ?? 0} accent="text-amber-400" />
        <MiniStat label={t("profile.statMatches")} value={stats?.total_matches ?? 0} accent="text-emerald-400" />
        <MiniStat label={t("profile.statPartners")} value={stats?.different_partners ?? 0} accent="text-sky-400" />
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-xl bg-zinc-900 px-2 py-3 text-center">
      <p className={`text-xl font-bold ${accent}`}>{value}</p>
      <p className="mt-0.5 text-[10px] leading-tight text-zinc-400">{label}</p>
    </div>
  );
}
