import Image from "next/image";
import RotatingImage from "./RotatingImage";

const IMG = "https://images.ctfassets.net/rbzqg6pelgqa";

const TIERS: {
  name: string;
  tagline: string;
  img: string;
  images?: string[];
  features: string[];
  featured: boolean;
}[] = [
  {
    name: "TENNIS",
    tagline: "Der Klassiker — finde Partner für Singles oder Doubles auf deinem Level.",
    img: `${IMG}/3waVHtJ6R9HOTAreGiUP5a/e9a8df7e641adb0cbf3adc005d31a278/One_card__1_.png`,
    images: ["/tennis/tennis-1.jpg", "/tennis/tennis-2.jpg", "/tennis/tennis-3.jpg"],
    features: [
      "Spieler nach Skill-Level & Rating filtern",
      "Singles & Doubles organisieren",
      "Plätze und Clubs in deiner Nähe",
    ],
    featured: false,
  },
  {
    name: "PADEL",
    tagline: "Die am schnellsten wachsende Sportart — immer im Doppel, immer gesellig.",
    img: `${IMG}/2L5W622UNiYxlnHE3hHGAL/d3443637b907fe3541f32a8d9fe58cbc/Peak_card__1_.png`,
    features: [
      "Finde drei Mitspieler in Sekunden",
      "Offene Spiele beitreten oder erstellen",
      "Padel-Gruppen & Community-Treffs",
    ],
    featured: true,
  },
  {
    name: "PICKLEBALL",
    tagline: "Schnell zu lernen, schwer zu meistern — perfekt für jedes Level.",
    img: `${IMG}/4jiLfkO6RPmVBkcMtN3jRX/87b712d7ce771cf1d579d619aed659f0/Life_card__3_.webp`,
    features: [
      "Einsteiger und Profis verbinden",
      "Spontane Matches in deiner Umgebung",
      "Lokale Events & Turniere entdecken",
    ],
    featured: false,
  },
];

export default function Memberships() {
  return (
    <section id="mitgliedschaft" className="bg-white px-4 py-24 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-[1280px]">
        <div className="text-center">
          <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            Wähle deine Sportart
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-neutral-600 sm:text-lg">
            Tennis, Padel oder Pickleball — auf Matchup findest du für jede
            Sportart die passenden Spielpartner.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <article
              key={tier.name}
              className={`flex flex-col overflow-hidden rounded-3xl border ${
                tier.featured
                  ? "border-matchup ring-2 ring-matchup"
                  : "border-neutral-200"
              }`}
            >
              <div className="relative aspect-[4/3] bg-neutral-100">
                {tier.images ? (
                  <RotatingImage
                    images={tier.images}
                    alt={tier.name}
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                ) : (
                  <Image
                    src={tier.img}
                    alt={tier.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover"
                  />
                )}
                {tier.featured && (
                  <span className="absolute right-4 top-4 rounded-full bg-matchup px-3 py-1 text-xs font-bold tracking-wide text-white">
                    IM TREND
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col p-7">
                <h3 className="text-xl font-bold tracking-wide">{tier.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                  {tier.tagline}
                </p>

                <ul className="mt-6 flex-1 space-y-3 text-sm">
                  {tier.features.map((feat) => (
                    <li key={feat} className="flex gap-2.5">
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0 text-matchup"
                        viewBox="0 0 16 16"
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
                      <span className="text-neutral-700">{feat}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="/app"
                  className={`mt-8 inline-block rounded-full px-6 py-3.5 text-center text-sm font-bold tracking-wide transition-colors ${
                    tier.featured
                      ? "bg-matchup text-white hover:bg-matchup-hover"
                      : "border border-black text-black hover:bg-black hover:text-white"
                  }`}
                >
                  Partner finden
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
