/* ─────────────────────────────────────────────────────────────────────────────
   Beta Tenant Service Worker — Production PWA
   ───────────────────────────────────────────────────────────────────────────── */

const APP_VERSION = "bt-v4";
const CACHE_STATIC = `${APP_VERSION}-static`;
const CACHE_PAGES  = `${APP_VERSION}-pages`;
const CACHE_IMAGES = `${APP_VERSION}-images`;
const CACHE_API    = `${APP_VERSION}-api`;

const PRECACHE_URLS = [
  "/",
  "/properties",
  "/agents",
  "/search",
  "/offline.html",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// ── Install: precache shell + key pages ───────────────────────────────────────
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_STATIC)
      .then((c) => c.addAll(PRECACHE_URLS.map((u) => new Request(u, { cache: "reload" }))))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()) // don't block install on failures
  );
});

// ── Activate: purge old caches ────────────────────────────────────────────────
self.addEventListener("activate", (e) => {
  const CURRENT = [CACHE_STATIC, CACHE_PAGES, CACHE_IMAGES, CACHE_API];
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !CURRENT.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: strategy per request type ─────────────────────────────────────────
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // Skip non-GET and browser-extension requests
  if (req.method !== "GET") return;
  if (!url.protocol.startsWith("http")) return;

  // ── API calls: network-first, short-lived cache ──
  if (url.hostname === "api.betatenant.com") {
    e.respondWith(networkFirstWithCache(req, CACHE_API, 30 * 60)); // 30 min
    return;
  }

  // ── _next/static assets: cache-first (immutable) ──
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(cacheFirstImmutable(req, CACHE_STATIC));
    return;
  }

  // ── Images: cache-first, long TTL ──
  if (/\.(png|jpg|jpeg|webp|gif|svg|ico)$/.test(url.pathname) || url.hostname.includes("cloudinary") || url.hostname.includes("amazonaws")) {
    e.respondWith(cacheFirstWithRevalidate(req, CACHE_IMAGES));
    return;
  }

  // ── HTML navigation: network-first, offline fallback ──
  if (req.mode === "navigate") {
    e.respondWith(navigationHandler(req));
    return;
  }

  // ── Everything else: stale-while-revalidate ──
  e.respondWith(staleWhileRevalidate(req, CACHE_STATIC));
});

/* ─── Strategies ───────────────────────────────────────────────────────────── */

async function networkFirstWithCache(req, cacheName, maxAgeSecs) {
  try {
    const res = await fetch(req.clone());
    if (res.ok) {
      const cache = await caches.open(cacheName);
      const toStore = res.clone();
      const headers = new Headers(toStore.headers);
      headers.set("sw-cached-at", String(Date.now()));
      cache.put(req, new Response(await toStore.blob(), { status: toStore.status, headers }));
    }
    return res;
  } catch {
    const cached = await caches.match(req);
    if (cached) {
      const cachedAt = cached.headers.get("sw-cached-at");
      if (cachedAt && Date.now() - Number(cachedAt) < maxAgeSecs * 1000) return cached;
    }
    return new Response(JSON.stringify({ offline: true }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function cacheFirstImmutable(req, cacheName) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) (await caches.open(cacheName)).put(req, res.clone());
    return res;
  } catch {
    return new Response("", { status: 503 });
  }
}

async function cacheFirstWithRevalidate(req, cacheName) {
  const cached = await caches.match(req);
  const networkFetch = fetch(req).then(async (res) => {
    if (res.ok) (await caches.open(cacheName)).put(req, res.clone());
    return res;
  }).catch(() => cached || new Response("", { status: 503 }));
  return cached || networkFetch;
}

async function staleWhileRevalidate(req, cacheName) {
  const cached = await caches.match(req);
  const networkFetch = fetch(req).then(async (res) => {
    if (res.ok) (await caches.open(cacheName)).put(req, res.clone());
    return res;
  }).catch(() => null);
  return cached || await networkFetch || new Response("", { status: 503 });
}

async function navigationHandler(req) {
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(CACHE_PAGES);
      cache.put(req, res.clone());
    }
    return res;
  } catch {
    // Try exact cache match first
    const cached = await caches.match(req);
    if (cached) return cached;

    // For dynamic routes (/property/xxx, /payment/xxx) return the placeholder shell
    const url = new URL(req.url);
    const dynamicPrefixes = ["/property/", "/payment/", "/m/", "/s/", "/agents/portfolio/"];
    for (const prefix of dynamicPrefixes) {
      if (url.pathname.startsWith(prefix)) {
        const shell = await caches.match(new URL(prefix + "placeholder", url.origin).href);
        if (shell) return shell;
      }
    }

    // Fallback to cached home or offline page
    const offline = await caches.match("/offline.html");
    if (offline) return offline;
    return caches.match("/") || new Response("<h1>You are offline</h1>", {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  }
}

/* ─── Push Notifications ────────────────────────────────────────────────────── */

self.addEventListener("push", (e) => {
  if (!e.data) return;

  let data = {};
  try { data = e.data.json(); } catch { data = { title: "Beta Tenant", body: e.data.text() }; }

  const title = data.title || "Beta Tenant";
  const options = {
    body: data.body || "",
    icon: data.icon || "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    image: data.image || undefined,
    tag: data.tag || "bt-notification",
    renotify: !!data.tag,
    data: { url: data.url || "/" },
    actions: data.actions || [],
    vibrate: [100, 50, 100],
    requireInteraction: data.requireInteraction || false,
  };

  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url || "/";

  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Focus existing tab if open
      for (const client of windowClients) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      // Otherwise open new tab
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

self.addEventListener("notificationclose", (e) => {
  // Could log analytics here
});

/* ─── Background Sync ────────────────────────────────────────────────────────── */

self.addEventListener("sync", (e) => {
  if (e.tag === "bt-sync-messages") {
    e.waitUntil(syncMessages());
  }
});

async function syncMessages() {
  try {
    const allClients = await clients.matchAll({ includeUncontrolled: true });
    for (const client of allClients) {
      client.postMessage({ type: "SYNC_MESSAGES" });
    }
  } catch {}
}

/* ─── App Update Detection ───────────────────────────────────────────────────── */

self.addEventListener("message", (e) => {
  if (e.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (e.data?.type === "CLIENTS_CLAIM") {
    self.clients.claim();
  }
  if (e.data?.type === "GET_VERSION") {
    e.source?.postMessage({ type: "VERSION", version: APP_VERSION });
  }
});
