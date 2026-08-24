import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import ProfileView from "./ProfileView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("tour.t2navProfile"),
    description: t("tour.setupSubtitle"),
    alternates: { canonical: "/tour2/setup" },
    robots: { index: false, follow: false },
  };
}

export default async function TourSetupPage({ searchParams }: { searchParams: Promise<{ step?: string }> }) {
  const sp = await searchParams;
  const initialStep = sp.step === "1" ? 1 : sp.step === "2" ? 2 : sp.step === "3" ? 3 : undefined;
  return <ProfileView initialStep={initialStep} />;
}
