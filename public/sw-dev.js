// Development-only replacement served at /sw.js by Next's beforeFiles rewrite.
// No fetch handler: once claimed, open tabs fetch fresh HTML, JS and CSS directly.
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("buckeyesprouts-")).map((key) => caches.delete(key)));
    await self.clients.claim();
    await self.registration.unregister();
  })());
});
