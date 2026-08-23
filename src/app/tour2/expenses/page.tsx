import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { TOUR_MAIN, EYEBROW, PAGE_H1, PAGE_SUB } from "@/app/tour2/components/tourUi";
import BackToWorkspace from "../components/BackToWorkspace";
import ExpensesTourView from "./components/ExpensesTourView";

// Server Component (Standard). Kein "— Matchup"-Suffix — das Root-Layout hängt es an.
// Das bestehende src/app/tour/layout.tsx (AuthProvider) umschließt diese Route mit.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("tour.expSeoTitle"),
    description: t("tour.expSeoDescription"),
    alternates: { canonical: "/tour2/expenses" },
    // Interner, login-pflichtiger Bereich → nicht indexieren.
    robots: { index: false, follow: false },
  };
}

export default async function ExpensesPage() {
  const t = await getT();
  return (
    <main className={TOUR_MAIN}>
      <p className={EYEBROW}>Matchup Tour</p>
      <h1 className={PAGE_H1}>
        {t("tour.expTitle")}
      </h1>
      <p className={PAGE_SUB}>{t("tour.expSubtitle")}</p>

      <BackToWorkspace />

      {/* Auth-Gate + Daten laufen client-seitig (Session liegt im Browser). */}
      <ExpensesTourView />
    </main>
  );
}
