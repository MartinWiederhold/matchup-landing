import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import Tour2Subpage from "../components/Tour2Subpage";
import FinanceView from "./FinanceView";

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
    <Tour2Subpage title={t("tour.financeTitle")} subtitle={t("tour.financeSubtitle")}>
      <FinanceView />
    </Tour2Subpage>
  );
}
