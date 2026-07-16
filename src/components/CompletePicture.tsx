"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useT } from "@/lib/i18n";
import { COMPETE_FEATURES } from "@/components/compete/features";
import { TOURNAMENTS, TIER_META, tournamentLogo } from "@/lib/tournaments";

type Overlay = "discover" | "organize" | "community" | "progress";

const FEATURES: { img: string; overlay: Overlay }[] = [
  { img: "/landing/discover-hd.jpg", overlay: "discover" },
  { img: "/landing/organize-hd.jpg", overlay: "organize" },
  { img: "/landing/community-hd.jpg", overlay: "community" },
  { img: "/landing/progress-hd.jpg", overlay: "progress" },
];

/**
 * inView wird TRUE, sobald die Karte deutlich sichtbar ist, und wieder FALSE,
 * sobald sie das Sichtfeld verlässt — so spielt die Animation bei JEDEM
 * Reinscrollen erneut ab (nicht nur einmal). rootMargin schneidet oben/unten
 * ab, damit sie nicht zu früh (am Rand) auslöst.
 */
function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ob = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.55, rootMargin: "-12% 0px -12% 0px" },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, []);
  return { ref, inView };
}

/* Kleiner, dezenter Chip unten links auf dem Bild — IMMER sichtbar.
 * Animiert wird nicht der Chip selbst, sondern die Elemente innen
 * (Punkte, Ring, Balken). So bleibt das Badge beim Scrollen stehen
 * und ruht im fertigen Zustand, die Grafik darin spielt beim
 * Reinscrollen jedes Mal neu ab. */
function Chip({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <div
      className={`absolute bottom-3 flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/15 backdrop-blur-md ${
        align === "right" ? "right-3" : "left-3"
      }`}
    >
      {children}
    </div>
  );
}

function TennisBall({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M5.6 5.6a11 11 0 0 1 0 12.8M18.4 5.6a11 11 0 0 0 0 12.8" />
    </svg>
  );
}

/* Entdecke Spieler — Tennisball + Match (Pink-Akzent).
 * Ball ist immer da, ploppt beim Reinscrollen kurz auf. */
function DiscoverOverlay({ show }: { show: boolean }) {
  const t = useT();
  return (
    <Chip>
      <TennisBall className={`h-4 w-4 text-pink-400 ${show ? "anim-pop" : ""}`} />
      <span>{t("landing.discoverChip")}</span>
    </Chip>
  );
}

/* Spiele organisieren — offene Slots (Punkte-Reihe).
 * Punkte bleiben sichtbar, ploppen beim Reinscrollen nacheinander auf. */
function OrganizeOverlay({ show }: { show: boolean }) {
  const t = useT();
  return (
    <Chip>
      <span className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full bg-matchup ${show ? "anim-pop" : ""}`}
            style={{ animationDelay: `${i * 110}ms` }}
          />
        ))}
        <span
          className={`h-1.5 w-1.5 rounded-full ring-1 ring-white/60 ${show ? "anim-pop" : ""}`}
          style={{ animationDelay: "330ms" }}
        />
      </span>
      <span>{t("landing.organizeChip")}</span>
    </Chip>
  );
}

/* Deine Community — kleiner Live-Ring.
 * Ring ruht gefüllt, füllt sich beim Reinscrollen erneut auf. */
function CommunityOverlay({ show }: { show: boolean }) {
  const t = useT();
  const C = 2 * Math.PI * 7;
  const filled = C * 0.3; // Endzustand (Ruhe)
  return (
    <Chip align="right">
      <svg viewBox="0 0 20 20" className="h-5 w-5 -rotate-90">
        <circle cx="10" cy="10" r="7" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" />
        <circle
          cx="10"
          cy="10"
          r="7"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={filled}
          className={show ? "anim-ring" : ""}
          style={{ ["--ring-c" as string]: `${C}` }}
        />
      </svg>
      <span>{t("landing.communityChip")}</span>
    </Chip>
  );
}

/* Verfolge Fortschritt — Mini-Wochenbalken + Level.
 * Balken bleiben in voller Höhe, wachsen beim Reinscrollen erneut hoch. */
function ProgressOverlay({ show }: { show: boolean }) {
  const t = useT();
  const bars = [45, 70, 40, 95, 60];
  return (
    <Chip align="right">
      <span>{t("landing.progressChip")}</span>
      <span className="flex h-4 items-end gap-[3px]">
        {bars.map((h, i) => (
          <span
            key={i}
            className={`w-1 rounded-sm bg-emerald-400 ${show ? "anim-bar" : ""}`}
            style={{ height: `${h}%`, transformOrigin: "bottom", animationDelay: `${i * 80}ms` }}
          />
        ))}
      </span>
    </Chip>
  );
}

/* Spiele organisieren — Match-Einladung ploppt oben links auf: Typ/Zeit/Platz,
 * Mitspieler füllen die Slots, letzter Slot bleibt offen, dann „Zugesagt". */
const GAME_AVATARS = [
  "/find-a-partner/av-man.jpg",
  "/find-a-partner/av-woman1.jpg",
  "/find-a-partner/av-woman2.jpg",
];
function OrganizeScene({ show }: { show: boolean }) {
  const t = useT();
  return (
    <div className="absolute left-2.5 top-[26%] w-fit max-w-[46%] sm:left-3">
      <div
        className={`rounded-xl bg-white/95 p-1.5 shadow-[0_10px_26px_-10px_rgba(0,0,0,0.55)] ring-1 ring-black/5 backdrop-blur ${show ? "anim-pop" : "opacity-0"}`}
        style={show ? { animationDelay: "0.25s" } : undefined}
      >
        <div className="flex items-center gap-1.5">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-matchup text-white">
            <TennisBall className="h-2.5 w-2.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[8px] font-extrabold leading-tight text-neutral-900">{t("landing.organizeSceneType")}</p>
            <p className="truncate text-[7px] font-semibold leading-tight text-neutral-500">{t("landing.organizeSceneWhen")}</p>
          </div>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2 border-t border-black/5 pt-1">
          <div className="flex -space-x-1">
            {GAME_AVATARS.map((src, i) => (
              <span
                key={src}
                className={`h-3.5 w-3.5 overflow-hidden rounded-full ring-1 ring-white ${show ? "anim-pop" : "opacity-0"}`}
                style={show ? { animationDelay: `${0.5 + i * 0.13}s` } : undefined}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
              </span>
            ))}
            {/* offener Slot */}
            <span
              className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border border-dashed border-matchup/60 bg-white text-[7px] font-bold leading-none text-matchup ring-1 ring-white ${show ? "anim-pop" : "opacity-0"}`}
              style={show ? { animationDelay: "0.9s" } : undefined}
            >
              +
            </span>
          </div>
          <span className="shrink-0 text-[6.5px] font-extrabold text-matchup">{t("landing.organizeSceneSlot")}</span>
        </div>
      </div>

      {/* Zusage-Pill */}
      <div
        className={`ml-auto mt-1.5 w-fit rounded-full bg-emerald-500 px-1.5 py-0.5 text-[7px] font-bold text-white shadow-lg ${show ? "anim-pop" : "opacity-0"}`}
        style={show ? { animationDelay: "1.15s" } : undefined}
      >
        ✓ {t("landing.organizeSceneJoined")}
      </div>
    </div>
  );
}

function FeatureCard({ f }: { f: (typeof FEATURES)[number] }) {
  const { ref, inView } = useInView<HTMLElement>();
  const t = useT();
  return (
    <article
      ref={ref}
      className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
        <Image
          src={f.img}
          alt={t(`landing.${f.overlay}Title`)}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {f.overlay === "discover" && <DiscoverOverlay show={inView} />}
        {f.overlay === "organize" && <OrganizeScene show={inView} />}
        {f.overlay === "organize" && <OrganizeOverlay show={inView} />}
        {f.overlay === "community" && <CommunityOverlay show={inView} />}
        {f.overlay === "progress" && <ProgressOverlay show={inView} />}
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold tracking-tight">
          {t(`landing.${f.overlay}Title`)}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          {t(`landing.${f.overlay}Copy`)}
        </p>
      </div>
    </article>
  );
}

/* ── Compete-Kacheln: gleiche Bühne wie die Play-Bildkacheln (aspect-4/5),
 *    nur statt Foto eine gestaltete, animierte Mini-Oberfläche. ───────────── */

/* Saison-Planer: Route zeichnet sich, an jedem Stopp poppt ein echtes
 * Turnier-Logo (Favicon der offiziellen Turnier-Domain) auf. */
const SEASON_STOPS = [
  { x: 26, y: 105, id: "gstaad" },
  { x: 44, y: 80, id: "barcelona" },
  { x: 36, y: 55, id: "madrid" },
  { x: 62, y: 37, id: "rome" },
  { x: 78, y: 17, id: "roland-garros" },
].map((s) => {
  const t = TOURNAMENTS.find((x) => x.id === s.id);
  return { ...s, logo: t ? tournamentLogo(t) : null, color: t ? TIER_META[t.tier].color : "#fff" };
});
/* Route in EINZEL-Etappen (Stopp → Stopp), damit sich die Linie Schritt für
 * Schritt zeichnet und der nächste Stopp erst bei Ankunft erscheint. */
const SEASON_LEGS = [
  "M26 105 Q 40 92 44 80",
  "M44 80 Q 34 67 36 55",
  "M36 55 Q 52 46 62 37",
  "M62 37 Q 72 27 78 17",
];
const STOP_MS = 120, LEG_MS = 560, STEP_MS = 620; // Takt: Stopp, dann Etappe

function SeasonTile({ show }: { show: boolean }) {
  const legRefs = useRef<(SVGPathElement | null)[]>([]);
  const [lens, setLens] = useState<number[]>([]);
  // Exakte Pfadlängen messen → die Linie zeichnet sich sauber (nicht geschätzt).
  useEffect(() => {
    setLens(legRefs.current.map((p) => p?.getTotalLength() ?? 35));
  }, []);

  return (
    <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_15%_0%,#5b4bff_0%,#3a30c8_45%,#191a6b_100%)]">
      <div className="absolute inset-0 opacity-[0.22]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px,#fff 1px,transparent 0)", backgroundSize: "16px 16px" }} />
      <svg viewBox="0 0 100 125" className="absolute inset-0 h-full w-full">
        {/* blasse Gesamtroute als Führung */}
        <path d={SEASON_LEGS.join(" ")} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.4" strokeLinecap="round" />
        {SEASON_LEGS.map((d, i) => {
          const L = lens[i] ?? 35;
          return (
            <path
              key={i}
              ref={(el) => { legRefs.current[i] = el; }}
              d={d}
              fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.4" strokeLinecap="round"
              strokeDasharray={L} strokeDashoffset={show ? 0 : L}
              className={show ? "anim-draw" : ""}
              style={{
                ["--dash-len" as string]: `${L}`,
                animationDuration: `${LEG_MS}ms`,
                animationDelay: `${STOP_MS + 40 + i * STEP_MS}ms`,
                filter: "drop-shadow(0 0 3px rgba(255,255,255,0.45))",
              }}
            />
          );
        })}
      </svg>
      {SEASON_STOPS.map((s, i) => (
        <span
          key={s.id}
          className={`absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full bg-white ${show ? "anim-pop" : "opacity-0"}`}
          style={{
            left: `${s.x}%`, top: `${s.y / 1.25}%`,
            boxShadow: `0 0 0 2px ${s.color}, 0 4px 12px -3px rgba(0,0,0,0.6)`,
            // Stopp i erscheint, sobald Etappe i-1 angekommen ist
            animationDelay: `${STOP_MS + i * STEP_MS}ms`,
          }}
        >
          {s.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.logo} alt="" loading="lazy" className="h-[62%] w-[62%] object-contain" />
          ) : (
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
          )}
        </span>
      ))}
      {/* Ziel: Puls-Ring, sobald die letzte Etappe angekommen ist */}
      {show && (
        <span
          className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-white/50 opacity-0"
          style={{
            left: `${SEASON_STOPS[SEASON_STOPS.length - 1].x}%`,
            top: `${SEASON_STOPS[SEASON_STOPS.length - 1].y / 1.25}%`,
            animationDuration: "1.8s",
            animationDelay: `${STOP_MS + (SEASON_STOPS.length - 1) * STEP_MS}ms`,
            animationFillMode: "forwards",
          }}
        />
      )}
    </div>
  );
}

/* Turnier-Workspace: Preisgeld vs. Kosten wachsen, Netto zählt hoch. */
function WorkspaceTile({ show }: { show: boolean }) {
  const weeks = [40, 65, 35, 80, 55, 95];
  return (
    <div className="absolute inset-0 bg-[linear-gradient(165deg,#141736_0%,#0a0b21_60%,#05061a_100%)] p-4">
      <div className="flex h-full flex-col justify-center gap-4 pb-6">
        {/* Preisgeld vs. Kosten */}
        <div className="space-y-2.5">
          {[{ l: "Prize", w: 82, c: "#10b981" }, { l: "Costs", w: 54, c: "rgba(255,255,255,0.28)" }].map((b, i) => (
            <div key={b.l}>
              <p className="text-[8.5px] font-bold uppercase tracking-[0.14em] text-white/40">{b.l}</p>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className={`h-full rounded-full ${show ? "anim-growx" : ""}`} style={{ width: `${b.w}%`, background: b.c, animationDelay: `${200 + i * 180}ms` }} />
              </div>
            </div>
          ))}
        </div>
        {/* Wochenverlauf */}
        <span className="flex h-14 items-end gap-1">
          {weeks.map((h, i) => (
            <span key={i} className={`flex-1 rounded-sm ${i === weeks.length - 1 ? "bg-emerald-400" : "bg-white/25"} ${show ? "anim-bar" : ""}`}
              style={{ height: `${h}%`, transformOrigin: "bottom", animationDelay: `${400 + i * 90}ms` }} />
          ))}
        </span>
      </div>
    </div>
  );
}

/* Ranking & Meldechancen: Ring füllt auf 72 %, Rang steigt. */
function RankingTile({ show }: { show: boolean }) {
  const C = 2 * Math.PI * 28;
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[radial-gradient(110%_90%_at_50%_0%,#2b2f8f_0%,#12143f_55%,#07081e_100%)] p-4">
      <div className="relative">
        <svg viewBox="0 0 72 72" className="h-24 w-24 -rotate-90">
          <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="6" />
          <circle cx="36" cy="36" r="28" fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * 0.28}
            className={show ? "anim-ring" : ""} style={{ ["--ring-c" as string]: `${C}` }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-extrabold text-white">72%</span>
      </div>
      <div className="w-full space-y-1">
        {[{ r: "#412", o: 0.45 }, { r: "#318", o: 0.7 }, { r: "#232", o: 1 }].map((x, i) => (
          <div key={x.r} className={`flex items-center justify-between rounded-lg bg-white/[0.07] px-2.5 py-1 transition-all duration-500 ${show ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"}`}
            style={{ transitionDelay: `${300 + i * 140}ms` }}>
            <span className="text-[10px] font-bold text-white/70">ATP {x.r}</span>
            <span className="text-[9px] font-bold text-emerald-400">▲</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Team & Services: Crew ploppt auf, Wochenplan füllt sich. */
function TeamTile({ show }: { show: boolean }) {
  const crew = [
    { c: "#7b6cff", l: "Coach", img: "/compete/team/coach.png" },
    { c: "#10b981", l: "Physio", img: "/compete/team/physio.png" },
    { c: "#f59e0b", l: "Fitness", img: "/compete/team/fitness.png" },
    { c: "#38bdf8", l: "Stringer", img: "/compete/team/stringer.png" },
  ];
  const days = ["M", "T", "W", "T", "F"];
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-4 bg-[linear-gradient(160deg,#3b2ecc_0%,#221c7a_55%,#0c0b33_100%)] p-4">
      <div className="grid grid-cols-2 gap-2">
        {crew.map((m, i) => (
          <div key={m.l} className={`flex items-center gap-2 rounded-xl bg-white/[0.09] px-2 py-1.5 ring-1 ring-white/15 ${show ? "anim-pop" : ""}`}
            style={{ animationDelay: `${150 + i * 130}ms` }}>
            {m.img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.img} alt="" loading="lazy" className="h-5 w-5 shrink-0 rounded-full object-cover" style={{ boxShadow: `0 0 0 1.5px ${m.c}` }} />
            ) : (
              <span className="h-5 w-5 shrink-0 rounded-full ring-2 ring-white/25" style={{ background: m.c }} />
            )}
            <span className="truncate text-[9px] font-bold text-white/85">{m.l}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between rounded-xl bg-white/[0.07] px-2.5 py-2 ring-1 ring-white/10">
        {days.map((d, i) => (
          <span key={i} className="flex flex-col items-center gap-1">
            <span className="text-[8px] font-bold text-white/45">{d}</span>
            <span className={`h-1.5 w-1.5 rounded-full transition-all duration-500 ${show ? "scale-100 opacity-100" : "scale-0 opacity-0"}`}
              style={{ background: [0, 2, 4].includes(i) ? "#10b981" : "rgba(255,255,255,0.25)", transitionDelay: `${500 + i * 90}ms` }} />
          </span>
        ))}
      </div>
    </div>
  );
}

function CompeteTile({ k, show }: { k: string; show: boolean }) {
  if (k === "competeSeason") return <SeasonTile show={show} />;
  if (k === "competeTournament") return <WorkspaceTile show={show} />;
  if (k === "competeRanking") return <RankingTile show={show} />;
  return <TeamTile show={show} />;
}

/* Kleine animierte Grafik im Chip — analog zu den Play-Karten. */
function CompeteChipViz({ k, show }: { k: string; show: boolean }) {
  if (k === "competeSeason")
    return (
      <span className="flex items-center gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-1.5 w-1.5 rounded-full bg-matchup ${show ? "anim-pop" : ""}`} style={{ animationDelay: `${i * 110}ms` }} />
        ))}
      </span>
    );
  if (k === "competeTournament")
    return (
      <span className="flex h-4 items-end gap-[3px]">
        {[45, 70, 40, 95].map((h, i) => (
          <span key={i} className={`w-1 rounded-sm bg-emerald-400 ${show ? "anim-bar" : ""}`} style={{ height: `${h}%`, transformOrigin: "bottom", animationDelay: `${i * 80}ms` }} />
        ))}
      </span>
    );
  if (k === "competeRanking") {
    const C = 2 * Math.PI * 7;
    return (
      <svg viewBox="0 0 20 20" className="h-5 w-5 -rotate-90">
        <circle cx="10" cy="10" r="7" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" />
        <circle cx="10" cy="10" r="7" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * 0.3} className={show ? "anim-ring" : ""} style={{ ["--ring-c" as string]: `${C}` }} />
      </svg>
    );
  }
  return (
    <span className="flex -space-x-1.5">
      {["/compete/team/coach.png", "/compete/team/physio.png", "/compete/team/fitness.png"].map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={src} src={src} alt="" loading="lazy" className={`h-4 w-4 rounded-full object-cover ring-2 ring-black/40 ${show ? "anim-pop" : ""}`} style={{ animationDelay: `${i * 110}ms` }} />
      ))}
    </span>
  );
}

export function CompeteCard({ f, light }: { f: (typeof COMPETE_FEATURES)[number]; light?: boolean }) {
  const { ref, inView } = useInView<HTMLElement>();
  const t = useT();
  return (
    <article ref={ref} className={`group overflow-hidden rounded-2xl shadow-sm ring-1 ${light ? "bg-white ring-black/5" : "bg-white/[0.06] ring-white/10"}`}>
      <div className="relative aspect-[4/5] overflow-hidden">
        <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
          <CompeteTile k={f.key} show={inView} />
        </div>
        {/* Chip einheitlich rechtsbündig (Stat zuerst, dann Mini-Grafik) */}
        <Chip align="right">
          <span>{f.stat}</span>
          <CompeteChipViz k={f.key} show={inView} />
        </Chip>
      </div>
      <div className="p-6">
        <h3 className={`text-xl font-bold tracking-tight ${light ? "" : "text-white"}`}>{t(`landing.${f.key}Title`)}</h3>
        <p className={`mt-2 text-sm leading-relaxed ${light ? "text-neutral-600" : "text-white/60"}`}>{t(`landing.${f.key}Copy`)}</p>
      </div>
    </article>
  );
}

export default function CompletePicture() {
  const t = useT();
  return (
    <section id="funktionsweise" className="bg-neutral-50 px-4 py-24 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-[1280px]">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            {t("landing.featuresTitle")}
          </h2>
          <p className="mt-6 text-base leading-relaxed text-neutral-600 sm:text-lg">
            {t("landing.featuresSubtitle")}
          </p>
        </div>

        {/* PLAY */}
        <div className="mt-14 flex flex-col items-start gap-2.5">
          <span className="rounded-full bg-matchup/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-matchup">{t("landing.playSectionLabel")}</span>
          <h3 className="text-xl font-bold tracking-tight sm:text-2xl">{t("landing.playSectionTitle")}</h3>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <FeatureCard key={f.overlay} f={f} />
          ))}
        </div>

        {/* COMPETE */}
        <div className="mt-16 overflow-hidden rounded-3xl bg-neutral-950 p-8 text-white sm:p-12">
          <div className="flex flex-col items-start gap-2.5">
            <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white">{t("landing.competeSectionLabel")}</span>
            <h3 className="text-xl font-bold tracking-tight sm:text-2xl">{t("landing.competeSectionTitle")}</h3>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/60 sm:text-base">{t("landing.competeSectionCopy")}</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {COMPETE_FEATURES.map((f) => (
              <CompeteCard key={f.key} f={f} />
            ))}
          </div>
          <Link href="/map?tab=season" className="mt-8 inline-block rounded-full bg-white px-8 py-3.5 text-sm font-bold text-neutral-900 transition-colors hover:bg-white/90">
            {t("landing.heroCtaSecondary")}
          </Link>
        </div>
      </div>
    </section>
  );
}
