import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import PointsView from "../points/components/PointsView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("tour.t2rkTitle"),
    description: t("tour.t2rkLead"),
    alternates: { canonical: "/tour2/ranking" },
    robots: { index: false, follow: false },
  };
}

export default function RankingPage() {
  return <PointsView />;
}
