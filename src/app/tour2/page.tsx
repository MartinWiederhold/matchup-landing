import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import HomeView from "./components/home/HomeView";

// /tour2 Home — der Einstiegspunkt des Neuaufbaus (statt der Karte/des Planers).
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("tour.t2navHome"),
    description: t("tour.plSubtitle"),
    alternates: { canonical: "/tour2" },
    robots: { index: false, follow: false },
  };
}

export default function Tour2HomePage() {
  return <HomeView />;
}
