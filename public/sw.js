// Service Worker — Network-First für Navigationen, damit die installierte PWA
// immer die neueste Version lädt (wenn online). Offline-Fallback auf den Cache.
// Bei jedem Deploy die Version erhöhen, damit der SW sicher neu aktiviert wird.
const VERSION = "mu-2026-08-23-2";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Alte Caches früherer Versionen entfernen.
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // nur eigene Domain

  // HTML-Navigationen: immer zuerst Netzwerk (frische Seite), Cache nur offline.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req, { cache: "no-store" });
          const cache = await caches.open(VERSION);
          cache.put(req, fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match(req);
          return cached || (await caches.match("/app")) || Response.error();
        }
      })(),
    );
  }
  // Alle anderen Requests (Next.js-Chunks haben Hash-Namen) übernimmt der Browser.
});

// Erlaubt der Seite, ein sofortiges Update auszulösen.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
