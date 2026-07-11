"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { useT, useLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { useAppNav } from "../appNav";
import { loadTourProfile, loadTourPlan } from "@/lib/tour";
import { planAlerts, kindShort, type Urgency } from "@/lib/deadlines";
import { schengenProjection } from "@/lib/schengen";
import type { TourProfile } from "@/lib/types";

const MS_DAY = 86_400_000;

const CIRCUIT_LABEL: Record<string, string> = {
  atp: "ATP Tour",
  challenger: "ATP Challenger",
  itf: "ITF World Tennis Tour",
  wta: "WTA Tour",
};

type Tourn = { id: string; name: string; city: string | null; tier: string; surface: string; start_date: string; end_date: string; country: string | null };

function SecLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2.5 mt-6 px-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-neutral-400 first:mt-0">{children}</p>;
}

export default function TourHome() {
  const t = useT();
  const { locale } = useLocale();
  const { profile, openSubView } = useAppNav();
  const [tour, setTour] = useState<TourProfile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [tournaments, setTournaments] = useState<Tourn[]>([]);
  const [inPlan, setInPlan] = useState(false);
  const [expTotals, setExpTotals] = useState<[string, number][]>([]);
  const [todayEv, setTodayEv] = useState<{ id: string; kind: string; title: string; event_time: string | null }[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [tp, planIds] = await Promise.all([loadTourProfile(profile.id), loadTourPlan(profile.id)]);
      const today = new Date().toISOString().slice(0, 10);
      // Turniere: bevorzugt aus dem Saisonplan; sonst die nächsten drei als Anregung.
      const q = supabase.from("tournaments").select("id,name,city,tier,surface,start_date,end_date,country");
      const { data } = planIds.length
        ? await q.in("id", planIds).order("start_date")
        : await q.gte("end_date", today).order("start_date").limit(3);
      const { data: exp } = await supabase.from("tour_expenses").select("amount,currency").eq("user_id", profile.id);
      const { data: ev } = await supabase
        .from("tour_events")
        .select("id,kind,title,event_time")
        .eq("user_id", profile.id)
        .eq("event_date", today)
        .order("event_time", { nullsFirst: true });
      if (!alive) return;
      setTodayEv((ev as { id: string; kind: string; title: string; event_time: string | null }[]) ?? []);
      setTour(tp);
      setInPlan(planIds.length > 0);
      setTournaments(((data as Tourn[]) ?? []).filter((tr) => tr.end_date >= today));
      const totals = new Map<string, number>();
      for (const r of (exp as { amount: number | null; currency: string | null }[]) ?? []) {
        if (r.amount == null) continue;
        const c = r.currency ?? "?";
        totals.set(c, (totals.get(c) ?? 0) + Number(r.amount));
      }
      setExpTotals([...totals.entries()]);
      setLoaded(true);
    })();
    return () => { alive = false; };
  }, [profile.id]);

  if (!loaded) return null;

  const hasTour = !!tour && (tour.circuit || tour.ranking != null);
  const fmt = (iso: string) => new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short" });

  // Deadline-Alerts aus dem Saisonplan (nur wenn Turniere eingeplant sind).
  const alerts = inPlan
    ? planAlerts(tournaments.map((tr) => ({ ...tr, start: tr.start_date }))).slice(0, 6)
    : [];
  const URG_BG: Record<Urgency, string> = {
    red: "bg-red-500/10 text-red-600",
    amber: "bg-amber-500/10 text-amber-600",
    none: "bg-black/[0.05] text-neutral-500",
  };
  const URG_DOT: Record<Urgency, string> = { red: "bg-red-500", amber: "bg-amber-500", none: "bg-neutral-400" };
  const daysLabel = (n: number) => (n === 0 ? t("mode.today") : t("mode.inDays", { n }));

  // Schengen 90/180-Projektion aus den Plan-Turnieren.
  const schengen = inPlan
    ? schengenProjection(tournaments.map((tr) => ({ start: tr.start_date, end: tr.end_date, country: tr.country })))
    : null;
  const schengenPct = schengen ? Math.min(100, Math.round((schengen.used / 90) * 100)) : 0;
  const schengenUrg: Urgency = schengen ? (schengen.left <= 7 ? "red" : schengen.left <= 21 ? "amber" : "none") : "none";

  // ESTA/Visum-Ablauf.
  const estaExpiry = tour?.esta_expiry ?? null;
  const estaDays = estaExpiry ? Math.round((Date.parse(estaExpiry + "T00:00:00Z") - Date.now()) / MS_DAY) : null;
  const estaUrg: Urgency = estaDays == null ? "none" : estaDays <= 30 ? "red" : estaDays <= 90 ? "amber" : "none";
  const hasEsta = !!tour?.esta_status && tour.esta_status !== "None";
  const dateFmt = (iso: string) => new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="px-4 pb-28">
      {/* Dringend: nächste Deadlines aus dem Saisonplan */}
      {alerts.length > 0 && (
        <>
          <SecLabel>{t("mode.urgent")}</SecLabel>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {alerts.map((a, i) => (
              <a
                key={i}
                href="/map"
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-semibold ${URG_BG[a.urgency]}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${URG_DOT[a.urgency]}`} />
                {kindShort(a.kind, locale)} {a.tournament.city ?? a.tournament.name} · {daysLabel(a.daysLeft)}
              </a>
            ))}
          </div>
          <p className="mt-1 px-1 text-[10px] text-neutral-400">{t("mode.deadlineDisclaimer")}</p>
        </>
      )}

      {/* Setup-CTA, wenn noch kein Tour-Profil */}
      {!hasTour && (
        <div className="mt-4 rounded-[24px] bg-gradient-to-br from-matchup to-indigo-500 p-5 text-white">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/15">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor"><path d="M5 16l-2-9 5.5 4L12 5l3.5 6L21 7l-2 9zM5 20h14" /></svg>
          </div>
          <h3 className="text-[19px] font-bold leading-tight tracking-tight">{t("mode.setupTitle")}</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-white/85">{t("mode.setupSub")}</p>
          <button type="button" onClick={() => openSubView({ type: "tour-profile-edit" })} className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-[13px] font-bold text-matchup">
            {t("mode.setupCta")}
          </button>
        </div>
      )}

      {/* Ranking-Karte */}
      {hasTour && (
        <>
          <SecLabel>{t("mode.rankingSection")}</SecLabel>
          <button type="button" onClick={() => openSubView({ type: "tour-profile-edit" })} className="block w-full rounded-[24px] bg-black/[0.035] p-5 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-neutral-500">{tour?.circuit ? CIRCUIT_LABEL[tour.circuit] : "—"}</span>
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white px-3 py-4 text-center ring-1 ring-black/[0.06]">
                <div className="text-[22px] font-extrabold tracking-tight text-neutral-900">{tour?.ranking ?? "—"}</div>
                <div className="mt-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-neutral-400">{t("mode.ranking")}</div>
              </div>
              <div className="rounded-2xl bg-white px-3 py-4 text-center ring-1 ring-black/[0.06]">
                <div className="text-[22px] font-extrabold tracking-tight text-neutral-900">{tour?.points ?? "—"}</div>
                <div className="mt-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-neutral-400">{t("mode.points")}</div>
              </div>
            </div>
          </button>
        </>
      )}

      {/* Heute (Termine) */}
      {todayEv.length > 0 && (
        <>
          <div className="mt-6 mb-2.5 flex items-center justify-between px-1">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">{t("mode.todaySchedule")}</span>
            <button type="button" onClick={() => openSubView({ type: "tour-schedule" })} className="text-[11px] font-bold uppercase tracking-wider text-matchup">{t("mode.openSchedule")}</button>
          </div>
          <div className="rounded-2xl bg-black/[0.035] p-2">
            {todayEv.map((e, i) => {
              const dot: Record<string, string> = { training: "bg-emerald-500", match: "bg-red-500", physio: "bg-matchup", travel: "bg-blue-500", gym: "bg-amber-500", other: "bg-neutral-400" };
              return (
                <div key={e.id} className={`flex items-center gap-3 px-2.5 py-2.5 ${i > 0 ? "border-t border-black/[0.06]" : ""}`}>
                  <span className="w-11 shrink-0 text-[12px] font-bold text-neutral-500">{e.event_time ? e.event_time.slice(0, 5) : "—"}</span>
                  <span className={`h-2 w-2 shrink-0 rounded-full ${dot[e.kind] ?? dot.other}`} />
                  <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-neutral-900">{e.title}</span>
                  <span className="shrink-0 text-[11px] text-neutral-400">{t(`mode.ekind_${e.kind}`)}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Schnellaktionen */}
      <SecLabel>{t("mode.quickActions")}</SecLabel>
      <div className="grid grid-cols-3 gap-3">
        {[
          { l: t("mode.scanReceipt"), p: "M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2M4 12h16", active: true },
          { l: t("mode.logTraining"), p: "M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM12 14v3M10.5 15.5h3", active: true, to: "schedule" as const },
          { l: t("mode.deadlines"), p: "M12 8v4l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", active: false },
        ].map((a) => (
          <button
            key={a.l}
            type="button"
            onClick={() => {
              if (!a.active) return;
              if ("to" in a && a.to === "schedule") openSubView({ type: "tour-schedule", addKind: "training" });
              else openSubView({ type: "tour-expenses" });
            }}
            className="relative flex flex-col items-center gap-2 rounded-2xl bg-black/[0.035] px-2 py-4 text-center"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-matchup" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={a.p} /></svg>
            <span className="text-[11px] font-semibold text-neutral-600">{a.l}</span>
            {!a.active && <span className="absolute right-1.5 top-1.5 rounded-full bg-black/[0.06] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-neutral-400">{t("mode.comingSoon")}</span>}
          </button>
        ))}
      </div>

      {/* Dein Team */}
      <SecLabel>{t("mode.yourTeam")}</SecLabel>
      {tour?.team && tour.team.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {tour.team.map((m, i) => (
            <div key={i} className="flex w-16 shrink-0 flex-col items-center gap-1.5">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-200 text-[15px] font-bold text-neutral-500">
                {(m.name?.[0] ?? "?").toUpperCase()}
              </span>
              <span className="max-w-16 truncate text-[11px] font-semibold text-neutral-700">{m.name}</span>
              <span className="text-[9px] text-neutral-400">{m.role}</span>
            </div>
          ))}
        </div>
      ) : (
        <button type="button" onClick={() => openSubView({ type: "tour-profile-edit" })} className="flex w-full items-center gap-1.5 rounded-2xl bg-black/[0.035] px-4 py-3.5 text-left text-[13px] font-semibold text-matchup">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          {t("mode.inviteTeam")}
        </button>
      )}

      {/* Visa / Compliance */}
      <SecLabel>{t("mode.visaStatus")}</SecLabel>

      {/* Schengen 90/180 aus dem Plan */}
      {schengen && (
        <div className="mb-2 rounded-2xl bg-black/[0.035] p-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-bold text-neutral-900">{t("mode.schengen")}</p>
            <span className={`text-[12px] font-bold ${schengenUrg === "red" ? "text-red-600" : schengenUrg === "amber" ? "text-amber-600" : "text-neutral-500"}`}>
              {t("mode.daysLeft", { n: schengen.left })}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
            <div className={`h-full rounded-full ${schengenUrg === "red" ? "bg-red-500" : schengenUrg === "amber" ? "bg-amber-500" : "bg-matchup"}`} style={{ width: `${schengenPct}%` }} />
          </div>
          <p className="mt-1.5 text-[11px] text-neutral-500">{t("mode.schengenUsed", { used: schengen.used })}</p>
        </div>
      )}

      {/* ESTA / US-Einreise */}
      <div className="flex items-center gap-3 rounded-2xl bg-black/[0.035] p-4">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${estaUrg === "red" ? "bg-red-500/10 text-red-600" : estaUrg === "amber" ? "bg-amber-500/10 text-amber-600" : "bg-black/[0.05] text-neutral-500"}`}>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" strokeLinecap="round" /></svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-neutral-900">{hasEsta ? tour!.esta_status : t("mode.esta")}</p>
          <p className="truncate text-[12px] text-neutral-500">
            {hasEsta && estaExpiry
              ? `${t("mode.estaUntil", { date: dateFmt(estaExpiry) })}${estaDays != null && estaDays >= 0 ? ` · ${daysLabel(estaDays)}` : ""}`
              : t("mode.estaNone")}
          </p>
        </div>
      </div>

      {(schengen || hasEsta) && (
        <p className="mt-1 px-1 text-[10px] text-neutral-400">{t("mode.visaDisclaimer")}</p>
      )}

      {/* Turniere: Saisonplan (mit nächster Frist) oder Anregung */}
      <div className="mt-6 mb-2.5 flex items-center justify-between px-1">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">
          {inPlan ? t("mode.yourTournaments") : t("mode.upcoming")}
        </span>
        <a href="/map" className="text-[11px] font-bold uppercase tracking-wider text-matchup">{t("mode.planSeason")}</a>
      </div>
      <div className="rounded-2xl bg-black/[0.035] p-2">
        {tournaments.length === 0 ? (
          <p className="px-3 py-4 text-center text-[13px] text-neutral-400">
            {inPlan ? t("mode.noData") : t("mode.briefingEmpty")}
          </p>
        ) : (
          tournaments.map((tr, i) => {
            const next = alerts.find((a) => a.tournament.id === tr.id);
            return (
              <a key={tr.id} href="/map" className={`flex items-center gap-3 px-2.5 py-3 ${i > 0 ? "border-t border-black/[0.06]" : ""}`}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-bold text-neutral-900">{tr.name}</p>
                  <p className="text-[11.5px] text-neutral-500">{tr.tier} · {tr.surface} · {fmt(tr.start_date)}–{fmt(tr.end_date)}</p>
                </div>
                {next && (
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-bold ${URG_BG[next.urgency]}`}>
                    {kindShort(next.kind, locale)} · {daysLabel(next.daysLeft)}
                  </span>
                )}
              </a>
            );
          })
        )}
      </div>

      {/* Finanzen */}
      <SecLabel>{t("mode.financeTitle")}</SecLabel>
      <button type="button" onClick={() => openSubView({ type: "tour-expenses" })} className="flex w-full items-center gap-3 rounded-2xl bg-black/[0.035] p-4 text-left">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-matchup/10 text-matchup">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" /><circle cx="12" cy="12" r="3" /></svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-neutral-900">{t("mode.openFinance")}</p>
          <p className="truncate text-[12px] text-neutral-500">
            {expTotals.length
              ? `${t("mode.financeExpenses")}: ${expTotals.map(([c, v]) => `${v.toLocaleString(locale, { maximumFractionDigits: 0 })} ${c}`).join(" · ")}`
              : t("mode.financeSoon")}
          </p>
        </div>
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg>
      </button>
    </div>
  );
}
