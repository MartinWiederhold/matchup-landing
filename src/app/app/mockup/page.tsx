import type { Metadata } from "next";
import MockupScreen from "./MockupScreen";

export const metadata: Metadata = {
  title: "Matchup · Mockup",
  robots: { index: false, follow: false },
};

export default function MockupPage() {
  return <MockupScreen />;
}
