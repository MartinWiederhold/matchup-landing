import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SportLandingPage from "@/components/seo/SportLandingPage";
import { CITIES, cityLanding } from "@/lib/sportLandings";

const SPORT = "padelpartner-finden";

export const dynamicParams = false;

export function generateStaticParams() {
  return CITIES.map((c) => ({ stadt: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ stadt: string }>;
}): Promise<Metadata> {
  const { stadt } = await params;
  const data = cityLanding(SPORT, stadt);
  if (!data) return {};
  const path = `/${SPORT}/${stadt}`;
  return {
    title: `${data.h1} – kostenlos Mitspieler`,
    description: data.intro.slice(0, 155),
    alternates: { canonical: path },
    openGraph: { url: path, title: data.h1, description: data.intro, images: ["/og-v6.jpg"] },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ stadt: string }>;
}) {
  const { stadt } = await params;
  const data = cityLanding(SPORT, stadt);
  if (!data) notFound();
  return <SportLandingPage data={data} />;
}
