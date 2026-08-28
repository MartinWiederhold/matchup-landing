"use client";

import dynamic from "next/dynamic";
import type { SeasonMapT3Props } from "./SeasonMapViewT3";

/**
 * Client-Wrapper — maplibre-gl braucht window/document, deshalb nur im Browser
 * laden (`ssr: false`). Ladeplatzhalter ist eine ruhige Fläche im
 * Sunken-Ton — keine Zuck-Animation.
 */
const SeasonMapViewT3 = dynamic(() => import("./SeasonMapViewT3"), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden
      className="h-[40vh] w-full rounded-[var(--t3-radius)] border md:h-[55vh]"
      style={{ background: "var(--t3-sunken)", borderColor: "var(--t3-line)" }}
    />
  ),
});

export default function SeasonMapT3(props: SeasonMapT3Props) {
  return <SeasonMapViewT3 {...props} />;
}
