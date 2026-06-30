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

type NavFeature = {
  label: string;
  href: string;
  waitlist?: boolean;
  comingSoon?: boolean;
};

export default function Header() {
  const [open, setOpen] = useState(false);
  const [waitlist, setWaitlist] = useState<NavFeature | null>(null);
  const t = useT();

  // Find a Partner & Events: normale Links. Shop & Advice: Warteliste (Coming soon).
  const navItems: NavFeature[] = [
    { label: t("header.findPartner"), href: "/find-a-partner" },
    { label: t("header.events"), href: "/events", comingSoon: true },
    { label: t("header.shop"), href: "/shop", waitlist: true, comingSoon: true },
    { label: t("header.beratung"), href: "/beratung", waitlist: true },
  ];

  // Im Hamburger zusätzlich „About" anzeigen.
  const mobileNavItems: NavFeature[] = [
    ...navItems,
    { label: t("header.about"), href: "/about" },
  ];

  function openWaitlist(item: NavFeature) {
    setOpen(false);
    setWaitlist(item);
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-black text-white">
      <div className="mx-auto flex h-[68px] max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="/" className="shrink-0">
          <MatchupLogo />
        </a>

        {/* Desktop-Nav + (Coming soon) */}
        <nav className="hidden items-center gap-5 lg:flex">
          {navItems.map((item) =>
            item.waitlist ? (
              <button
                key={item.href}
                type="button"
                onClick={() => openWaitlist(item)}
                className="text-[13px] font-semibold tracking-wide text-white/90 transition-colors hover:text-white"
              >
                {item.label}
              </button>
            ) : (
              <a
                key={item.href}
                href={item.href}
                className="text-[13px] font-semibold tracking-wide text-white/90 transition-colors hover:text-white"
              >
                {item.label}
              </a>
            ),
          )}
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
        <nav className="flex flex-col gap-1 border-t border-white/10 px-4 pb-6 pt-3 lg:hidden">
          {mobileNavItems.map((item) =>
            item.waitlist ? (
              <button
                key={item.href}
                type="button"
                onClick={() => openWaitlist(item)}
                className="flex w-full items-center gap-2 py-3 text-left text-sm font-semibold tracking-wide text-white/90"
              >
                {item.label}
                {item.comingSoon && (
                  <span className="text-xs font-medium text-white/40">
                    {t("header.comingSoon")}
                  </span>
                )}
              </button>
            ) : (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 py-3 text-left text-sm font-semibold tracking-wide text-white/90"
              >
                {item.label}
                {item.comingSoon && (
                  <span className="text-xs font-medium text-white/40">
                    {t("header.comingSoon")}
                  </span>
                )}
              </a>
            ),
          )}

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
        open={waitlist !== null}
        feature={waitlist?.label ?? ""}
        secretHref={waitlist?.href ?? "/"}
        onClose={() => setWaitlist(null)}
      />
    </header>
  );
}
