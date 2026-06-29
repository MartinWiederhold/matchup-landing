import type { Metadata } from "next";
import SportLandingPage from "@/components/seo/SportLandingPage";
import { SPORT_LANDINGS } from "@/lib/sportLandings";

const data = SPORT_LANDINGS["pickleballpartner-finden"];

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
    images: ["/og.jpg"],
  },
};

export default function Page() {
  return <SportLandingPage data={data} />;
}
