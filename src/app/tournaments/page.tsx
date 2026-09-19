import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import GroundsView from "./components/GroundsView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("tournaments.homeTitle"),
    description: t("tournaments.homeDesc"),
    alternates: { canonical: "/tournaments" },
    robots: { index: false, follow: false },
  };
}

export default function TournamentsHomePage() {
  return <GroundsView />;
}
