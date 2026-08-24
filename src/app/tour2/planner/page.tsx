import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import SeasonWorkspace from "../components/planner/SeasonWorkspace";

// /tour2 Saison: Verlauf + Karte. Die Navigation „Saison" führt hierher.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("tour.plTitle"),
    description: t("tour.plSubtitle"),
    alternates: { canonical: "/tour2/planner" },
    robots: { index: false, follow: false },
  };
}

export default function Tour2PlannerPage() {
  return <SeasonWorkspace />;
}
