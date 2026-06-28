import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Matchup App",
  description: "Finde deinen Spielpartner für Tennis, Padel und Pickleball.",
};

// Verhindert das iOS-Auto-Zoom beim Fokussieren von Eingabefeldern (App-Bereich).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
