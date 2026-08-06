import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import BeratungTabs from "@/components/shop/BeratungTabs";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("seo.beratungTitle"),
    description: t("seo.beratungDescription"),
    alternates: { canonical: "/beratung" },
    openGraph: {
      url: "/beratung",
      title: t("seo.beratungTitle"),
      description: t("seo.beratungDescription"),
      images: ["/og-v6.jpg"],
    },
  };
}

const BLOCK_KEYS = [
  { title: "beratung.block1Title", text: "beratung.block1Text" },
  { title: "beratung.block2Title", text: "beratung.block2Text" },
  { title: "beratung.block3Title", text: "beratung.block3Text" },
];

export default async function BeratungPage() {
  const t = await getT();
  return (
    <>
      {/* TITELBILD */}
      <section className="relative flex min-h-[calc(100svh-68px-44px)] items-center justify-center overflow-hidden">
        <Image
          src="/beratung/hero-v2.jpg"
          alt={t("beratung.heroAlt")}
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: "center 45%" }}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 px-6 text-center text-white">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">
            {t("beratung.heroEyebrow")}
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl">
            {t("beratung.heroTitle")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
            {t("beratung.heroSubtitle")}
          </p>
        </div>
      </section>

      {/* TOGGLE + INHALT */}
      <section className="bg-gradient-to-b from-neutral-50 to-white px-4 py-16 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <BeratungTabs />
          <p className="mt-5 text-center text-xs text-neutral-500">
            {t("beratung.privacyNote")}
          </p>

          {/* Verweis auf den Schläger-Katalog (steht als eigene Seite daneben) */}
          <Link
            href="/beratung/katalog"
            className="mt-8 flex items-center justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-black/[0.02]"
          >
            <span>
              <span className="block text-base font-bold tracking-tight text-neutral-900">{t("catalog.title")}</span>
              <span className="mt-1 block text-sm leading-relaxed text-neutral-500">{t("catalog.subtitle")}</span>
            </span>
            <span aria-hidden className="shrink-0 text-2xl text-matchup">→</span>
          </Link>
        </div>
      </section>

      {/* Unterstützende Infos */}
      <section className="bg-white px-4 pb-24 sm:px-6 lg:px-12">
        <div className="mx-auto grid max-w-[1280px] gap-6 md:grid-cols-3">
          {BLOCK_KEYS.map((block) => (
            <article
              key={block.title}
              className="rounded-3xl border border-neutral-200 p-8"
            >
              <h2 className="text-xl font-bold tracking-tight">{t(block.title)}</h2>
              <p className="mt-4 text-sm leading-relaxed text-neutral-600">
                {t(block.text)}
              </p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
