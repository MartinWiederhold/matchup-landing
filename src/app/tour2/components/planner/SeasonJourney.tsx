"use client";

/**
 * Saison als Reiseverlauf: Stopp für Stopp, dazwischen nur belegte Etappen
 * (km, Anreise-Satz, Ruhetage, knappe Anreise). Keine Flugzeiten.
 */

import { useEffect, useRef } from "react";
import { useT } from "@/lib/i18n";

export type JourneyLeg = {
  km: number | null;
  restDays: number;
  tight: boolean;
  cluster: boolean;
  arrivalText: string | null;
};

export type JourneyStop = {
  id: string;
  order: number;
  city: string;
  country: string;
  date: string;
  month: string;
  category: string;
  pill: React.ReactNode;
};

export default function SeasonJourney({
  startLabel,
  stops,
  legs,
  selectedId,
  onSelect,
  onRemove,
  empty,
}: {
  startLabel: string | null;
  stops: JourneyStop[];
  legs: JourneyLeg[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  empty: React.ReactNode;
}) {
  const t = useT();
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!selectedId || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-stop="${selectedId}"]`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedId]);

  if (stops.length === 0) return <>{empty}</>;

  let lastMonth = "";
  return (
    <ul ref={listRef} className="space-y-0">
      {startLabel && (
        <li className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-neutral-900">
          <span className="flex h-6 w-6 items-center justify-center border border-black/20 text-[11px]">⌂</span>
          {t("tour.t2startHome", { name: startLabel })}
        </li>
      )}
      {stops.map((s, idx) => {
        const leg = idx > 0 ? legs[idx - 1] : null;
        const showMonth = s.month !== lastMonth;
        lastMonth = s.month;
        const sel = selectedId === s.id;
        return (
          <li key={s.id} data-stop={s.id}>
            {showMonth && (
              <p className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-500 first:mt-0">{s.month}</p>
            )}
            {leg && (
              <div className={`my-1 ml-[11px] border-l-2 py-2 pl-5 text-[11px] leading-snug ${leg.tight ? "border-neutral-900 text-neutral-800" : "border-black/15 text-neutral-500"}`}>
                {leg.cluster ? (
                  <p>{t("tour.t2legCluster")}</p>
                ) : (
                  <>
                    {leg.km != null && <p>{t("tour.t2legKm", { n: Math.round(leg.km) })}{leg.arrivalText ? ` · ${leg.arrivalText}` : ""}</p>}
                    {leg.km == null && leg.arrivalText && <p>{leg.arrivalText}</p>}
                    <p>{leg.tight ? t("tour.t2legTight", { n: leg.restDays }) : t("tour.t2legRest", { n: leg.restDays })}</p>
                  </>
                )}
              </div>
            )}
            <div className={`flex items-start gap-2 border-l-2 px-2 py-2 ${sel ? "border-matchup bg-neutral-50" : "border-transparent"}`}>
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center bg-matchup text-[11px] font-bold text-white">{s.order}</span>
              <button type="button" onClick={() => onSelect(s.id)} className="min-w-0 flex-1 text-left">
                <p className="truncate text-[15px] font-semibold tracking-tight">{s.city}<span className="text-[var(--t2-muted)]">, {s.country}</span></p>
                <p className="text-[11px] text-neutral-500">{s.date} · {s.category}</p>
                {s.pill}
              </button>
              <button type="button" onClick={() => onRemove(s.id)} className="mt-0.5 shrink-0 text-[12px] font-semibold text-neutral-400 hover:text-neutral-900">{t("tour.seasonRemove")}</button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
