"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import WheelPicker from "./WheelPicker";
import type { Sport } from "@/lib/types";

type SetLine = { a: number; b: number };

/**
 * Satzweise Score-Eingabe mit Scrollrädern.
 * Baut daraus den Score-String ("6:3 6:4") und leitet den Sieger automatisch
 * aus den gewonnenen Sätzen ab. onChange(score, winner) — winner ist null bei
 * Gleichstand/leer.
 */
export default function SetScore({
  sport,
  teamA,
  teamB,
  onChange,
}: {
  sport: Sport;
  teamA: string;
  teamB: string;
  onChange: (score: string, winner: "a" | "b" | null) => void;
}) {
  const t = useT();
  const maxGame = sport === "pickleball" ? 21 : 7;
  const values = Array.from({ length: maxGame + 1 }, (_, i) => i);
  const [sets, setSets] = useState<SetLine[]>([{ a: 0, b: 0 }]);

  useEffect(() => {
    const played = sets.filter((s) => s.a > 0 || s.b > 0);
    const score = played.map((s) => `${s.a}:${s.b}`).join(" ");
    let aw = 0;
    let bw = 0;
    played.forEach((s) => {
      if (s.a > s.b) aw += 1;
      else if (s.b > s.a) bw += 1;
    });
    const winner: "a" | "b" | null = aw === bw ? null : aw > bw ? "a" : "b";
    onChange(score, winner);
  }, [sets, onChange]);

  function setVal(i: number, side: "a" | "b", v: number) {
    setSets((prev) => prev.map((s, idx) => (idx === i ? { ...s, [side]: v } : s)));
  }

  return (
    <div className="space-y-3">
      {/* Kopf: Team-Namen */}
      <div className="flex items-center gap-2 px-1 text-xs font-semibold text-zinc-400">
        <div className="flex-1 truncate text-center">{teamA}</div>
        <div className="w-14 shrink-0" />
        <div className="flex-1 truncate text-center">{teamB}</div>
      </div>

      {sets.map((s, i) => (
        <div key={i} className="flex items-center gap-2 rounded-2xl bg-zinc-900 p-2">
          <div className="flex-1">
            <WheelPicker values={values} value={s.a} onChange={(v) => setVal(i, "a", v)} />
          </div>
          <div className="w-14 shrink-0 text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            {t("games.setLabel", { n: i + 1 })}
          </div>
          <div className="flex-1">
            <WheelPicker values={values} value={s.b} onChange={(v) => setVal(i, "b", v)} />
          </div>
        </div>
      ))}

      <div className="flex gap-2">
        {sets.length < 5 && (
          <button
            type="button"
            onClick={() => setSets((p) => [...p, { a: 0, b: 0 }])}
            className="flex-1 rounded-full bg-zinc-800 py-2.5 text-sm font-semibold text-zinc-200"
          >
            {t("games.addSet")}
          </button>
        )}
        {sets.length > 1 && (
          <button
            type="button"
            onClick={() => setSets((p) => p.slice(0, -1))}
            className="flex-1 rounded-full border border-zinc-700 py-2.5 text-sm font-semibold text-zinc-400"
          >
            {t("games.removeSet")}
          </button>
        )}
      </div>
    </div>
  );
}
