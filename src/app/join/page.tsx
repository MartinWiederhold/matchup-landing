import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import JoinRedirect from "./JoinRedirect";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("seo.homeTitle"),
    description: t("seo.homeDescription"),
    alternates: { canonical: "/" },
    robots: { index: false, follow: true },
    openGraph: {
      type: "website",
      siteName: "Matchup",
      url: "https://matchup-app.com/join",
      title: t("seo.homeTitle"),
      description: t("seo.homeDescription"),
      images: [{ url: "/og-v5.jpg", width: 1200, height: 630, alt: "Matchup" }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("seo.homeTitle"),
      description: t("seo.homeDescription"),
      images: ["/og-v5.jpg"],
    },
  };
}

export default function JoinPage() {
  return <JoinRedirect />;
}
