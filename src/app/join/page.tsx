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
      images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "Matchup", type: "image/png" }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("seo.homeTitle"),
      description: t("seo.homeDescription"),
      // Twitter/X behält die Landscape-Karte (summary_large_image erwartet 1.91:1).
      images: ["/og-v6.jpg"],
    },
  };
}

export default function JoinPage() {
  return <JoinRedirect />;
}
