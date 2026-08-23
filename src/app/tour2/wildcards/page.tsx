import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { TOUR_MAIN, EYEBROW, PAGE_H1, PAGE_SUB } from "@/app/tour2/components/tourUi";
import BackToWorkspace from "../components/BackToWorkspace";
import WildcardsView from "./WildcardsView";

// Server Component. Interner, login-pflichtiger Bereich → nicht indexieren.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("tour.wildcardsSeoTitle"),
    description: t("tour.wildcardsSeoDescription"),
    alternates: { canonical: "/tour2/wildcards" },
    robots: { index: false, follow: false },
  };
}

export default async function WildcardsPage() {
  const t = await getT();
  return (
    <main className={TOUR_MAIN}>
      <p className={EYEBROW}>Matchup Tour</p>
      <h1 className={PAGE_H1}>{t("tour.wildcardsTitle")}</h1>
      <p className={PAGE_SUB}>{t("tour.wildcardsSubtitle")}</p>
      <BackToWorkspace />
      {/* Auth-Gate + Daten laufen client-seitig (Session liegt im Browser). */}
      <WildcardsView />
    </main>
  );
}
