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
    <div className="flex h-[500px] gap-2.5">
      {panels.map((p, i) => {
        const open = i === active;
        return (
          <div
            key={p.name}
            onClick={() => !open && setActive(i)}
            className={`relative overflow-hidden rounded-3xl transition-[flex-grow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              open
                ? "flex-[8]"
                : "flex-[1] min-w-[3.25rem] cursor-pointer"
            } ${open && p.featured ? "ring-2 ring-matchup" : ""}`}
            role={open ? undefined : "button"}
            aria-label={open ? undefined : p.name}
          >
            <Image
              src={p.img}
              alt={p.name}
              fill
              sizes="100vw"
              className={`object-cover transition-transform duration-500 ${
                open ? "scale-100" : "scale-110"
              }`}
              style={p.position ? { objectPosition: p.position } : undefined}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />

            {open ? (
              <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                {p.featured && (
                  <span className="mb-3 inline-flex w-fit rounded-full bg-matchup px-3 py-1 text-[11px] font-bold tracking-wide">
                    {trendLabel}
                  </span>
                )}
                <h3 className="text-2xl font-bold tracking-wide">{p.name}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/85">
                  {p.tagline}
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  {p.features.map((feat) => (
                    <li key={feat} className="flex gap-2">
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0 text-matchup"
                        viewBox="0 0 16 16"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M3 8.5l3 3 7-7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-white/90">{feat}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="/app"
                  className="mt-5 inline-block w-fit rounded-full bg-white px-6 py-3 text-sm font-bold tracking-wide text-black transition-colors hover:bg-white/85"
                >
                  {ctaLabel}
                </a>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="rotate-180 text-sm font-bold uppercase tracking-[0.2em] text-white [writing-mode:vertical-rl]">
                  {p.name}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
