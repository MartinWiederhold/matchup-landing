"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n";

/* Grob nachgezeichneter Weg (x%, y% der Bühne) von unten (Spieler) → oben (Ziel).
 * Die Marker-Kugel wandert diese Punkte entlang. */
const PATH: [number, number][] = [
  [63, 93], [60, 85], [71, 75], [54, 67], [30, 61],
  [52, 51], [74, 45], [50, 37], [28, 31], [45, 23], [18, 15], [7, 9],
];

/* Punkt am Wegende (Ziel/Flag) — Bild-relativ in %. */
const FINISH: [number, number] = [7, 10];

type WP = {
  at: number;                 // Reveal-Schwelle (Scroll-Progress 0–1)
  pinX: number; pinY: number; // Punkt AUF dem Weg (Bild-relativ %)
  side: "l" | "r";            // in welche Flanke die Karte hängt
  code: string;               // Kürzel im Logo-Kreis
  ring: string;               // Kategorie-Farbe
  tier: { de: string; en: string };
  name: string;
  cat: { de: string; en: string };
  date: { de: string; en: string };
  surface: { de: string; en: string };
  note: { de: string; en: string };
};

const WAYPOINTS: WP[] = [
  {
    at: 0.15, pinX: 54, pinY: 74, side: "l",
    code: "M25", ring: "#7c8698",
    tier: { de: "ITF WORLD TOUR", en: "ITF WORLD TOUR" },
    name: "ITF M25 Wetzlar",
    cat: { de: "$25.000 · Sand", en: "$25,000 · Clay" },
    date: { de: "12.–18. Mai", en: "12–18 May" },
    surface: { de: "Deutschland", en: "Germany" },
    note: { de: "Achtelfinale · +8 Ränge", en: "Round of 16 · +8 ranks" },
  },
  {
    at: 0.39, pinX: 32, pinY: 57, side: "r",
    code: "RG", ring: "#c6432b",
    tier: { de: "GRAND SLAM · QUALI", en: "GRAND SLAM · QUALI" },
    name: "Roland-Garros",
    cat: { de: "Qualifikation · Sand", en: "Qualifying · Clay" },
    date: { de: "20.–24. Mai", en: "20–24 May" },
    surface: { de: "Paris", en: "Paris" },
    note: { de: "3. Quali-Runde erreicht", en: "Reached final qualifying round" },
  },
  {
    at: 0.61, pinX: 69, pinY: 44, side: "l",
    code: "CH", ring: "#1f9d55",
    tier: { de: "ATP CHALLENGER", en: "ATP CHALLENGER" },
    name: "Challenger Prag",
    cat: { de: "CH 75 · Sand", en: "CH 75 · Clay" },
    date: { de: "1.–7. Juni", en: "1–7 Jun" },
    surface: { de: "Tschechien", en: "Czechia" },
    note: { de: "Viertelfinale · +40 Punkte", en: "Quarterfinal · +40 points" },
  },
  {
    at: 0.83, pinX: 31, pinY: 29, side: "r",
    code: "250", ring: "#e0a500",
    tier: { de: "ATP TOUR", en: "ATP TOUR" },
    name: "ATP 250 Gstaad",
    cat: { de: "Hauptfeld · Sand", en: "Main draw · Clay" },
    date: { de: "14.–20. Juli", en: "14–20 Jul" },
    surface: { de: "Schweiz", en: "Switzerland" },
    note: { de: "Tour-Debüt · Runde 2", en: "Tour debut · Round 2" },
  },
];

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function pointAt(p: number): [number, number] {
  const n = PATH.length - 1;
  const f = Math.max(0, Math.min(0.999, p)) * n;
  const i = Math.floor(f);
  const t = f - i;
  return [lerp(PATH[i][0], PATH[i + 1][0], t), lerp(PATH[i][1], PATH[i + 1][1], t)];
}

/* Runder „Logo"-Chip mit Kategorie-Farbring. */
function LogoChip({ code, ring, size = 46 }: { code: string; ring: string; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-white font-extrabold tracking-tight"
      style={{
        width: size, height: size,
        boxShadow: `0 0 0 2.5px ${ring}, 0 6px 16px -6px rgba(0,0,0,0.4)`,
        color: ring,
        fontSize: code.length > 2 ? 12 : 14,
      }}
    >
      {code}
    </span>
  );
}

type Box = { l: number; t: number; w: number; h: number };

export default function SeasonJourney() {
  const { locale } = useLocale();
  const lang = locale === "de" ? "de" : "en";
  const sectionRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [p, setP] = useState(0);
  const [box, setBox] = useState<Box | null>(null);

  // Scroll-Fortschritt (Marker + Reveals).
  useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const prog = (vh - r.top) / (vh + r.height);
      setP(Math.max(0, Math.min(1, prog)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Bild-Rechteck relativ zum Sticky-Wrapper messen (für Flanken-Karten + Leader-Lines).
  // Ändert sich nur bei Resize/Load, nicht beim Scrollen (Bild bewegt sich mit dem Wrapper).
  useLayoutEffect(() => {
    const measure = () => {
      const wrap = wrapRef.current;
      const img = imgRef.current;
      if (!wrap || !img) return;
      const wr = wrap.getBoundingClientRect();
      const ir = img.getBoundingClientRect();
      setBox({ l: ir.left - wr.left, t: ir.top - wr.top, w: ir.width, h: ir.height });
    };
    measure();
    window.addEventListener("resize", measure);
    const id = window.setTimeout(measure, 200); // nach Layout/Font
    return () => { window.removeEventListener("resize", measure); window.clearTimeout(id); };
  }, []);

  const [mx, my] = pointAt(p);
  const finished = p > 0.9;
  const doneCount = WAYPOINTS.filter((w) => p >= w.at).length;

  const T = {
    de: {
      label: "SEASON JOURNEY",
      title: "Deine Saison,\nSchritt für Schritt.",
      sub: "Jedes Turnier geplant — vom ersten ITF bis zum grossen Court.",
      progress: "Stationen",
      done: "Saison abgeschlossen",
      rank: "Ranking", net: "Netto", events: "Turniere",
    },
    en: {
      label: "SEASON JOURNEY",
      title: "Your season,\nstep by step.",
      sub: "Every tournament planned — from your first ITF to the big court.",
      progress: "Stops",
      done: "Season complete",
      rank: "Ranking", net: "Net", events: "Events",
    },
  }[lang];

  // Pixel-Position eines Bild-relativen Punktes im Wrapper.
  const px = (X: number, Y: number) =>
    box ? { x: box.l + (X / 100) * box.w, y: box.t + (Y / 100) * box.h } : null;

  return (
    <section ref={sectionRef} className="relative bg-[#353fcc]" style={{ height: "260vh" }}>
      <div ref={wrapRef} className="sticky top-0 h-screen overflow-hidden">
        {/* Bühne im Bild-Seitenverhältnis (900×1274), zentriert. */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative h-full max-h-screen" style={{ aspectRatio: "900 / 1274" }}>
            <img
              ref={imgRef}
              src="/compete/season-journey.jpg"
              alt=""
              onLoad={() => {
                const wrap = wrapRef.current, img = imgRef.current;
                if (!wrap || !img) return;
                const wr = wrap.getBoundingClientRect(), ir = img.getBoundingClientRect();
                setBox({ l: ir.left - wr.left, t: ir.top - wr.top, w: ir.width, h: ir.height });
              }}
              className="absolute inset-0 h-full w-full object-cover"
            />

            {/* Marker-Kugel (wandert den Weg hoch) + Puls-Ring */}
            <span
              className="absolute z-30 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${mx}%`, top: `${my}%` }}
            >
              <span className="absolute inset-0 -m-3 animate-ping rounded-full bg-white/40" style={{ animationDuration: "1.8s" }} />
              <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-[0_0_26px_rgba(255,255,255,0.95)]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#353fcc]" />
              </span>
            </span>

            {/* Station-Pins direkt auf dem Weg */}
            {WAYPOINTS.map((w, i) => {
              const active = p >= w.at;
              return (
                <span
                  key={`pin-${i}`}
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${w.pinX}%`, top: `${w.pinY}%` }}
                >
                  <span
                    className={`block rounded-full transition-all duration-500 ${active ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
                    style={{ width: 15, height: 15, background: "#fff", boxShadow: `0 0 0 3.5px ${w.ring}` }}
                  />
                </span>
              );
            })}

            {/* Ziel-Flag am Wegende */}
            <span
              className="absolute z-30 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${FINISH[0]}%`, top: `${FINISH[1]}%` }}
            >
              {finished && (
                <span className="absolute inset-0 -m-4 animate-ping rounded-full bg-white/50" style={{ animationDuration: "1.4s" }} />
              )}
              <span
                className={`relative block rounded-full ring-2 ring-white transition-all duration-500 ${finished ? "scale-110" : "scale-90 opacity-70"}`}
                style={{ width: 30, height: 30, backgroundImage: "repeating-conic-gradient(#0b1030 0% 25%, #fff 0% 50%)", backgroundSize: "10px 10px" }}
              />
            </span>
          </div>
        </div>

        {/* ── Overlay: Kopfzeile, Flanken-Karten, Leader-Lines, Ergebnis ── */}
        <div className="pointer-events-none absolute inset-0 z-40">
          {/* Kopfzeile oben-rechts (freie Fläche, kein Overlap mit dem Weg) */}
          <div className="absolute right-5 top-6 max-w-[min(52%,380px)] text-right text-white sm:right-8 sm:top-9">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-white/75">{T.label}</span>
            <h2 className="mt-2 whitespace-pre-line text-[26px] font-bold leading-[1.05] tracking-tight sm:text-[38px]">{T.title}</h2>
            <p className="ml-auto mt-3 max-w-[22em] text-[12px] leading-snug text-white/70 sm:text-sm">{T.sub}</p>
            {/* Fortschritt */}
            <div className="mt-4 flex items-center justify-end gap-2">
              <div className="flex gap-1.5">
                {WAYPOINTS.map((w, i) => (
                  <span key={i} className="h-1.5 w-6 rounded-full transition-colors duration-500"
                    style={{ background: p >= w.at ? "#fff" : "rgba(255,255,255,0.28)" }} />
                ))}
              </div>
              <span className="text-[11px] font-bold tabular-nums text-white/80">{doneCount}/{WAYPOINTS.length}</span>
            </div>
          </div>

          {/* Turnier-Karten in den Flanken + Leader-Lines */}
          {box && WAYPOINTS.map((w, i) => {
            const pin = px(w.pinX, w.pinY)!;
            const active = p >= w.at;
            const left = w.side === "l";
            return (
              <div key={`card-${i}`}>
                {/* Leader-Line vom Pin in die Flanke */}
                <div
                  className="absolute h-px bg-white/45"
                  style={{
                    top: pin.y,
                    left: left ? 0 : pin.x,
                    right: left ? undefined : 0,
                    width: left ? pin.x : undefined,
                    transformOrigin: left ? "right" : "left",
                    transform: `scaleX(${active ? 1 : 0})`,
                    transition: "transform .6s ease .05s",
                  }}
                />
                {/* Kleiner Knoten am Pin */}
                <div
                  className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-500"
                  style={{ top: pin.y, left: pin.x, background: w.ring, opacity: active ? 1 : 0 }}
                />
                {/* Karte am Flanken-Rand */}
                <div
                  className="absolute w-[min(40vw,232px)] -translate-y-1/2"
                  style={{ top: pin.y, left: left ? 16 : undefined, right: left ? undefined : 16 }}
                >
                  <div
                    className={`transition-all duration-500 ${active ? "translate-x-0 opacity-100" : "opacity-0 " + (left ? "-translate-x-4" : "translate-x-4")}`}
                  >
                    <div className="flex items-center gap-3 rounded-2xl bg-white/97 p-3 shadow-[0_18px_40px_-14px_rgba(0,0,0,0.55)] ring-1 ring-black/5 backdrop-blur">
                      <LogoChip code={w.code} ring={w.ring} />
                      <div className="min-w-0">
                        <p className="truncate text-[9px] font-extrabold uppercase tracking-[0.13em]" style={{ color: w.ring }}>{w.tier[lang]}</p>
                        <p className="mt-0.5 truncate text-[14px] font-extrabold leading-tight text-neutral-900">{w.name}</p>
                        <p className="mt-0.5 truncate text-[11px] font-medium text-neutral-500">{w.date[lang]} · {w.cat[lang]}</p>
                        <p className="mt-1 flex items-center gap-1 truncate text-[11px] font-bold text-neutral-800">
                          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: w.ring }} />
                          {w.note[lang]}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Ergebnis-Karte (Ziel) — oben-links, klar getrennt vom Kopf-Text */}
          {box && (() => {
            const fin = px(FINISH[0], FINISH[1])!;
            return (
              <div
                className={`absolute w-[min(48vw,260px)] transition-all duration-700 ${finished ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}`}
                style={{ top: fin.y + 22, left: 16 }}
              >
                <div className="overflow-hidden rounded-2xl bg-neutral-950 text-white shadow-[0_24px_60px_-18px_rgba(0,0,0,0.7)] ring-1 ring-white/10">
                  <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-black text-neutral-950">✓</span>
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-400">{T.done}</span>
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-white/10">
                    <div className="px-3 py-3 text-center">
                      <span className="block text-[19px] font-extrabold leading-none">+180</span>
                      <span className="mt-1 block text-[8px] font-bold uppercase tracking-wide text-white/45">{T.rank}</span>
                    </div>
                    <div className="px-3 py-3 text-center">
                      <span className="block text-[19px] font-extrabold leading-none text-emerald-400">+4.2k</span>
                      <span className="mt-1 block text-[8px] font-bold uppercase tracking-wide text-white/45">{T.net} CHF</span>
                    </div>
                    <div className="px-3 py-3 text-center">
                      <span className="block text-[19px] font-extrabold leading-none">{WAYPOINTS.length}</span>
                      <span className="mt-1 block text-[8px] font-bold uppercase tracking-wide text-white/45">{T.events}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </section>
  );
}
