import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import Tour2Subpage from "../components/Tour2Subpage";
import PointsView from "./components/PointsView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("tour.pointsSeoTitle"),
    description: t("tour.pointsSeoDescription"),
    alternates: { canonical: "/tour2/points" },
    robots: { index: false, follow: false },
  };
}

export default async function PointsPage() {
  const t = await getT();
  return (
    <Tour2Subpage title={t("tour.pointsTitle")} subtitle={t("tour.pointsSubtitle")}>
      <PointsView />
    </Tour2Subpage>
  );
}
