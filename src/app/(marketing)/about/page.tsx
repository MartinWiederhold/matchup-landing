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
      {/* HERO — animierte Matchup-Welt in Markenfarbe (#4b3bf3) statt Titelbild */}
      <section className="relative isolate overflow-hidden px-4 py-28 text-white sm:px-6 sm:py-36 lg:px-12">
        {/* Verlauf in Markenfarbe */}
        <div
          aria-hidden
          className="absolute inset-0 -z-20"
          style={{ background: "linear-gradient(135deg,#5b4bff 0%,#4b3bf3 46%,#2a1f9e 100%)" }}
        />
        {/* feines Punktraster */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-[0.18]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px,#fff 1px,transparent 0)", backgroundSize: "22px 22px" }}
        />
        {/* schwebende, weiche Orbs */}
        <div aria-hidden className="anim-float absolute -left-24 top-6 -z-10 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
        <div
          aria-hidden
          className="anim-float absolute -right-16 -bottom-10 -z-10 h-80 w-80 rounded-full blur-3xl"
          style={{ background: "rgba(139,123,255,0.45)", animationDelay: "1.6s" }}
        />

        {/* „Match"-Netzwerk: pulsierende Knoten + fliessende Verbindungslinien */}
        <svg
          aria-hidden
          viewBox="0 0 400 220"
          preserveAspectRatio="xMidYMid slice"
          className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-60"
        >
          {[
            [58, 52, 150, 34], [150, 34, 250, 74], [250, 74, 344, 44],
            [58, 52, 116, 150], [150, 34, 210, 128], [250, 74, 210, 128],
            [210, 128, 306, 156], [116, 150, 210, 128],
          ].map(([x1, y1, x2, y2], i) => (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="1.2"
              strokeDasharray="5 7"
              strokeLinecap="round"
              className="anim-dashflow"
              style={{ animationDelay: `${i * 0.25}s` }}
            />
          ))}
          {[
            [58, 52], [150, 34], [250, 74], [344, 44], [116, 150], [210, 128], [306, 156],
          ].map(([cx, cy], i) => (
            <g key={i} className="anim-softpulse" style={{ transformOrigin: `${cx}px ${cy}px`, animationDelay: `${i * 0.35}s` }}>
              <circle cx={cx} cy={cy} r="6.5" fill="rgba(255,255,255,0.18)" />
              <circle cx={cx} cy={cy} r="3.2" fill="#fff" />
            </g>
          ))}
        </svg>

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <Eyebrow dark>{a.heroEyebrow}</Eyebrow>
          <h1 className="mt-5 text-4xl font-bold leading-[1.03] tracking-tight drop-shadow-sm sm:text-6xl">
            {a.heroTitle}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
            {a.heroSubtitle}
          </p>
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
