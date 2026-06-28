import type { Metadata } from "next";
import Image from "next/image";
import BeratungTabs from "@/components/shop/BeratungTabs";

export const metadata: Metadata = {
  title: "Beratung — Matchup",
  description:
    "Persönliche Schlägerberatung und Profi-Bespannung: individuelle Empfehlung oder spiele mit dem Setup deiner Stars.",
};

const BLOCKS = [
  {
    title: "Welcher Sport passt zu dir?",
    text: "Tennis, Padel oder Pickleball — jede Sportart hat ihren eigenen Reiz. Wir helfen dir herauszufinden, welche am besten zu deinem Spielstil, deiner Fitness und deinen Zielen passt.",
  },
  {
    title: "Der richtige Schläger",
    text: "Gewicht, Balance, Bespannung, Griffstärke — die Wahl des richtigen Schlägers macht den Unterschied. Basierend auf deinem Level und Spielstil geben wir individuelle Empfehlungen.",
  },
  {
    title: "Training & Coaching",
    text: "Finde Coaches, Trainingsgruppen und Kursangebote in deiner Nähe. Ob Anfänger-Kurs oder Intensiv-Training — wir verbinden dich mit den richtigen Leuten.",
  },
];

export default function BeratungPage() {
  return (
    <>
      {/* TITELBILD */}
      <section className="relative flex h-[42vh] min-h-[300px] items-center justify-center overflow-hidden">
        <Image
          src="/beratung/hero.jpg"
          alt="Beratung"
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: "center 45%" }}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 px-6 text-center text-white">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">
            Persönliche Beratung
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl">
            Finde dein perfektes Setup
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
            Individuelle Schlägerberatung oder die Bespannung deiner Stars —
            wähle, was du brauchst.
          </p>
        </div>
      </section>

      {/* TOGGLE + INHALT */}
      <section className="bg-gradient-to-b from-neutral-50 to-white px-4 py-16 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <BeratungTabs />
          <p className="mt-5 text-center text-xs text-neutral-500">
            Deine Angaben werden vertraulich behandelt und ausschließlich zur
            persönlichen Beratung verwendet.
          </p>
        </div>
      </section>

      {/* Unterstützende Infos */}
      <section className="bg-white px-4 pb-24 sm:px-6 lg:px-12">
        <div className="mx-auto grid max-w-[1280px] gap-6 md:grid-cols-3">
          {BLOCKS.map((block) => (
            <article
              key={block.title}
              className="rounded-3xl border border-neutral-200 p-8"
            >
              <h2 className="text-xl font-bold tracking-tight">{block.title}</h2>
              <p className="mt-4 text-sm leading-relaxed text-neutral-600">
                {block.text}
              </p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
