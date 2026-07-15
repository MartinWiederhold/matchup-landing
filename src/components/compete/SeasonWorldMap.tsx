"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { useT, useLocale } from "@/lib/i18n";
import { TOURNAMENTS, TIER_META, tournamentLogo, HOME_BASES, leg } from "@/lib/tournaments";

/* Projektion auf die Karte (/public/compete/world-map.jpg, 1536×1024).
 * Equirectangular, an den Landmassen des Bildes kalibriert. */
const MAP_W = 1536, MAP_H = 1024;
const project = (lat: number, lng: number) => ({
  x: 150 + (lng + 130) * 4.34,
  y: 300 + (55 - lat) * 4.0,
});

/* Eine echte Saison quer über den Globus (chronologisch), Start Zürich. */
const ROUTE_IDS = [
  "brisbane", "dubai", "indian-wells", "miami", "monte-carlo",
  "madrid", "rome", "queens", "cincinnati", "shanghai",
];

const HOME = HOME_BASES[0]; // Zürich

type Node = { id: string; name: string; city: string; x: number; y: number; color: string; logo: string | null; tier: string };

const NODES: Node[] = ROUTE_IDS.map((id) => {
  const t = TOURNAMENTS.find((x) => x.id === id)!;
  const p = project(t.lat, t.lng);
  return { id, name: t.name, city: t.city, x: p.x, y: p.y, color: TIER_META[t.tier].color, logo: tournamentLogo(t), tier: TIER_META[t.tier].short };
});
const START = { ...project(HOME.lat, HOME.lng), city: HOME.name };

/* Flugbögen zwischen den Stationen (Start → 1 → 2 → …). */
const PTS = [{ x: START.x, y: START.y }, ...NODES.map((n) => ({ x: n.x, y: n.y }))];
const ARCS = PTS.slice(1).map((p2, i) => {
  const p1 = PTS[i];
  const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const lift = Math.min(150, dist * 0.24);
  const cx = (p1.x + p2.x) / 2;
  const cy = (p1.y + p2.y) / 2 - lift;
  return { d: `M${p1.x} ${p1.y} Q ${cx} ${cy} ${p2.x} ${p2.y}`, len: Math.round(dist * 1.3) };
});

/* Echte Gesamt-Flugdistanz aus den Turnierdaten. */
const SEQ = [HOME, ...ROUTE_IDS.map((id) => TOURNAMENTS.find((x) => x.id === id)!)];
const TOTAL_KM = SEQ.slice(1).reduce((s, t, i) => s + leg(SEQ[i], t).km, 0);

export default function SeasonWorldMap() {
  const t = useT();
  const { locale } = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ob = new IntersectionObserver(([e]) => setShow(e.isIntersecting), { threshold: 0.25 });
    ob.observe(el);
    return () => ob.disconnect();
  }, []);

  const pct = (x: number, y: number) => ({ left: `${(x / MAP_W) * 100}%`, top: `${(y / MAP_H) * 100}%` });

  return (
    <section className="bg-black px-4 py-24 text-white sm:px-6 lg:px-12">
      <div className="mx-auto max-w-[1280px]">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-white/50">{t("landing.worldLabel")}</span>
        <h2 className="mt-3 max-w-2xl text-2xl font-bold leading-tight tracking-tight sm:text-4xl">{t("landing.worldTitle")}</h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/55 sm:text-base">{t("landing.worldCopy")}</p>

        {/* Karte */}
        <div ref={ref} className="relative mx-auto mt-10 w-full overflow-hidden rounded-3xl ring-1 ring-white/10" style={{ aspectRatio: `${MAP_W} / ${MAP_H}` }}>
          <img src="/compete/world-map.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_40%,rgba(75,59,243,0.18),transparent_70%)]" />

          {/* Flugrouten */}
          <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="absolute inset-0 h-full w-full" aria-hidden>
            <defs>
              <linearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#4b3bf3" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>
            {ARCS.map((a, i) => (
              <path
                key={i}
                d={a.d}
                fill="none"
                stroke="url(#routeGrad)"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeDasharray={a.len}
                strokeDashoffset={show ? 0 : a.len}
                className={show ? "anim-draw" : ""}
                style={{ ["--dash-len" as string]: `${a.len}`, animationDelay: `${300 + i * 260}ms`, filter: "drop-shadow(0 0 6px rgba(75,59,243,0.7))" }}
              />
            ))}
          </svg>

          {/* Start Zürich */}
          <span className="absolute z-20 -translate-x-1/2 -translate-y-1/2" style={pct(START.x, START.y)}>
            <span className={`relative flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.9)] ${show ? "anim-pop" : "opacity-0"}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-black" />
            </span>
            <span className={`absolute left-1/2 top-5 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-black transition-opacity duration-500 ${show ? "opacity-100" : "opacity-0"}`}
              style={{ transitionDelay: "200ms" }}>
              {t("landing.worldStart")} · {START.city}
            </span>
          </span>

          {/* Turnier-Stationen */}
          {NODES.map((n, i) => (
            <span key={n.id} className="absolute z-10 -translate-x-1/2 -translate-y-1/2" style={pct(n.x, n.y)}>
              <span
                className={`flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-white ${show ? "anim-pop" : "opacity-0"}`}
                style={{ boxShadow: `0 0 0 2px ${n.color}, 0 0 14px ${n.color}`, animationDelay: `${500 + i * 260}ms` }}
              >
                {n.logo ? <img src={n.logo} alt="" loading="lazy" className="h-[62%] w-[62%] object-contain" /> : <span className="h-1.5 w-1.5 rounded-full" style={{ background: n.color }} />}
              </span>
              <span
                className={`absolute left-1/2 top-6 hidden -translate-x-1/2 whitespace-nowrap text-[9px] font-bold text-white/70 transition-opacity duration-500 sm:block ${show ? "opacity-100" : "opacity-0"}`}
                style={{ transitionDelay: `${650 + i * 260}ms` }}
              >
                {n.city}
              </span>
            </span>
          ))}
        </div>

        {/* Kennzahlen aus den echten Turnierdaten */}
        <div className="mt-8 grid grid-cols-3 gap-4 sm:max-w-xl">
          {[
            { v: String(NODES.length), l: t("landing.worldStops") },
            { v: TOTAL_KM.toLocaleString(locale === "de" ? "de-CH" : "en-US"), l: t("landing.worldKm") },
            { v: "4", l: t("landing.worldContinents") },
          ].map((s) => (
            <div key={s.l}>
              <p className="text-2xl font-extrabold tracking-tight text-matchup sm:text-3xl">{s.v}</p>
              <p className="mt-1 text-[11px] font-semibold text-white/50 sm:text-xs">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
