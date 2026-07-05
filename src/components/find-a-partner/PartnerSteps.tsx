"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useT } from "@/lib/i18n";

type Overlay = "profile" | "match" | "play";

type Step = {
  number: string;
  title: string;
  text: string;
  img: string;
  overlay: Overlay;
};

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

/* Chip immer sichtbar — animiert werden nur die Grafik-Elemente innen
   (wie in der Landing-Sektion „Discover players / Organise games …"). */
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-black/55 px-3.5 py-2 text-xs font-semibold text-white ring-1 ring-white/15 backdrop-blur-md">
      {children}
    </div>
  );
}

/* 01 — Sportarten/Profil */
function ProfileOverlay({ show }: { show: boolean }) {
  const t = useT();
  return (
    <Chip>
      <span className="flex items-center gap-1">
        {["T", "P", "P"].map((s, i) => (
          <span
            key={i}
            className={`flex h-5 w-5 items-center justify-center rounded-full bg-matchup text-[9px] font-bold ${show ? "anim-pop" : ""}`}
            style={show ? { animationDelay: `${i * 0.12}s` } : undefined}
          >
            {s}
          </span>
        ))}
      </span>
      <span>{t("findPartner.profileReady")}</span>
    </Chip>
  );
}

/* 02 — Match */
function MatchOverlay({ show }: { show: boolean }) {
  const t = useT();
  return (
    <Chip>
      <svg
        viewBox="0 0 24 24"
        className={`h-4 w-4 text-pink-400 ${show ? "anim-pop" : ""}`}
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9Z" />
      </svg>
      <span>{t("findPartner.itsAMatch")}</span>
    </Chip>
  );
}

/* 03 — Chat-Szene: Nachricht + kreisrunde Spieler-Avatare, animiert eingeblendet */
const PLAY_AVATARS = [
  "/find-a-partner/av-man.jpg",
  "/find-a-partner/av-woman1.jpg",
  "/find-a-partner/av-woman2.jpg",
];
function PlayOverlay({ show }: { show: boolean }) {
  const t = useT();
  return (
    <div className="absolute bottom-4 left-4 flex flex-col items-start gap-2.5">
      {/* Chat-Nachricht */}
      <div
        className={`rounded-2xl rounded-bl-md bg-white px-3.5 py-2 text-xs font-semibold text-black shadow-lg ${
          show ? "anim-pop" : "opacity-0"
        }`}
        style={show ? { animationDelay: "0.45s" } : undefined}
      >
        {t("findPartner.chatMessage")}
      </div>

      {/* Avatare + Label */}
      <div className="flex items-center gap-2">
        <div className="flex -space-x-3">
          {PLAY_AVATARS.map((src, i) => (
            <span
              key={src}
              className={`h-9 w-9 overflow-hidden rounded-full ring-2 ring-white ${
                show ? "anim-pop" : "opacity-0"
              }`}
              style={show ? { animationDelay: `${i * 0.12}s` } : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </span>
          ))}
        </div>
        <span className="rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/15 backdrop-blur-md">
          {t("findPartner.gameOrganized")}
        </span>
      </div>
    </div>
  );
}

function StepRow({ step, index }: { step: Step; index: number }) {
  const t = useT();
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
              ? "[object-position:center_20%]"
              : step.overlay === "match"
                ? "[object-position:center_20%]"
                : step.overlay === "profile"
                  ? "[object-position:center_10%]"
                  : ""
          }`}
        />
        {step.overlay === "profile" && <ProfileOverlay show={inView} />}
        {step.overlay === "match" && <MatchOverlay show={inView} />}
        {step.overlay === "play" && <PlayOverlay show={inView} />}
      </div>

      <div className="w-full lg:w-1/2">
        <p className="text-sm font-bold tracking-[0.18em] text-matchup">
          {t("findPartner.stepLabel")} {step.number}
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
  const t = useT();
  const steps: Step[] = [
    {
      number: "01",
      title: t("findPartner.step1Title"),
      text: t("findPartner.step1Text"),
      img: "/find-a-partner/step-profile.jpg",
      overlay: "profile",
    },
    {
      number: "02",
      title: t("findPartner.step2Title"),
      text: t("findPartner.step2Text"),
      img: "/find-a-partner/step-match-v2.jpg",
      overlay: "match",
    },
    {
      number: "03",
      title: t("findPartner.step3Title"),
      text: t("findPartner.step3Text"),
      img: "/find-a-partner/step-play-v3.jpg",
      overlay: "play",
    },
  ];
  return (
    <section className="bg-white px-4 py-24 sm:px-6 lg:px-12">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-20 lg:gap-28">
        {steps.map((step, i) => (
          <StepRow key={step.number} step={step} index={i} />
        ))}
      </div>
    </section>
  );
}
