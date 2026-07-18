"use client";

import { useEffect, useState } from "react";
import { useT, useLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { flagEmoji } from "@/lib/flags";
import { useAppNav } from "../appNav";

type Match = { id: string; title: string; event_date: string; tournament_id: string | null; won: boolean | null; score: string | null; round: string | null; opponent: string | null };
type Tourn = { id: string; name: string; surface: string | null; country: string | null; tier: string | null };

export default function TourMatchesTab({ embedded = false }: { embedded?: boolean }) {
  const t = useT();
  const { locale } = useLocale();
  const { profile, openSubView } = useAppNav();
  const [tab, setTab] = useState<"results" | "stats">("results");
  const [matches, setMatches] = useState<Match[]>([]);
  const [tById, setTById] = useState<Record<string, Tourn>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("tour_events")
        .select("id,title,event_date,tournament_id,won,score,round,opponent")
        .eq("user_id", profile.id)
        .eq("kind", "match")
        .order("event_date", { ascending: false });
      const ms = (data as Match[]) ?? [];
      const ids = [...new Set(ms.map((m) => m.tournament_id).filter(Boolean))] as string[];
      const map: Record<string, Tourn> = {};
      if (ids.length) {
        const { data: ts } = await supabase.from("tournaments").select("id,name,surface,country,tier").in("id", ids);
        for (const tr of (ts as Tourn[]) ?? []) map[tr.id] = tr;
      }
      setMatches(ms); setTById(map); setLoaded(true);
    })();
  }, [profile.id]);

  if (!loaded) return null;

  const decided = matches.filter((m) => m.won != null);
  const wins = decided.filter((m) => m.won).length;
  const losses = decided.length - wins;
  const winRate = decided.length ? Math.round((wins / decided.length) * 100) : 0;

  // Belag-Statistik.
  const surf = new Map<string, { w: number; l: number }>();
  for (const m of decided) {
    const s = m.tournament_id ? tById[m.tournament_id]?.surface : null;
    if (!s) continue;
    const key = s.toLowerCase();
    const cur = surf.get(key) ?? { w: 0, l: 0 };
    if (m.won) cur.w++; else cur.l++;
    surf.set(key, cur);
  }
  const surfLabel: Record<string, string> = { clay: "Sand", hard: "Hart", grass: "Rasen", carpet: "Teppich" };

  const fmt = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="overflow-y-auto pb-28">
      {/* Kopf — im Inbox-Tab ausgeblendet (dort ist „Matches" schon das Segment) */}
      {!embedded && (
        <div className="flex items-center justify-between px-4 pb-1 pt-3">
          <h1 className="text-[18px] font-extrabold tracking-tight text-neutral-900">{t("mode.matchesTitle")}</h1>
          <button type="button" onClick={() => openSubView({ type: "tour-schedule", addKind: "match" })} className="rounded-full bg-black/[0.05] px-3 py-1.5 text-[12px] font-bold text-matchup">+ {t("mode.logMatch")}</button>
        </div>
      )}

      {/* Record — Dashboard-Karte (Win-Rate als Held + W/L + Balken), mockup2-Stil */}
      <div className="px-4 pb-3 pt-2">
        <div className="rounded-2xl bg-black/[0.035] p-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">{t("mode.winRate")}</p>
              <p className="mt-0.5 text-[30px] font-extrabold leading-none tracking-tight text-neutral-900">{winRate}<span className="text-[18px] text-neutral-400">%</span></p>
            </div>
            <div className="flex gap-5 text-right">
              <div>
                <p className="text-[20px] font-extrabold leading-none text-neutral-900">{wins}</p>
                <p className="mt-1 flex items-center justify-end gap-1 text-[10px] font-bold uppercase tracking-wide text-neutral-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{t("mode.wins")}</p>
              </div>
              <div>
                <p className="text-[20px] font-extrabold leading-none text-neutral-900">{losses}</p>
                <p className="mt-1 flex items-center justify-end gap-1 text-[10px] font-bold uppercase tracking-wide text-neutral-400"><span className="h-1.5 w-1.5 rounded-full bg-red-400" />{t("mode.losses")}</p>
              </div>
            </div>
          </div>
          <div className="mt-3 flex h-1.5 w-full overflow-hidden rounded-full bg-black/10">
            <div className="h-full bg-emerald-500" style={{ width: `${winRate}%` }} />
            <div className="h-full bg-red-400" style={{ width: `${decided.length ? 100 - winRate : 0}%` }} />
          </div>
        </div>
      </div>

      {/* Sub-Tabs (Play-Segment-Stil) */}
      <div className="px-4 pb-2">
        <div className="flex gap-1.5 rounded-full bg-black/[0.05] p-1">
          {(["results", "stats"] as const).map((k) => (
            <button key={k} type="button" onClick={() => setTab(k)} className={`flex-1 rounded-full py-1.5 text-[13px] font-bold transition-colors ${tab === k ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"}`}>
              {t(k === "results" ? "mode.tabResults" : "mode.tabStats")}
            </button>
          ))}
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="mx-4 rounded-2xl bg-black/[0.035] p-5 text-center">
          <p className="text-[13px] text-neutral-500">{t("mode.noMatches")}</p>
          <button type="button" onClick={() => openSubView({ type: "tour-schedule", addKind: "match" })} className="mt-3 rounded-full bg-matchup px-4 py-2 text-[13px] font-bold text-white">+ {t("mode.logMatch")}</button>
        </div>
      ) : tab === "results" ? (
        <div className="space-y-2 px-4">
          {matches.map((m) => {
            const tr = m.tournament_id ? tById[m.tournament_id] : null;
            return (
              <button key={m.id} type="button" onClick={() => openSubView({ type: "tour-schedule", addKind: "match" })} className="flex w-full items-center gap-3 rounded-2xl bg-black/[0.035] p-3.5 text-left">
                {tr && <span className="text-[16px]">{flagEmoji(tr.country)}</span>}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-bold text-neutral-900">{m.opponent ? `vs ${m.opponent}` : m.title}</p>
                  <p className="truncate text-[11px] text-neutral-500">
                    {[m.round, tr?.name, fmt(m.event_date)].filter(Boolean).join(" · ")}
                  </p>
                  {m.score && <p className="mt-0.5 text-[12px] font-semibold text-neutral-700">{m.score}</p>}
                </div>
                {m.won != null && (
                  <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${m.won ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}>{m.won ? t("mode.wonShort") : t("mode.lostShort")}</span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="px-4">
          <p className="mb-2 px-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">{t("mode.winBySurface")}</p>
          {surf.size === 0 ? (
            <p className="rounded-2xl bg-black/[0.035] p-4 text-center text-[13px] text-neutral-400">{t("mode.noSurfaceData")}</p>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {[...surf.entries()].map(([s, r]) => {
                const total = r.w + r.l;
                const pct = total ? Math.round((r.w / total) * 100) : 0;
                return (
                  <div key={s} className="rounded-2xl bg-black/[0.035] p-3.5 text-center">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">{surfLabel[s] ?? s}</div>
                    <div className={`mt-1 text-[20px] font-extrabold ${pct >= 60 ? "text-emerald-600" : pct >= 45 ? "text-amber-600" : "text-red-600"}`}>{pct}%</div>
                    <div className="text-[10px] text-neutral-400">{r.w}W / {r.l}L</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
