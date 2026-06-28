// Minimaler Service Worker — erfüllt die Installierbarkeits-Kriterien (PWA),
// ohne Inhalte zu cachen. Alle Requests laufen normal übers Netzwerk.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {
  // bewusst kein respondWith(): Browser übernimmt das Laden wie gewohnt.
});
