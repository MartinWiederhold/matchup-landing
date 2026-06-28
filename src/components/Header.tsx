"use client";

import { useState } from "react";
import MatchupLogo from "./MatchupLogo";
import AppInstall from "./AppInstall";

const NAV_LINKS = [
  { label: "Find a Partner", href: "/find-a-partner" },
  { label: "Shop", href: "/shop" },
  { label: "Beratung", href: "/beratung" },
  { label: "Events", href: "/events" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-black text-white">
      <div className="mx-auto flex h-[68px] max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="/" className="shrink-0">
          <MatchupLogo />
        </a>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[13px] font-semibold tracking-wide text-white/90 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <AppInstall className="hidden rounded-full bg-matchup px-6 py-3 text-[13px] font-bold tracking-wide text-white transition-colors hover:bg-matchup-hover sm:inline-block">
            App
          </AppInstall>

          <button
            type="button"
            aria-label="Menü öffnen"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:hidden"
          >
            <span
              className={`h-0.5 w-6 bg-white transition-transform ${open ? "translate-y-2 rotate-45" : ""}`}
            />
            <span className={`h-0.5 w-6 bg-white transition-opacity ${open ? "opacity-0" : ""}`} />
            <span
              className={`h-0.5 w-6 bg-white transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`}
            />
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-white/10 px-4 pb-6 pt-2 lg:hidden">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="py-3 text-sm font-semibold tracking-wide text-white/90"
            >
              {link.label}
            </a>
          ))}
          <AppInstall
            onNavigate={() => setOpen(false)}
            className="mt-3 block rounded-full bg-matchup px-6 py-3 text-center text-sm font-bold tracking-wide text-white"
          >
            App
          </AppInstall>
        </nav>
      )}
    </header>
  );
}
