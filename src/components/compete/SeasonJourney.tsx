"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import {
  TOURNAMENTS, TIER_META, tournamentLogo, HOME_BASES, leg, nights,
  type Tournament,
} from "@/lib/tournaments";

/* Grob nachgezeichneter Weg (x%, y% der Bühne) von unten (Spieler) → oben (Ziel).
 * Erster Punkt = START (Strassenende unten-rechts): der Marker animiert von dort
 * zur Person und dann wie gewohnt den Weg hoch. */
const PATH: [number, number][] = [
  [102, 92], // START am Strassenende unten-rechts
  [84, 86],  // die Strasse diagonal hoch …
  [65, 79],  // … am Spieler/Schläger vorbei
  [46, 69],
  [30, 61],
  [52, 51], [74, 45], [50, 37], [28, 31], [45, 23], [18, 15], [7, 9],
];
const FINISH: [number, number] = [2.4, 12.4];     // Ziel-Trophy am Ende der Linie (oben-links)
const START = { pinX: 102, pinY: 92, cx: 0.30 };  // Weganfang = Strassenende unten-rechts; Karte links-mittig

// Turniername nur bis „Open" (sonst zu lang für die schmale Karte).
function shortName(name: string) {
  const i = name.indexOf("Open");
  return i >= 0 ? name.slice(0, i + 4) : name;
}

/* Nur echte ATP-Turniere aus dem Map-Kalender (steigende Prestige: 250 → 1000).
 * cx = Ziel-Position der Karte (Mitte, Anteil der Bühnenbreite) → Karten in die Flanken. */
type Stop = { id: string; at: number; pinX: number; pinY: number; cx: number; note: { de: string; en: string } };
const STOPS: Stop[] = [
  { id: "gstaad",    at: 0.15, pinX: 54, pinY: 74, cx: 0.15, note: { de: "Erste Runde · Tour-Debüt", en: "Round 1 · tour debut" } },
  { id: "barcelona", at: 0.39, pinX: 32, pinY: 57, cx: 0.85, note: { de: "Achtelfinale · +45 Punkte", en: "Round of 16 · +45 points" } },
  { id: "madrid",    at: 0.61, pinX: 69, pinY: 44, cx: 0.13, note: { de: "Viertelfinale · +180 Punkte", en: "Quarterfinal · +180 points" } },
  { id: "rome",      at: 0.83, pinX: 31, pinY: 29, cx: 0.67, note: { de: "Hauptfeld · Karriere-Bestwert", en: "Main draw · career best" } },
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

/* ── kleine Icons ──────────────────────────────────────────────────────── */
function ModeIcon({ icon }: { icon: "plane" | "train" | "car" }) {
  if (icon === "plane") return <path fill="currentColor" d="M21 16v-1.7l-8-4.8V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5v6L2 14.3V16l8-2.4V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.4L21 16Z" />;
  if (icon === "train") return <path fill="currentColor" d="M7 2h10a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3l1.6 2.3v.4H4.4v-.4L6 16a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3Zm-1 5v4h5V6H7a1 1 0 0 0-1 1Zm7 4h5V7a1 1 0 0 0-1-1h-4v5Zm-3.5 2.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm7 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />;
  return <path fill="currentColor" d="M5 11l1.4-4A2 2 0 0 1 8.3 5.6h7.4A2 2 0 0 1 17.6 7l1.4 4h1a1 1 0 0 1 1 1v3.5a1 1 0 0 1-1 1h-.5v.5a1.2 1.2 0 0 1-2.4 0v-.5H6.9v.5a1.2 1.2 0 0 1-2.4 0v-.5H4a1 1 0 0 1-1-1V12a1 1 0 0 1 1-1h1Zm2.3-.4h9.4l-1-2.8a1 1 0 0 0-.9-.6H9.2a1 1 0 0 0-.9.6l-1 2.8ZM6.6 12.6a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm10.8 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />;
}
function BedIcon() { return <path fill="currentColor" d="M2 7a1 1 0 0 1 2 0v4h7V9a1 1 0 0 1 1-1h6a4 4 0 0 1 4 4v5a1 1 0 0 1-2 0v-2H4v2a1 1 0 0 1-2 0V7Zm4.5 0A2.5 2.5 0 1 0 6.5 12 2.5 2.5 0 0 0 6.5 7Z" />; }
function TeamIcon() { return <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><path d="M16.5 5.3a2.5 2.5 0 0 1 0 4.9M17 13.5a4.6 4.6 0 0 1 3.5 4.5" /></g>; }
type Svc = { key: string; label: { de: string; en: string }; path: string; stroke?: boolean };
const SERVICES: Svc[] = [
  { key: "string", label: { de: "Besaitung", en: "Stringing" }, path: "M9 9m-5 0a5 5 0 1 0 10 0a5 5 0 1 0-10 0M12.6 12.6 20 20", stroke: true },
  { key: "physio", label: { de: "Physio", en: "Physio" }, path: "M10.5 3h3v6h6v3h-6v6h-3v-6h-6V9h6z" },
  { key: "fitness", label: { de: "Fitness", en: "Fitness" }, path: "M4 9v6M7 6.5v11M17 6.5v11M20 9v6M7 12h10", stroke: true },
  { key: "coach", label: { de: "Coach", en: "Coach" }, path: "M12 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6M6 21a6 6 0 0 1 12 0", stroke: true },
];
const SVC = Object.fromEntries(SERVICES.map((s) => [s.key, s])) as Record<string, Svc>;

/* Team-&-Service-Hinweise: dezente Mini-Karten (Profilbild + Rolle + Trainings-
 * Kalender) verteilt neben dem Weg zwischen den Turnier-Kacheln. */
/* Services hängen unter „ihrer" Turnier-Kachel (per Verbindungslinie). */
const ATTACHED = [
  { stop: "gstaad", key: "string", cat: "stringer", role: { de: "Besaiter", en: "Stringer" }, accent: "#38bdf8", days: [1, 3], at: 0.15 },
  { stop: "barcelona", key: "physio", cat: "physio", role: { de: "Physio", en: "Physio" }, accent: "#10b981", days: [0, 3], at: 0.39 },
];
const WEEKDAYS = { de: ["Mo", "Di", "Mi", "Do", "Fr"], en: ["Mo", "Tu", "We", "Th", "Fr"] };

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

/* Kleine, transparente Team-/Service-Kachel (Profilfoto + Rolle + Trainingstage). */
function ServiceTile({ hint, person, lang }: { hint: { key: string; role: { de: string; en: string }; accent: string; days: number[] }; person?: { img: string; name: string }; lang: "de" | "en" }) {
  const s = SVC[hint.key];
  const sched = hint.days.map((d) => WEEKDAYS[lang][d]).join(" · ");
  return (
    <div className="flex items-center gap-2.5 rounded-2xl bg-white/[0.14] px-2.5 py-2 ring-1 ring-white/30 backdrop-blur-md">
      {person ? (
        <img src={person.img} alt="" loading="lazy" className="h-9 w-9 shrink-0 rounded-full object-cover" style={{ boxShadow: `0 0 0 2px ${hint.accent}` }} />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white" style={{ background: `${hint.accent}66`, boxShadow: `0 0 0 2px ${hint.accent}` }}>
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden fill={s.stroke ? "none" : "currentColor"} stroke={s.stroke ? "currentColor" : "none"} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={s.path} /></svg>
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-[10px] font-extrabold uppercase tracking-[0.1em]" style={{ color: hint.accent }}>{hint.role[lang]}</p>
        <p className="truncate text-[12.5px] font-bold leading-tight text-white">{person?.name || (lang === "de" ? "Dein Team" : "Your team")}</p>
        <p className="mt-0.5 truncate text-[10px] font-semibold text-white/70">{sched}</p>
      </div>
    </div>
  );
}

/* Karte an cx-Ziel (Flanke); Leader-Line läuft vom Pin exakt bis zur Karte. */
function cardGeom(pinx: number, cx: number, vw: number, cardw: number) {
  const cardLeft = Math.max(10, Math.min(vw - cardw - 10, cx * vw - cardw / 2));
  const cardRight = cardLeft + cardw;
  if (pinx >= cardRight) return { cardLeft, lineLeft: cardRight, lineWidth: pinx - cardRight, fromLeft: true };
  if (pinx <= cardLeft) return { cardLeft, lineLeft: pinx, lineWidth: cardLeft - pinx, fromLeft: false };
  return { cardLeft, lineLeft: pinx, lineWidth: 0, fromLeft: true };
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
  const [team, setTeam] = useState<Record<string, { img: string; name: string }>>({});

  // Echte Service-Anbieter (Coach/Physio/Besaiter/Fitness) aus /map als „Team" —
  // öffentlich lesbar (anders als profiles), mit echten Fotos.
  useEffect(() => {
    let active = true;
    supabase
      .from("service_providers")
      .select("name,category,image_url")
      .not("image_url", "is", null)
      .in("category", ["coach", "physio", "stringer", "sc"])
      .limit(40)
      .then(({ data }) => {
        if (!active || !data) return;
        const m: Record<string, { img: string; name: string }> = {};
        for (const r of data as { name: string; category: string; image_url: string | null }[]) {
          if (r.image_url && !m[r.category]) m[r.category] = { img: r.image_url, name: r.name };
        }
        setTeam(m);
      });
    return () => { active = false; };
  }, []);

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

  // Marker erst zeigen, sobald er den START-Kreis verlassen hat.
  const startPx = px(START.pinX, START.pinY);
  const markerPx = px(mx, my);
  const insideStart = !!(startPx && markerPx && Math.hypot(markerPx.x - startPx.x, markerPx.y - startPx.y) < 46);

  // Mobil kompakter: schmalere Karten, kleineres Emblem.
  const mobile = (box?.vw ?? 1024) < 640;
  const CW = mobile ? 150 : 236;
  const EMB = mobile ? 34 : 48;

  // Reise-Etappen: Zürich → Gstaad → Barcelona → Madrid → Rom (echte leg()-Berechnung).
  const zurich = HOME_BASES[0];
  const nodes = [
    { x: START.pinX, y: START.pinY, at: 0, obj: zurich as { name?: string; city?: string; lat: number; lng: number } },
    ...WAYPOINTS.map((w) => ({ x: w.pinX, y: w.pinY, at: w.at, obj: w.t })),
  ];
  /* Etappen-Korrekturen: Pill-Position + Verkehrsmittel.
   * Gstaad → Barcelona (698 km) ist realistisch ein Flug, nicht die Bahn. */
  const LEG_FIX: Record<number, { mode?: "Flug" | "Bahn" | "Auto"; dx?: number; dy?: number }> = {
    0: { dx: 62, dy: 3 },              // „Auto · 139 km" weiter nach rechts
    1: { mode: "Flug", dx: -37 },      // „Flug · 698 km" nach links
    2: { dx: 32 },                     // „Bahn · 505 km" nach rechts
  };
  const legs = nodes.slice(1).map((n, i) => {
    const a = nodes[i];
    const L = leg(a.obj, n.obj);
    const fix = LEG_FIX[i] ?? {};
    return {
      mid: { x: (a.x + n.x) / 2 + (fix.dx ?? 0), y: (a.y + n.y) / 2 + (fix.dy ?? 0) },
      at: (a.at + n.at) / 2,
      L: fix.mode ? { ...L, mode: fix.mode } : L,
    };
  });
  // Saison-Summary für die Ziel-Karte (echte Zahlen).
  const flights = legs.filter((l) => l.L.mode === "Flug").length;
  const nightsTotal = WAYPOINTS.reduce((s, w) => s + nights(w.t), 0);

  const T = {
    de: { label: "SEASON JOURNEY", title: "Deine Saison,\nSchritt für Schritt.", sub: "Nur echte ATP-Turniere — mit Reise, Team und Kosten im Blick.", done: "Saison abgeschlossen", season: "Saison", prize: "Preisgeld", costs: "Kosten", rank: "Ranking", net: "Netto", events: "Turniere", flights: "Flüge", nights: "Nächte", team: "Team" },
    en: { label: "SEASON JOURNEY", title: "Your season,\nstep by step.", sub: "Real ATP tournaments only — travel, team and cost in one view.", done: "Season complete", season: "Season", prize: "Prize", costs: "Costs", rank: "Ranking", net: "Net", events: "Events", flights: "Flights", nights: "Nights", team: "Team" },
  }[lang];

  return (
    <section ref={sectionRef} className="relative bg-[#353fcc]" style={{ height: "360vh" }}>
      <div ref={wrapRef} className="sticky top-0 h-screen overflow-hidden">
        {/* Bühne */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative h-full max-h-screen" style={{ aspectRatio: "900 / 1274" }}>
            <img ref={imgRef} src="/compete/season-journey.jpg" alt="" onLoad={measure} className="absolute inset-0 h-full w-full object-cover" />

            {/* START-Knoten (grosser weisser Kreis + Pin, immer sichtbar) */}
            <span className="absolute z-20 -translate-x-1/2 -translate-y-1/2" style={{ left: `${START.pinX}%`, top: `${START.pinY}%` }}>
              <span className="absolute inset-0 -m-3 rounded-full bg-white/25 blur-md" />
              <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-[0_0_34px_rgba(255,255,255,0.9)]">
                <svg width="38" height="38" viewBox="0 0 24 24" style={{ color: "#353fcc" }} aria-hidden>
                  <path fill="currentColor" d="M12 2C8.7 2 6 4.7 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.3-2.7-6-6-6Zm0 8.2A2.2 2.2 0 1 1 12 5.8a2.2 2.2 0 0 1 0 4.4Z" />
                </svg>
              </span>
            </span>

            {/* Marker = Tennisball (erst sichtbar, wenn ausserhalb des START-Kreises) */}
            <span className="absolute z-30 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200" style={{ left: `${mx}%`, top: `${my}%`, opacity: insideStart ? 0 : 1 }}>
              <span className="absolute inset-0 -m-2.5 animate-ping rounded-full bg-white/30" style={{ animationDuration: "1.8s" }} />
              <img src="/compete/tennis-ball.png" alt="" className="relative h-7 w-7 rounded-full shadow-[0_3px_12px_rgba(0,0,0,0.4)]" />
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

            {/* Ziel-Medaillon — erscheint erst, wenn der Ball angekommen ist */}
            <span className="absolute z-30 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500" style={{ left: `${FINISH[0]}%`, top: `${FINISH[1]}%`, opacity: finished ? 1 : 0 }}>
              {finished && <>
                <span className="absolute inset-0 -m-2 animate-ping rounded-full" style={{ animationDuration: "1.6s", boxShadow: "0 0 0 2px rgba(224,165,0,0.6)" }} />
                <span className="absolute inset-0 -m-5 animate-ping rounded-full" style={{ animationDuration: "2.2s", boxShadow: "0 0 0 2px rgba(224,165,0,0.35)" }} />
              </>}
              <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white transition-all duration-500"
                style={{ boxShadow: `0 0 0 3px #e0a500, 0 0 26px ${finished ? "rgba(224,165,0,0.85)" : "rgba(224,165,0,0.35)"}`, transform: finished ? "scale(1.05)" : "scale(0.95)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" style={{ color: "#e0a500" }} aria-hidden>
                  <path fill="currentColor" d="M7 4V3h10v1h3v3a4 4 0 0 1-4 4h-.4A6 6 0 0 1 13 13.9V16h3v2H8v-2h3v-2.1A6 6 0 0 1 7.4 11H7a4 4 0 0 1-4-4V4h4Zm0 2H5v1a2 2 0 0 0 2 2V6Zm10 0v3a2 2 0 0 0 2-2V6h-2Z" />
                </svg>
              </span>
            </span>
          </div>
        </div>

        {/* ── Overlay ── */}
        <div className="pointer-events-none absolute inset-0 z-40">
          {/* Kopfzeile oben-rechts */}
          <div className="absolute right-4 top-[76px] max-w-[min(52%,360px)] text-right text-white sm:right-8 sm:top-24">
            <span className="text-[8px] font-extrabold uppercase tracking-[0.22em] text-white/75 sm:text-[10px] sm:tracking-[0.28em]">{T.label}</span>
            <h2 className="mt-1.5 whitespace-pre-line text-[19px] font-bold leading-[1.05] tracking-tight sm:mt-2 sm:text-[38px]">{T.title}</h2>
            <div className="mt-3 flex items-center justify-end gap-2 sm:mt-5">
              <div className="flex gap-1 sm:gap-1.5">
                {WAYPOINTS.map((w, i) => (
                  <span key={i} className="h-1.5 w-4 rounded-full transition-colors duration-500 sm:w-6" style={{ background: p >= w.at ? "#34d399" : "rgba(255,255,255,0.28)" }} />
                ))}
              </div>
              <span className="text-[10px] font-bold tabular-nums text-white/80 sm:text-[11px]">{doneCount}/{WAYPOINTS.length}</span>
            </div>
          </div>

          {/* Reise-Etappen als dezente Pills auf dem Weg */}
          {box && legs.map((lg, i) => {
            const m = px(lg.mid.x, lg.mid.y)!;
            const active = p >= lg.at;
            const md = MODE[lg.L.mode];
            return (
              <div key={`leg-${i}`} className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${active ? "opacity-100" : "opacity-0"}`} style={{ left: m.x, top: m.y }}>
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
            const g = cardGeom(pin.x, START.cx, box.vw, CW);
            return (
              <>
                {/* Linie endet am LINKEN Rand des Start-Kreises (nicht in der Mitte) */}
                <div className="absolute h-px bg-white/45" style={{ top: pin.y, left: g.lineLeft, width: Math.max(0, g.lineWidth - 46) }} />
                <div className="absolute -translate-y-1/2" style={{ top: pin.y, left: g.cardLeft, width: CW }}>
                  <div className="flex items-center gap-2 rounded-2xl bg-white/97 p-2 shadow-[0_18px_40px_-14px_rgba(0,0,0,0.55)] ring-1 ring-black/5 backdrop-blur sm:gap-3 sm:p-3">
                    <span className="flex shrink-0 items-center justify-center rounded-full bg-[#353fcc] text-white shadow-[0_6px_16px_-6px_rgba(0,0,0,0.5)]" style={{ width: EMB, height: EMB }}>
                      <svg width={EMB * 0.46} height={EMB * 0.46} viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M12 2C8.7 2 6 4.7 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.3-2.7-6-6-6Zm0 8.2A2.2 2.2 0 1 1 12 5.8a2.2 2.2 0 0 1 0 4.4Z" /></svg>
                    </span>
                    <div className="min-w-0">
                      <p className="text-[8px] font-extrabold uppercase tracking-[0.14em] text-[#353fcc] sm:text-[9px] sm:tracking-[0.16em]">START</p>
                      <p className="mt-0.5 truncate text-[12px] font-extrabold leading-tight text-neutral-900 sm:text-[15px]">{lang === "de" ? "Zürich" : "Zurich"}</p>
                      {/* Abflug: kurz vor dem ersten Turnier (Barcelona, 13. Apr) */}
                      <p className="mt-0.5 truncate text-[9.5px] font-semibold text-neutral-500 sm:text-[11px]">{lang === "de" ? "10. Apr 2026" : "10 Apr 2026"}</p>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

          {/* Turnier-Karten (in den Flanken) */}
          {box && WAYPOINTS.map((w, i) => {
            const pin = px(w.pinX, w.pinY)!;
            const active = p >= w.at;
            const g = cardGeom(pin.x, w.cx, box.vw, CW);
            return (
              <div key={`card-${i}`}>
                <div className="absolute h-px bg-white/45" style={{ top: pin.y, left: g.lineLeft, width: g.lineWidth, transformOrigin: g.fromLeft ? "right" : "left", transform: `scaleX(${active ? 1 : 0})`, transition: "transform .6s ease .05s" }} />
                <div className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-500" style={{ top: pin.y, left: pin.x, background: w.color, opacity: active ? 1 : 0 }} />
                <div className="absolute -translate-y-1/2" style={{ top: pin.y, left: g.cardLeft, width: CW }}>
                  <div className={`transition-all duration-500 ${active ? "translate-x-0 opacity-100" : "opacity-0 " + (g.fromLeft ? "-translate-x-4" : "translate-x-4")}`}>
                    <div className="rounded-2xl bg-white/97 p-2 shadow-[0_18px_40px_-14px_rgba(0,0,0,0.55)] ring-1 ring-black/5 backdrop-blur sm:p-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Emblem w={w} size={EMB} />
                        <div className="min-w-0">
                          <p className="truncate text-[8px] font-extrabold uppercase tracking-[0.1em] sm:text-[9px] sm:tracking-[0.13em]" style={{ color: w.color }}>{w.tier}</p>
                          <p className="mt-0.5 truncate text-[11.5px] font-extrabold leading-tight text-neutral-900 sm:text-[14px]">{shortName(w.t.name)}</p>
                          <p className="mt-0.5 truncate text-[9.5px] font-medium text-neutral-500 sm:text-[11px]">{rangeLabel(w.t, lang)} · {SURFACE[w.t.surface]?.[lang] ?? w.t.surface} · {w.t.city}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Services — hängen mit Verbindungslinie über „ihrer" Turnier-Kachel */}
          {box && ATTACHED.map((svc) => {
            const w = WAYPOINTS.find((x) => x.id === svc.stop);
            if (!w) return null;
            const pin = px(w.pinX, w.pinY)!;
            const geom = cardGeom(pin.x, w.cx, box.vw, CW);
            const active = p >= svc.at;
            const TW = mobile ? 132 : 168;
            const tileLeft = geom.cardLeft + 16;
            const tileTop = pin.y - 126;
            const lineX = tileLeft + 24;
            const cardTopEdge = pin.y - 38;
            return (
              <div key={svc.key} className={`transition-all duration-500 ${active ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`} style={{ transitionDelay: active ? "220ms" : "0ms" }}>
                <div className="absolute w-px bg-white/45" style={{ left: lineX, top: tileTop + 58, height: Math.max(0, cardTopEdge - (tileTop + 58)) }} />
                <div className="absolute" style={{ left: tileLeft, top: tileTop, width: TW }}>
                  <ServiceTile hint={svc} person={team[svc.cat]} lang={lang} />
                </div>
              </div>
            );
          })}

          {/* Ergebnis-Karte (Ziel) — Saison-Abschluss */}
          {box && (
            <div className={`absolute w-[min(74vw,266px)] transition-all duration-700 sm:w-[318px] ${finished ? "translate-y-0 scale-100 opacity-100" : "translate-y-6 scale-95 opacity-0"}`} style={{ top: mobile ? 74 : 88, left: mobile ? 10 : 16 }}>
              <div className="overflow-hidden rounded-[18px] bg-white/97 text-neutral-900 shadow-[0_28px_64px_-20px_rgba(0,0,0,0.7)] ring-1 ring-black/5 backdrop-blur">
                {/* Kopf: Profil + Abschluss */}
                <div className="flex items-center gap-2.5 px-3 pb-2 pt-2.5">
                  <img src="/compete/player-luca.png" alt="" loading="lazy" className="h-8 w-8 shrink-0 rounded-full object-cover" style={{ boxShadow: "0 0 0 2px #e0a500" }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-extrabold leading-tight">Luca M.</p>
                    <p className="truncate text-[8.5px] font-semibold text-neutral-500">22 · Zürich · Sand</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#e0a500]/12 px-1.5 py-0.5 text-[7px] font-extrabold uppercase tracking-[0.1em] text-[#a97a00] ring-1 ring-[#e0a500]/30">
                    <svg width="8" height="8" viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M7 4V3h10v1h3v3a4 4 0 0 1-4 4h-.4A6 6 0 0 1 13 13.9V16h3v2H8v-2h3v-2.1A6 6 0 0 1 7.4 11H7a4 4 0 0 1-4-4V4h4Zm0 2H5v1a2 2 0 0 0 2 2V6Zm10 0v3a2 2 0 0 0 2-2V6h-2Z" /></svg>
                    {T.done}
                  </span>
                </div>

                {/* Ranking-Ring + Netto/Preisgeld-Balken (Stil der Compete-Kacheln) */}
                <div className="flex items-center gap-3 px-3 pb-2.5">
                  <div className="relative shrink-0">
                    <svg viewBox="0 0 44 44" className="h-12 w-12 -rotate-90">
                      <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="4" />
                      <circle cx="22" cy="22" r="18" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 18} strokeDashoffset={2 * Math.PI * 18 * 0.44}
                        className={finished ? "anim-ring" : ""} style={{ ["--ring-c" as string]: `${2 * Math.PI * 18}` }} />
                    </svg>
                    <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                      <span className="text-[10px] font-extrabold tabular-nums">#232</span>
                      <span className="text-[6px] font-bold uppercase tracking-wide text-emerald-600">+180</span>
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {[
                      { l: T.prize, w: 82, c: "#10b981", v: "12.4k" },
                      { l: T.costs, w: 54, c: "#d4d4d8", v: "8.2k" },
                    ].map((b, i) => (
                      <div key={b.l}>
                        <div className="flex items-baseline justify-between">
                          <span className="text-[7px] font-extrabold uppercase tracking-[0.12em] text-neutral-400">{b.l}</span>
                          <span className="text-[8.5px] font-bold tabular-nums text-neutral-500">{b.v}</span>
                        </div>
                        <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                          <div className={`h-full rounded-full ${finished ? "anim-growx" : ""}`} style={{ width: `${b.w}%`, background: b.c, animationDelay: `${200 + i * 160}ms` }} />
                        </div>
                      </div>
                    ))}
                    <p className="pt-0.5 text-[15px] font-extrabold leading-none tracking-tight text-emerald-600">
                      +4 200 <span className="text-[7px] font-bold uppercase tracking-wide text-neutral-400">{T.net} CHF</span>
                    </p>
                  </div>
                </div>

                {/* Reise & Team */}
                <div className="grid grid-cols-4 border-t border-black/5 text-center">
                  {[
                    { icon: <ModeIcon icon="plane" />, v: String(flights), l: T.flights },
                    { icon: <BedIcon />, v: String(nightsTotal), l: T.nights },
                    { icon: <TeamIcon />, v: "4", l: T.team },
                    { icon: <ModeIcon icon="car" />, v: String(WAYPOINTS.length), l: T.events },
                  ].map((c, i) => (
                    <div key={i} className={`px-1 py-1.5 transition-all duration-500 ${finished ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"} ${i < 3 ? "border-r border-black/5" : ""}`} style={{ transitionDelay: `${300 + i * 100}ms` }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" aria-hidden className="mx-auto text-neutral-400">{c.icon}</svg>
                      <p className="mt-0.5 text-[10px] font-extrabold leading-none">{c.v}</p>
                      <p className="mt-0.5 text-[6.5px] font-bold uppercase tracking-wide text-neutral-400">{c.l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </section>
  );
}
