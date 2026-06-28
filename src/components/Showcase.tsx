import Image from "next/image";

const IMG = "https://images.ctfassets.net/rbzqg6pelgqa";

const ROWS = [
  {
    eyebrow: "SICHERHEIT",
    title: "Sicher und verifiziert",
    copy: "Jedes Profil wird geprüft. Melde unangemessenes Verhalten, blockiere Nutzer und vertraue auf automatische Moderation. Deine Daten gehören dir.",
    img: `${IMG}/4Yh8vc5goDh5JgJHv9DVo1/c0366d221c77a0c972cebd4cc30a6b03/Image_desktop.webp`,
    reverse: false,
  },
  {
    eyebrow: "EVENTS",
    title: "Events & Spieltreffs",
    copy: "Entdecke lokale Turniere, Social-Play-Abende und Community-Treffen — oder organisiere dein eigenes Event direkt in der App.",
    img: "/events/event-1.jpg",
    position: "center 40%",
    reverse: true,
  },
];

export default function Showcase() {
  return (
    <section id="shop" className="bg-white px-4 py-24 sm:px-6 lg:px-12">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-24">
        {ROWS.map((row) => (
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
                href="/app"
                className="mt-8 inline-block rounded-full border border-black px-8 py-4 text-sm font-bold tracking-wide text-black transition-colors hover:bg-black hover:text-white"
              >
                App öffnen
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
