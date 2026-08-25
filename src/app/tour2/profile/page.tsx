import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import ProfileView from "../setup/ProfileView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("tour.t2navProfile"),
    description: t("tour.setupSubtitle"),
    alternates: { canonical: "/tour2/profile" },
    robots: { index: false, follow: false },
  };
}

export default async function TourProfilePage({ searchParams }: { searchParams: Promise<{ step?: string }> }) {
  const sp = await searchParams;
  const initialStep = sp.step === "1" ? 1 : sp.step === "2" ? 2 : sp.step === "3" ? 3 : sp.step === "4" ? 4 : undefined;
  return <ProfileView initialStep={initialStep} />;
}
