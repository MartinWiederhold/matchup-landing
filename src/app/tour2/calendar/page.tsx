import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import CalendarTape from "./components/CalendarTape";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("tour.calTitle"),
    description: t("tour.calSubtitle"),
    alternates: { canonical: "/tour2/calendar" },
    robots: { index: false, follow: false },
  };
}

export default function CalendarPage() {
  return <CalendarTape />;
}
