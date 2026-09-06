import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getLocale } from "@/lib/i18n/server";
import { messages } from "@/lib/i18n/messages";

type AboutMessages = {
  metaTitle: string;
  metaDesc: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  portraitAlt: string;
  name: string;
  role: string;
  introLead: string;
  intro: string[];
  visionTitle: string;
  vision: string[];
  playTitle: string;
  play: string[];
  teaseTitle: string;
  tease: string[];
  teaseBadge: string;
  signature: string;
  ctaTitle: string;
  ctaText: string;
  ctaButton: string;
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const a = (messages[locale] as { about: AboutMessages }).about;
  return {
    title: a.metaTitle, // Root-Layout hängt „— Matchup" an
    description: a.metaDesc,
    alternates: { canonical: "/about" },
    openGraph: {
      url: "/about",
      title: a.metaTitle,
      description: a.metaDesc,
      images: ["/icon-512.png"],
    },
  };
}

// Kleines Eyebrow-Pill im Matchup-Stil (wie auf der Landingpage).
function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] ${
        dark ? "bg-white/10 text-white" : "bg-matchup/10 text-matchup"
      }`}
    >
      {children}
    </span>
  );
}

export default async function AboutPage() {
  const locale = await getLocale();
  const a = (messages[locale] as { about: AboutMessages }).about;

  return (
    <>
      {/* HERO — Titelbild mit Titel-Overlay */}
      <section className="relative overflow-hidden">
        <div className="relative min-h-[52svh] w-full sm:min-h-[62svh]">
          <Image
            src="/about/hero.png"
            alt={a.heroTitle}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          {/* Verlauf für Lesbarkeit des Titels */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/20" />
          <div className="absolute inset-0 flex items-end sm:items-center">
            <div className="mx-auto w-full max-w-3xl px-4 pb-10 text-center text-white sm:px-6 sm:pb-0 lg:px-12">
              <Eyebrow dark>{a.heroEyebrow}</Eyebrow>
              <h1 className="mt-5 text-4xl font-bold leading-[1.03] tracking-tight drop-shadow-lg sm:text-6xl">
                {a.heroTitle}
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/90 drop-shadow sm:text-lg">
                {a.heroSubtitle}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* GRÜNDER — Portrait (bewusst „outgezoomt" im gerahmten Card) + Vorstellung */}
      <section className="bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-12">
        <div className="mx-auto grid max-w-[1100px] items-center gap-12 lg:grid-cols-[minmax(0,420px)_1fr]">
          {/* Portrait */}
          <div className="mx-auto w-full max-w-sm">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-sm ring-1 ring-black/5">
              <Image
                src="/about/martin.png"
                alt={a.portraitAlt}
                fill
                priority
                sizes="(max-width: 1024px) 90vw, 420px"
                className="object-cover"
              />
            </div>
            <div className="mt-4 flex items-baseline justify-center gap-2 text-center">
              <span className="text-lg font-bold tracking-tight">{a.name}</span>
              <span className="text-sm font-semibold text-neutral-500">· {a.role}</span>
            </div>
          </div>

          {/* Vorstellung */}
          <div>
            <p className="text-2xl font-bold leading-snug tracking-tight sm:text-3xl">
              {a.introLead}
            </p>
            <div className="mt-6 space-y-5 text-base leading-relaxed text-neutral-700 sm:text-lg">
              {a.intro.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* VISION */}
      <section className="bg-neutral-50 px-4 py-20 sm:px-6 sm:py-24 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <Eyebrow>{a.visionTitle}</Eyebrow>
          <div className="mt-6 space-y-5 text-base leading-relaxed text-neutral-700 sm:text-lg">
            {a.vision.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      {/* PLAY */}
      <section className="bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{a.playTitle}</h2>
          <div className="mt-5 space-y-5 text-base leading-relaxed text-neutral-700 sm:text-lg">
            {a.play.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      {/* TEASER — dunkler Block mit Matchup-Verlauf, bewusst ohne Details */}
      <section className="bg-white px-4 pb-20 sm:px-6 sm:pb-24 lg:px-12">
        <div className="mx-auto max-w-[1100px]">
          <div className="relative overflow-hidden rounded-3xl bg-neutral-950 p-8 text-white sm:p-12">
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full opacity-40 blur-3xl"
              style={{ background: "radial-gradient(circle, rgba(91,75,255,0.6) 0%, transparent 70%)" }}
            />
            <div className="relative max-w-2xl">
              <Eyebrow dark>{a.teaseBadge}</Eyebrow>
              <h2 className="mt-5 text-2xl font-bold tracking-tight sm:text-4xl">{a.teaseTitle}</h2>
              <div className="mt-5 space-y-4 text-base leading-relaxed text-white/70 sm:text-lg">
                {a.tease.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
              <p className="mt-8 text-sm font-semibold text-white/50">{a.signature}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA — Matchup-Banner (wie Landing) */}
      <section className="bg-matchup px-4 py-24 text-white sm:px-6 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            {a.ctaTitle}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            {a.ctaText}
          </p>
          <div className="mt-10">
            <Link
              href="/find-a-partner"
              className="inline-block rounded-full bg-white px-10 py-4 text-sm font-bold tracking-wide text-matchup transition-opacity hover:opacity-90"
            >
              {a.ctaButton}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
