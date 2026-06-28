"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

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
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent || "";
    const ios = /iphone|ipad|ipod/i.test(ua);
    const android = /android/i.test(ua);
    const mobile =
      ios || android || window.matchMedia("(max-width: 768px)").matches;
    setIsIOS(ios);
    setIsMobile(mobile);
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

    // Service Worker registrieren (Voraussetzung für Installierbarkeit)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  function handleClick(e: React.MouseEvent) {
    // Nur auf Mobilgeräten (und wenn nicht schon installiert) das Sheet zeigen.
    if (!isMobile || standalone) return; // -> normaler Link zu /app
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
                  Matchup als App installieren
                </h3>
                <p className="text-sm text-neutral-500">
                  Direkt vom Home-Bildschirm öffnen — wie eine native App.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {deferred ? (
                <button
                  type="button"
                  onClick={install}
                  className="w-full rounded-full bg-matchup py-3.5 text-sm font-bold text-white transition-colors hover:bg-matchup-hover"
                >
                  Jetzt installieren
                </button>
              ) : isIOS ? (
                <div className="rounded-2xl bg-neutral-50 p-4 text-sm leading-relaxed text-neutral-700">
                  <p className="font-semibold text-black">So geht&apos;s auf dem iPhone:</p>
                  <ol className="mt-2 list-decimal space-y-1 pl-4">
                    <li>
                      Unten auf das <span className="font-semibold">Teilen-Symbol</span>{" "}
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
                      </svg>{" "}
                      tippen
                    </li>
                    <li>
                      <span className="font-semibold">„Zum Home-Bildschirm"</span> wählen
                    </li>
                    <li>Mit „Hinzufügen" bestätigen</li>
                  </ol>
                </div>
              ) : (
                <div className="rounded-2xl bg-neutral-50 p-4 text-sm leading-relaxed text-neutral-700">
                  Öffne das Browser-Menü und wähle{" "}
                  <span className="font-semibold">
                    „App installieren" bzw. „Zum Startbildschirm hinzufügen"
                  </span>
                  .
                </div>
              )}

              <a
                href="/app"
                onClick={close}
                className="block w-full rounded-full border border-neutral-300 py-3.5 text-center text-sm font-semibold text-black transition-colors hover:bg-neutral-100"
              >
                Im Browser öffnen
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
