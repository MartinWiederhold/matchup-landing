import type { Metadata } from "next";
import MapClient from "./MapClient";

export const metadata: Metadata = {
  title: "Matchup Map",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <MapClient />;
}
