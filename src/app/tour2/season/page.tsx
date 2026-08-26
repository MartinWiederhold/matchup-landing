import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import SeasonWorkspace from "../components/planner/SeasonWorkspace";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("tour.t2navPlanner"),
    description: t("tour.plSubtitle"),
    alternates: { canonical: "/tour2/season" },
    robots: { index: false, follow: false },
  };
}

export default async function Tour2SeasonPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const sp = await searchParams;
  const id = typeof sp.id === "string" && sp.id.length > 0 ? sp.id : null;
  return <SeasonWorkspace initialSelectedId={id} />;
}
