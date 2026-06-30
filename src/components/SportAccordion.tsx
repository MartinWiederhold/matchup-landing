"use client";

import { useState } from "react";
import Image from "next/image";

export type SportPanel = {
  name: string;
  tagline: string;
  img: string;
  position?: string;
  features: string[];
  featured: boolean;
};

/**
 * Horizontales Accordion (mobil): ein Panel ist aufgeklappt und zeigt alle
 * Infos, die anderen stehen als schmale Balken daneben. Antippen klappt das
 * jeweilige Panel gross auf — animiert.
 */
export default function SportAccordion({
  panels,
  trendLabel,
  ctaLabel,
}: {
  panels: SportPanel[];
  trendLabel: string;
  ctaLabel: string;
}) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex h-[520px] gap-2.5">
      {panels.map((p, i) => {
        const open = i === active;
        return (
          <div
            key={p.name}
            onClick={() => !open && setActive(i)}
            className={`group relative overflow-hidden rounded-[28px] transition-[flex-grow] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[flex-grow] ${
              open
                ? "flex-[8]"
                : "flex-[1] min-w-[3.5rem] cursor-pointer active:scale-[0.985]"
            } ${
              open && p.featured
                ? "ring-2 ring-matchup ring-offset-2 ring-offset-white"
                : ""
            }`}
            role={open ? undefined : "button"}
            aria-label={open ? undefined : p.name}
          >
            <Image
              src={p.img}
              alt={p.name}
              fill
              sizes="100vw"
              className={`object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                open ? "scale-100" : "scale-[1.18] group-active:scale-[1.22]"
              }`}
              style={p.position ? { objectPosition: p.position } : undefined}
            />
            {/* Verlauf: unten satt, oben fast klar — bessere Tiefe */}
            <div
              className={`absolute inset-0 transition-opacity duration-700 ${
                open
                  ? "bg-gradient-to-t from-black/92 via-black/45 to-black/5"
                  : "bg-gradient-to-t from-black/80 via-black/40 to-black/20"
              }`}
            />

            {open ? (
              <div
                key={active}
                className="absolute inset-0 flex flex-col justify-end p-7 text-white"
              >
                {p.featured ? (
                  <span
                    className="anim-acc mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-matchup/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] backdrop-blur-sm"
                    style={{ animationDelay: "60ms" }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    {trendLabel}
                  </span>
                ) : (
                  <span
                    className="anim-acc mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55"
                    style={{ animationDelay: "60ms" }}
                  >
                    Matchup
                  </span>
                )}
                <h3
                  className="anim-acc text-[2rem] font-bold leading-none tracking-tight"
                  style={{ animationDelay: "120ms" }}
                >
                  {p.name}
                </h3>
                <p
                  className="anim-acc mt-3 max-w-xs text-sm leading-relaxed text-white/80"
                  style={{ animationDelay: "180ms" }}
                >
                  {p.tagline}
                </p>
                <ul className="mt-5 space-y-2.5 text-sm">
                  {p.features.map((feat, fi) => (
                    <li
                      key={feat}
                      className="anim-acc flex items-center gap-2.5"
                      style={{ animationDelay: `${240 + fi * 70}ms` }}
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-matchup/20 ring-1 ring-matchup/40">
                        <svg
                          className="h-3 w-3 text-matchup"
                          viewBox="0 0 16 16"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M3 8.5l3 3 7-7"
                            stroke="currentColor"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <span className="text-white/90">{feat}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="/app"
                  className="anim-acc mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold tracking-wide text-black shadow-lg shadow-black/20 transition-colors hover:bg-white/90"
                  style={{ animationDelay: `${240 + p.features.length * 70 + 80}ms` }}
                >
                  {ctaLabel}
                  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M6 3l5 5-5 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-between py-6">
                <span className="text-[11px] font-bold tabular-nums text-white/40">
                  0{i + 1}
                </span>
                <span className="rotate-180 text-sm font-bold uppercase tracking-[0.22em] text-white/95 [writing-mode:vertical-rl]">
                  {p.name}
                </span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-white/80 backdrop-blur-sm transition-colors group-hover:bg-white/25">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M8 3v10M3 8h10"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
