import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MATCHUP – Das Wearable für nachweislich bessere Gesundheit",
  description:
    "MATCHUP kombiniert 24/7-Gesundheitseinblicke mit personalisiertem Coaching, um dir zu helfen, deine Schlafqualität, dein Training und dein Wohlbefinden zu verbessern – ab dem ersten Tag.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-black">
        {children}
      </body>
    </html>
  );
}
