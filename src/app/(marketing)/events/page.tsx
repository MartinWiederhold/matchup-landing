import type { Metadata } from "next";
import Image from "next/image";
import PageHero from "@/components/PageHero";
import PageCta from "@/components/PageCta";

export const metadata: Metadata = {
  title: "Events & Turniere — Matchup",
  description:
    "Entdecke lokale Turniere, Social-Play-Events und Community-Treffen.",
};

const EVENTS = [
  {
    date: "12. Jul 2026",
    title: "Summer Smash — Zürich",
    description:
      "Padel-Turnier für alle Level. Mixed-Teams, DJ und Afterparty.",
    location: "Padel Zone Zürich",
    img: "/events/event-1.jpg",
  },
  {
    date: "19. Jul 2026",
    title: "Matchup Mixednight — Bern",
    description:
      "Tennis Mixed-Doubles Abend. Zufällige Paarungen, lockere Atmosphäre.",
    location: "TC Bern-Neufeld",
    img: "/events/event-1.jpg",
  },
  {
    date: "26. Jul 2026",
    title: "Pickleball Open — Basel",
    description:
      "Das erste Schweizer Pickleball Open. Einsteiger bis Fortgeschrittene.",
    location: "Sportcenter St. Jakob, Basel",
    img: "/events/event-1.jpg",
  },
  {
    date: "09. Aug 2026",
    title: "Community Day — Luzern",
    description:
      "Offener Spieltag für die gesamte Matchup-Community. Alle Sportarten.",
    location: "Sportanlage Allmend, Luzern",
    img: "/events/event-1.jpg",
  },
];

export default function EventsPage() {
  return (
    <>
      <PageHero
        title="Events & Turniere"
        subtitle="Entdecke lokale Turniere, Social-Play-Events und Community-Treffen."
      />

      <section className="bg-white px-4 py-24 sm:px-6 lg:px-12">
        <div className="mx-auto grid max-w-[1280px] gap-6 sm:grid-cols-2">
          {EVENTS.map((event) => (
            <article
              key={event.title}
              className="flex flex-col overflow-hidden rounded-3xl border border-neutral-200"
            >
              <div className="relative aspect-[16/9] bg-neutral-100">
                <Image
                  src={event.img}
                  alt={event.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover"
                />
                <span className="absolute left-4 top-4 inline-flex rounded-full bg-matchup px-4 py-1.5 text-xs font-bold tracking-wide text-white">
                  {event.date}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-8">
                <h2 className="text-2xl font-bold tracking-tight">
                  {event.title}
                </h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-neutral-600">
                  {event.description}
                </p>
                <p className="mt-5 flex items-center gap-1.5 text-sm font-medium text-neutral-500">
                  <svg
                    className="h-4 w-4 shrink-0 text-matchup"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {event.location}
                </p>
                <a
                  href="#"
                  className="mt-6 inline-block w-fit rounded-full border border-black px-7 py-3 text-sm font-bold tracking-wide text-black transition-colors hover:bg-black hover:text-white"
                >
                  Mehr erfahren
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <PageCta
        title="Eigenes Event planen?"
        text="In der Matchup App kannst du Spiele und Turniere selbst organisieren."
        buttonLabel="App öffnen"
        buttonHref="/app"
      />
    </>
  );
}
