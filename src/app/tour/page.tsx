import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { TOUR_MAIN, EYEBROW, PAGE_H1, PAGE_SUB } from "@/app/tour/components/tourUi";
import TourWorkspace from "./components/TourWorkspace";

// Server Component (Standard). Kein "— Matchup"-Suffix — das Root-Layout hängt es an.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("tour.workspaceSeoTitle"),
    description: t("tour.workspaceSeoDescription"),
    alternates: { canonical: "/tour" },
    // Interner, login-pflichtiger Bereich → nicht indexieren.
    robots: { index: false, follow: false },
  };
}

export default async function TourPage() {
  const t = await getT();
  return (
    // Breiter als die früheren Einzelseiten (max-w-1000): die Arbeitsfläche nutzt
    // am Laptop zwei Spalten und damit die Fläche aus.
    <main className={TOUR_MAIN}>
      <p className={EYEBROW}>Matchup Tour</p>
      <h1 className={PAGE_H1}>
        {t("tour.workspaceTitle")}
      </h1>
      <p className={PAGE_SUB}>{t("tour.workspaceSubtitle")}</p>

      {/* Auth-Gate + gebündelter Load + Dashboard laufen client-seitig. */}
      <TourWorkspace />
    </main>
  );
}
