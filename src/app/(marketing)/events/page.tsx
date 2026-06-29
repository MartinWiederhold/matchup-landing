import type { Metadata } from "next";
import PageCta from "@/components/PageCta";
import EventsExperience from "@/components/events/EventsExperience";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("seo.eventsTitle"),
    description: t("seo.eventsDescription"),
    alternates: { canonical: "/events" },
    openGraph: {
      url: "/events",
      title: t("seo.eventsTitle"),
      description: t("seo.eventsDescription"),
    },
  };
}

export default async function EventsPage() {
  const t = await getT();
  return (
    <>
      <section className="relative flex h-[52vh] min-h-[360px] items-center justify-center overflow-hidden bg-black">
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-80"
          src="/events/hero.mp4"
          poster="/events/hero-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative z-10 max-w-3xl px-6 text-center text-white">
          <h1 className="text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl">
            {t("events.heroTitle")}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            {t("events.heroSubtitle")}
          </p>
        </div>
      </section>

      <EventsExperience />

      <PageCta
        title={t("events.ctaTitle")}
        text={t("events.ctaText")}
        buttonLabel={t("events.ctaButton")}
        buttonHref="/app"
      />
    </>
  );
}
