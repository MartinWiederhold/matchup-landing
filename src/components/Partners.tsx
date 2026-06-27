import Image from "next/image";

const IMG = "https://images.ctfassets.net/rbzqg6pelgqa";

export default function Partners() {
  return (
    <section id="warum-matchup" className="relative isolate overflow-hidden bg-black text-white">
      <Image
        src={`${IMG}/5I95JPiLeukka1icX19lkP/e67704d468c036f5fe152fe463ec45a0/Cristiano_partners_Desktop.png`}
        alt="MATCHUP Athlet"
        fill
        sizes="100vw"
        className="object-cover object-center opacity-70"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

      <div className="relative mx-auto flex min-h-[80vh] max-w-[1280px] flex-col justify-end px-4 py-20 sm:px-6 lg:px-12">
        <h2 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-6xl">
          Für Spieler, von Spielern
        </h2>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
          Ob du die Nummer 1 deines Clubs bist oder gerade erst anfängst —
          Matchup hilft dir, die richtigen Leute zum Spielen zu finden.
        </p>
        <div className="mt-10">
          <a
            href="/app"
            className="inline-block rounded-full bg-white px-8 py-4 text-sm font-bold tracking-wide text-black transition-colors hover:bg-white/85"
          >
            Jetzt Partner finden
          </a>
        </div>
      </div>
    </section>
  );
}
