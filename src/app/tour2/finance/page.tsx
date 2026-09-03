import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import FinanceView from "./FinanceView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("tour.financeTitle"),
    description: t("tour.financeSubtitle"),
    alternates: { canonical: "/tour2/finance" },
    robots: { index: false, follow: false },
  };
}

export default function FinancePage() {
  return <FinanceView />;
}
