import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { DM_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { LocaleProvider } from "@/lib/i18n";
import { getLocale, getT } from "@/lib/i18n/server";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  const locale = await getLocale();
  const title = t("seo.homeTitle");
  const description = t("seo.homeDescription");
  return {
    metadataBase: new URL("https://matchup-app.com"),
    title: {
      default: title,
      template: "%s — Matchup",
    },
    description,
    applicationName: "Matchup",
    appleWebApp: {
      capable: true,
      title: "Matchup",
      statusBarStyle: "black-translucent",
    },
    icons: {
      icon: [
        { url: "/favicon.ico?v=2", sizes: "any" },
        { url: "/icon-192.png?v=2", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png?v=2", sizes: "512x512", type: "image/png" },
      ],
      apple: "/apple-touch-icon.png?v=2",
    },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: "Matchup",
      title,
      description,
      url: "/",
      locale: locale === "de" ? "de_CH" : "en_US",
      images: [{ url: "/og-v6.jpg", width: 1200, height: 630, alt: "Matchup" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-v6.jpg"],
    },
  };
}

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#000000",
  // iOS/Android: Tastatur verkleinert die Layout-Höhe (100dvh/innerHeight),
  // statt nur die visuelle Ansicht — verhindert die weiße Fläche unter Eingaben.
  interactiveWidget: "resizes-content",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${dmSans.variable} h-full bg-black antialiased`}>
      <body className="min-h-full flex flex-col bg-black text-black">
        {/* Travelpayouts Drive – Affiliate-Monetarisierung (Marker 547946) */}
        <Script id="tp-drive" src="https://tpembars.com/NTQ3OTQ2.js?t=547946" strategy="beforeInteractive" data-cfasync="false" />
        <LocaleProvider initialLocale={locale}>
          {children}
          <ServiceWorkerRegister />
          <Analytics />
        </LocaleProvider>
      </body>
    </html>
  );
}
