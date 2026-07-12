"use client";

import { useEffect, useState } from "react";
import { useT, useLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { tournamentDeadlines, kindShort, deadlineClock } from "@/lib/deadlines";
import { flagEmoji } from "@/lib/flags";
import { loadProvidersNear, type ServiceProvider, type ServiceCategory } from "@/lib/services";
import { useAppNav } from "../appNav";
import { SubViewHeader } from "../shared/ui";
import ServiceProviderCard from "../shared/ServiceProviderCard";

type Tourn = { id: string; name: string; city: string | null; country: string | null; tier: string; surface: string; start_date: string; end_date: string };

// Service-Kategorie → Ausgaben-Kategorie (tour_expenses).
const CAT_TO_EXPENSE: Record<ServiceCategory, string> = {
  coach: "coach", sc: "coach", mental: "coach", nutrition: "coach", hitting: "coach",
  physio: "physio", stringer: "stringing", tour_companion: "other",
};

export default function TourTournament({ tournamentId }: { tournamentId: string }) {
  const t = useT();
  const { locale } = useLocale();
  const { profile } = useAppNav();
  const [tourn, setTourn] = useState<Tourn | null>(null);
  const [providers, setProviders] = useState<ServiceProvider[] | null>(null);
  const [prize, setPrize] = useState(0);
  const [cost, setCost] = useState(0);
  const [cur, setCur] = useState("EUR");
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("tournaments").select("id,name,city,country,tier,surface,start_date,end_date").eq("id", tournamentId).maybeSingle();
      const tr = (data as Tourn | null) ?? null;
      setTourn(tr);
      const [{ data: pz }, { data: ex }] = await Promise.all([
        supabase.from("tour_prize").select("amount,currency").eq("user_id", profile.id).eq("tournament_id", tournamentId),
        supabase.from("tour_expenses").select("amount,currency").eq("user_id", profile.id).eq("tournament_id", tournamentId),
      ]);
      let p = 0, c = 0, cc = "";
      for (const r of (pz as { amount: number | null; currency: string | null }[]) ?? []) { p += Number(r.amount) || 0; if (!cc && r.currency) cc = r.currency; }
      for (const r of (ex as { amount: number | null; currency: string | null }[]) ?? []) { c += Number(r.amount) || 0; if (!cc && r.currency) cc = r.currency; }
      setPrize(p); setCost(c); setCur(cc || "EUR");
      if (tr?.city) { const r = await loadProvidersNear(tr.city, 12); setProviders(r.rows); } else setProviders([]);
      setLoaded(true);
    })();
  }, [tournamentId, profile.id]);

  async function addExpense(p: ServiceProvider) {
    await supabase.from("tour_expenses").insert({
      user_id: profile.id,
      tournament_id: tournamentId,
      merchant: p.name,
      amount: p.price_from ?? 0,
      currency: p.currency ?? cur,
      category: CAT_TO_EXPENSE[p.category] ?? "other",
      spent_on: new Date().toISOString().slice(0, 10),
    });
    setAdded((a) => ({ ...a, [p.id]: true }));
    setCost((c) => c + (p.price_from ?? 0));
  }

  const money = (n: number) => `${n < 0 ? "−" : ""}${Math.abs(n).toLocaleString(locale, { maximumFractionDigits: 0 })} ${cur}`;
  const fmt = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString(locale, { day: "numeric", month: "short" });

  if (!loaded) return <div className="flex h-full items-center justify-center bg-white text-neutral-400">…</div>;
  if (!tourn) return <div className="flex h-full flex-col bg-white"><SubViewHeader light title="—" /><p className="p-8 text-center text-sm text-neutral-400">{t("mode.noData")}</p></div>;

  const deadlines = tournamentDeadlines({ start: tourn.start_date, tier: tourn.tier });
  const net = prize - cost;

  return (
    <div className="flex h-full flex-col bg-white text-neutral-900">
      <SubViewHeader light title={t("services.workspace")} />
      <div className="flex-1 overflow-y-auto p-4 pb-28">
        {/* Kopf */}
        <div className="flex items-center gap-3">
          <span className="text-[26px]">{flagEmoji(tourn.country)}</span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[18px] font-extrabold tracking-tight text-neutral-900">{tourn.name}</h2>
            <p className="text-[12px] text-neutral-500">{tourn.tier} · {tourn.surface} · {fmt(tourn.start_date)}–{fmt(tourn.end_date)}{tourn.city ? ` · ${tourn.city}` : ""}</p>
          </div>
        </div>

        {/* P&L */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { v: money(prize), l: t("mode.prizeMoney"), c: "text-neutral-900" },
            { v: money(cost), l: t("mode.costsLabel"), c: "text-neutral-900" },
            { v: money(net), l: t("mode.net"), c: net >= 0 ? "text-emerald-600" : "text-red-600" },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl bg-black/[0.035] px-2 py-3 text-center">
              <div className={`text-[14px] font-extrabold tracking-tight ${s.c}`}>{s.v}</div>
              <div className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-neutral-400">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Deadlines */}
        <p className="mb-2 mt-6 px-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">{t("mode.deadlines")}</p>
        <div className="rounded-2xl bg-black/[0.035] p-2">
          {deadlines.map((d, i) => (
            <div key={i} className={`flex items-center justify-between px-2.5 py-2 ${i > 0 ? "border-t border-black/[0.06]" : ""}`}>
              <span className="text-[13px] font-semibold text-neutral-800">{kindShort(d.kind, locale)}</span>
              <span className="text-[12px] text-neutral-500">{fmt(d.date)}{deadlineClock(d) ? ` · ${deadlineClock(d)}` : ""}</span>
            </div>
          ))}
        </div>
        <p className="mt-1 px-1 text-[10px] text-neutral-400">{t("mode.deadlineDisclaimer")}</p>

        {/* Services in dieser Stadt */}
        <p className="mb-2 mt-6 px-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">{t("services.inCity", { city: tourn.city ?? "" })}</p>
        {providers === null ? null : providers.length === 0 ? (
          <p className="rounded-2xl bg-black/[0.035] p-4 text-center text-[13px] text-neutral-400">{t("services.empty")}</p>
        ) : (
          <div className="space-y-2.5">
            {providers.map((p) => (
              <div key={p.id}>
                <ServiceProviderCard p={p} />
                <button
                  type="button"
                  onClick={() => addExpense(p)}
                  disabled={!!added[p.id]}
                  className={`mt-1 w-full rounded-full py-2 text-[12px] font-bold ${added[p.id] ? "bg-emerald-500/10 text-emerald-600" : "bg-black/[0.05] text-matchup"}`}
                >
                  {added[p.id] ? t("services.expenseAdded") : t("services.addExpense", { price: p.price_from != null ? `${p.price_from} ${p.currency}` : "" })}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
