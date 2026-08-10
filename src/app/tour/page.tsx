import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import SeasonWorkspace from "./components/planner/SeasonWorkspace";

// Server Component (Standard). Kein "— Matchup"-Suffix — das Root-Layout hängt es an.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("tour.plTitle"),
    description: t("tour.plSubtitle"),
    alternates: { canonical: "/tour" },
    // Interner, login-pflichtiger Bereich → nicht indexieren.
    robots: { index: false, follow: false },
  };
}

export default function TourPage() {
  // Voll-bleed Arbeitsfläche (eigenes Layout, kein TOUR_MAIN): Panel + Karte über
  // die volle Viewporthöhe. Auth-Gate, Datenladen und die gesamte Reaktivität
  // rendert die Client-Komponente selbst.
  return <SeasonWorkspace />;
}
