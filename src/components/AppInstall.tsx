"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// Apple App Store: Matchup – Spielpartner finden.
const APP_STORE_URL = "https://apps.apple.com/ch/app/matchup-spielpartner-finden/id6764099315?l=de-DE";

function AppleLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 384 512" className={className} fill="currentColor" aria-hidden="true">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

/**
 * "App"-Eintrag im mobilen Menü.
 * Öffnet auf Mobilgeräten ein Sheet, über das man Matchup als App auf den
 * Home-Bildschirm legen kann (Android: nativer Prompt, iOS: Anleitung).
 * Auf dem Desktop / als bereits installierte App führt es direkt zur Web-App.
 */
export default function AppInstall({
  className,
  children,
  onNavigate,
}: {
  className?: string;
  children: React.ReactNode;
  onNavigate?: () => void;
}) {
  const t = useT();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent || "";
    const ios = /iphone|ipad|ipod/i.test(ua);
    setIsIOS(ios);
    setStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        // iOS Safari
        (window.navigator as unknown as { standalone?: boolean }).standalone === true,
    );

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    // SW-Registrierung passiert zentral in ServiceWorkerRegister (app-weit).

    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  function handleClick(e: React.MouseEvent) {
    // Schon als App installiert -> direkt zur Web-App. Sonst Sheet mit
    // App-Store-Download + Web-App-Optionen zeigen (Mobile UND Desktop).
    if (standalone) return;
    e.preventDefault();
    setOpen(true);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setOpen(false);
  }

  function close() {
    setOpen(false);
    onNavigate?.();
  }

  return (
    <>
      <a href="/app" className={className} onClick={handleClick}>
        {children}
      </a>

      {open && (
        <div
          onClick={close}
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 sm:items-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-3xl bg-white p-6 text-black sm:rounded-3xl"
          >
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-neutral-200 sm:hidden" />

            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icon-192.png"
                alt="Matchup"
                className="h-14 w-14 rounded-2xl"
                width={56}
                height={56}
              />
              <div>
                <h3 className="text-lg font-bold tracking-tight">
                  {t("header.installTitle")}
                </h3>
                <p className="text-sm text-neutral-500">
                  {t("header.installSubtitle")}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {/* Nativer Download im App Store (Apple). Live, sobald APP_STORE_URL gesetzt ist. */}
              {APP_STORE_URL ? (
                <a
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2.5 rounded-full bg-black py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  <AppleLogo className="h-4 w-4" />
                  {t("header.storeApple")}
                </a>
              ) : (
                <div className="flex w-full items-center justify-center gap-2.5 rounded-full bg-neutral-100 py-3.5 text-sm font-bold text-neutral-400">
                  <AppleLogo className="h-4 w-4" />
                  {t("header.storeSoon")}
                </div>
              )}

              <p className="pt-1 text-center text-xs font-medium text-neutral-400">
                {t("header.storeOr")}
              </p>

              {deferred ? (
                <button
                  type="button"
                  onClick={install}
                  className="w-full rounded-full bg-matchup py-3.5 text-sm font-bold text-white transition-colors hover:bg-matchup-hover"
                >
                  {t("header.installNow")}
                </button>
              ) : isIOS ? (
                <div className="rounded-2xl bg-neutral-50 p-4 text-sm leading-relaxed text-neutral-700">
                  <p className="font-semibold text-black">{t("header.iosHowTo")}</p>
                  <ol className="mt-2 list-decimal space-y-1 pl-4">
                    <li>
                      {t("header.iosStep1Pre")}
                      <span className="font-semibold">{t("header.iosStep1Bold")}</span>{" "}
                      <svg
                        viewBox="0 0 24 24"
                        className="inline h-4 w-4 -translate-y-0.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M12 15V3M8.5 6.5 12 3l3.5 3.5" />
                        <path d="M6 12v7a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-7" />
                      </svg>
                      {t("header.iosStep1Post")}
                    </li>
                    <li>
                      {t("header.iosStep2Pre")}
                      <span className="font-semibold">{t("header.iosStep2Bold")}</span>
                      {t("header.iosStep2Post")}
                    </li>
                    <li>{t("header.iosStep3")}</li>
                  </ol>
                </div>
              ) : (
                <div className="rounded-2xl bg-neutral-50 p-4 text-sm leading-relaxed text-neutral-700">
                  {t("header.otherHowToPre")}
                  <span className="font-semibold">{t("header.otherHowToBold")}</span>.
                </div>
              )}

              <a
                href="/app"
                onClick={close}
                className="block w-full rounded-full border border-neutral-300 py-3.5 text-center text-sm font-semibold text-black transition-colors hover:bg-neutral-100"
              >
                {t("header.openInBrowser")}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
