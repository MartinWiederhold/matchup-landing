import type { Metadata } from "next";
import Image from "next/image";
import PageCta from "@/components/PageCta";

export const metadata: Metadata = {
  title: "So findest du deinen Spielpartner — Matchup",
  description:
    "In drei einfachen Schritten zum perfekten Match: Profil erstellen, entdecken & matchen, chatten & spielen.",
};

const STEPS = [
  {
    number: "01",
    title: "Erstelle dein Profil",
    text: "Wähle deine Sportarten (Tennis, Padel, Pickleball), gib dein Skill-Level an, lade bis zu 4 Fotos hoch und sag uns, was du suchst — ob lockeres Spielen oder Wettkampf.",
    tag: "2 Minuten",
    icon: (
      <path d="M20 21a8 8 0 0 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
    ),
  },
  {
    number: "02",
    title: "Entdecke & Matche",
    text: "Swipe durch passende Spieler in deiner Nähe. Filtere nach Distanz, Sportart, Alter und Können. Findest du jemanden interessant? Like das Profil. Liked die Person zurück, entsteht ein Match.",
    tag: "In deiner Nähe",
    icon: (
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7 7-7Z" />
    ),
  },
  {
    number: "03",
    title: "Chatte & Spiele",
    text: "Schreibe deinem Match direkt in der App. Organisiert gemeinsam ein Spiel, bucht einen Platz und trefft euch auf dem Court. Oder tretet offenen Spielen anderer Spieler bei.",
    tag: "Auf dem Court",
    icon: (
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    ),
  },
];

export default function FindAPartnerPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex h-[58vh] min-h-[420px] items-end overflow-hidden">
        <Image
          src="/find-a-partner/partner.jpg"
          alt="Zwei Spieler auf dem Court"
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: "center 35%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/10" />
        <div className="relative z-10 mx-auto w-full max-w-[1280px] px-4 pb-14 text-white sm:px-6 lg:px-12">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-matchup" />
            In 3 Schritten
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl">
            So findest du deinen Spielpartner
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            Vom Profil bis zum Match auf dem Court — Matchup macht jeden Schritt
            einfach und einladend.
          </p>
        </div>
      </section>

      {/* Schritte */}
      <section className="bg-neutral-50 px-4 py-24 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-[1280px]">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-matchup">
              So funktioniert&apos;s
            </p>
            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              In drei einfachen Schritten zum perfekten Match
            </h2>
          </div>

          <div className="relative grid gap-6 lg:grid-cols-3 lg:gap-8">
            {/* Verbindungslinie (Desktop) */}
            <div className="absolute left-0 right-0 top-[58px] hidden h-px bg-gradient-to-r from-transparent via-matchup/30 to-transparent lg:block" />

            {STEPS.map((step) => (
              <article
                key={step.number}
                className="group relative flex flex-col rounded-3xl border border-neutral-200 bg-white p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-matchup/30 hover:shadow-[0_20px_50px_-20px_rgba(75,59,243,0.35)]"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-matchup/10 text-matchup transition-colors group-hover:bg-matchup group-hover:text-white">
                    <svg
                      className="h-7 w-7"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      {step.icon}
                    </svg>
                  </span>
                  <span className="text-5xl font-bold tracking-tight text-neutral-100 transition-colors group-hover:text-matchup/20 sm:text-6xl">
                    {step.number}
                  </span>
                </div>

                <span className="mt-7 inline-flex w-fit rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                  {step.tag}
                </span>
                <h3 className="mt-3 text-2xl font-bold tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-neutral-600">
                  {step.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <PageCta
        title="Bereit?"
        text="Erstelle jetzt dein Profil und finde deinen ersten Spielpartner."
        buttonLabel="Jetzt starten"
        buttonHref="/app"
      />
    </>
  );
}
