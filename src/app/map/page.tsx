import type { Metadata, Viewport } from "next";
import MapClient from "./MapClient";

export const metadata: Metadata = {
  title: "Matchup Map",
  robots: { index: false, follow: false },
};

// Dunkle Statusleiste → weisse Icons (WLAN/5G/Akku) auf der Karten-Seite
export const viewport: Viewport = {
  themeColor: "#0b0b0f",
};

export default function Page() {
  return <MapClient />;
}
