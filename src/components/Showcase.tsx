import Image from "next/image";
import { getT } from "@/lib/i18n/server";

export default async function Showcase() {
  const t = await getT();

  const rows = [
    {
      eyebrow: t("landing.securityEyebrow"),
      title: t("landing.securityTitle"),
      copy: t("landing.securityCopy"),
      img: "/landing/sicherheit.jpg",
      reverse: false,
      cta: { label: t("landing.securityCta"), href: "/app" },
    },
    {
      eyebrow: t("landing.eventsEyebrow"),
      title: t("landing.eventsTitle"),
      copy: t("landing.eventsCopy"),
      img: "/events/showcase-events.jpg",
      position: "center 30%",
      reverse: true,
      cta: { label: t("landing.eventsCta"), href: "/events" },
    },
  ];

  return (
    <section id="shop" className="bg-white px-4 py-24 sm:px-6 lg:px-12">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-24">
        {rows.map((row) => (
          <div
            key={row.title}
            className={`flex flex-col items-center gap-10 lg:gap-16 ${
              row.reverse ? "lg:flex-row-reverse" : "lg:flex-row"
            }`}
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-neutral-100 lg:w-1/2">
              <Image
                src={row.img}
                alt={row.title}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                style={row.position ? { objectPosition: row.position } : undefined}
              />
            </div>
            <div className="w-full lg:w-1/2">
              <p className="text-xs font-bold tracking-[0.2em] text-matchup">
                {row.eyebrow}
              </p>
              <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
                {row.title}
              </h2>
              <p className="mt-6 text-base leading-relaxed text-neutral-600 sm:text-lg">
                {row.copy}
              </p>
              <a
                href={row.cta.href}
                className="mt-8 inline-block rounded-full border border-black px-8 py-4 text-sm font-bold tracking-wide text-black transition-colors hover:bg-black hover:text-white"
              >
                {row.cta.label}
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
