import type { Metadata } from "next";
import Image from "next/image";
import PageCta from "@/components/PageCta";
import { CompeteCard } from "@/components/CompletePicture";
import { COMPETE_FEATURES } from "@/components/compete/features";
import SeasonJourney from "@/components/compete/SeasonJourney";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("landing.competePageTitle") + " · Matchup Compete",
    description: t("landing.competePageSubtitle"),
    alternates: { canonical: "/compete" },
    openGraph: {
      url: "/compete",
      title: t("landing.competePageTitle"),
      description: t("landing.competePageSubtitle"),
      images: ["/og-v6.jpg"],
    },
  };
}

export default async function ComparePage() {
  const t = await getT();
  return (
    <>
      {/* Hero */}
      <section className="relative flex h-[46vh] min-h-[320px] items-center justify-center overflow-hidden">
        <Image
          src="/compete/compete-hero.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: "center 55%" }}
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 max-w-4xl px-6 text-center text-white">
          <span className="rounded-full bg-white/15 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white backdrop-blur">
            {t("landing.competeSectionLabel")}
          </span>
          <h1 className="mt-4 text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl">
            {t("landing.competePageTitle")}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            {t("landing.competePageSubtitle")}
          </p>
        </div>
      </section>

      {/* Season Journey — scroll-getriebene Weg-Animation mit Turnier-Stationen */}
      <SeasonJourney />

      {/* Feature-Grid (hell, animierte Karten) — sauberer Cut auf weiss */}
      <section className="bg-white px-4 pb-24 pt-40 text-neutral-900 sm:px-6 lg:px-12 sm:pt-48">
        <div className="mx-auto max-w-[1280px]">
          <h2 className="max-w-2xl text-2xl font-bold leading-tight tracking-tight sm:text-4xl">
            {t("landing.competeSectionTitle")}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-500 sm:text-base">
            {t("landing.competePageIntro")}
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {COMPETE_FEATURES.map((f) => (
              <CompeteCard key={f.key} f={f} light />
            ))}
          </div>

          <a href="/find-a-partner" className="mt-12 inline-flex items-center gap-1 text-sm font-semibold text-neutral-500 underline-offset-4 hover:text-neutral-900 hover:underline">
            {t("landing.competeBackToPlay")} →
          </a>
        </div>
      </section>

      <PageCta
        title={t("landing.competeCtaTitle")}
        text={t("landing.competeCtaText")}
        buttonLabel={t("landing.competeCtaButton")}
        buttonHref="/map?tab=season"
      />
    </>
  );
}
