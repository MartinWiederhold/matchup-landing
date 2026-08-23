import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { TOUR_MAIN, EYEBROW, PAGE_H1, PAGE_SUB } from "@/app/tour2/components/tourUi";
import SetupPanel from "../components/setup/SetupPanel";
import PlayerMasterForm from "./PlayerMasterForm";
import TravelDocsCard from "./TravelDocsCard";

// Server Component. Kein "— Matchup"-Suffix — das Root-Layout hängt es an.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("tour.setupSeoTitle"),
    description: t("tour.setupSubtitle"),
    alternates: { canonical: "/tour2/setup" },
    // Interner, login-pflichtiger Bereich → nicht indexieren.
    robots: { index: false, follow: false },
  };
}

// Einrichtung als eigene Route — damit die drei Schritte auch später einzeln aufrufbar
// sind (per ?step=1|2|3). In Next 16 sind searchParams ein Promise.
export default async function TourSetupPage({ searchParams }: { searchParams: Promise<{ step?: string }> }) {
  const t = await getT();
  const sp = await searchParams;
  const initialStep = sp.step === "1" ? 1 : sp.step === "2" ? 2 : sp.step === "3" ? 3 : undefined;

  return (
    <main className={TOUR_MAIN}>
      <p className={EYEBROW}>Matchup Tour</p>
      <h1 className={PAGE_H1}>{t("tour.setupTitle")}</h1>
      <p className={PAGE_SUB}>{t("tour.setupSubtitle")}</p>

      {/* Auth-Gate + Laden laufen client-seitig. Ohne onExit → Ausstieg per Link auf /tour. */}
      <SetupPanel initialStep={initialStep} />

      {/* Spielerstammdaten — nur die Felder, aus denen die App etwas macht (Ablaufwarnungen,
          Visa, Besaiter-Info). Eigener client-seitiger Abschnitt unter dem Wizard. */}
      <PlayerMasterForm />

      {/* Reisedokumente-Ablage (mehrere je Nutzer) — verknüpft im Turnierdetail mit „ESTA nötig". */}
      <TravelDocsCard />
    </main>
  );
}
