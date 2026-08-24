import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import Tour2Subpage from "../components/Tour2Subpage";
import SchengenView from "./components/SchengenView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("tour.schengenSeoTitle"),
    description: t("tour.schengenSeoDescription"),
    alternates: { canonical: "/tour2/schengen" },
    robots: { index: false, follow: false },
  };
}

export default async function SchengenPage() {
  const t = await getT();
  return (
    <Tour2Subpage title={t("tour.schengenTitle")} subtitle={t("tour.schengenSubtitle")}>
      <SchengenView />
    </Tour2Subpage>
  );
}
