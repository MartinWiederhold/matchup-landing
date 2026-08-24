import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import TournamentsView from "../tournaments/TournamentsView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("tour.t2navTournaments"),
    description: t("tour.seoDescription"),
    alternates: { canonical: "/tour2/browse" },
    robots: { index: false, follow: false },
  };
}

export default function TourBrowsePage() {
  return <TournamentsView />;
}
