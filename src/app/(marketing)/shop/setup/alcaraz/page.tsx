import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import AlcarazSetup from "@/components/shop/AlcarazSetup";

// Server Component (Standard). Kein „— Matchup"-Suffix — das Root-Layout hängt es an.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("alcaraz.title"),
    description: t("alcaraz.intro"),
    alternates: { canonical: "/shop/setup/alcaraz" },
  };
}

export default function AlcarazSetupPage() {
  // Der geteilte Warenkorb (CartProvider) und der Drawer (CartUI) kommen aus
  // src/app/(marketing)/shop/layout.tsx — diese Seite legt nur hinein.
  return <AlcarazSetup />;
}
