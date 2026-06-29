"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type Overlay = "profile" | "match" | "play";

const STEPS: {
  number: string;
  title: string;
  text: string;
  img: string;
  overlay: Overlay;
}[] = [
  {
    number: "01",
    title: "Erstelle dein Profil",
    text: "Wähle deine Sportarten (Tennis, Padel, Pickleball), gib dein Skill-Level an, lade bis zu 4 Fotos hoch und sag uns, was du suchst — ob lockeres Spielen oder Wettkampf.",
    img: "/find-a-partner/step-profile.jpg",
    overlay: "profile",
  },
  {
    number: "02",
    title: "Entdecke & Matche",
    text: "Swipe durch passende Spieler in deiner Nähe. Filtere nach Distanz, Sportart, Alter und Können. Findest du jemanden interessant? Like das Profil. Liked die Person zurück, entsteht ein Match.",
    img: "/find-a-partner/step-match-v2.jpg",
    overlay: "match",
  },
  {
    number: "03",
    title: "Chatte & Spiele",
    text: "Schreibe deinem Match direkt in der App. Organisiert gemeinsam ein Spiel, bucht einen Platz und trefft euch auf dem Court. Oder tretet offenen Spielen anderer Spieler bei.",
    img: "/find-a-partner/step-play.jpg",
    overlay: "play",
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
      { threshold: 0.3 },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, []);
  return { ref, inView };
}

function Chip({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-black/55 px-3.5 py-2 text-xs font-semibold text-white ring-1 ring-white/15 backdrop-blur-md ${
        show ? "anim-rise" : "opacity-0"
      }`}
    >
      {children}
    </div>
  );
}

/* 01 — Sportarten/Profil */
function ProfileOverlay({ show }: { show: boolean }) {
  return (
    <Chip show={show}>
      <span className="flex items-center gap-1">
        {["T", "P", "P"].map((s, i) => (
          <span
            key={i}
            className="flex h-5 w-5 items-center justify-center rounded-full bg-matchup text-[9px] font-bold"
          >
            {s}
          </span>
        ))}
      </span>
      <span>Profil bereit</span>
    </Chip>
  );
}

/* 02 — Match */
function MatchOverlay({ show }: { show: boolean }) {
  return (
    <Chip show={show}>
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-pink-400" fill="currentColor" aria-hidden="true">
        <path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9Z" />
      </svg>
      <span>Es ist ein Match!</span>
    </Chip>
  );
}

/* 03 — Spiel organisiert */
function PlayOverlay({ show }: { show: boolean }) {
  return (
    <Chip show={show}>
      <span className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-1.5 w-1.5 rounded-full bg-matchup" />
        ))}
        <span className="h-1.5 w-1.5 rounded-full ring-1 ring-white/60" />
      </span>
      <span>Spiel organisiert</span>
    </Chip>
  );
}

function StepRow({ step, index }: { step: (typeof STEPS)[number]; index: number }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const reverse = index % 2 === 1;
  return (
    <div
      ref={ref}
      className={`flex flex-col items-center gap-10 lg:gap-16 ${
        reverse ? "lg:flex-row-reverse" : "lg:flex-row"
      }`}
    >
      <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-neutral-100 lg:w-1/2">
        <Image
          src={step.img}
          alt={step.title}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className={`object-cover transition-transform duration-500 group-hover:scale-105 ${
            step.overlay === "play"
              ? "[object-position:center_30%] lg:object-center"
              : ""
          }`}
        />
        {step.overlay === "profile" && <ProfileOverlay show={inView} />}
        {step.overlay === "match" && <MatchOverlay show={inView} />}
        {step.overlay === "play" && <PlayOverlay show={inView} />}
      </div>

      <div className="w-full lg:w-1/2">
        <p className="text-sm font-bold tracking-[0.18em] text-matchup">
          SCHRITT {step.number}
        </p>
        <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {step.title}
        </h2>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-neutral-600 sm:text-lg">
          {step.text}
        </p>
      </div>
    </div>
  );
}

export default function PartnerSteps() {
  return (
    <section className="bg-white px-4 py-24 sm:px-6 lg:px-12">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-20 lg:gap-28">
        {STEPS.map((step, i) => (
          <StepRow key={step.number} step={step} index={i} />
        ))}
      </div>
    </section>
  );
}
