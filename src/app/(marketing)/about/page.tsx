import type { Metadata } from "next";
import Image from "next/image";
import { getLocale } from "@/lib/i18n/server";
import { messages } from "@/lib/i18n/messages";

type AboutMessages = {
  heroEyebrow: string;
  heroTitle: string;
  heroAlt: string;
  intro: string[];
  whyTitle: string;
  why: string[];
  moreTitle: string;
  moreIntro: string[];
  bullets: string[];
  moreOutro: string;
  comingSoon: string;
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const a = (messages[locale] as { about: AboutMessages }).about;
  return {
    title: `${a.heroTitle} – Matchup`,
    description: a.intro[0],
    alternates: { canonical: "/about" },
    openGraph: {
      url: "/about",
      title: a.heroTitle,
      description: a.intro[0],
      images: ["/og-v6.jpg"],
    },
  };
}

export default async function AboutPage() {
  const locale = await getLocale();
  const a = (messages[locale] as { about: AboutMessages }).about;

  return (
    <>
      {/* TITELBILD — gleiche Höhe wie das Landing-Video */}
      <section className="relative flex min-h-[calc(100svh-68px-44px)] items-center justify-center overflow-hidden">
        <Image
          src="/beratung/hero-v2.jpg"
          alt={a.heroAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover [object-position:left_45%] sm:[object-position:center_45%]"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 px-6 text-center text-white">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">
            {a.heroEyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl">
            {a.heroTitle}
          </h1>
        </div>
      </section>

      {/* TEXT */}
      <section className="bg-white px-4 py-20 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <div className="space-y-5 text-base leading-relaxed text-neutral-700 sm:text-lg">
            {a.intro.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>

          <h2 className="mt-14 text-2xl font-bold tracking-tight sm:text-3xl">
            {a.whyTitle}
          </h2>
          <div className="mt-5 space-y-5 text-base leading-relaxed text-neutral-700 sm:text-lg">
            {a.why.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>

          <h2 className="mt-14 text-2xl font-bold tracking-tight sm:text-3xl">
            {a.moreTitle}
          </h2>
          <div className="mt-5 space-y-5 text-base leading-relaxed text-neutral-700 sm:text-lg">
            {a.moreIntro.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>

          <ul className="mt-5 space-y-3">
            {a.bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-base text-neutral-700 sm:text-lg">
                <svg
                  viewBox="0 0 16 16"
                  className="mt-1.5 h-4 w-4 shrink-0 text-matchup"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3 8.5l3 3 7-7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {b}
              </li>
            ))}
          </ul>

          <p className="mt-6 text-base leading-relaxed text-neutral-700 sm:text-lg">
            {a.moreOutro}
          </p>

          <p className="mt-10 inline-flex rounded-full bg-neutral-100 px-5 py-2 text-sm font-bold uppercase tracking-wide text-matchup">
            {a.comingSoon}
          </p>
        </div>
      </section>
    </>
  );
}
