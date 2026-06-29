import type { Metadata } from "next";
import SportLandingPage from "@/components/seo/SportLandingPage";
import { SPORT_LANDINGS, CITIES } from "@/lib/sportLandings";

const data = SPORT_LANDINGS["tennispartner-finden"];
const cityLinks = CITIES.map((c) => ({
  href: `/tennispartner-finden/${c.slug}`,
  name: c.name,
}));

export const metadata: Metadata = {
  title: "Tennispartner finden in deiner Nähe – kostenlos Mitspieler",
  description:
    "Tennispartner finden auf deinem Level: Mitspieler für Einzel & Doppel in deiner Nähe matchen, chatten und Spiele organisieren. Kostenlos mit Matchup.",
  alternates: { canonical: "/tennispartner-finden" },
  openGraph: {
    url: "/tennispartner-finden",
    title: "Tennispartner finden in deiner Nähe",
    description:
      "Finde Tennis-Mitspieler auf deinem Level — kostenlos matchen, chatten und spielen.",
    images: ["/og.jpg"],
  },
};

export default function Page() {
  return <SportLandingPage data={data} cityLinks={cityLinks} />;
}
