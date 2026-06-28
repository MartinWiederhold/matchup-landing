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

const AVATARS = [
  "from-orange-400 to-red-500",
  "from-sky-400 to-blue-600",
  "from-emerald-400 to-teal-600",
  "from-violet-400 to-purple-600",
];

const GLASS =
  "absolute bottom-4 left-4 right-4 rounded-2xl bg-black/45 p-3.5 ring-1 ring-white/15 backdrop-blur-md";
const SHADE = "absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 to-transparent";

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

/* ── Entdecke Spieler — Pink-Match ─────────────────────────────────────── */
function DiscoverOverlay({ show }: { show: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className={SHADE} />
      <div className={GLASS}>
        <div className="flex items-center justify-center gap-3">
          <span className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 ring-2 ring-pink-500/80" />
          <span
            className="text-pink-500"
            style={show ? undefined : { opacity: 0 }}
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-9 w-9 drop-shadow ${show ? "anim-pop" : ""}`}
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9Z" />
            </svg>
          </span>
          <span className="h-10 w-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 ring-2 ring-pink-500/80" />
        </div>
        <div className="mt-2.5 text-center">
          <div className="text-sm font-bold text-white">Es ist ein Match!</div>
          <div className="text-[11px] font-medium text-pink-300">
            94 % Übereinstimmung
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Spiele organisieren — Match-Termin ────────────────────────────────── */
function OrganizeOverlay({ show }: { show: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className={SHADE} />
      <div className={GLASS}>
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
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
            Offen
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-white/80">
          <span>Spieler</span>
          <span className="font-semibold text-white">3/4</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
          <div className={`h-full rounded-full bg-matchup ${show ? "anim-fill" : "w-0"}`} />
        </div>
        <div className="mt-2.5 flex -space-x-2">
          {AVATARS.slice(0, 3).map((g, i) => (
            <span key={i} className={`h-6 w-6 rounded-full bg-gradient-to-br ${g} ring-2 ring-black/40`} />
          ))}
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-white/50 bg-black/30 text-xs text-white/70 ring-2 ring-black/40">
            +
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Deine Community — Live-Ring ───────────────────────────────────────── */
function CommunityOverlay({ show }: { show: boolean }) {
  const C = 2 * Math.PI * 20;
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className={SHADE} />
      <div className={`${GLASS} flex items-center gap-3`}>
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
              strokeDashoffset={C}
              className={show ? "anim-ring" : ""}
              style={{ ["--ring-c" as string]: `${C}` }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white">
            2.4k
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex -space-x-2">
            {AVATARS.map((g, i) => (
              <span key={i} className={`h-6 w-6 rounded-full bg-gradient-to-br ${g} ring-2 ring-black/40`} />
            ))}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-white/90">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            Aktive Spieler in deiner Nähe
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Verfolge Fortschritt — Wochen-Stats ───────────────────────────────── */
function ProgressOverlay({ show }: { show: boolean }) {
  const bars = [42, 64, 38, 82, 56, 96, 70];
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className={SHADE} />
      <div className={GLASS}>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-sm font-bold text-white">Level 7</div>
            <div className="text-[11px] text-white/70">1.840 XP</div>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-orange-400" fill="currentColor" aria-hidden="true">
              <path d="M12 2c1 3-1.5 4.5-1.5 7A3.5 3.5 0 0 0 14 12c0-1 .8-2 .8-2 1.5 1.4 2.2 3 2.2 4.7A5 5 0 0 1 7 15c0-3.5 3-5 5-13Z" />
            </svg>
            12 Tage
          </span>
        </div>
        <div className="mt-3 flex h-10 items-end gap-1.5">
          {bars.map((h, i) => (
            <span
              key={i}
              className={`flex-1 rounded-t-sm bg-gradient-to-t from-matchup to-indigo-400 ${
                show ? "anim-bar" : "scale-y-0"
              }`}
              style={{ height: `${h}%`, transformOrigin: "bottom", animationDelay: `${i * 80}ms` }}
            />
          ))}
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
            <FeatureCard key={f.title} f={f} />
          ))}
        </div>
      </div>
    </section>
  );
}
