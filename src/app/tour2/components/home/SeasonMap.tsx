"use client";

import dynamic from "next/dynamic";
import type { SeasonMapProps, SeasonStop, SeasonStopState } from "./SeasonMapView";
export type { SeasonStop, SeasonStopState };

/**
 * Client-Wrapper für SeasonMapView — maplibre-gl braucht window/document,
 * daher nur im Browser laden (`ssr: false`). Muster übernommen von
 * TourMapView-Klient (src/app/tour2/map/components/TourMapClient.tsx).
 */
const SeasonMapView = dynamic(() => import("./SeasonMapView"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[260px] w-full items-center justify-center rounded-[var(--t2-radius-md)] border border-[var(--t2-line)] bg-[var(--t2-surface)] t2-fs-body text-[var(--t2-text-soft)] md:min-h-[380px]">
      …
    </div>
  ),
});

export default function SeasonMap(props: SeasonMapProps) {
  return <SeasonMapView {...props} />;
}
