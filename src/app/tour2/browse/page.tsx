import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { TOUR_MAIN, EYEBROW, PAGE_H1, PAGE_SUB } from "@/app/tour2/components/tourUi";
import TourBrowser from "../components/TourBrowser";
import BackToWorkspace from "../components/BackToWorkspace";

// Neues Zuhause des Turnierkalenders (früher unter /tour). Bleibt als Einzelseite
// erreichbar; in Schritt 2 wird derselbe Browser zu Setup-Schritt 3.
// Server Component (Standard). Kein "— Matchup"-Suffix — das Root-Layout hängt es an.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("tour.seoTitle"),
    description: t("tour.seoDescription"),
    alternates: { canonical: "/tour2/browse" },
    // Interner, login-pflichtiger Bereich → nicht indexieren.
    robots: { index: false, follow: false },
  };
}

export default async function TourBrowsePage() {
  const t = await getT();
  return (
    <main className={TOUR_MAIN}>
      <p className={EYEBROW}>Matchup Tour</p>
      <h1 className={PAGE_H1}>
        {t("tour.title")}
      </h1>
      <p className={PAGE_SUB}>{t("tour.subtitle")}</p>

      <BackToWorkspace />

      {/* Auth-Gate + Daten + Filter laufen client-seitig (Session liegt im Browser). */}
      <TourBrowser />
    </main>
  );
}
