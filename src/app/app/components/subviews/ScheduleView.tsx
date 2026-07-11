"use client";

import { useEffect, useState } from "react";
import { useT, useLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { loadTourPlan, ensureCalendarToken, calendarFeedUrl } from "@/lib/tour";
import { useAppNav } from "../appNav";
import { SubViewHeader } from "../shared/ui";

const KINDS = ["training", "match", "physio", "travel", "gym", "other"] as const;
type Kind = (typeof KINDS)[number];
const DOT: Record<Kind, string> = {
  training: "bg-emerald-500", match: "bg-red-500", physio: "bg-matchup",
  travel: "bg-blue-500", gym: "bg-amber-500", other: "bg-neutral-400",
};

type Ev = { id: string; kind: string; title: string; event_date: string; event_time: string | null; note: string | null; tournament_id: string | null };
type Tourn = { id: string; name: string };
type Draft = { kind: Kind; title: string; event_date: string; event_time: string; tournament_id: string };

function todayISO() { return new Date().toISOString().slice(0, 10); }
const emptyDraft = (kind: Kind = "training"): Draft => ({ kind, title: "", event_date: todayISO(), event_time: "", tournament_id: "" });

export default function ScheduleView({ addKind }: { addKind?: string }) {
  const t = useT();
  const { locale } = useLocale();
  const { profile } = useAppNav();
  const [rows, setRows] = useState<Ev[]>([]);
  const [plan, setPlan] = useState<Tourn[]>([]);
  const [draft, setDraft] = useState<Draft | null>(
    addKind && (KINDS as readonly string[]).includes(addKind) ? emptyDraft(addKind as Kind) : null,
  );
  const [saving, setSaving] = useState(false);
  const [feed, setFeed] = useState<string | null>(null);
  const [syncOpen, setSyncOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const kindLabel = (k: string) => t(`mode.ekind_${k}`);

  async function openSync() {
    const token = await ensureCalendarToken(profile.id);
    setFeed(calendarFeedUrl(token));
    setSyncOpen(true);
    setCopied(false);
  }
  async function copyFeed() {
    if (!feed) return;
    try { await navigator.clipboard.writeText(feed); } catch { /* ignore */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function load() {
    const { data } = await supabase
      .from("tour_events")
      .select("id,kind,title,event_date,event_time,note,tournament_id")
      .eq("user_id", profile.id)
      .gte("event_date", todayISO())
      .order("event_date")
      .order("event_time", { nullsFirst: true });
    setRows((data as Ev[]) ?? []);
    const ids = await loadTourPlan(profile.id);
    if (ids.length) {
      const { data: ts } = await supabase.from("tournaments").select("id,name").in("id", ids);
      setPlan((ts as Tourn[]) ?? []);
    }
  }
  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    if (!draft || !draft.title.trim()) return;
    setSaving(true);
    await supabase.from("tour_events").insert({
      user_id: profile.id,
      kind: draft.kind,
      title: draft.title.trim(),
      event_date: draft.event_date,
      event_time: draft.event_time || null,
      tournament_id: draft.tournament_id || null,
    });
    setSaving(false);
    setDraft(null);
    void load();
  }
  async function remove(id: string) {
    await supabase.from("tour_events").delete().eq("id", id);
    void load();
  }

  // Nach Datum gruppieren.
  const groups = new Map<string, Ev[]>();
  for (const r of rows) {
    if (!groups.has(r.event_date)) groups.set(r.event_date, []);
    groups.get(r.event_date)!.push(r);
  }
  const dayLabel = (iso: string) => {
    const d = new Date(iso + "T00:00:00");
    if (iso === todayISO()) return t("mode.today");
    return d.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });
  };

  return (
    <div className="flex h-full flex-col bg-white text-neutral-900">
      <SubViewHeader
        light
        title={t("mode.scheduleTitle")}
        rightActions={
          <div className="flex items-center gap-3">
            <button type="button" onClick={openSync} className="text-[13px] font-bold text-matchup">{t("mode.sync")}</button>
            <button type="button" onClick={() => setDraft(emptyDraft())} className="text-[13px] font-bold text-matchup">+ {t("mode.addEvent")}</button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 pb-28">
        {rows.length === 0 ? (
          <p className="pt-8 text-center text-[13px] text-neutral-400">{t("mode.noEvents")}</p>
        ) : (
          [...groups.entries()].map(([date, evs]) => (
            <div key={date} className="mb-5">
              <p className="mb-2 px-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-neutral-400">{dayLabel(date)}</p>
              <div className="rounded-2xl bg-black/[0.035] p-2">
                {evs.map((e, i) => (
                  <div key={e.id} className={`flex items-center gap-3 px-2.5 py-3 ${i > 0 ? "border-t border-black/[0.06]" : ""}`}>
                    <span className="w-11 shrink-0 text-[12px] font-bold text-neutral-500">{e.event_time ? e.event_time.slice(0, 5) : "—"}</span>
                    <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[(e.kind as Kind)] ?? DOT.other}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold text-neutral-900">{e.title}</p>
                      <p className="text-[11.5px] text-neutral-500">
                        {kindLabel(e.kind)}
                        {e.tournament_id && plan.find((p) => p.id === e.tournament_id) ? ` · ${plan.find((p) => p.id === e.tournament_id)!.name}` : ""}
                      </p>
                    </div>
                    <button type="button" onClick={() => remove(e.id)} aria-label="×" className="shrink-0 text-neutral-300">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {syncOpen && feed && (
        <div className="fixed inset-0 z-[70] mx-auto flex max-w-[430px] items-end bg-black/40 backdrop-blur-sm" onClick={() => setSyncOpen(false)}>
          <div className="w-full rounded-t-[28px] bg-white p-5 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-base font-bold text-neutral-900">{t("mode.syncTitle")}</span>
              <button type="button" onClick={() => setSyncOpen(false)} className="text-sm font-medium text-neutral-500">{t("common.close")}</button>
            </div>
            <p className="mb-4 text-[13px] leading-relaxed text-neutral-500">{t("mode.syncBody")}</p>
            <div className="grid grid-cols-2 gap-2.5">
              <a href={feed.replace(/^https?:/, "webcal:")} className="flex items-center justify-center gap-2 rounded-xl bg-black py-3 text-[13px] font-bold text-white">
                 Apple
              </a>
              <a href={`https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(feed)}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-black/[0.05] py-3 text-[13px] font-bold text-neutral-800">
                Google
              </a>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-black/[0.04] p-2">
              <span className="min-w-0 flex-1 truncate px-2 text-[12px] text-neutral-500">{feed}</span>
              <button type="button" onClick={copyFeed} className="shrink-0 rounded-lg bg-matchup px-3 py-2 text-[12px] font-bold text-white">{copied ? t("mode.copied") : t("mode.copyLink")}</button>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-neutral-400">{t("mode.syncHint")}</p>
          </div>
        </div>
      )}

      {draft && (
        <div className="fixed inset-0 z-[70] mx-auto flex max-w-[430px] items-end bg-black/40 backdrop-blur-sm" onClick={() => setDraft(null)}>
          <div className="w-full rounded-t-[28px] bg-white p-5 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-base font-bold text-neutral-900">{t("mode.addEvent")}</span>
              <button type="button" onClick={() => setDraft(null)} className="text-sm font-medium text-neutral-500">{t("common.cancel")}</button>
            </div>
            <div className="space-y-2.5">
              <div className="flex flex-wrap gap-1.5">
                {KINDS.map((k) => (
                  <button key={k} type="button" onClick={() => setDraft({ ...draft, kind: k })} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold ${draft.kind === k ? "bg-matchup text-white" : "bg-black/[0.05] text-neutral-600"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${draft.kind === k ? "bg-white" : DOT[k]}`} /> {kindLabel(k)}
                  </button>
                ))}
              </div>
              <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder={t("mode.eventTitle")} className="w-full rounded-xl bg-black/[0.04] px-4 py-3 text-sm outline-none" />
              <div className="flex gap-2">
                <input type="date" value={draft.event_date} onChange={(e) => setDraft({ ...draft, event_date: e.target.value })} className="flex-1 rounded-xl bg-black/[0.04] px-4 py-3 text-sm outline-none" />
                <input type="time" value={draft.event_time} onChange={(e) => setDraft({ ...draft, event_time: e.target.value })} className="w-32 rounded-xl bg-black/[0.04] px-4 py-3 text-sm outline-none" />
              </div>
              {plan.length > 0 && (
                <select value={draft.tournament_id} onChange={(e) => setDraft({ ...draft, tournament_id: e.target.value })} className="w-full rounded-xl bg-black/[0.04] px-4 py-3 text-sm outline-none">
                  <option value="">{t("mode.noTournament")}</option>
                  {plan.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              )}
              <button type="button" onClick={save} disabled={saving || !draft.title.trim()} className="mt-1 w-full rounded-full bg-matchup py-3.5 text-sm font-bold text-white disabled:opacity-50">
                {saving ? t("mode.saving") : t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
