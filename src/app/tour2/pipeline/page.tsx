import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import PipelineView from "./PipelineView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("tour.pipelineTitle"),
    description: t("tour.pipelineSubtitle"),
    alternates: { canonical: "/tour2/pipeline" },
    robots: { index: false, follow: false },
  };
}

export default function PipelinePage() {
  return <PipelineView />;
}
