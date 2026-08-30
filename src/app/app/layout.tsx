import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Matchup App",
  description: "Finde deinen Spielpartner für Tennis, Padel und Pickleball.",
  robots: { index: false, follow: false },
};

// Verhindert das iOS-Auto-Zoom beim Fokussieren von Eingabefeldern (App-Bereich).
// themeColor WEISS: Der App-Bereich ist hell → Safari malt den Bereich hinter der
// Status-Leiste weiss (statt schwarz) und stellt die Status-Symbole dunkel dar.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#ffffff",
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
