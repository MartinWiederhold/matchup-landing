"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SubViewHeader } from "../shared/ui";

type Player = { name: string; country: string | null; flag: string | null; seed: number | null; sets: number[]; won: boolean };
type Match = { round: string; state: "pre" | "in" | "post"; statusText: string; players: Player[] };
type Side = { name: string; matches: Match[] } | null;
type Data = { updatedAt: string; men: Side; women: Side };

const STAGES = [
  { key: "R128", labels: ["round of 128", "1st", "first round", "round 1"] },
  { key: "R64", labels: ["round of 64", "2nd", "second round", "round 2"] },
  { key: "R32", labels: ["round of 32", "3rd", "third round", "round 3"] },
  { key: "R16", labels: ["round of 16", "4th", "fourth round", "round 4"] },
  { key: "VF", labels: ["quarterfinal"] },
  { key: "HF", labels: ["semifinal"] },
  { key: "Finale", labels: ["final"] },
];
function stageOf(round: string): number {
  const r = round.toLowerCase();
  for (let i = STAGES.length - 1; i >= 0; i--) if (STAGES[i].labels.some((l) => r.includes(l))) return i;
  return -1;
}

export default function TennisLive() {
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState<"men" | "women">("men");
  const [loading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/tennis", { cache: "no-store" });
      const d = (await r.json()) as Data;
      setData(d);
    } catch {
      /* best effort */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    timer.current = setInterval(() => void load(), 25000); // Auto-Refresh ~25s
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [load]);

  const side = tab === "men" ? data?.men : data?.women;
  const matches = side?.matches ?? [];
  const liveCount = matches.filter((m) => m.state === "in").length;

  // Runden-Fortschritt (nur wenn Grand-Slam-artig, d.h. mehrere Stages vorhanden)
  const reached = new Set(matches.map((m) => stageOf(m.round)).filter((i) => i >= 0));
  const furthest = Math.max(-1, ...Array.from(reached));
  const showProgress = reached.size >= 2;

  // nach Runde gruppieren, Live-Gruppen zuerst
  const byRound = new Map<string, Match[]>();
  for (const m of matches) {
    const k = m.round || "—";
    const a = byRound.get(k);
    if (a) a.push(m); else byRound.set(k, [m]);
  }
  const groups = Array.from(byRound.entries()).sort((a, b) => stageOf(b[0]) - stageOf(a[0]));

  return (
    <div className="flex h-full flex-col bg-black">
      <SubViewHeader title="Live im Profitennis" />

      {/* Herren / Damen */}
      <div className="flex shrink-0 gap-2 px-4 pt-3">
        {(["men", "women"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setTab(s)}
            className={`flex-1 rounded-full py-2 text-xs font-extrabold uppercase tracking-wider transition-colors ${
              tab === s ? "bg-matchup text-white" : "bg-zinc-900 text-zinc-400"
            }`}
          >
            {s === "men" ? "Herren" : "Damen"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24 pt-3">
        {/* Turnier-Header */}
        {side?.name && (
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">{side.name}</h2>
              {data?.updatedAt && (
                <p className="text-[11px] text-zinc-500">
                  Quelle ESPN · aktualisiert {new Date(data.updatedAt).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>
            {liveCount > 0 && (
              <span className="flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-1 text-[11px] font-extrabold text-red-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> {liveCount} LIVE
              </span>
            )}
          </div>
        )}

        {/* Fortschritt bis Finale */}
        {showProgress && (
          <div className="mb-4 flex items-center gap-1">
            {STAGES.map((st, i) => (
              <div key={st.key} className="flex flex-1 flex-col items-center gap-1">
                <div className={`h-1 w-full rounded-full ${i <= furthest ? "bg-matchup" : "bg-zinc-800"}`} />
                <span className={`text-[8.5px] font-bold uppercase tracking-wide ${i === furthest ? "text-matchup" : i < furthest ? "text-zinc-400" : "text-zinc-600"}`}>{st.key}</span>
              </div>
            ))}
          </div>
        )}

        {loading && !data ? (
          <p className="mt-10 text-center text-sm text-zinc-500">Lädt …</p>
        ) : matches.length === 0 ? (
          <p className="mt-10 text-center text-sm text-zinc-500">Aktuell keine Einzel-Matches im Live-Feed.</p>
        ) : (
          <div className="space-y-4">
            {groups.map(([round, ms]) => (
              <div key={round}>
                <div className="mb-1.5 px-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-zinc-500">{round}</div>
                <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-950">
                  {ms.map((m, i) => (
                    <MatchRow key={i} m={m} last={i === ms.length - 1} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MatchRow({ m, last }: { m: Match; last: boolean }) {
  const live = m.state === "in";
  const maxSets = Math.max(m.players[0]?.sets.length ?? 0, m.players[1]?.sets.length ?? 0);
  return (
    <div className={`px-3 py-2.5 ${last ? "" : "border-b border-white/[0.06]"}`}>
      <div className="mb-1.5 flex items-center justify-between">
        <span className={`flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider ${live ? "text-red-400" : "text-zinc-500"}`}>
          {live && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />}
          {live ? "Live" : m.state === "post" ? "Beendet" : m.statusText || "Angesetzt"}
        </span>
        {live && m.statusText && <span className="text-[10px] text-zinc-500">{m.statusText}</span>}
      </div>
      {m.players.map((p, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          {p.flag ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.flag} alt="" className="h-3.5 w-5 shrink-0 rounded-sm object-cover" />
          ) : (
            <span className="h-3.5 w-5 shrink-0 rounded-sm bg-zinc-800" />
          )}
          {p.seed && <span className="w-4 shrink-0 text-center text-[10px] text-zinc-500">{p.seed}</span>}
          <span className={`min-w-0 flex-1 truncate text-[13px] ${p.won ? "font-extrabold text-white" : "font-medium text-zinc-300"}`}>{p.name}</span>
          <span className="flex shrink-0 gap-2 tabular-nums">
            {Array.from({ length: maxSets }).map((_, s) => {
              const v = p.sets[s];
              const opp = m.players[1 - i]?.sets[s];
              const setWon = v != null && opp != null && v > opp;
              return (
                <span key={s} className={`w-3 text-center text-[13px] ${setWon ? "font-extrabold text-white" : "text-zinc-500"}`}>{v ?? ""}</span>
              );
            })}
          </span>
          {p.won && <span className="w-2 shrink-0 text-matchup">◂</span>}
          {!p.won && <span className="w-2 shrink-0" />}
        </div>
      ))}
    </div>
  );
}
