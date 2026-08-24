import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import Tour2Subpage from "../components/Tour2Subpage";
import WildcardsView from "./WildcardsView";

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
    <Tour2Subpage title={t("tour.wildcardsTitle")} subtitle={t("tour.wildcardsSubtitle")}>
      <WildcardsView />
    </Tour2Subpage>
  );
}
