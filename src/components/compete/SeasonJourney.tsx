"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n";

// Grob nachgezeichneter Weg (x%, y% der Bühne) von unten (Spieler) nach oben (Ziel).
const PATH: [number, number][] = [
  [63, 93], [60, 85], [71, 75], [54, 67], [30, 61],
  [52, 51], [74, 45], [50, 37], [28, 31], [45, 23], [18, 15], [7, 9],
];

// Stationen: reveal-Schwelle (Scroll-Progress 0–1) + Karten-Position (x%,y%) + Seite.
type WP = { at: number; x: number; y: number; side: "l" | "r"; name: string; meta: { de: string; en: string } };
const WAYPOINTS: WP[] = [
  { at: 0.18, x: 44, y: 78, side: "l", name: "ITF M25 Wetzlar", meta: { de: "12.–18. Mai · Sand", en: "12–18 May · Clay" } },
  { at: 0.42, x: 60, y: 58, side: "r", name: "Roland-Garros Quali", meta: { de: "20.–24. Mai · Sand", en: "20–24 May · Clay" } },
  { at: 0.64, x: 40, y: 42, side: "l", name: "Challenger Prag", meta: { de: "1.–7. Juni · Sand", en: "1–7 Jun · Clay" } },
  { at: 0.84, x: 55, y: 26, side: "r", name: "ATP 250 Gstaad", meta: { de: "14.–20. Juli · Sand", en: "14–20 Jul · Clay" } },
];

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function pointAt(p: number): [number, number] {
  const n = PATH.length - 1;
  const f = Math.max(0, Math.min(0.999, p)) * n;
  const i = Math.floor(f);
  const t = f - i;
  return [lerp(PATH[i][0], PATH[i + 1][0], t), lerp(PATH[i][1], PATH[i + 1][1], t)];
}

export default function SeasonJourney() {
  const { locale } = useLocale();
  const lang = locale === "de" ? "de" : "en";
  const ref = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 wenn Sektion-Oberkante am unteren Rand, 1 wenn Unterkante am oberen Rand.
      const prog = (vh - r.top) / (vh + r.height);
      setP(Math.max(0, Math.min(1, prog)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, []);

  const [mx, my] = pointAt(p);
  const finished = p > 0.9;
  const T = {
    de: { label: "SEASON JOURNEY", title: "Deine Saison, Schritt für Schritt.", sub: "Plane jedes Turnier, verfolge deinen Weg — vom ersten ITF bis zum grossen Court.", done: "Saison abgeschlossen", rank: "Ranking", net: "Netto" },
    en: { label: "SEASON JOURNEY", title: "Your season, step by step.", sub: "Plan every tournament, follow your path — from your first ITF to the big court.", done: "Season complete", rank: "Ranking", net: "Net" },
  }[lang];

  return (
    <section ref={ref} className="relative bg-[#3b46c9]" style={{ height: "230vh" }}>
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        {/* Bühne im Bild-Seitenverhältnis (900×1274) */}
        <div className="relative h-full max-h-screen" style={{ aspectRatio: "900 / 1274" }}>
          <img src="/compete/season-journey.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />

          {/* Kopf-Text */}
          <div className="absolute inset-x-0 top-0 z-20 p-5 text-white sm:p-7">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-white/70">{T.label}</span>
            <h2 className="mt-2 max-w-[9em] text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{T.title}</h2>
            <p className="mt-2 max-w-[16em] text-[12px] leading-snug text-white/70 sm:text-sm">{T.sub}</p>
          </div>

          {/* Marker (wandert den Weg hoch) */}
          <span
            className="absolute z-30 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.9)] transition-none"
            style={{ left: `${mx}%`, top: `${my}%` }}
          >
            <span className="h-2 w-2 rounded-full bg-[#3b46c9]" />
          </span>

          {/* Turnier-Stationen */}
          {WAYPOINTS.map((w, i) => {
            const shown = p >= w.at;
            return (
              <div
                key={i}
                className={`absolute z-20 w-[46%] max-w-[220px] -translate-y-1/2 transition-all duration-500 ${w.side === "l" ? "-translate-x-full pr-2 text-right" : "pl-2"} ${shown ? "translate-y-[-50%] opacity-100" : "translate-y-[-30%] opacity-0"}`}
                style={{ left: `${w.x}%`, top: `${w.y}%` }}
              >
                <div className="inline-block rounded-2xl bg-white/95 px-3.5 py-2.5 text-left shadow-xl ring-1 ring-black/5 backdrop-blur">
                  <p className="text-[13px] font-extrabold leading-tight text-neutral-900">{w.name}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-matchup">{w.meta[lang]}</p>
                </div>
              </div>
            );
          })}

          {/* Ziel-Linie oben */}
          <div className="absolute inset-x-0 top-[6%] z-10 flex justify-center">
            <div className={`h-4 w-24 rounded-sm transition-opacity duration-500 ${finished ? "opacity-100" : "opacity-40"}`} style={{ backgroundImage: "repeating-conic-gradient(#fff 0% 25%, #0b1030 0% 50%)", backgroundSize: "10px 10px" }} />
          </div>

          {/* Result-Karte am Ende */}
          <div className={`absolute inset-x-0 top-[11%] z-30 flex justify-center px-6 transition-all duration-700 ${finished ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
            <div className="rounded-2xl bg-neutral-950 px-5 py-4 text-center text-white shadow-2xl ring-1 ring-white/10">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-400">✓ {T.done}</p>
              <div className="mt-2 flex items-center justify-center gap-5">
                <span><span className="block text-lg font-extrabold leading-none">+180</span><span className="text-[9px] font-bold uppercase tracking-wide text-white/50">{T.rank}</span></span>
                <span className="h-6 w-px bg-white/15" />
                <span><span className="block text-lg font-extrabold leading-none text-emerald-400">+4.2k</span><span className="text-[9px] font-bold uppercase tracking-wide text-white/50">{T.net} CHF</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
