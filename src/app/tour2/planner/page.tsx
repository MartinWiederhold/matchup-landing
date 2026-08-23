import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import SeasonWorkspace from "../components/planner/SeasonWorkspace";

// Der Planer (Karte + 4 Spalten) — in /tour2 aus dem Index nach /tour2/planner verschoben,
// weil der Index jetzt Home ist. „Saison" in der Navigation führt hierher. Die Karte ist
// damit eine Ansicht INNERHALB von Saison, kein eigener Bereich mehr.
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
