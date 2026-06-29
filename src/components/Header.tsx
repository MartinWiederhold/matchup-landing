"use client";

import { useState } from "react";
import MatchupLogo from "./MatchupLogo";
import AppInstall from "./AppInstall";
import WaitlistModal from "./WaitlistModal";
import { useLocale, useT, type Locale } from "@/lib/i18n";

function LangSwitch({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const options: Locale[] = ["de", "en"];
  return (
    <div
      className={`items-center rounded-full bg-white/10 p-0.5 text-[11px] font-bold ${className}`}
    >
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => setLocale(opt)}
          aria-pressed={locale === opt}
          className={`rounded-full px-2.5 py-1 uppercase tracking-wide transition-colors ${
            locale === opt
              ? "bg-white text-black"
              : "text-white/70 hover:text-white"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const [waitlistFeature, setWaitlistFeature] = useState<string | null>(null);
  const t = useT();

  // Reihenfolge: Find a Partner → Events → Shop → Advice (alle "Coming soon")
  const navItems = [
    t("header.findPartner"),
    t("header.events"),
    t("header.shop"),
    t("header.beratung"),
  ];

  function openWaitlist(feature: string) {
    setOpen(false);
    setWaitlistFeature(feature);
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-black text-white">
      <div className="mx-auto flex h-[68px] max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="/" className="shrink-0">
          <MatchupLogo />
        </a>

        {/* Desktop-Nav: pinkes Oval + (Coming soon) */}
        <nav className="hidden items-center gap-3 lg:flex">
          <div className="flex items-center gap-1 rounded-full border border-pink-400/70 px-1.5 py-1 shadow-[0_0_22px_-6px_rgba(236,72,153,0.85)]">
            {navItems.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => openWaitlist(label)}
                className="rounded-full px-3 py-1.5 text-[13px] font-semibold tracking-wide text-white/90 transition-colors hover:bg-white/10 hover:text-white"
              >
                {label}
              </button>
            ))}
          </div>
          <span className="text-[11px] font-semibold tracking-wide text-pink-400">
            {t("waitlist.comingSoon")}
          </span>
        </nav>

        <div className="flex items-center gap-3">
          <LangSwitch className="hidden lg:inline-flex" />

          <AppInstall className="hidden rounded-full bg-matchup px-6 py-3 text-[13px] font-bold tracking-wide text-white transition-colors hover:bg-matchup-hover sm:inline-block">
            {t("header.app")}
          </AppInstall>

          <button
            type="button"
            aria-label={t("header.openMenu")}
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
        <nav className="flex flex-col gap-2 border-t border-white/10 px-4 pb-6 pt-3 lg:hidden">
          <div className="rounded-3xl border border-pink-400/60 p-2 shadow-[0_0_22px_-8px_rgba(236,72,153,0.8)]">
            <div className="flex items-center justify-between px-2 pb-1.5 pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wide text-pink-400">
                {t("waitlist.comingSoon")}
              </span>
            </div>
            {navItems.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => openWaitlist(label)}
                className="block w-full rounded-2xl px-3 py-3 text-left text-sm font-semibold tracking-wide text-white/90 transition-colors hover:bg-white/5"
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-1 flex items-center justify-between py-2">
            <span className="text-sm font-semibold tracking-wide text-white/60">
              {t("header.language")}
            </span>
            <LangSwitch className="inline-flex" />
          </div>
          <AppInstall
            onNavigate={() => setOpen(false)}
            className="mt-1 block rounded-full bg-matchup px-6 py-3 text-center text-sm font-bold tracking-wide text-white"
          >
            {t("header.app")}
          </AppInstall>
        </nav>
      )}

      <WaitlistModal
        open={waitlistFeature !== null}
        feature={waitlistFeature ?? ""}
        onClose={() => setWaitlistFeature(null)}
      />
    </header>
  );
}
