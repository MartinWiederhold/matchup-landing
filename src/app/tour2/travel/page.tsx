import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import TravelHub from "./TravelHub";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("tour.t2navTravel"),
    description: t("tour.t2travelLead"),
    alternates: { canonical: "/tour2/travel" },
    robots: { index: false, follow: false },
  };
}

export default function TravelPage() {
  return <TravelHub />;
}
