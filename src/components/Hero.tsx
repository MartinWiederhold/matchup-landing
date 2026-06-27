"use client";

import { useRef, useState } from "react";

const HERO_VIDEO =
  "https://videos.ctfassets.net/rbzqg6pelgqa/1qNUDy3Kalh6nd3sYyy4vD/3ecd2e778352554be72abf7bb1d518a2/WHOOP_Web_HomepageHero_JanJump_16x9_Final__1_.mp4";

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);

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
        poster="https://images.ctfassets.net/rbzqg6pelgqa/2NfK4ifx3hmXPavqk5YTLa/ebd21ddc09078d79fdbca9da5351cb60/one_hero_desktop_1184x808__1_.png"
      />
      {/* subtle darkening so the white headline stays legible */}
      <div className="absolute inset-0 bg-black/15" />

      <div className="relative mx-auto flex min-h-[calc(100vh-68px-44px)] max-w-[1600px] flex-col px-4 py-12 sm:px-6 lg:px-12">
        <div className="flex flex-1 flex-col justify-center">
          <h1 className="max-w-5xl text-[2.75rem] font-bold leading-[0.98] tracking-tight text-white sm:text-7xl lg:text-[6.5rem]">
            Finde deinen perfekten Spielpartner.
          </h1>
          <p className="mt-7 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
            Matchup verbindet dich mit Tennis-, Padel- und Pickleball-Spielern in
            deiner Nähe. Matche, chatte und spiele — alles in einer App.
          </p>
        </div>
        <div className="flex flex-col items-center gap-4 pb-6 sm:flex-row sm:justify-center">
          <a
            href="/app"
            className="inline-block rounded-full bg-matchup px-12 py-4 text-sm font-bold tracking-wide text-white transition-colors hover:bg-matchup-hover"
          >
            Jetzt Partner finden
          </a>
          <a
            href="/find-a-partner"
            className="inline-block rounded-full border border-white/70 px-12 py-4 text-sm font-bold tracking-wide text-white transition-colors hover:bg-white hover:text-black"
          >
            So funktioniert&apos;s
          </a>
        </div>
      </div>

      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Video pausieren" : "Video abspielen"}
        className="absolute bottom-6 right-6 z-10 flex h-10 w-10 items-center justify-center text-white/90 transition-opacity hover:opacity-70"
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
    </section>
  );
}
