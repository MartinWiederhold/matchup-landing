"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type Overlay = "discover" | "organize" | "community" | "progress";

const FEATURES: { title: string; copy: string; img: string; overlay: Overlay }[] = [
  {
    title: "Entdecke Spieler",
    copy: "Swipe durch Profile verifizierter Spieler. Filtere nach Sportart, Skill-Level, Alter und Entfernung. Bei einem gegenseitigen Like entsteht ein Match.",
    img: "/landing/entdecke-spieler.jpg",
    overlay: "discover",
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
    img: "/landing/verfolge-fortschritt.jpg",
    overlay: "progress",
  },
];

function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ob = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          ob.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, []);
  return { ref, inView };
}

/* Kleiner, dezenter Chip unten links auf dem Bild */
function Chip({
  show,
  children,
}: {
  show: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/15 backdrop-blur-md ${
        show ? "anim-rise" : "opacity-0"
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

/* Entdecke Spieler — Tennisball + Match (Pink-Akzent) */
function DiscoverOverlay({ show }: { show: boolean }) {
  return (
    <Chip show={show}>
      <TennisBall className="h-4 w-4 text-pink-400" />
      <span>94 % Match</span>
    </Chip>
  );
}

/* Spiele organisieren — offene Slots (Punkte-Reihe) */
function OrganizeOverlay({ show }: { show: boolean }) {
  return (
    <Chip show={show}>
      <span className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-1.5 w-1.5 rounded-full bg-matchup" />
        ))}
        <span className="h-1.5 w-1.5 rounded-full ring-1 ring-white/60" />
      </span>
      <span>3/4 Spieler</span>
    </Chip>
  );
}

/* Deine Community — kleiner Live-Ring */
function CommunityOverlay({ show }: { show: boolean }) {
  const C = 2 * Math.PI * 7;
  return (
    <Chip show={show}>
      <svg viewBox="0 0 20 20" className="h-5 w-5 -rotate-90">
        <circle cx="10" cy="10" r="7" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" />
        <circle
          cx="10"
          cy="10"
          r="7"
          fill="none"
          stroke="var(--matchup-blue)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C}
          className={show ? "anim-ring" : ""}
          style={{ ["--ring-c" as string]: `${C}` }}
        />
      </svg>
      <span>2.4k aktiv</span>
    </Chip>
  );
}

/* Verfolge Fortschritt — Mini-Wochenbalken + Level */
function ProgressOverlay({ show }: { show: boolean }) {
  const bars = [45, 70, 40, 95, 60];
  return (
    <Chip show={show}>
      <span>Lvl 7</span>
      <span className="flex h-4 items-end gap-[3px]">
        {bars.map((h, i) => (
          <span
            key={i}
            className={`w-1 rounded-sm bg-matchup ${show ? "anim-bar" : "scale-y-0"}`}
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
