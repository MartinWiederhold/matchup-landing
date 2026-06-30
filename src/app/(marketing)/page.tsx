import type { Metadata } from "next";
import Hero from "@/components/Hero";
import HealthStats from "@/components/HealthStats";
import CompletePicture from "@/components/CompletePicture";
import Memberships from "@/components/Memberships";
import Partners from "@/components/Partners";
import Showcase from "@/components/Showcase";
import CtaBanner from "@/components/CtaBanner";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    alternates: { canonical: "/" },
    openGraph: {
      url: "/",
      title: t("seo.homeTitle"),
      description: t("seo.homeDescription"),
      images: ["/og-v4.jpg"],
    },
  };
}

export default function Home() {
  return (
    <>
      <Hero />
      <HealthStats />
      <CompletePicture />
      <Memberships />
      <Partners />
      <Showcase />
      <CtaBanner />
    </>
  );
}
