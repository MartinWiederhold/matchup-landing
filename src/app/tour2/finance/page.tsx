import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { TOUR_MAIN, EYEBROW, PAGE_H1, PAGE_SUB } from "@/app/tour2/components/tourUi";
import BackToWorkspace from "../components/BackToWorkspace";
import FinanceView from "./FinanceView";

// Server Component. Interner, login-pflichtiger Bereich → nicht indexieren.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("tour.financeSeoTitle"),
    description: t("tour.financeSeoDescription"),
    alternates: { canonical: "/tour2/finance" },
    robots: { index: false, follow: false },
  };
}

export default async function FinancePage() {
  const t = await getT();
  return (
    <main className={TOUR_MAIN}>
      <p className={EYEBROW}>Matchup Tour</p>
      <h1 className={PAGE_H1}>{t("tour.financeTitle")}</h1>
      <p className={PAGE_SUB}>{t("tour.financeSubtitle")}</p>
      <BackToWorkspace />
      {/* Auth-Gate + Daten laufen client-seitig (Session liegt im Browser). */}
      <FinanceView />
    </main>
  );
}
