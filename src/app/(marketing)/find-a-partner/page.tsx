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
      images: ["/og-v2.jpg"],
    },
  };
}

export default async function FindAPartnerPage() {
  const t = await getT();
  return (
    <>
      <section className="relative flex h-[46vh] min-h-[320px] items-center justify-center overflow-hidden">
        <Image
          src="/find-a-partner/partner.jpg"
          alt={t("findPartner.heroImageAlt")}
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: "center 35%" }}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 max-w-4xl px-6 text-center text-white">
          <h1 className="text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl">
            {t("findPartner.heroTitle")}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
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
