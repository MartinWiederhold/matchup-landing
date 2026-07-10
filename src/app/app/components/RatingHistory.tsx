"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useT } from "@/lib/i18n";

/**
 * Kleiner MatchScore-Sparkline aus web.rating_history (nur eigener Verlauf via RLS).
 * Zeigt Startpunkt → jeden gewerteten Score, plus aktueller Wert & Gesamtveränderung.
 */
export default function RatingHistory({ userId }: { userId: string }) {
  const t = useT();
  const [series, setSeries] = useState<number[] | null>(null);

  useEffect(() => {
    let alive = true;
    supabase
      .from("rating_history")
      .select("new_score, delta, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(50)
      .then(({ data }) => {
        if (!alive) return;
        const rows = (data as { new_score: number; delta: number }[]) ?? [];
        if (rows.length === 0) {
          setSeries([]);
          return;
        }
        // Startwert vor dem ersten gewerteten Spiel voranstellen.
        const start = rows[0].new_score - rows[0].delta;
        setSeries([start, ...rows.map((r) => r.new_score)]);
      });
    return () => {
      alive = false;
    };
  }, [userId]);

  if (series === null) return null; // lädt
  if (series.length < 2) {
    return <p className="text-sm text-neutral-400">{t("profile.ratingHistoryEmpty")}</p>;
  }

  const W = 100;
  const H = 40;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const pts = series.map((v, i) => {
    const x = (i / (series.length - 1)) * W;
    const y = H - ((v - min) / span) * (H - 6) - 3; // 3px Rand oben/unten
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `0,${H} ${line} ${W},${H}`;
  const last = pts[pts.length - 1];
  const current = series[series.length - 1];
  const total = current - series[0];
  const games = series.length - 1;

  return (
    <div>
      <div className="flex items-end justify-between">
        <div className="text-3xl font-bold tabular-nums text-neutral-900">{current}</div>
        <div
          className={`text-sm font-bold ${
            total > 0 ? "text-emerald-600" : total < 0 ? "text-neutral-500" : "text-neutral-400"
          }`}
        >
          {total > 0 ? `+${total}` : total}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="mt-2 h-16 w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="rh-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--matchup-blue)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--matchup-blue)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#rh-fill)" />
        <polyline
          points={line}
          fill="none"
          stroke="var(--matchup-blue)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={last[0]} cy={last[1]} r="2.5" fill="var(--matchup-blue)" vectorEffect="non-scaling-stroke" />
      </svg>

      <p className="mt-1 text-xs text-neutral-400">
        {t("profile.ratingHistoryCaption", { n: games })}
      </p>
    </div>
  );
}
