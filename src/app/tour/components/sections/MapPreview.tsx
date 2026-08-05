"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useT } from "@/lib/i18n";
import type { SeasonEntry } from "@/lib/tourSeason";

// MapLibre nur im Browser (kein SSR) — Muster wie TourMapClient.
const TourMapView = dynamic(() => import("../../map/components/TourMapView"), {
  ssr: false,
  loading: () => <div className="h-72 w-full animate-pulse rounded-2xl bg-black/[0.04] lg:h-80" />,
});

/**
 * Kartenvorschau: kleine, etwa quadratische Kachel (kein halber Bildschirm) — sie soll
 * visuell abholen, nicht mit der Arbeit konkurrieren. Ein transparenter Knopf über der
 * Karte fängt den Klick (die Vorschau ist absichtlich nicht verschiebbar) und öffnet den
 * Vollbild-Modus; Escape oder Schließen bringt zurück.
 */
export default function MapPreview({ entries }: { entries: SeasonEntry[] }) {
  const t = useT();
  const [full, setFull] = useState(false);
  const withCoords = entries.filter((e) => e.tournament.latitude != null && e.tournament.longitude != null);

  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFull(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [full]);

  if (withCoords.length === 0) {
    return (
      <section className="rounded-2xl bg-black/[0.02] ring-1 ring-black/5 px-5 py-6 text-center">
        <p className="text-sm text-neutral-500">{t("tour.wsMapNoCoords")}</p>
        <Link href="/tour/map" className="mt-2 inline-flex text-[13px] font-semibold text-matchup hover:underline">
          {t("tour.wsMapOpen")} →
        </Link>
      </section>
    );
  }

  return (
    <section>
      <div className="relative">
        <TourMapView entries={withCoords} heightClass="h-72 lg:h-80" />
        {/* Transparenter Klickfänger: Vorschau nicht verschiebbar, Klick → Vollbild. */}
        <button
          type="button"
          onClick={() => setFull(true)}
          aria-label={t("tour.wsMapExpand")}
          className="absolute inset-0 rounded-2xl"
        />
        <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-neutral-700 shadow">
          {t("tour.wsMapExpand")}
        </span>
      </div>

      {full && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white p-3 sm:p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.mapTitle")}</p>
            <button
              type="button"
              onClick={() => setFull(false)}
              className="rounded-full bg-black/[0.06] px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-black/[0.1]"
            >
              {t("tour.wsClose")}
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <TourMapView entries={withCoords} heightClass="h-full" />
          </div>
        </div>
      )}
    </section>
  );
}
