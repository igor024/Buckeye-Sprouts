// BuckeyeStudy Service Worker (PWA)
// Enables offline access, background resilience in OSU libraries, and asset caching

const CACHE_NAME = "buckeyestudy-v1";
const OFFLINE_FALLBACK_URL = "/offline";

const PRECACHE_ASSETS = [
  "/",
  OFFLINE_FALLBACK_URL,
  "/manifest.webmanifest",
  "/manifest.json",
  "/favicon.svg",
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-192.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
];

// Install: precache offline shell and core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn("[PWA SW] Precache failed during install:", err);
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

// Fetch: smart network-first with offline fallback for pages, stale-while-revalidate for static assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and cross-origin analytics/external requests
  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // API calls: Network-first, do not fallback to HTML offline page
  if (url.pathname.startsWith("/api/")) {
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
          const fallback = await caches.match(OFFLINE_FALLBACK_URL);
          return fallback || new Response("BuckeyeStudy is offline", { status: 503 });
        })
    );
    return;
  }

  // Static assets (CSS, JS, images, fonts): Cache-first with stale-while-revalidate
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".woff2");

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            if (response.status === 200) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => cached);

        return cached || networkFetch;
      })
    );
    return;
  }

  // Default fallback: Network with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request))
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
      icon: "/icons/icon-192.png",
      badge: "/icons/icon.svg",
      data: { url: data.url || "/" },
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch {
    // Plain text fallback
    event.waitUntil(
      self.registration.showNotification("BuckeyeStudy", {
        body: event.data.text(),
        icon: "/icons/icon-192.png",
      })
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";
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
