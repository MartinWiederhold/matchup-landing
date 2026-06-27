import type { Metadata } from "next";
import ShopExperience from "@/components/shop/ShopExperience";

export const metadata: Metadata = {
  title: "Shop — Matchup",
  description:
    "Premium-Equipment für Tennis, Padel und Pickleball: Schläger, Besaitung, Verleih und persönliche Beratung — alles online.",
};

export default function ShopPage() {
  return <ShopExperience />;
}
