"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n";
import { TOURNAMENTS, TIER_META, tournamentLogo, type Tournament } from "@/lib/tournaments";

/* Grob nachgezeichneter Weg (x%, y% der Bühne) von unten (Spieler) → oben (Ziel). */
const PATH: [number, number][] = [
  [63, 93], [60, 85], [71, 75], [54, 67], [30, 61],
  [52, 51], [74, 45], [50, 37], [28, 31], [45, 23], [18, 15], [7, 9],
];
const FINISH: [number, number] = [7, 10]; // Punkt am Wegende (Ziel/Flag)
const START = { pinX: 64, pinY: 95, side: "l" as const }; // Weganfang (Heimbasis)

/* Nur echte ATP-Turniere aus dem Map-Kalender (steigende Prestige: 250 → 1000).
 * Logo = echtes Turnier-Favicon (tournamentLogo), Farbe = Tier-Farbe (wie auf der Map). */
type Stop = {
  id: string;                 // Turnier-ID aus TOURNAMENTS
  at: number;                 // Reveal-Schwelle (Scroll-Progress 0–1)
  pinX: number; pinY: number; // Punkt AUF dem Weg (Bild-relativ %)
  side: "l" | "r";            // in welche Flanke die Karte hängt
  note: { de: string; en: string };
};
const STOPS: Stop[] = [
  { id: "gstaad",    at: 0.15, pinX: 54, pinY: 74, side: "l", note: { de: "Erste Runde · Tour-Debüt", en: "Round 1 · tour debut" } },
  { id: "barcelona", at: 0.39, pinX: 32, pinY: 57, side: "r", note: { de: "Achtelfinale · +45 Punkte", en: "Round of 16 · +45 points" } },
  { id: "madrid",    at: 0.61, pinX: 69, pinY: 44, side: "l", note: { de: "Viertelfinale · +180 Punkte", en: "Quarterfinal · +180 points" } },
  { id: "rome",      at: 0.83, pinX: 31, pinY: 29, side: "r", note: { de: "Hauptfeld · Karriere-Bestwert", en: "Main draw · career best" } },
];

type WP = Stop & { t: Tournament; color: string; tier: string; logo: string | null };
const WAYPOINTS: WP[] = STOPS.map((s) => {
  const t = TOURNAMENTS.find((x) => x.id === s.id)!;
  const meta = TIER_META[t.tier];
  return { ...s, t, color: meta.color, tier: meta.label, logo: tournamentLogo(t) };
});

const SURFACE: Record<string, { de: string; en: string }> = {
  Sand: { de: "Sand", en: "Clay" },
  Hartplatz: { de: "Hartplatz", en: "Hard" },
  Rasen: { de: "Rasen", en: "Grass" },
};
function rangeLabel(t: Tournament, lang: "de" | "en") {
  const loc = lang === "de" ? "de-DE" : "en-GB";
  const o: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const s = new Date(t.start + "T00:00:00").toLocaleDateString(loc, o);
  const e = new Date(t.end + "T00:00:00").toLocaleDateString(loc, o);
  return `${s} – ${e}`;
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function pointAt(p: number): [number, number] {
  const n = PATH.length - 1;
  const f = Math.max(0, Math.min(0.999, p)) * n;
  const i = Math.floor(f);
  const t = f - i;
  return [lerp(PATH[i][0], PATH[i + 1][0], t), lerp(PATH[i][1], PATH[i + 1][1], t)];
}

/* Runder Turnier-Emblem: echtes Logo-Bild, sonst Stern-Fallback. */
function Emblem({ w, size = 48 }: { w: WP; size?: number }) {
  return (
    <span
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white"
      style={{ width: size, height: size, boxShadow: `0 0 0 2.5px ${w.color}, 0 6px 16px -6px rgba(0,0,0,0.4)` }}
    >
      {w.logo ? (
        <img src={w.logo} alt="" className="h-[62%] w-[62%] object-contain" />
      ) : (
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" aria-hidden style={{ color: w.color }}>
          <path fill="currentColor" d="M12 3.2l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.7 6.6 19.5l1.1-5.9L3.4 9.4l5.9-.8L12 3.2Z" />
        </svg>
      )}
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

  // Fortschritt NUR über die gepinnte Strecke (0 = Pin-Start, 1 = Pin-Ende) —
  // so liegen alle Stationen + Ziel im tatsächlich sichtbaren Scroll-Fenster.
  useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const max = el.offsetHeight - window.innerHeight;
      const prog = max > 0 ? Math.min(1, Math.max(0, -r.top / max)) : 0;
      setP(prog);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Bild-Rechteck relativ zum Sticky-Wrapper messen (Flanken-Karten + Leader-Lines).
  const measure = () => {
    const wrap = wrapRef.current, img = imgRef.current;
    if (!wrap || !img) return;
    const wr = wrap.getBoundingClientRect(), ir = img.getBoundingClientRect();
    setBox({ l: ir.left - wr.left, t: ir.top - wr.top, w: ir.width, h: ir.height });
  };
  useLayoutEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    const id = window.setTimeout(measure, 200);
    return () => { window.removeEventListener("resize", measure); window.clearTimeout(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [mx, my] = pointAt(p);
  const finished = p > 0.9;
  const doneCount = WAYPOINTS.filter((w) => p >= w.at).length;

  const T = {
    de: { label: "SEASON JOURNEY", title: "Deine Saison,\nSchritt für Schritt.", sub: "Nur echte ATP-Turniere — von deinem ersten Tour-Start bis zum grossen Court.", done: "Saison abgeschlossen", rank: "Ranking", net: "Netto", events: "Turniere" },
    en: { label: "SEASON JOURNEY", title: "Your season,\nstep by step.", sub: "Real ATP tournaments only — from your first tour start to the big court.", done: "Season complete", rank: "Ranking", net: "Net", events: "Events" },
  }[lang];

  const px = (X: number, Y: number) =>
    box ? { x: box.l + (X / 100) * box.w, y: box.t + (Y / 100) * box.h } : null;

  return (
    <section ref={sectionRef} className="relative bg-[#353fcc]" style={{ height: "300vh" }}>
      <div ref={wrapRef} className="sticky top-0 h-screen overflow-hidden">
        {/* Bühne im Bild-Seitenverhältnis (900×1274), zentriert. */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative h-full max-h-screen" style={{ aspectRatio: "900 / 1274" }}>
            <img
              ref={imgRef}
              src="/compete/season-journey.jpg"
              alt=""
              onLoad={measure}
              className="absolute inset-0 h-full w-full object-cover"
            />

            {/* START-Knoten am Weganfang (grosser weisser Kreis, immer sichtbar) */}
            <span className="absolute z-20 -translate-x-1/2 -translate-y-1/2" style={{ left: `${START.pinX}%`, top: `${START.pinY}%` }}>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_0_22px_rgba(255,255,255,0.85)]">
                <svg width="18" height="18" viewBox="0 0 24 24" style={{ color: "#353fcc" }} aria-hidden>
                  <path fill="currentColor" d="M12 2C8.7 2 6 4.7 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.3-2.7-6-6-6Zm0 8.2A2.2 2.2 0 1 1 12 5.8a2.2 2.2 0 0 1 0 4.4Z" />
                </svg>
              </span>
            </span>

            {/* Marker-Kugel + Puls-Ring */}
            <span className="absolute z-30 -translate-x-1/2 -translate-y-1/2" style={{ left: `${mx}%`, top: `${my}%` }}>
              <span className="absolute inset-0 -m-3 animate-ping rounded-full bg-white/40" style={{ animationDuration: "1.8s" }} />
              <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-[0_0_26px_rgba(255,255,255,0.95)]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#353fcc]" />
              </span>
            </span>

            {/* Station-Pins auf dem Weg */}
            {WAYPOINTS.map((w, i) => {
              const active = p >= w.at;
              return (
                <span key={`pin-${i}`} className="absolute z-20 -translate-x-1/2 -translate-y-1/2" style={{ left: `${w.pinX}%`, top: `${w.pinY}%` }}>
                  <span className={`block rounded-full transition-all duration-500 ${active ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
                    style={{ width: 15, height: 15, background: "#fff", boxShadow: `0 0 0 3.5px ${w.color}` }} />
                </span>
              );
            })}

            {/* Ziel-Flag am Wegende */}
            <span className="absolute z-30 -translate-x-1/2 -translate-y-1/2" style={{ left: `${FINISH[0]}%`, top: `${FINISH[1]}%` }}>
              {finished && <span className="absolute inset-0 -m-4 animate-ping rounded-full bg-white/50" style={{ animationDuration: "1.4s" }} />}
              <span className={`relative block rounded-full ring-2 ring-white transition-all duration-500 ${finished ? "scale-110" : "scale-90 opacity-70"}`}
                style={{ width: 30, height: 30, backgroundImage: "repeating-conic-gradient(#0b1030 0% 25%, #fff 0% 50%)", backgroundSize: "10px 10px" }} />
            </span>
          </div>
        </div>

        {/* ── Overlay: Kopfzeile, Flanken-Karten, Leader-Lines, Ergebnis ── */}
        <div className="pointer-events-none absolute inset-0 z-40">
          {/* Kopfzeile oben-rechts (unter der Nav, bleibt beim Scrollen sichtbar) */}
          <div className="absolute right-5 top-[84px] max-w-[min(52%,380px)] text-right text-white sm:right-8 sm:top-24">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-white/75">{T.label}</span>
            <h2 className="mt-2 whitespace-pre-line text-[26px] font-bold leading-[1.05] tracking-tight sm:text-[38px]">{T.title}</h2>
            <p className="ml-auto mt-3 max-w-[22em] text-[12px] leading-snug text-white/70 sm:text-sm">{T.sub}</p>
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

          {/* START-Karte am Weganfang (Heimbasis) — immer sichtbar */}
          {box && (() => {
            const pin = px(START.pinX, START.pinY)!;
            const left = START.side === "l";
            return (
              <>
                <div className="absolute h-px bg-white/45"
                  style={{ top: pin.y, left: left ? 0 : pin.x, right: left ? undefined : 0, width: left ? pin.x : undefined }} />
                <div className="absolute w-[min(42vw,236px)] -translate-y-1/2" style={{ top: pin.y, left: left ? 16 : undefined, right: left ? undefined : 16 }}>
                  <div className="flex items-center gap-3 rounded-2xl bg-white/97 p-3 shadow-[0_18px_40px_-14px_rgba(0,0,0,0.55)] ring-1 ring-black/5 backdrop-blur">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#353fcc] text-white shadow-[0_6px_16px_-6px_rgba(0,0,0,0.5)]">
                      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
                        <path fill="currentColor" d="M12 2C8.7 2 6 4.7 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.3-2.7-6-6-6Zm0 8.2A2.2 2.2 0 1 1 12 5.8a2.2 2.2 0 0 1 0 4.4Z" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#353fcc]">{lang === "de" ? "START" : "START"}</p>
                      <p className="mt-0.5 truncate text-[15px] font-extrabold leading-tight text-neutral-900">Zürich</p>
                      <p className="mt-0.5 truncate text-[11px] font-medium text-neutral-500">{lang === "de" ? "Heimbasis · Saisonstart" : "Home base · season start"}</p>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

          {/* Turnier-Karten in den Flanken + Leader-Lines */}
          {box && WAYPOINTS.map((w, i) => {
            const pin = px(w.pinX, w.pinY)!;
            const active = p >= w.at;
            const left = w.side === "l";
            return (
              <div key={`card-${i}`}>
                <div className="absolute h-px bg-white/45"
                  style={{ top: pin.y, left: left ? 0 : pin.x, right: left ? undefined : 0, width: left ? pin.x : undefined,
                    transformOrigin: left ? "right" : "left", transform: `scaleX(${active ? 1 : 0})`, transition: "transform .6s ease .05s" }} />
                <div className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-500"
                  style={{ top: pin.y, left: pin.x, background: w.color, opacity: active ? 1 : 0 }} />
                <div className="absolute w-[min(42vw,244px)] -translate-y-1/2" style={{ top: pin.y, left: left ? 16 : undefined, right: left ? undefined : 16 }}>
                  <div className={`transition-all duration-500 ${active ? "translate-x-0 opacity-100" : "opacity-0 " + (left ? "-translate-x-4" : "translate-x-4")}`}>
                    <div className="flex items-center gap-3 rounded-2xl bg-white/97 p-3 shadow-[0_18px_40px_-14px_rgba(0,0,0,0.55)] ring-1 ring-black/5 backdrop-blur">
                      <Emblem w={w} />
                      <div className="min-w-0">
                        <p className="truncate text-[9px] font-extrabold uppercase tracking-[0.13em]" style={{ color: w.color }}>{w.tier}</p>
                        <p className="mt-0.5 truncate text-[14px] font-extrabold leading-tight text-neutral-900">{w.t.name}</p>
                        <p className="mt-0.5 truncate text-[11px] font-medium text-neutral-500">{rangeLabel(w.t, lang)} · {SURFACE[w.t.surface]?.[lang] ?? w.t.surface} · {w.t.city}</p>
                        <p className="mt-1 flex items-center gap-1 truncate text-[11px] font-bold text-neutral-800">
                          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: w.color }} />
                          {w.note[lang]}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Ergebnis-Karte (Ziel) — oben-links */}
          {box && (() => {
            const fin = px(FINISH[0], FINISH[1])!;
            return (
              <div className={`absolute w-[min(48vw,260px)] transition-all duration-700 ${finished ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}`}
                style={{ top: fin.y + 22, left: 16 }}>
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

      {/* Sanfter Blau→Schwarz-Übergang am Sektionsende → nahtlos in die dunkle Feature-Sektion */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[26vh] bg-gradient-to-b from-transparent to-neutral-950" />
    </section>
  );
}
