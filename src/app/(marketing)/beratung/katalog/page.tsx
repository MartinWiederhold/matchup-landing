import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import RacketCatalog from "@/components/beratung/RacketCatalog";

// Server Component (Standard). Kein „— Matchup"-Suffix — das Root-Layout hängt es an.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("catalog.seoTitle"),
    description: t("catalog.seoDescription"),
    alternates: { canonical: "/beratung/katalog" },
    // Login-pflichtiger Bereich (Katalog nur für authenticated lesbar) → nicht indexieren.
    robots: { index: false, follow: false },
  };
}

export default async function KatalogPage() {
  const t = await getT();
  return (
    <main className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 sm:py-14 lg:px-12">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-matchup">{t("catalog.eyebrow")}</p>
      <h1 className="mt-3 text-[32px] font-extrabold leading-[1.05] tracking-tight text-neutral-900 sm:text-5xl">
        {t("catalog.title")}
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-neutral-500">{t("catalog.subtitle")}</p>

      {/* Auth-Gate + Load + Katalog laufen client-seitig. */}
      <RacketCatalog />
    </main>
  );
}
