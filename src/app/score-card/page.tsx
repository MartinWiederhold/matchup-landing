import type { Metadata } from "next";
import ScoreCardPreview from "./ScoreCardPreview";

export const metadata: Metadata = {
  title: "Matchup Score-Card",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ScoreCardPreview />;
}
