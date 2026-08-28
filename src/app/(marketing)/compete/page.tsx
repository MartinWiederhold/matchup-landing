import type { Metadata } from "next";
import Image from "next/image";
import PageCta from "@/components/PageCta";
import { CompeteCard } from "@/components/CompletePicture";
import { COMPETE_FEATURES } from "@/components/compete/features";
import SeasonJourney from "@/components/compete/SeasonJourney";
import SeasonWorldMap from "@/components/compete/SeasonWorldMap";
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
      images: ["/icon-512.png"],
    },
  };
}

export default async function ComparePage() {
  const t = await getT();
  return (
    <>
      {/* Hero exakt im Format der Landing-/Play-Seite (dort Video, hier Bild):
          volle Höhe, linksbündig, gleiche Schriftgrössen und Overlay. */}
      <section className="relative isolate overflow-hidden bg-neutral-700">
        <Image
          src="/compete/compete-hero.jpg"
          alt={t("landing.competeHeroImageAlt")}
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: "center 50%" }}
        />
        <div className="absolute inset-0 bg-black/25" />
        <div className="relative mx-auto flex min-h-[calc(100svh-68px-44px)] max-w-[1600px] flex-col justify-center px-4 py-10 sm:px-6 sm:py-12 lg:px-12">
          <h1 className="max-w-5xl text-[2.75rem] font-bold leading-[0.98] tracking-tight text-white sm:text-7xl lg:text-[6.5rem]">
            {t("landing.competePageTitle")}
          </h1>
          <p className="mt-7 max-w-2xl text-[15px] leading-relaxed text-white/90 sm:max-w-4xl sm:text-lg">
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

      {/* Saison auf der Weltkarte: echte Turniere + Flugrouten ab Zürich */}
      <SeasonWorldMap />

      <PageCta
        title={t("landing.competeCtaTitle")}
        text={t("landing.competeCtaText")}
        buttonLabel={t("landing.competeCtaButton")}
        buttonHref="/map?tab=season"
      />
    </>
  );
}
