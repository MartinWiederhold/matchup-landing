import Image from "next/image";

const IMG = "https://images.ctfassets.net/rbzqg6pelgqa";

const FEATURES = [
  {
    title: "Entdecke Spieler",
    copy: "Swipe durch Profile verifizierter Spieler. Filtere nach Sportart, Skill-Level, Alter und Entfernung. Bei einem gegenseitigen Like entsteht ein Match.",
    img: `${IMG}/4DF8ek6h14dnRgI3fjAAOc/7c760379a38f2e32df2ebb5e0e8ee579/Sleep-1.png`,
  },
  {
    title: "Spiele organisieren",
    copy: "Erstelle ein Match, wähle Ort und Zeit, lade Mitspieler ein oder tritt offenen Spielen bei. Singles oder Doubles, spontan oder geplant.",
    img: `${IMG}/2MWznHIwCBkq0psNWBlMBd/4350d9ee58495e76c4b3946d09706bdf/Recovery.png`,
  },
  {
    title: "Deine Community",
    copy: "Gründe Gruppen, tausche dich im Feed aus und vernetze dich mit Gleichgesinnten — von Club-Gruppen bis zu lokalen Spieltreffs.",
    img: `${IMG}/50iEhV1lmhfX4BOUjZnTK/0e7e3ac599a5607e1fb091b28cc2c127/Strain-1.png`,
  },
  {
    title: "Verfolge Fortschritt",
    copy: "Sammle XP, steige im Level auf, halte deinen Streak und schalte Achievements frei. Wochen-Statistiken zeigen dir, wie aktiv du bist.",
    img: `${IMG}/1iwCpHpMpjVHfBkQcNGv4P/fbd48749a53d0979359b9b7a86ff9de6/Stay_connected_to_your_heart_health__1_.webp`,
  },
];

export default function CompletePicture() {
  return (
    <section id="funktionsweise" className="bg-neutral-50 px-4 py-24 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-[1280px]">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            Alles, was du zum Spielen brauchst
          </h2>
          <p className="mt-6 text-base leading-relaxed text-neutral-600 sm:text-lg">
            Von der ersten Begegnung bis zum fertig organisierten Match — Matchup
            bringt Spieler zusammen und macht jeden Schritt einfach.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
                <Image
                  src={f.img}
                  alt={f.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold tracking-tight">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{f.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
