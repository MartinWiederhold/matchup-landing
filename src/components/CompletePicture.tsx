"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useT } from "@/lib/i18n";
import { COMPETE_FEATURES } from "@/components/compete/features";

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

/* Animierte Mini-Grafik je Compete-Feature (spielt beim Reinscrollen ab, wie die Play-Karten). */
function CompeteViz({ k, show, light }: { k: string; show: boolean; light?: boolean }) {
  if (k === "competeSeason") {
    // Reise-Route: Stops ploppen nacheinander auf einer Linie.
    return (
      <div className="relative flex items-center">
        <span className={`absolute left-1 right-1 top-1/2 h-px -translate-y-1/2 ${light ? "bg-black/15" : "bg-white/20"}`} />
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`relative mx-1.5 h-2.5 w-2.5 rounded-full ${i === 3 ? (light ? "bg-matchup ring-[3px] ring-matchup/20" : "bg-white ring-2 ring-matchup") : "bg-matchup"} ${show ? "anim-pop" : ""}`} style={{ animationDelay: `${i * 130}ms` }} />
        ))}
      </div>
    );
  }
  if (k === "competeTournament") {
    // P&L: Balken wachsen hoch (grün = Netto).
    const bars = [50, 30, 80, 55, 95];
    return (
      <span className="flex h-9 items-end gap-[3px]">
        {bars.map((h, i) => (
          <span key={i} className={`w-1.5 rounded-sm ${i === bars.length - 1 ? "bg-emerald-400" : light ? "bg-neutral-300" : "bg-white/30"} ${show ? "anim-bar" : ""}`} style={{ height: `${h}%`, transformOrigin: "bottom", animationDelay: `${i * 80}ms` }} />
        ))}
      </span>
    );
  }
  if (k === "competeRanking") {
    // Annahme-Wahrscheinlichkeit: Ring füllt sich auf ~72%.
    const C = 2 * Math.PI * 14;
    return (
      <svg viewBox="0 0 36 36" className="h-11 w-11 -rotate-90">
        <circle cx="18" cy="18" r="14" fill="none" stroke={light ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.2)"} strokeWidth="3.5" />
        <circle cx="18" cy="18" r="14" fill="none" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * 0.28} className={show ? "anim-ring" : ""} style={{ ["--ring-c" as string]: `${C}` }} />
      </svg>
    );
  }
  // competeTeam: Team-Avatare ploppen nacheinander auf.
  return (
    <span className="flex -space-x-2">
      {["#7b6cff", "#10b981", "#f59e0b", "#38bdf8"].map((c, i) => (
        <span key={i} className={`h-7 w-7 rounded-full ring-2 ${light ? "ring-white" : "ring-neutral-950"} ${show ? "anim-pop" : ""}`} style={{ background: c, animationDelay: `${i * 120}ms` }} />
      ))}
    </span>
  );
}

export function CompeteCard({ f, light }: { f: (typeof COMPETE_FEATURES)[number]; light?: boolean }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const t = useT();
  return (
    <div ref={ref} className={light ? "rounded-2xl bg-white p-5 ring-1 ring-black/10 shadow-[0_10px_30px_-16px_rgba(0,0,0,0.35)]" : "rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10"}>
      <div className="flex h-11 items-center justify-between">
        <CompeteViz k={f.key} show={inView} light={light} />
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${light ? "bg-neutral-100 text-neutral-600 ring-black/10" : "bg-black/40 text-white/80 ring-white/10"}`}>{f.stat}</span>
      </div>
      <h4 className={`mt-4 text-[15px] font-bold ${light ? "text-neutral-900" : ""}`}>{t(`landing.${f.key}Title`)}</h4>
      <p className={`mt-1.5 text-[13px] leading-relaxed ${light ? "text-neutral-500" : "text-white/55"}`}>{t(`landing.${f.key}Copy`)}</p>
    </div>
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
          <a href="/map" className="mt-8 inline-block rounded-full bg-white px-8 py-3.5 text-sm font-bold text-neutral-900 transition-colors hover:bg-white/90">
            {t("landing.heroCtaSecondary")}
          </a>
        </div>
      </div>
    </section>
  );
}
