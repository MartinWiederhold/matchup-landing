import Link from "next/link";
import Image from "next/image";
import RotatingImage, { type RotatingImg } from "./RotatingImage";
import SportAccordion, { type SportPanel } from "./SportAccordion";
import { getT } from "@/lib/i18n/server";

const IMG = "https://images.ctfassets.net/rbzqg6pelgqa";

function firstImg(images?: RotatingImg[]): { img: string; position?: string } {
  const f = images?.[0];
  if (!f) return { img: "" };
  return typeof f === "string" ? { img: f } : { img: f.src, position: f.position };
}

export default async function Memberships() {
  const t = await getT();

  const tiers: {
    name: string;
    tagline: string;
    img: string;
    images?: RotatingImg[];
    features: string[];
    featured: boolean;
  }[] = [
    {
      name: "TENNIS",
      tagline: t("landing.tennisTagline"),
      img: `${IMG}/3waVHtJ6R9HOTAreGiUP5a/e9a8df7e641adb0cbf3adc005d31a278/One_card__1_.png`,
      images: [
        "/tennis/tennis-1.jpg",
        "/tennis/tennis-2.jpg",
        { src: "/tennis/tennis-3.jpg", position: "center 25%" },
      ],
      features: [t("landing.tennisF1"), t("landing.tennisF2"), t("landing.tennisF3")],
      featured: false,
    },
    {
      name: "PADEL",
      tagline: t("landing.padelTagline"),
      img: `${IMG}/2L5W622UNiYxlnHE3hHGAL/d3443637b907fe3541f32a8d9fe58cbc/Peak_card__1_.png`,
      images: ["/padel/padel-1.jpg", "/padel/padel-2.jpg"],
      features: [t("landing.padelF1"), t("landing.padelF2"), t("landing.padelF3")],
      featured: true,
    },
    {
      name: "PICKLEBALL",
      tagline: t("landing.pickleTagline"),
      img: `${IMG}/4jiLfkO6RPmVBkcMtN3jRX/87b712d7ce771cf1d579d619aed659f0/Life_card__3_.webp`,
      images: [
        "/pickleball/pickleball-1.jpg",
        { src: "/pickleball/pickleball-2.jpg", position: "center 20%" },
      ],
      features: [t("landing.pickleF1"), t("landing.pickleF2"), t("landing.pickleF3")],
      featured: false,
    },
  ];

  const mobilePanels: SportPanel[] = tiers.map((tier) => ({
    name: tier.name,
    tagline: tier.tagline,
    features: tier.features,
    featured: tier.featured,
    ...firstImg(tier.images),
  }));

  return (
    <section id="mitgliedschaft" className="bg-white px-4 py-24 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-[1280px]">
        <div className="text-center">
          <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            {t("landing.sportsTitle")}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-neutral-600 sm:text-lg">
            {t("landing.sportsSubtitle")}
          </p>
        </div>

        {/* Mobile: horizontales Accordion */}
        <div className="mt-12 lg:hidden">
          <SportAccordion
            panels={mobilePanels}
            trendLabel={t("landing.sportsTrend")}
            ctaLabel={t("landing.sportsCta")}
          />
        </div>

        {/* Desktop: 3-Spalten-Raster */}
        <div className="mt-14 hidden gap-6 lg:grid lg:grid-cols-3">
          {tiers.map((tier) => (
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
                    {t("landing.sportsTrend")}
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

                <Link
                  href="/app"
                  className={`mt-8 inline-block rounded-full px-6 py-3.5 text-center text-sm font-bold tracking-wide transition-colors ${
                    tier.featured
                      ? "bg-matchup text-white hover:bg-matchup-hover"
                      : "border border-black text-black hover:bg-black hover:text-white"
                  }`}
                >
                  {t("landing.sportsCta")}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
