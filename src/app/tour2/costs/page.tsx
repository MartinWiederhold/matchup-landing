import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import Tour2Subpage from "../components/Tour2Subpage";
import CostsView from "./components/CostsView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("tour.costsSeoTitle"),
    description: t("tour.costsSeoDescription"),
    alternates: { canonical: "/tour2/costs" },
    robots: { index: false, follow: false },
  };
}

export default async function CostsPage() {
  const t = await getT();
  return (
    <Tour2Subpage title={t("tour.costsTitle")} subtitle={t("tour.costsSubtitle")}>
      <CostsView />
    </Tour2Subpage>
  );
}
