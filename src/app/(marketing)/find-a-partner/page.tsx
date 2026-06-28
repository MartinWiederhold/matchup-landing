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
  },
  {
    number: "02",
    title: "Entdecke & Matche",
    text: "Swipe durch passende Spieler in deiner Nähe. Filtere nach Distanz, Sportart, Alter und Können. Findest du jemanden interessant? Like das Profil. Liked die Person zurück, entsteht ein Match.",
  },
  {
    number: "03",
    title: "Chatte & Spiele",
    text: "Schreibe deinem Match direkt in der App. Organisiert gemeinsam ein Spiel, bucht einen Platz und trefft euch auf dem Court. Oder tretet offenen Spielen anderer Spieler bei.",
  },
];

export default function FindAPartnerPage() {
  return (
    <>
      <section className="relative flex h-[46vh] min-h-[320px] items-center justify-center overflow-hidden">
        <Image
          src="/find-a-partner/hero.jpg"
          alt="Spielpartner finden"
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: "center 40%" }}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 max-w-4xl px-6 text-center text-white">
          <h1 className="text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl">
            So findest du deinen Spielpartner
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            In drei einfachen Schritten zum perfekten Match.
          </p>
        </div>
      </section>

      <section className="bg-white px-4 py-24 sm:px-6 lg:px-12">
        <div className="mx-auto flex max-w-[1080px] flex-col gap-12">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="flex flex-col gap-4 border-b border-neutral-200 pb-12 last:border-0 last:pb-0 sm:flex-row sm:gap-10"
            >
              <span className="text-5xl font-bold tracking-tight text-matchup sm:w-32 sm:shrink-0">
                {step.number}
              </span>
              <div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {step.title}
                </h2>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-neutral-600">
                  {step.text}
                </p>
              </div>
            </div>
          ))}
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
