import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import Tour2Subpage from "../components/Tour2Subpage";
import ExpensesTourView from "./components/ExpensesTourView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("tour.expSeoTitle"),
    description: t("tour.expSeoDescription"),
    alternates: { canonical: "/tour2/expenses" },
    robots: { index: false, follow: false },
  };
}

export default async function ExpensesPage() {
  const t = await getT();
  return (
    <Tour2Subpage title={t("tour.expTitle")} subtitle={t("tour.expSubtitle")}>
      <ExpensesTourView />
    </Tour2Subpage>
  );
}
