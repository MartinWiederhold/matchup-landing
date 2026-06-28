"use client";

import { useEffect } from "react";

/**
 * Registriert den Service Worker app-weit (auch in der installierten /app-PWA)
 * und sorgt dafür, dass eine neue Version automatisch übernommen wird:
 *  - prüft beim Start UND jedes Mal, wenn die PWA wieder in den Vordergrund kommt,
 *    auf ein Update (reg.update())
 *  - aktiviert einen wartenden neuen SW sofort (SKIP_WAITING)
 *  - lädt die Seite einmalig neu, sobald der neue SW die Kontrolle übernimmt
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });

    let reg: ServiceWorkerRegistration | undefined;

    function promote(r: ServiceWorkerRegistration) {
      const sw = r.waiting;
      if (sw) sw.postMessage("SKIP_WAITING");
    }

    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((r) => {
        reg = r;
        // Bereits ein Update bereit?
        promote(r);
        // Neuer SW wird installiert → sobald fertig, sofort übernehmen.
        r.addEventListener("updatefound", () => {
          const installing = r.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              promote(r);
            }
          });
        });
      })
      .catch(() => {});

    // Beim Zurückkehren in die PWA auf Updates prüfen.
    function checkForUpdate() {
      if (document.visibilityState === "visible") reg?.update().catch(() => {});
    }
    document.addEventListener("visibilitychange", checkForUpdate);
    window.addEventListener("focus", checkForUpdate);

    return () => {
      document.removeEventListener("visibilitychange", checkForUpdate);
      window.removeEventListener("focus", checkForUpdate);
    };
  }, []);

  return null;
}
