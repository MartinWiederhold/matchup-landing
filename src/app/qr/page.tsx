import type { Metadata } from "next";
import QrClient from "./QrClient";

export const metadata: Metadata = {
  title: "Matchup QR",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <QrClient />;
}
