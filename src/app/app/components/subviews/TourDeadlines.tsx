"use client";

import { useEffect, useState } from "react";
import { useT, useLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { loadTourPlan } from "@/lib/tour";
import { planAlerts, kindShort, type Urgency, type Alert } from "@/lib/deadlines";
import { useAppNav } from "../appNav";
import { SubViewHeader } from "../shared/ui";

type Tourn = { id: string; name: string; city: string | null; tier: string; start_date: string; end_date: string };

const URG_BG: Record<Urgency, string> = {
  red: "bg-red-500/10 text-red-600", amber: "bg-amber-500/10 text-amber-600", none: "bg-black/[0.05] text-neutral-500",
};
const URG_DOT: Record<Urgency, string> = { red: "bg-red-500", amber: "bg-amber-500", none: "bg-neutral-400" };

export default function TourDeadlines() {
  const t = useT();
  const { locale } = useLocale();
  const { profile } = useAppNav();
  const [alerts, setAlerts] = useState<Alert<Tourn & { start: string }>[] | null>(null);

  useEffect(() => {
    (async () => {
      const ids = await loadTourPlan(profile.id);
      if (!ids.length) { setAlerts([]); return; }
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("tournaments")
        .select("id,name,city,tier,start_date,end_date")
        .in("id", ids);
      const tours = ((data as Tourn[]) ?? []).filter((tr) => tr.end_date >= today).map((tr) => ({ ...tr, start: tr.start_date }));
      setAlerts(planAlerts(tours, 180));
    })();
  }, [profile.id]);

  const daysLabel = (n: number) => (n === 0 ? t("mode.today") : t("mode.inDays", { n }));
  const dateFmt = (iso: string) => new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short" });

  return (
    <div className="flex h-full flex-col bg-white text-neutral-900">
      <SubViewHeader light title={t("mode.deadlines")} />
      <div className="flex-1 overflow-y-auto p-4 pb-28">
        {alerts === null ? null : alerts.length === 0 ? (
          <p className="pt-8 text-center text-[13px] text-neutral-400">{t("mode.briefingEmpty")}</p>
        ) : (
          <div className="space-y-2">
            {alerts.map((a, i) => (
              <a key={i} href="/map" className="flex items-center gap-3 rounded-2xl bg-black/[0.035] p-3.5">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${URG_DOT[a.urgency]}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold text-neutral-900">{kindShort(a.kind, locale)} · {a.tournament.city ?? a.tournament.name}</p>
                  <p className="text-[11.5px] text-neutral-500">{a.tournament.name} · {a.tournament.tier} · {dateFmt(a.date)}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-bold ${URG_BG[a.urgency]}`}>{daysLabel(a.daysLeft)}</span>
              </a>
            ))}
          </div>
        )}
        <p className="mt-3 px-1 text-[10px] text-neutral-400">{t("mode.deadlineDisclaimer")}</p>
      </div>
    </div>
  );
}
