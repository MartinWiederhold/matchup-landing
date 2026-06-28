import Image from "next/image";

const IMG = "https://images.ctfassets.net/rbzqg6pelgqa";

const FEATURES: {
  title: string;
  copy: string;
  img: string;
  overlay?: "community" | "organize";
}[] = [
  {
    title: "Entdecke Spieler",
    copy: "Swipe durch Profile verifizierter Spieler. Filtere nach Sportart, Skill-Level, Alter und Entfernung. Bei einem gegenseitigen Like entsteht ein Match.",
    img: `${IMG}/4DF8ek6h14dnRgI3fjAAOc/7c760379a38f2e32df2ebb5e0e8ee579/Sleep-1.png`,
  },
  {
    title: "Spiele organisieren",
    copy: "Erstelle ein Match, wähle Ort und Zeit, lade Mitspieler ein oder tritt offenen Spielen bei. Singles oder Doubles, spontan oder geplant.",
    img: "/landing/spiele-organisieren.jpg",
    overlay: "organize",
  },
  {
    title: "Deine Community",
    copy: "Gründe Gruppen, tausche dich im Feed aus und vernetze dich mit Gleichgesinnten — von Club-Gruppen bis zu lokalen Spieltreffs.",
    img: "/shop/pullover-frau.png",
    overlay: "community",
  },
  {
    title: "Verfolge Fortschritt",
    copy: "Sammle XP, steige im Level auf, halte deinen Streak und schalte Achievements frei. Wochen-Statistiken zeigen dir, wie aktiv du bist.",
    img: `${IMG}/1iwCpHpMpjVHfBkQcNGv4P/fbd48749a53d0979359b9b7a86ff9de6/Stay_connected_to_your_heart_health__1_.webp`,
  },
];

/** Animierte, premium Community-Grafik (Glas-Karte mit Live-Ring & Avataren). */
function CommunityOverlay() {
  const C = 2 * Math.PI * 20; // Umfang r=20
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-2xl bg-black/45 px-3.5 py-3 ring-1 ring-white/15 backdrop-blur-md">
        {/* Live-Ring */}
        <div className="relative h-12 w-12 shrink-0">
          <svg viewBox="0 0 48 48" className="h-12 w-12 -rotate-90">
            <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="var(--matchup-blue)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={C}
              className="community-ring"
              style={{ ["--ring-c" as string]: `${C}` }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white">
            2.4k
          </span>
        </div>

        <div className="min-w-0">
          {/* Avatar-Stack */}
          <div className="flex -space-x-2">
            {[
              "from-orange-400 to-red-500",
              "from-sky-400 to-blue-600",
              "from-emerald-400 to-teal-600",
              "from-violet-400 to-purple-600",
            ].map((g, i) => (
              <span
                key={i}
                className={`h-6 w-6 rounded-full bg-gradient-to-br ${g} ring-2 ring-black/40`}
              />
            ))}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-white/90">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
            </span>
            Aktive Spieler in deiner Nähe
          </div>
        </div>
      </div>
    </div>
  );
}

/** Animierte Match-Grafik (Glas-Karte: Termin, offene Slots, Live-Füllung). */
function OrganizeOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-black/45 p-3.5 ring-1 ring-white/15 backdrop-blur-md">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-white/70">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              Sa · 18:00
            </div>
            <div className="mt-0.5 truncate text-sm font-bold text-white">
              Padel Zone · Court 2
            </div>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400" />
            </span>
            Offen
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-white/80">
          <span>Spieler</span>
          <span className="font-semibold text-white">3/4</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
          <div className="organize-fill h-full rounded-full bg-matchup" />
        </div>
        <div className="mt-2.5 flex -space-x-2">
          {[
            "from-orange-400 to-red-500",
            "from-sky-400 to-blue-600",
            "from-emerald-400 to-teal-600",
          ].map((g, i) => (
            <span
              key={i}
              className={`h-6 w-6 rounded-full bg-gradient-to-br ${g} ring-2 ring-black/40`}
            />
          ))}
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-white/50 bg-black/30 text-xs text-white/70 ring-2 ring-black/40">
            +
          </span>
        </div>
      </div>
    </div>
  );
}

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
                {f.overlay === "community" && <CommunityOverlay />}
                {f.overlay === "organize" && <OrganizeOverlay />}
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
