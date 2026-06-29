import type { Metadata, Viewport } from "next";
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
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: "/apple-touch-icon.png",
    },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: "Matchup",
      title,
      description,
      url: "/",
      locale: locale === "de" ? "de_CH" : "en_US",
      images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Matchup" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og.jpg"],
    },
  };
}

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#000000",
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
        <LocaleProvider initialLocale={locale}>
          {children}
          <ServiceWorkerRegister />
          <Analytics />
        </LocaleProvider>
      </body>
    </html>
  );
}
