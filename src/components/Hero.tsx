"use client";

import { useRef, useState } from "react";
import { useT } from "@/lib/i18n";

const HERO_VIDEO = "/hero.mp4";
const HERO_AUDIO = "/hero-audio.m4a";
const FADE_START = 12; // ab hier leiser werden
const FADE_END = 15; // hier praktisch still → sauberer Loop-Übergang

// Lautstärke entlang der Video-Zeit: voll bis 12s, linear aus bis 15s.
function volAt(time: number): number {
  if (time < FADE_START) return 1;
  if (time >= FADE_END) return 0;
  return Math.max(0, (FADE_END - time) / (FADE_END - FADE_START));
}

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastTime = useRef(0);
  const [playing, setPlaying] = useState(true);
  const [sound, setSound] = useState(false); // Musik startet NIE von selbst
  const t = useT();

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  const toggleSound = () => {
    const a = audioRef.current;
    const v = videoRef.current;
    const next = !sound;
    setSound(next);
    if (!a) return;
    if (next) {
      // Ab aktueller Video-Position starten (nur solange die Musik noch läuft)
      if (v && v.currentTime < FADE_END) {
        a.currentTime = v.currentTime;
        a.volume = volAt(v.currentTime);
        a.muted = false;
        void a.play();
      }
    } else {
      a.pause();
    }
  };

  // Musik an die Video-Zeitachse koppeln: 0–20s, beim Loop von vorne.
  const onTimeUpdate = () => {
    const v = videoRef.current;
    const a = audioRef.current;
    if (!v || !a) return;
    const wrapped = v.currentTime < lastTime.current - 0.5; // Video ist neu gestartet
    lastTime.current = v.currentTime;

    if (!sound) {
      if (!a.paused) a.pause();
      return;
    }
    if (wrapped && v.currentTime < FADE_END) {
      a.currentTime = 0;
      a.volume = 1;
      void a.play();
      return;
    }
    if (v.currentTime >= FADE_END) {
      if (!a.paused) a.pause();
    } else {
      a.volume = volAt(v.currentTime); // sanfter Fade 12→15s
      if (a.paused) {
        a.currentTime = v.currentTime;
        void a.play();
      } else if (Math.abs(a.currentTime - v.currentTime) > 0.4) {
        a.currentTime = v.currentTime; // locker synchron halten
      }
    }
  };

  return (
    <section id="top" className="relative isolate overflow-hidden bg-neutral-700">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src={HERO_VIDEO}
        autoPlay
        muted
        loop
        playsInline
        poster="/hero-poster.jpg"
        onTimeUpdate={onTimeUpdate}
      />
      <audio ref={audioRef} src={HERO_AUDIO} preload="auto" />
      {/* subtle darkening so the white headline stays legible */}
      <div className="absolute inset-0 bg-black/15" />

      <div className="relative mx-auto flex min-h-[calc(100svh-68px-44px)] max-w-[1600px] flex-col px-4 py-10 sm:py-12 sm:px-6 lg:px-12">
        <div className="flex flex-1 flex-col justify-center">
          <h1 className="max-w-5xl whitespace-pre-line text-[2.75rem] font-bold leading-[0.98] tracking-tight text-white sm:text-7xl lg:text-[6.5rem]">
            {t("landing.heroTitle")}
          </h1>
          <p className="mt-7 max-w-2xl text-[15px] leading-relaxed text-white/90 sm:text-lg">
            {t("landing.heroSubtitle")}
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 pb-2 sm:flex-row sm:items-center sm:justify-center sm:gap-4 sm:pb-6">
          <a
            href="/app"
            className="inline-block rounded-full bg-matchup px-10 py-4 text-sm font-bold tracking-wide text-white transition-colors hover:bg-matchup-hover sm:px-12"
          >
            {t("landing.heroCtaPrimary")}
          </a>
          <a
            href="/map"
            className="inline-block rounded-full border border-white/70 px-10 py-4 text-sm font-bold tracking-wide text-white transition-colors hover:bg-white hover:text-black sm:px-12"
          >
            {t("landing.heroCtaSecondary")}
          </a>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 z-10 flex items-center gap-1">
        {/* Ton an/aus (Musik startet nie automatisch) */}
        <button
          type="button"
          onClick={toggleSound}
          aria-label={sound ? "Musik aus" : "Musik an"}
          className="flex h-10 w-10 items-center justify-center text-white/90 transition-opacity hover:opacity-70"
        >
          {sound ? (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 5 6 9H2v6h4l5 4V5z" />
              <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />
            </svg>
          ) : (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 5 6 9H2v6h4l5 4V5z" />
              <path d="M22 9l-6 6M16 9l6 6" />
            </svg>
          )}
        </button>

        {/* Video Play/Pause */}
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? t("landing.heroPause") : t("landing.heroPlay")}
          className="flex h-10 w-10 items-center justify-center text-white/90 transition-opacity hover:opacity-70"
        >
          {playing ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
              <rect x="3" y="2" width="4" height="14" rx="1" />
              <rect x="11" y="2" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
              <path d="M4 2.5v13l11-6.5L4 2.5z" />
            </svg>
          )}
        </button>
      </div>
    </section>
  );
}
