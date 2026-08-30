"use client";

import dynamic from "next/dynamic";
import AppLoader from "@/app/app/components/AppLoader";

// Leaflet nutzt window/document → nur im Browser laden (kein SSR).
// Weißer Tennisball-Loader statt schwarzem „Lädt…"-Screen.
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <AppLoader label="Karte lädt …" className="h-dvh" />,
});

export default function MapClient() {
  return <MapView />;
}
