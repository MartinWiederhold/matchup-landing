import type { Metadata } from "next";
import Image from "next/image";
import PageCta from "@/components/PageCta";
import PartnerSteps from "@/components/find-a-partner/PartnerSteps";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("seo.partnerTitle"),
    description: t("seo.partnerDescription"),
    alternates: { canonical: "/find-a-partner" },
    openGraph: {
      url: "/find-a-partner",
      title: t("seo.partnerTitle"),
      description: t("seo.partnerDescription"),
      images: ["/icon-512.png"],
    },
  };
}

export default async function FindAPartnerPage() {
  const t = await getT();
  return (
    <>
      {/* Hero exakt im Format der Landing-Page (dort Video, hier Bild):
          volle Höhe, linksbündig, gleiche Schriftgrössen und Overlay. */}
      <section className="relative isolate overflow-hidden bg-neutral-700">
        <Image
          src="/find-a-partner/partner.jpg"
          alt={t("findPartner.heroImageAlt")}
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: "center 40%" }}
        />
        <div className="absolute inset-0 bg-black/25" />
        <div className="relative mx-auto flex min-h-[calc(100svh-68px-44px)] max-w-[1600px] flex-col justify-center px-4 py-10 sm:px-6 sm:py-12 lg:px-12">
          <h1 className="max-w-5xl text-[2.75rem] font-bold leading-[0.98] tracking-tight text-white sm:text-7xl lg:text-[6.5rem]">
            {t("findPartner.heroTitle")}
          </h1>
          <p className="mt-7 max-w-2xl text-[15px] leading-relaxed text-white/90 sm:max-w-4xl sm:text-lg">
            {t("findPartner.heroSubtitle")}
          </p>
        </div>
      </section>

      <PartnerSteps />

      <PageCta
        title={t("findPartner.ctaTitle")}
        text={t("findPartner.ctaText")}
        buttonLabel={t("findPartner.ctaButton")}
        buttonHref="/app"
      />
    </>
  );
}
