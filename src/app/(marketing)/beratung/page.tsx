import type { Metadata } from "next";
import BeratungWizard from "@/components/shop/BeratungWizard";

export const metadata: Metadata = {
  title: "Beratung — Matchup",
  description:
    "Persönliche Schlägerberatung: Beantworte ein paar Fragen zu deinem Spiel und erhalte eine individuelle Empfehlung — abgestimmt auf Level, Spielstil und Budget.",
};

const STATS = [
  { value: "24 h", label: "Antwortzeit" },
  { value: "100 %", label: "Unverbindlich" },
  { value: "~3 Min", label: "Ausfüllen" },
];

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
      {/* HERO mit eingebettetem Formular */}
      <section className="relative overflow-hidden bg-gradient-to-b from-neutral-50 to-white px-4 py-16 sm:px-6 lg:px-12 lg:py-24">
        {/* dezenter Akzent */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-matchup/10 blur-3xl"
        />
        <div className="relative mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-matchup">
              Persönliche Beratung
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Finde deinen perfekten Schläger
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-neutral-600 sm:text-lg">
              Beantworte ein paar Fragen zu deinem Spiel — unsere Experten melden
              sich mit einer persönlichen Empfehlung, abgestimmt auf Level,
              Spielstil und Budget.
            </p>
            <div className="mx-auto mt-8 flex max-w-md items-center justify-center gap-8">
              {STATS.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl font-bold tracking-tight sm:text-3xl">{s.value}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.08em] text-neutral-500">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <BeratungWizard />

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
