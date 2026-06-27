import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import BeratungCta from "@/components/BeratungCta";

export const metadata: Metadata = {
  title: "Beratung — Matchup",
  description:
    "Von der Sportauswahl bis zum perfekten Schläger — wir helfen dir weiter.",
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
      <PageHero
        title="Persönliche Beratung"
        subtitle="Von der Sportauswahl bis zum perfekten Schläger — wir helfen dir weiter."
      />

      <section className="bg-white px-4 py-24 sm:px-6 lg:px-12">
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

      <BeratungCta />
    </>
  );
}
