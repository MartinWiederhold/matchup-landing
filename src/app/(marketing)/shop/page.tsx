import type { Metadata } from "next";
import ShopExperience from "@/components/shop/ShopExperience";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("seo.shopTitle"),
    description: t("seo.shopDescription"),
    alternates: { canonical: "/shop" },
    openGraph: {
      url: "/shop",
      title: t("seo.shopTitle"),
      description: t("seo.shopDescription"),
    },
  };
}

export default function ShopPage() {
  return <ShopExperience />;
}
