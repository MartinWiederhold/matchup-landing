import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import ShopNotify from "@/components/ShopNotify";

export const metadata: Metadata = {
  title: "Shop — Matchup",
  description:
    "Ausrüstung und Accessoires für Tennis, Padel und Pickleball. Bald verfügbar.",
};

export default function ShopPage() {
  return (
    <>
      <PageHero
        title="Matchup Shop"
        subtitle="Ausrüstung und Accessoires für Tennis, Padel und Pickleball."
      />

      <section className="bg-white px-4 py-28 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-6xl" aria-hidden="true">
            🎾
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
            Bald verfügbar
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-neutral-600">
            Wir arbeiten an einer kuratierten Auswahl an Schlägern, Schuhen und
            Zubehör. Lass dich benachrichtigen, wenn es losgeht.
          </p>
          <div className="mt-10">
            <ShopNotify />
          </div>
        </div>
      </section>
    </>
  );
}
