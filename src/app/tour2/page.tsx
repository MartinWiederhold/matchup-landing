import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import HomeView from "./components/home/HomeView";

// /tour2 Home — der Einstiegspunkt des Neuaufbaus (statt der Karte/des Planers).
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("tour.t2navOverview"),
    description: t("tour.t2ovLead"),
    alternates: { canonical: "/tour2" },
    robots: { index: false, follow: false },
  };
}

export default function Tour2HomePage() {
  return <HomeView />;
}
