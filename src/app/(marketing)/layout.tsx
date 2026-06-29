import PromoBar from "@/components/PromoBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const BASE = "https://matchup-app.com";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${BASE}/#organization`,
      name: "Matchup",
      url: BASE,
      logo: `${BASE}/icon-512.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${BASE}/#website`,
      url: BASE,
      name: "Matchup",
      inLanguage: ["de", "en"],
      publisher: { "@id": `${BASE}/#organization` },
    },
    {
      "@type": "SoftwareApplication",
      name: "Matchup",
      applicationCategory: "SportsApplication",
      operatingSystem: "Web, iOS, Android",
      url: BASE,
      description:
        "Matchup verbindet Spieler für Tennis, Padel und Pickleball. Finde Spielpartner in deiner Nähe, organisiere Spiele und entdecke Events.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "CHF" },
    },
  ],
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PromoBar />
      <Header />
      <main className="flex-1 bg-white">{children}</main>
      <Footer />
    </>
  );
}
