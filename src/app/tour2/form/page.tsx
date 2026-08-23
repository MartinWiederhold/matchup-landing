import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { TOUR_MAIN, EYEBROW, PAGE_H1, PAGE_SUB } from "@/app/tour2/components/tourUi";
import BackToWorkspace from "../components/BackToWorkspace";
import FormView from "./FormView";

// Server Component. Interner, login-pflichtiger Bereich → nicht indexieren.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("tour.formSeoTitle"),
    description: t("tour.formSeoDescription"),
    alternates: { canonical: "/tour2/form" },
    robots: { index: false, follow: false },
  };
}

export default async function FormPage() {
  const t = await getT();
  return (
    <main className={TOUR_MAIN}>
      <p className={EYEBROW}>Matchup Tour</p>
      <h1 className={PAGE_H1}>{t("tour.formTitle")}</h1>
      <p className={PAGE_SUB}>{t("tour.formSubtitle")}</p>
      <BackToWorkspace />
      {/* Auth-Gate + Daten laufen client-seitig (Session liegt im Browser). */}
      <FormView />
    </main>
  );
}
