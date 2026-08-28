import type { Metadata } from "next";
import SportLandingPage from "@/components/seo/SportLandingPage";
import { SPORT_LANDINGS, CITIES } from "@/lib/sportLandings";

const data = SPORT_LANDINGS["pickleballpartner-finden"];
const cityLinks = CITIES.map((c) => ({
  href: `/pickleballpartner-finden/${c.slug}`,
  name: c.name,
}));

export const metadata: Metadata = {
  title: "Pickleballpartner finden in deiner Nähe – kostenlos Mitspieler",
  description:
    "Pickleballpartner finden in deiner Nähe: Mitspieler für jedes Level matchen, spontane Matches organisieren und lokale Events entdecken. Kostenlos mit Matchup.",
  alternates: { canonical: "/pickleballpartner-finden" },
  openGraph: {
    url: "/pickleballpartner-finden",
    title: "Pickleballpartner finden in deiner Nähe",
    description:
      "Finde Pickleball-Mitspieler auf deinem Level — kostenlos matchen und spielen.",
    images: ["/icon-512.png"],
  },
};

export default function Page() {
  return <SportLandingPage data={data} cityLinks={cityLinks} />;
}
