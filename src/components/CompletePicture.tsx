"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type Overlay = "discover" | "organize" | "community" | "progress";

const FEATURES: { title: string; copy: string; img: string; overlay: Overlay }[] = [
  {
    title: "Entdecke Spieler",
    copy: "Swipe durch Profile verifizierter Spieler. Filtere nach Sportart, Skill-Level, Alter und Entfernung. Bei einem gegenseitigen Like entsteht ein Match.",
    img: "/landing/discover-hd.jpg",
    overlay: "discover",
  },
  {
    title: "Spiele organisieren",
    copy: "Erstelle ein Match, wähle Ort und Zeit, lade Mitspieler ein oder tritt offenen Spielen bei. Singles oder Doubles, spontan oder geplant.",
    img: "/landing/organize-hd.jpg",
    overlay: "organize",
  },
  {
    title: "Deine Community",
    copy: "Gründe Gruppen, tausche dich im Feed aus und vernetze dich mit Gleichgesinnten — von Club-Gruppen bis zu lokalen Spieltreffs.",
    img: "/landing/community-hd.jpg",
    overlay: "community",
  },
  {
    title: "Verfolge Fortschritt",
    copy: "Sammle XP, steige im Level auf, halte deinen Streak und schalte Achievements frei. Wochen-Statistiken zeigen dir, wie aktiv du bist.",
    img: "/landing/progress-hd.jpg",
    overlay: "progress",
  },
];

/**
 * inView wird TRUE, sobald die Karte deutlich sichtbar ist, und wieder FALSE,
 * sobald sie das Sichtfeld verlässt — so spielt die Animation bei JEDEM
 * Reinscrollen erneut ab (nicht nur einmal). rootMargin schneidet oben/unten
 * ab, damit sie nicht zu früh (am Rand) auslöst.
 */
function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ob = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.55, rootMargin: "-12% 0px -12% 0px" },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, []);
  return { ref, inView };
}

/* Kleiner, dezenter Chip unten links auf dem Bild — IMMER sichtbar.
 * Animiert wird nicht der Chip selbst, sondern die Elemente innen
 * (Punkte, Ring, Balken). So bleibt das Badge beim Scrollen stehen
 * und ruht im fertigen Zustand, die Grafik darin spielt beim
 * Reinscrollen jedes Mal neu ab. */
function Chip({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <div
      className={`absolute bottom-3 flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/15 backdrop-blur-md ${
        align === "right" ? "right-3" : "left-3"
      }`}
    >
      {children}
    </div>
  );
}

function TennisBall({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M5.6 5.6a11 11 0 0 1 0 12.8M18.4 5.6a11 11 0 0 0 0 12.8" />
    </svg>
  );
}

/* Entdecke Spieler — Tennisball + Match (Pink-Akzent).
 * Ball ist immer da, ploppt beim Reinscrollen kurz auf. */
function DiscoverOverlay({ show }: { show: boolean }) {
  return (
    <Chip>
      <TennisBall className={`h-4 w-4 text-pink-400 ${show ? "anim-pop" : ""}`} />
      <span>94 % Match</span>
    </Chip>
  );
}

/* Spiele organisieren — offene Slots (Punkte-Reihe).
 * Punkte bleiben sichtbar, ploppen beim Reinscrollen nacheinander auf. */
function OrganizeOverlay({ show }: { show: boolean }) {
  return (
    <Chip>
      <span className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full bg-matchup ${show ? "anim-pop" : ""}`}
            style={{ animationDelay: `${i * 110}ms` }}
          />
        ))}
        <span
          className={`h-1.5 w-1.5 rounded-full ring-1 ring-white/60 ${show ? "anim-pop" : ""}`}
          style={{ animationDelay: "330ms" }}
        />
      </span>
      <span>3/4 Spieler</span>
    </Chip>
  );
}

/* Deine Community — kleiner Live-Ring.
 * Ring ruht gefüllt, füllt sich beim Reinscrollen erneut auf. */
function CommunityOverlay({ show }: { show: boolean }) {
  const C = 2 * Math.PI * 7;
  const filled = C * 0.3; // Endzustand (Ruhe)
  return (
    <Chip align="right">
      <svg viewBox="0 0 20 20" className="h-5 w-5 -rotate-90">
        <circle cx="10" cy="10" r="7" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" />
        <circle
          cx="10"
          cy="10"
          r="7"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={filled}
          className={show ? "anim-ring" : ""}
          style={{ ["--ring-c" as string]: `${C}` }}
        />
      </svg>
      <span>2.4k aktiv</span>
    </Chip>
  );
}

/* Verfolge Fortschritt — Mini-Wochenbalken + Level.
 * Balken bleiben in voller Höhe, wachsen beim Reinscrollen erneut hoch. */
function ProgressOverlay({ show }: { show: boolean }) {
  const bars = [45, 70, 40, 95, 60];
  return (
    <Chip align="right">
      <span>Lvl 7</span>
      <span className="flex h-4 items-end gap-[3px]">
        {bars.map((h, i) => (
          <span
            key={i}
            className={`w-1 rounded-sm bg-emerald-400 ${show ? "anim-bar" : ""}`}
            style={{ height: `${h}%`, transformOrigin: "bottom", animationDelay: `${i * 80}ms` }}
          />
        ))}
      </span>
    </Chip>
  );
}

function FeatureCard({ f }: { f: (typeof FEATURES)[number] }) {
  const { ref, inView } = useInView<HTMLElement>();
  return (
    <article
      ref={ref}
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
        {f.overlay === "discover" && <DiscoverOverlay show={inView} />}
        {f.overlay === "organize" && <OrganizeOverlay show={inView} />}
        {f.overlay === "community" && <CommunityOverlay show={inView} />}
        {f.overlay === "progress" && <ProgressOverlay show={inView} />}
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold tracking-tight">{f.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">{f.copy}</p>
      </div>
    </article>
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
            <FeatureCard key={f.title} f={f} />
          ))}
        </div>
      </div>
    </section>
  );
}
