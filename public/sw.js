// BuckeyeStudy Service Worker (PWA)
// Enables offline access, background resilience in OSU libraries, and asset caching

const CACHE_NAME = "buckeyestudy-v9";

// Dynamically determine the application base path (e.g. "/hackohio2026" on GitHub Pages or "" on localhost)
function getBasePath() {
  try {
    const scopeUrl = new URL(self.registration ? self.registration.scope : self.location.href);
    const path = scopeUrl.pathname;
    return path.endsWith("/") ? path.slice(0, -1) : path;
  } catch {
    return "";
  }
}

const PRECACHE_PATHS = [
  "/",
  "/offline",
  "/manifest.webmanifest",
  "/manifest.json",
  "/favicon.svg",
  "/brand/logo.png",
  "/squiggly.svg",
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-192.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
  "/maps/floor-1-map.svg",
];

// Install: precache offline shell and core assets defensively
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        const basePath = getBasePath();
        const urlsToCache = PRECACHE_PATHS.map((p) => `${basePath}${p}`);

        // Cache each asset using Promise.allSettled so a single missing asset or 404 does NOT abort installation
        await Promise.allSettled(
          urlsToCache.map(async (url) => {
            try {
              const res = await fetch(url);
              if (res.ok) {
                await cache.put(url, res);
              }
            } catch {
              // Silently ignore individual asset fetch failures during install
            }
          })
        );
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn("[PWA SW] Precache warning during install:", err);
      })
  );
});

// Activate: clean up outdated caches and immediately take control
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: network-first for pages with offline fallback, stale-while-revalidate for static assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and cross-origin analytics/external requests
  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  const basePath = getBasePath();

  // API calls: Network-first, do not fallback to HTML offline page
  if (url.pathname.includes("/api/")) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            error: {
              code: "OFFLINE",
              message: "Network unavailable. Operating in offline mode.",
            },
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          }
        );
      })
    );
    return;
  }

  // Navigation requests (HTML pages): Network-first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          const offlineFallback =
            (await caches.match(`${basePath}/offline`)) ||
            (await caches.match("/offline")) ||
            (await caches.match(`${basePath}/`)) ||
            (await caches.match("/"));
          return offlineFallback || new Response("BuckeyeStudy is offline", { status: 503 });
        })
    );
    return;
  }

  // Static assets (CSS, JS, images, fonts): Cache-first with network fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => cached);
    })
  );
});

// Support manual skipWaiting trigger from client
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Push notification support (study session updates, booking confirmed, host approved)
self.addEventListener("push", (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const title = data.title || "BuckeyeStudy Notification";
    const options = {
      body: data.body || "New study group activity at Ohio State.",
      icon: `${getBasePath()}/icons/icon-192.png`,
      badge: `${getBasePath()}/icons/icon.svg`,
      data: { url: data.url || `${getBasePath()}/` },
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch {
    event.waitUntil(
      self.registration.showNotification("BuckeyeStudy", {
        body: event.data.text(),
        icon: `${getBasePath()}/icons/icon-192.png`,
      })
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const basePath = getBasePath();
  const targetUrl = (event.notification.data && event.notification.data.url) || `${basePath}/`;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});



