"use client";

/**
 * Saison als Reiseverlauf: Stopp für Stopp, dazwischen nur belegte Etappen
 * (km, Anreise-Satz, Ruhetage, knappe Anreise). Keine Flugzeiten.
 */

import { useEffect, useRef } from "react";
import { useT } from "@/lib/i18n";
import { displayCity } from "@/domain/tour/displayCity";

// Belag → Rollenfarbe (Farbe = Bedeutung). Fallback: neutrale Linie.
function surfaceToken(surface: string | null): string {
  const s = (surface || "").toLowerCase();
  if (s.includes("clay") || s.includes("sand")) return "var(--t2-clay)";
  if (s.includes("grass") || s.includes("rasen")) return "var(--t2-grass)";
  if (s.includes("carpet") || s.includes("indoor") || s.includes("halle")) return "var(--t2-indoor)";
  if (s.includes("hard")) return "var(--t2-hard)";
  return "var(--t2-line-strong)";
}

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
  surface: string | null;
  pill: React.ReactNode;
  deadline: string | null;
  cost: string | null;
  why: string[];
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
        <li className="mb-3 flex items-center gap-2 t2-fs-body-sm font-semibold">
          <span className="flex h-6 w-6 items-center justify-center border border-[var(--t2-line)] t2-fs-meta">⌂</span>
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
              <p className="mb-2 mt-4 t2-fs-meta font-semibold uppercase tracking-[0.16em] text-[var(--t2-muted)] first:mt-0">{s.month}</p>
            )}
            {leg && (
              <div className={`my-1 ml-[11px] border-l py-2 pl-5 t2-fs-meta leading-snug ${leg.tight ? "border-[var(--t2-ink)] text-[var(--t2-ink)]" : "border-[var(--t2-line)] text-[var(--t2-muted)]"}`}>
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
            <div
              className="flex items-start gap-2 border-l-[3px] px-2 py-2"
              style={{ borderLeftColor: sel ? "var(--t2-accent)" : surfaceToken(s.surface) }}
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--t2-accent)] t2-fs-meta font-bold text-[var(--t2-on-accent)]">{s.order}</span>
              <button type="button" onClick={() => onSelect(s.id)} className="min-w-0 flex-1 text-left">
                <p className="truncate t2-fs-body font-semibold tracking-tight">{displayCity(s.city)}<span className="text-[var(--t2-muted)]">, {s.country}</span></p>
                <p className="t2-fs-meta text-[var(--t2-muted)]">{s.date} · {s.category}</p>
                {(s.deadline || s.cost) && (
                  <p className="t2-fs-meta text-[var(--t2-muted)]">
                    {s.deadline ?? ""}
                    {s.deadline && s.cost ? " · " : ""}
                    {s.cost ?? ""}
                  </p>
                )}
                {s.pill}
                {s.why.length > 0 && (
                  <p className="mt-0.5 t2-fs-meta leading-snug text-[var(--t2-faint)]">{t("tour.t2whyTitle")}: {s.why.join(" · ")}</p>
                )}
              </button>
              <button type="button" onClick={() => onRemove(s.id)} className="mt-0.5 shrink-0 t2-fs-micro font-semibold text-[var(--t2-muted)] hover:text-[var(--t2-ink)]">{t("tour.seasonRemove")}</button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
