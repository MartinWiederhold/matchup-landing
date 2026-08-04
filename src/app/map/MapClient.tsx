"use client";

import dynamic from "next/dynamic";

// Leaflet nutzt window/document → nur im Browser laden (kein SSR).
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-dvh items-center justify-center bg-neutral-950 text-sm text-white/50">
      Karte wird geladen…
    </div>
  ),
});

export default function MapClient() {
  return <MapView />;
}
