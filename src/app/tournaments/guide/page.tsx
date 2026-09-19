import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import VisitorStub from "../components/VisitorStub";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("tournaments.navGuide"),
    robots: { index: false, follow: false },
  };
}

export default function TournamentsGuidePage() {
  return <VisitorStub />;
}
