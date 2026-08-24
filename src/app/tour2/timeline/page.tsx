import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import Tour2Subpage from "../components/Tour2Subpage";
import TimelineView from "./components/TimelineView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("tour.tlSeoTitle"),
    description: t("tour.tlSeoDescription"),
    alternates: { canonical: "/tour2/timeline" },
    robots: { index: false, follow: false },
  };
}

export default async function TimelinePage() {
  const t = await getT();
  return (
    <Tour2Subpage title={t("tour.tlTitle")} subtitle={t("tour.tlSubtitle")} wide>
      <TimelineView />
    </Tour2Subpage>
  );
}
