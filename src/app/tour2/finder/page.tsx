import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import TournamentsView from "../tournaments/TournamentsView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("tour.t2navFinder"),
    description: t("tour.t2findLead"),
    alternates: { canonical: "/tour2/finder" },
    robots: { index: false, follow: false },
  };
}

export default function Tour2FinderPage() {
  return <TournamentsView />;
}
