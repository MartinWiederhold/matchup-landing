import type { Metadata } from "next";
import Mockup2Screen from "./Mockup2Screen";

export const metadata: Metadata = {
  title: "Matchup · Mockup 2",
  robots: { index: false, follow: false },
};

export default function Mockup2Page() {
  return <Mockup2Screen />;
}
