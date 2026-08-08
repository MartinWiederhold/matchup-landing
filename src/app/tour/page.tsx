import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { TOUR_MAIN } from "@/app/tour/components/tourUi";
import TourPlanner from "./components/planner/TourPlanner";

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
  // Kopf, Chip und Zwei-Spalten-Layout rendert der Planer selbst (client-seitig,
  // inkl. Auth-Gate + gebündeltem Load). Die alte Arbeitsfläche (TourWorkspace)
  // bleibt als Datei erhalten; ihre Abschnitte (Saisonliste, Fristen, Kosten) gehen
  // in spätere Planer-Schritte auf.
  return (
    <main className={TOUR_MAIN}>
      <TourPlanner />
    </main>
  );
}
