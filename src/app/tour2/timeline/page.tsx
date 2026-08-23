import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { EYEBROW } from "@/app/tour2/components/tourUi";
import BackToWorkspace from "../components/BackToWorkspace";
import TimelineView from "./components/TimelineView";

// Server Component (Standard). Kein „— Matchup"-Suffix — das Root-Layout hängt es an.
// BEWUSST NICHT TOUR_MAIN (max-w-1280): der Zeitstrahl nutzt die VOLLE Breite („ganzer
// Bildschirm"), deshalb ein eigener, randarmer Rahmen. Das tour/layout.tsx (AuthProvider)
// umschließt diese Route mit.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("tour.tlSeoTitle"),
    description: t("tour.tlSeoDescription"),
    alternates: { canonical: "/tour2/timeline" },
    robots: { index: false, follow: false }, // interner, login-pflichtiger Bereich
  };
}

export default async function TimelinePage() {
  const t = await getT();
  return (
    <main className="mx-auto w-full max-w-[1800px] px-4 py-8 sm:px-6">
      <p className={EYEBROW}>Matchup Tour</p>
      <h1 className="mt-3 text-[28px] font-extrabold leading-[1.05] tracking-tight text-neutral-900 sm:text-4xl">{t("tour.tlTitle")}</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-neutral-500">{t("tour.tlSubtitle")}</p>
      <BackToWorkspace />
      {/* Auth-Gate + Daten laufen client-seitig (Session liegt im Browser). */}
      <TimelineView />
    </main>
  );
}
