import type { Metadata } from "next";
import SportLandingPage from "@/components/seo/SportLandingPage";
import { SPORT_LANDINGS, CITIES } from "@/lib/sportLandings";

const data = SPORT_LANDINGS["padelpartner-finden"];
const cityLinks = CITIES.map((c) => ({
  href: `/padelpartner-finden/${c.slug}`,
  name: c.name,
}));

export const metadata: Metadata = {
  title: "Padelpartner finden in deiner Nähe – kostenlos Mitspieler",
  description:
    "Padelpartner finden in Sekunden: Mitspieler für deine Padel-Partie in der Nähe matchen, offenen Spielen beitreten oder selbst eines erstellen. Kostenlos mit Matchup.",
  alternates: { canonical: "/padelpartner-finden" },
  openGraph: {
    url: "/padelpartner-finden",
    title: "Padelpartner finden in deiner Nähe",
    description:
      "Finde Padel-Mitspieler auf deinem Level — kostenlos matchen, beitreten und spielen.",
    images: ["/og.jpg"],
  },
};

export default function Page() {
  return <SportLandingPage data={data} cityLinks={cityLinks} />;
}
