import type { Metadata } from "next";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Hilfe & FAQ",
  description:
    "Häufige Fragen zu Matchup: Spielpartner finden, Matching, Events, Konto und Sicherheit.",
  alternates: { canonical: "/faq" },
};

const FAQ = [
  {
    q: "Was ist Matchup?",
    a: "Matchup verbindet Spieler für Tennis, Padel und Pickleball. Du findest Spielpartner auf deinem Level in deiner Nähe, organisierst Spiele und entdeckst Events.",
  },
  {
    q: "Ist Matchup kostenlos?",
    a: "Ja, das Erstellen eines Profils und das Finden von Spielpartnern ist kostenlos.",
  },
  {
    q: "Wie finde ich einen Spielpartner?",
    a: "Erstelle ein Profil, wähle deine Sportart, dein Level und deinen Umkreis. Im Tab «Entdecken» siehst du passende Spieler und kannst dich verbinden. Bei einem gegenseitigen Interesse entsteht ein Match.",
  },
  {
    q: "Wie funktioniert das Matching?",
    a: "Du filterst in «Entdecken» nach Sportart, Level, Alter, Geschlecht und Entfernung. Likest du ein Profil und die Person liked zurück, entsteht ein Match und ihr könnt chatten.",
  },
  {
    q: "Kann ich Spiele organisieren?",
    a: "Ja. Du kannst offene Spiele erstellen oder bestehenden Spielen beitreten — für Einzel oder Doppel, spontan oder geplant.",
  },
  {
    q: "Wie melde oder blockiere ich jemanden?",
    a: "Über das jeweilige Profil kannst du Nutzer melden oder blockieren. Wir prüfen Meldungen und gehen gegen Missbrauch vor.",
  },
  {
    q: "Wie kontaktiere ich den Support?",
    a: "Schreib uns jederzeit an swissflow@bluewin.ch — wir helfen gern weiter.",
  },
];

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHero
        title="Hilfe & FAQ"
        subtitle="Antworten auf die häufigsten Fragen rund um Matchup."
      />
      <section className="bg-white px-4 py-16 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-[760px] divide-y divide-neutral-200">
          {FAQ.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="cursor-pointer list-none text-base font-semibold tracking-tight">
                {f.q}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">{f.a}</p>
            </details>
          ))}
          <p className="pt-8 text-sm text-neutral-500">
            Noch Fragen?{" "}
            <a
              href="mailto:swissflow@bluewin.ch?subject=Matchup%20Support"
              className="font-semibold text-matchup hover:underline"
            >
              swissflow@bluewin.ch
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
