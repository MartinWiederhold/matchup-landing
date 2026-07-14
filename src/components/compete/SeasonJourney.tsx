"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n";
import {
  TOURNAMENTS, TIER_META, tournamentLogo, HOME_BASES, leg,
  type Tournament,
} from "@/lib/tournaments";

/* Grob nachgezeichneter Weg (x%, y% der Bühne) von unten (Spieler) → oben (Ziel). */
const PATH: [number, number][] = [
  [63, 93], [60, 85], [71, 75], [54, 67], [30, 61],
  [52, 51], [74, 45], [50, 37], [28, 31], [45, 23], [18, 15], [7, 9],
];
const FINISH: [number, number] = [7, 10];
const START = { pinX: 64, pinY: 95, side: "l" as const };

/* Nur echte ATP-Turniere aus dem Map-Kalender (steigende Prestige: 250 → 1000). */
type Stop = {
  id: string; at: number; pinX: number; pinY: number; side: "l" | "r";
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
  Sand: { de: "Sand", en: "Clay" }, Hartplatz: { de: "Hartplatz", en: "Hard" }, Rasen: { de: "Rasen", en: "Grass" },
};
const MODE: Record<string, { de: string; en: string; icon: "plane" | "train" | "car" }> = {
  Flug: { de: "Flug", en: "Flight", icon: "plane" },
  Bahn: { de: "Bahn", en: "Train", icon: "train" },
  Auto: { de: "Auto", en: "Drive", icon: "car" },
};
function rangeLabel(t: Tournament, lang: "de" | "en") {
  const loc = lang === "de" ? "de-DE" : "en-GB";
  const o: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const s = new Date(t.start + "T00:00:00").toLocaleDateString(loc, o);
  const e = new Date(t.end + "T00:00:00").toLocaleDateString(loc, o);
  return `${s} – ${e}`;
}

/* ── kleine Icons (eigene, dezente Vektoren) ───────────────────────────── */
function ModeIcon({ icon }: { icon: "plane" | "train" | "car" }) {
  if (icon === "plane") return <path fill="currentColor" d="M21 16v-1.7l-8-4.8V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5v6L2 14.3V16l8-2.4V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.4L21 16Z" />;
  if (icon === "train") return <path fill="currentColor" d="M7 2h10a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3l1.6 2.3v.4H4.4v-.4L6 16a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3Zm-1 5v4h5V6H7a1 1 0 0 0-1 1Zm7 4h5V7a1 1 0 0 0-1-1h-4v5Zm-3.5 2.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm7 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />;
  return <path fill="currentColor" d="M5 11l1.4-4A2 2 0 0 1 8.3 5.6h7.4A2 2 0 0 1 17.6 7l1.4 4h1a1 1 0 0 1 1 1v3.5a1 1 0 0 1-1 1h-.5v.5a1.2 1.2 0 0 1-2.4 0v-.5H6.9v.5a1.2 1.2 0 0 1-2.4 0v-.5H4a1 1 0 0 1-1-1V12a1 1 0 0 1 1-1h1Zm2.3-.4h9.4l-1-2.8a1 1 0 0 0-.9-.6H9.2a1 1 0 0 0-.9.6l-1 2.8ZM6.6 12.6a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm10.8 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />;
}
const SERVICES: { key: string; label: { de: string; en: string }; path: string; stroke?: boolean }[] = [
  { key: "string", label: { de: "Besaitung", en: "Stringing" }, path: "M9 9m-5 0a5 5 0 1 0 10 0a5 5 0 1 0-10 0M12.6 12.6 20 20", stroke: true },
  { key: "physio", label: { de: "Physio", en: "Physio" }, path: "M10.5 3h3v6h6v3h-6v6h-3v-6h-6V9h6z" },
  { key: "fitness", label: { de: "Fitness", en: "Fitness" }, path: "M4 9v6M7 6.5v11M17 6.5v11M20 9v6M7 12h10", stroke: true },
  { key: "team", label: { de: "Team", en: "Team" }, path: "M9 8m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M3.5 19a5.5 5.5 0 0 1 11 0M17 10a2.4 2.4 0 1 0 0-4.8M16.5 13.6A4.5 4.5 0 0 1 20.5 18", stroke: true },
];

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function pointAt(p: number): [number, number] {
  const n = PATH.length - 1;
  const f = Math.max(0, Math.min(0.999, p)) * n;
  const i = Math.floor(f);
  const t = f - i;
  return [lerp(PATH[i][0], PATH[i + 1][0], t), lerp(PATH[i][1], PATH[i + 1][1], t)];
}

function Emblem({ w, size = 48 }: { w: WP; size?: number }) {
  return (
    <span className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white"
      style={{ width: size, height: size, boxShadow: `0 0 0 2.5px ${w.color}, 0 6px 16px -6px rgba(0,0,0,0.4)` }}>
      {w.logo ? <img src={w.logo} alt="" className="h-[62%] w-[62%] object-contain" />
        : <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" aria-hidden style={{ color: w.color }}>
            <path fill="currentColor" d="M12 3.2l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.7 6.6 19.5l1.1-5.9L3.4 9.4l5.9-.8L12 3.2Z" />
          </svg>}
    </span>
  );
}

/* Karten-Geometrie: Karte dicht am Pin, kurze Leader-Line die AN der Karte endet. */
const CARDW = 236, GAP = 42;
function cardGeom(pinx: number, side: "l" | "r", vw: number) {
  if (side === "l") {
    const cardLeft = Math.max(8, pinx - GAP - CARDW);
    const cardRight = cardLeft + CARDW;
    return { cardLeft, lineLeft: cardRight, lineWidth: Math.max(0, pinx - cardRight), origin: "right" as const };
  }
  const cardLeft = Math.min(vw - CARDW - 8, pinx + GAP);
  return { cardLeft, lineLeft: pinx, lineWidth: Math.max(0, cardLeft - pinx), origin: "left" as const };
}

type Box = { l: number; t: number; w: number; h: number; vw: number };

export default function SeasonJourney() {
  const { locale } = useLocale();
  const lang = locale === "de" ? "de" : "en";
  const sectionRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [p, setP] = useState(0);
  const [box, setBox] = useState<Box | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const max = el.offsetHeight - window.innerHeight;
      setP(max > 0 ? Math.min(1, Math.max(0, -r.top / max)) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const measure = () => {
    const wrap = wrapRef.current, img = imgRef.current;
    if (!wrap || !img) return;
    const wr = wrap.getBoundingClientRect(), ir = img.getBoundingClientRect();
    setBox({ l: ir.left - wr.left, t: ir.top - wr.top, w: ir.width, h: ir.height, vw: wr.width });
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
  const px = (X: number, Y: number) => box ? { x: box.l + (X / 100) * box.w, y: box.t + (Y / 100) * box.h } : null;

  // Reise-Etappen: Zürich → Gstaad → Barcelona → Madrid → Rom (echte leg()-Berechnung).
  const zurich = HOME_BASES[0];
  const nodes = [
    { x: START.pinX, y: START.pinY, at: 0, obj: zurich as { name?: string; city?: string; lat: number; lng: number } },
    ...WAYPOINTS.map((w) => ({ x: w.pinX, y: w.pinY, at: w.at, obj: w.t })),
  ];
  const legs = nodes.slice(1).map((n, i) => {
    const a = nodes[i];
    return { mid: { x: (a.x + n.x) / 2, y: (a.y + n.y) / 2 }, at: (a.at + n.at) / 2, L: leg(a.obj, n.obj) };
  });

  const T = {
    de: { label: "SEASON JOURNEY", title: "Deine Saison,\nSchritt für Schritt.", sub: "Nur echte ATP-Turniere — mit Reise, Team und Kosten im Blick.", done: "Saison abgeschlossen", rank: "Ranking", net: "Netto", events: "Turniere" },
    en: { label: "SEASON JOURNEY", title: "Your season,\nstep by step.", sub: "Real ATP tournaments only — travel, team and cost in one view.", done: "Season complete", rank: "Ranking", net: "Net", events: "Events" },
  }[lang];

  return (
    <section ref={sectionRef} className="relative bg-[#353fcc]" style={{ height: "300vh" }}>
      <div ref={wrapRef} className="sticky top-0 h-screen overflow-hidden">
        {/* Bühne */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative h-full max-h-screen" style={{ aspectRatio: "900 / 1274" }}>
            <img ref={imgRef} src="/compete/season-journey.jpg" alt="" onLoad={measure} className="absolute inset-0 h-full w-full object-cover" />

            {/* START-Knoten (grosser weisser Kreis, immer sichtbar) */}
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

            {/* Station-Pins */}
            {WAYPOINTS.map((w, i) => {
              const active = p >= w.at;
              return (
                <span key={`pin-${i}`} className="absolute z-20 -translate-x-1/2 -translate-y-1/2" style={{ left: `${w.pinX}%`, top: `${w.pinY}%` }}>
                  <span className={`block rounded-full transition-all duration-500 ${active ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
                    style={{ width: 15, height: 15, background: "#fff", boxShadow: `0 0 0 3.5px ${w.color}` }} />
                </span>
              );
            })}

            {/* Ziel-Medaillon (Pokal + Glow, Puls-Ringe bei Abschluss) */}
            <span className="absolute z-30 -translate-x-1/2 -translate-y-1/2" style={{ left: `${FINISH[0]}%`, top: `${FINISH[1]}%` }}>
              {finished && <>
                <span className="absolute inset-0 -m-2 animate-ping rounded-full" style={{ animationDuration: "1.6s", boxShadow: "0 0 0 2px rgba(224,165,0,0.6)" }} />
                <span className="absolute inset-0 -m-5 animate-ping rounded-full" style={{ animationDuration: "2.2s", boxShadow: "0 0 0 2px rgba(224,165,0,0.35)" }} />
              </>}
              <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white transition-all duration-500"
                style={{ boxShadow: `0 0 0 3px #e0a500, 0 0 26px ${finished ? "rgba(224,165,0,0.85)" : "rgba(224,165,0,0.35)"}`, transform: finished ? "scale(1.05)" : "scale(0.95)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" style={{ color: "#e0a500" }} aria-hidden>
                  <path fill="currentColor" d="M7 4V3h10v1h3v3a4 4 0 0 1-4 4h-.4A6 6 0 0 1 13 13.9V16h3v2H8v-2h3v-2.1A6 6 0 0 1 7.4 11H7a4 4 0 0 1-4-4V4h4Zm0 2H5v1a2 2 0 0 0 2 2V6Zm10 0v3a2 2 0 0 0 2-2V6h-2Z" />
                </svg>
              </span>
            </span>
          </div>
        </div>

        {/* ── Overlay ── */}
        <div className="pointer-events-none absolute inset-0 z-40">
          {/* Kopfzeile oben-rechts */}
          <div className="absolute right-5 top-[84px] max-w-[min(46%,360px)] text-right text-white sm:right-8 sm:top-24">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-white/75">{T.label}</span>
            <h2 className="mt-2 whitespace-pre-line text-[26px] font-bold leading-[1.05] tracking-tight sm:text-[38px]">{T.title}</h2>
            <p className="ml-auto mt-3 max-w-[20em] text-[12px] leading-snug text-white/70 sm:text-sm">{T.sub}</p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <div className="flex gap-1.5">
                {WAYPOINTS.map((w, i) => (
                  <span key={i} className="h-1.5 w-6 rounded-full transition-colors duration-500" style={{ background: p >= w.at ? "#fff" : "rgba(255,255,255,0.28)" }} />
                ))}
              </div>
              <span className="text-[11px] font-bold tabular-nums text-white/80">{doneCount}/{WAYPOINTS.length}</span>
            </div>
          </div>

          {/* Reise-Etappen als dezente Pills auf dem Weg */}
          {box && legs.map((lg, i) => {
            const m = px(lg.mid.x, lg.mid.y)!;
            const active = p >= lg.at;
            const md = MODE[lg.L.mode];
            return (
              <div key={`leg-${i}`} className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${active ? "translate-y-[-50%] opacity-100" : "opacity-0"}`}
                style={{ left: m.x, top: m.y }}>
                <span className="flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-[10px] font-semibold text-white/85 ring-1 ring-white/20 backdrop-blur-md">
                  <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden className="opacity-90"><ModeIcon icon={md.icon} /></svg>
                  {md[lang]} · {lg.L.km.toLocaleString(lang === "de" ? "de-CH" : "en-US")} km
                </span>
              </div>
            );
          })}

          {/* START-Karte (Heimbasis) */}
          {box && (() => {
            const pin = px(START.pinX, START.pinY)!;
            const g = cardGeom(pin.x, START.side, box.vw);
            return (
              <>
                <div className="absolute h-px bg-white/45" style={{ top: pin.y, left: g.lineLeft, width: g.lineWidth }} />
                <div className="absolute -translate-y-1/2" style={{ top: pin.y, left: g.cardLeft, width: CARDW }}>
                  <div className="flex items-center gap-3 rounded-2xl bg-white/97 p-3 shadow-[0_18px_40px_-14px_rgba(0,0,0,0.55)] ring-1 ring-black/5 backdrop-blur">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#353fcc] text-white shadow-[0_6px_16px_-6px_rgba(0,0,0,0.5)]">
                      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M12 2C8.7 2 6 4.7 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.3-2.7-6-6-6Zm0 8.2A2.2 2.2 0 1 1 12 5.8a2.2 2.2 0 0 1 0 4.4Z" /></svg>
                    </span>
                    <div className="min-w-0">
                      <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#353fcc]">START</p>
                      <p className="mt-0.5 truncate text-[15px] font-extrabold leading-tight text-neutral-900">Zürich</p>
                      <p className="mt-0.5 truncate text-[11px] font-medium text-neutral-500">{lang === "de" ? "Heimbasis · Saisonstart" : "Home base · season start"}</p>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

          {/* Turnier-Karten */}
          {box && WAYPOINTS.map((w, i) => {
            const pin = px(w.pinX, w.pinY)!;
            const active = p >= w.at;
            const g = cardGeom(pin.x, w.side, box.vw);
            return (
              <div key={`card-${i}`}>
                <div className="absolute h-px bg-white/45" style={{ top: pin.y, left: g.lineLeft, width: g.lineWidth, transformOrigin: g.origin, transform: `scaleX(${active ? 1 : 0})`, transition: "transform .6s ease .05s" }} />
                <div className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-500" style={{ top: pin.y, left: pin.x, background: w.color, opacity: active ? 1 : 0 }} />
                <div className="absolute -translate-y-1/2" style={{ top: pin.y, left: g.cardLeft, width: CARDW }}>
                  <div className={`transition-all duration-500 ${active ? "translate-x-0 opacity-100" : "opacity-0 " + (w.side === "l" ? "-translate-x-4" : "translate-x-4")}`}>
                    <div className="rounded-2xl bg-white/97 p-3 shadow-[0_18px_40px_-14px_rgba(0,0,0,0.55)] ring-1 ring-black/5 backdrop-blur">
                      <div className="flex items-center gap-3">
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
                      {/* Team & Services vor Ort (dezent) */}
                      <div className="mt-2.5 flex items-center gap-2.5 border-t border-black/5 pt-2">
                        {SERVICES.map((s, si) => (
                          <span key={s.key} title={s.label[lang]}
                            className={`flex items-center transition-all duration-500 ${active ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"}`}
                            style={{ transitionDelay: `${120 + si * 70}ms`, color: "#9aa2b1" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden fill={s.stroke ? "none" : "currentColor"} stroke={s.stroke ? "currentColor" : "none"} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                              <path d={s.path} />
                            </svg>
                          </span>
                        ))}
                        <span className="ml-auto text-[9px] font-semibold uppercase tracking-wide text-neutral-400">{lang === "de" ? "vor Ort" : "on site"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Ergebnis-Karte */}
          {box && (() => {
            const fin = px(FINISH[0], FINISH[1])!;
            return (
              <div className={`absolute w-[min(48vw,260px)] transition-all duration-700 ${finished ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}`} style={{ top: fin.y + 26, left: 16 }}>
                <div className="overflow-hidden rounded-2xl bg-neutral-950 text-white shadow-[0_24px_60px_-18px_rgba(0,0,0,0.7)] ring-1 ring-white/10">
                  <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-black text-neutral-950">✓</span>
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-400">{T.done}</span>
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-white/10">
                    <div className="px-3 py-3 text-center"><span className="block text-[19px] font-extrabold leading-none">+180</span><span className="mt-1 block text-[8px] font-bold uppercase tracking-wide text-white/45">{T.rank}</span></div>
                    <div className="px-3 py-3 text-center"><span className="block text-[19px] font-extrabold leading-none text-emerald-400">+4.2k</span><span className="mt-1 block text-[8px] font-bold uppercase tracking-wide text-white/45">{T.net} CHF</span></div>
                    <div className="px-3 py-3 text-center"><span className="block text-[19px] font-extrabold leading-none">{WAYPOINTS.length}</span><span className="mt-1 block text-[8px] font-bold uppercase tracking-wide text-white/45">{T.events}</span></div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[26vh] bg-gradient-to-b from-transparent to-neutral-950" />
    </section>
  );
}
