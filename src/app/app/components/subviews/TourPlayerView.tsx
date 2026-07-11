"use client";

import { useEffect, useState } from "react";
import { useT, useLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { SubViewHeader } from "../shared/ui";

const DOT: Record<string, string> = {
  training: "bg-emerald-500", match: "bg-red-500", physio: "bg-matchup",
  travel: "bg-blue-500", gym: "bg-amber-500", other: "bg-neutral-400",
};
type Ev = { id: string; kind: string; title: string; event_date: string; event_time: string | null };
type Exp = { amount: number | null; currency: string | null };

function todayISO() { return new Date().toISOString().slice(0, 10); }

export default function TourPlayerView({ playerId, role, playerName }: { playerId: string; role: string; playerName?: string }) {
  const t = useT();
  const { locale } = useLocale();
  const [events, setEvents] = useState<Ev[]>([]);
  const [expTotals, setExpTotals] = useState<[string, number][]>([]);
  const [loaded, setLoaded] = useState(false);
  const isAgent = role === "agent";

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: ev } = await supabase
        .from("tour_events")
        .select("id,kind,title,event_date,event_time")
        .eq("user_id", playerId)
        .gte("event_date", todayISO())
        .order("event_date")
        .order("event_time", { nullsFirst: true });
      let totals: [string, number][] = [];
      if (isAgent) {
        const { data: exp } = await supabase.from("tour_expenses").select("amount,currency").eq("user_id", playerId);
        const m = new Map<string, number>();
        for (const r of (exp as Exp[]) ?? []) {
          if (r.amount == null) continue;
          const c = r.currency ?? "?";
          m.set(c, (m.get(c) ?? 0) + Number(r.amount));
        }
        totals = [...m.entries()];
      }
      if (!alive) return;
      setEvents((ev as Ev[]) ?? []);
      setExpTotals(totals);
      setLoaded(true);
    })();
    return () => { alive = false; };
  }, [playerId, isAgent]);

  const groups = new Map<string, Ev[]>();
  for (const e of events) {
    if (!groups.has(e.event_date)) groups.set(e.event_date, []);
    groups.get(e.event_date)!.push(e);
  }
  const dayLabel = (iso: string) => {
    if (iso === todayISO()) return t("mode.today");
    return new Date(iso + "T00:00:00").toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });
  };

  return (
    <div className="flex h-full flex-col bg-white text-neutral-900">
      <SubViewHeader light title={playerName ?? t("mode.player")} />
      <div className="flex-1 overflow-y-auto p-4 pb-28">
        {/* Finanzen (nur Agent) */}
        {isAgent && expTotals.length > 0 && (
          <div className="mb-5 rounded-2xl bg-black/[0.035] p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">{t("mode.expensesTotal")}</p>
            <div className="mt-1 flex flex-wrap gap-x-4">
              {expTotals.map(([c, v]) => (
                <span key={c} className="text-[20px] font-extrabold tracking-tight text-neutral-900">{v.toLocaleString(locale, { maximumFractionDigits: 0 })} {c}</span>
              ))}
            </div>
          </div>
        )}

        {/* Kalender (read-only) */}
        <p className="mb-2 px-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">{t("mode.scheduleTitle")}</p>
        {!loaded ? null : events.length === 0 ? (
          <p className="pt-4 text-center text-[13px] text-neutral-400">{t("mode.noEvents")}</p>
        ) : (
          [...groups.entries()].map(([date, evs]) => (
            <div key={date} className="mb-4">
              <p className="mb-1.5 px-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-neutral-400">{dayLabel(date)}</p>
              <div className="rounded-2xl bg-black/[0.035] p-2">
                {evs.map((e, i) => (
                  <div key={e.id} className={`flex items-center gap-3 px-2.5 py-2.5 ${i > 0 ? "border-t border-black/[0.06]" : ""}`}>
                    <span className="w-11 shrink-0 text-[12px] font-bold text-neutral-500">{e.event_time ? e.event_time.slice(0, 5) : "—"}</span>
                    <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[e.kind] ?? DOT.other}`} />
                    <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-neutral-900">{e.title}</span>
                    <span className="shrink-0 text-[11px] text-neutral-400">{t(`mode.ekind_${e.kind}`)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
        <p className="mt-3 px-1 text-[10px] text-neutral-400">{t("mode.teamReadonly")}</p>
      </div>
    </div>
  );
}
