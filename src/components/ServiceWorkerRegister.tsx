"use client";

import { useEffect } from "react";

const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID;

/**
 * Hält die installierte PWA (und den Browser) automatisch aktuell:
 *
 *  1) Versions-Check (deploy-basiert, UNABHÄNGIG vom Service Worker):
 *     Beim Start und jedes Mal, wenn die App in den Vordergrund kommt, wird
 *     /api/version (no-store) geholt und mit der einbacken Build-Kennung
 *     verglichen. Stimmt sie nicht überein, ist die installierte App veraltet →
 *     Service Worker + Caches werden entfernt und die Seite hart neu geladen.
 *     Das ist der zuverlässige Weg, weil iOS-PWAs den SW-Update-Check oft
 *     ignorieren.
 *
 *  2) Service Worker: Network-First-Registrierung + sofortiges Übernehmen einer
 *     neuen Version (Best effort, ergänzt den Versions-Check).
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    let busy = false;

    async function forceFreshReload() {
      try {
        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
        }
      } catch {}
      try {
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
      } catch {}
      window.location.reload();
    }

    async function checkVersion() {
      if (busy || document.visibilityState !== "visible") return;
      if (!BUILD_ID || BUILD_ID === "dev") return; // lokal nicht
      busy = true;
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        if (res.ok) {
          const { id } = (await res.json()) as { id?: string };
          if (id && id !== "dev" && id !== BUILD_ID) {
            await forceFreshReload();
            return; // reload läuft
          }
        }
      } catch {}
      busy = false;
    }

    // 1) Versions-Check
    checkVersion();
    document.addEventListener("visibilitychange", checkVersion);
    window.addEventListener("focus", checkVersion);

    // 2) Service Worker (Best effort)
    let reg: ServiceWorkerRegistration | undefined;
    if ("serviceWorker" in navigator) {
      let reloaded = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (reloaded) return;
        reloaded = true;
        window.location.reload();
      });

      const promote = (r: ServiceWorkerRegistration) => {
        if (r.waiting) r.waiting.postMessage("SKIP_WAITING");
      };

      navigator.serviceWorker
        .register("/sw.js", { updateViaCache: "none" })
        .then((r) => {
          reg = r;
          promote(r);
          r.addEventListener("updatefound", () => {
            const installing = r.installing;
            if (!installing) return;
            installing.addEventListener("statechange", () => {
              if (
                installing.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                promote(r);
              }
            });
          });
        })
        .catch(() => {});
    }

    function onForeground() {
      if (document.visibilityState === "visible") reg?.update().catch(() => {});
    }
    document.addEventListener("visibilitychange", onForeground);
    window.addEventListener("focus", onForeground);

    return () => {
      document.removeEventListener("visibilitychange", checkVersion);
      window.removeEventListener("focus", checkVersion);
      document.removeEventListener("visibilitychange", onForeground);
      window.removeEventListener("focus", onForeground);
    };
  }, []);

  return null;
}
