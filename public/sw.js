/* ─────────────────────────────────────────────────────────────────────────────
   Beta Tenant Service Worker — World-Class PWA Edition
   ───────────────────────────────────────────────────────────────────────────── */

const APP_VERSION = "bt-v6";
const CACHE_STATIC = `${APP_VERSION}-static`;
const CACHE_PAGES  = `${APP_VERSION}-pages`;
const CACHE_IMAGES = `${APP_VERSION}-images`;
const CACHE_API    = `${APP_VERSION}-api`;
const CACHE_FONTS  = `${APP_VERSION}-fonts`;

const IMAGE_CACHE_MAX = 120;
const API_CACHE_MAX   = 60;

// Only cache things that genuinely exist as static files
const PRECACHE_URLS = [
  "/offline.html",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_STATIC)
      .then((c) => Promise.allSettled(
        PRECACHE_URLS.map((u) => c.add(new Request(u, { cache: "reload" })))
      ))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: purge old caches ────────────────────────────────────────────────
self.addEventListener("activate", (e) => {
  const CURRENT = [CACHE_STATIC, CACHE_PAGES, CACHE_IMAGES, CACHE_API, CACHE_FONTS];
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => !CURRENT.includes(k)).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch routing ─────────────────────────────────────────────────────────────
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);

  if (req.method !== "GET") return;
  if (!url.protocol.startsWith("http")) return;
  // Skip browser-extension requests
  if (url.hostname !== self.location.hostname && !url.hostname.includes("betatenant") && !url.hostname.includes("cloudinary") && !url.hostname.includes("amazonaws") && !url.hostname.includes("fontshare")) return;

  // ── Fonts (Fontshare CDN) — cache-first, long TTL ──
  if (url.hostname.includes("fontshare") || url.hostname.includes("fonts.gstatic")) {
    e.respondWith(cacheFirstForever(req, CACHE_FONTS));
    return;
  }

  // ── API calls — network-first, 5-min cache, LRU eviction ──
  if (url.hostname === "api.betatenant.com") {
    // Messages are real-time — never cache
    if (url.pathname.includes("/chats") || url.pathname.includes("/messages")) {
      e.respondWith(networkOnly(req));
      return;
    }
    e.respondWith(networkFirstWithCache(req, CACHE_API, 5 * 60, API_CACHE_MAX));
    return;
  }

  // ── Next.js immutable build chunks — cache-first forever ──
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(cacheFirstForever(req, CACHE_STATIC));
    return;
  }

  // ── Images (local + CDN) — cache-first with LRU ──
  if (
    /\.(png|jpg|jpeg|webp|gif|svg|ico|avif)(\?.*)?$/.test(url.pathname) ||
    url.hostname.includes("cloudinary") ||
    url.hostname.includes("amazonaws") ||
    url.hostname.includes("imagedelivery")
  ) {
    e.respondWith(cacheFirstWithLRU(req, CACHE_IMAGES, IMAGE_CACHE_MAX));
    return;
  }

  // ── HTML navigation — network-first, cache fallback ──
  if (req.mode === "navigate") {
    e.respondWith(navigationHandler(req));
    return;
  }

  // ── Everything else — stale-while-revalidate ──
  e.respondWith(staleWhileRevalidate(req, CACHE_STATIC));
});

/* ─── Strategies ───────────────────────────────────────────────────────────── */

// Cache-first, never revalidate (for immutable content-hashed assets + fonts)
async function cacheFirstForever(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return new Response("", { status: 503 });
  }
}

// Network-first with TTL-aware cache fallback + LRU eviction
async function networkFirstWithCache(req, cacheName, maxAgeSecs, maxEntries) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req.clone());
    if (res.ok) {
      const headers = new Headers(res.headers);
      headers.set("sw-cached-at", String(Date.now()));
      const body = await res.clone().arrayBuffer();
      await cache.put(req, new Response(body, { status: res.status, statusText: res.statusText, headers }));
      // LRU eviction
      const keys = await cache.keys();
      if (keys.length > maxEntries) {
        await Promise.all(keys.slice(0, keys.length - maxEntries).map((k) => cache.delete(k)));
      }
    }
    return res;
  } catch {
    const cached = await cache.match(req);
    if (cached) {
      const cachedAt = cached.headers.get("sw-cached-at");
      if (!cachedAt || Date.now() - Number(cachedAt) < maxAgeSecs * 1000) return cached;
    }
    return new Response(JSON.stringify({ offline: true, cached: false }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Cache-first with LRU eviction (for images)
async function cacheFirstWithLRU(req, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (!res.ok) return res;
    await cache.put(req, res.clone());
    const keys = await cache.keys();
    if (keys.length > maxEntries) {
      await Promise.all(keys.slice(0, keys.length - maxEntries).map((k) => cache.delete(k)));
    }
    return res;
  } catch {
    return new Response("", { status: 503 });
  }
}

// True stale-while-revalidate: return cache immediately, update in background
async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  // Always kick off background refresh
  const networkFetch = fetch(req.clone()).then(async (res) => {
    if (res.ok) await cache.put(req, res.clone());
    return res;
  }).catch(() => null);
  return cached ?? await networkFetch ?? new Response("", { status: 503 });
}

// Network only — for real-time data like messages
async function networkOnly(req) {
  try {
    return await fetch(req);
  } catch {
    return new Response(JSON.stringify({ offline: true }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Navigation: network-first, cache exact URL, offline page fallback
async function navigationHandler(req) {
  const cache = await caches.open(CACHE_PAGES);
  try {
    const res = await fetch(req);
    if (res.ok && res.headers.get("content-type")?.includes("text/html")) {
      cache.put(req, res.clone());
    }
    return res;
  } catch {
    // Try exact URL cache
    const cached = await cache.match(req);
    if (cached) return cached;

    // For property/payment pages, return cached properties listing as app shell
    const url = new URL(req.url);
    if (url.pathname.startsWith("/property/") || url.pathname.startsWith("/payment/")) {
      const shell = await cache.match("/properties");
      if (shell) return shell;
    }

    // Try root
    const root = await caches.match("/");
    if (root) return root;

    // Final fallback: inline offline page
    const offlinePage = await caches.match("/offline.html");
    if (offlinePage) return offlinePage;

    return new Response(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Offline — Beta Tenant</title></head>
      <body style="margin:0;font-family:-apple-system,sans-serif;background:#0A0876;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100dvh;padding:2rem;text-align:center;box-sizing:border-box">
        <div style="width:72px;height:72px;background:rgba(255,255,255,.12);border-radius:20px;display:flex;align-items:center;justify-content:center;margin-bottom:1.5rem;font-size:2rem">📡</div>
        <h1 style="margin:0 0 .75rem;font-size:1.75rem;font-weight:700">You're Offline</h1>
        <p style="margin:0 0 2rem;color:rgba(255,255,255,.65);line-height:1.6;max-width:300px">Check your connection and try again. Previously viewed pages are still available.</p>
        <button onclick="location.reload()" style="background:#fff;color:#0A0876;border:none;border-radius:50px;padding:.875rem 2.5rem;font-size:1rem;font-weight:700;cursor:pointer;font-family:inherit">Try Again</button>
      </body></html>`,
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  }
}

/* ─── Push Notifications ─────────────────────────────────────────────────────── */

self.addEventListener("push", (e) => {
  if (!e.data) return;

  let data = {};
  try { data = e.data.json(); } catch { data = { title: "Beta Tenant", body: e.data.text() }; }

  const title = data.title || "Beta Tenant";
  const options = {
    body: data.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192-monochrome.png",
    image: data.image || undefined,
    tag: data.tag || "bt-general",
    renotify: true,
    data: { url: data.url || "/", type: data.type || "general" },
    actions: data.actions || [],
    vibrate: [100, 50, 100, 50, 100],
    requireInteraction: data.requireInteraction || false,
    silent: false,
  };

  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const { action } = e;
  const { url } = e.notification.data || {};
  const targetUrl = url || "/";

  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      const existing = windowClients.find((c) =>
        new URL(c.url).pathname === new URL(targetUrl, self.location.origin).pathname
      );
      if (existing) return existing.focus();
      return clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener("notificationclose", () => {});

/* ─── Background Sync ────────────────────────────────────────────────────────── */

self.addEventListener("sync", (e) => {
  if (e.tag === "bt-sync-messages") {
    e.waitUntil(notifyClients("SYNC_MESSAGES"));
  }
  if (e.tag === "bt-sync-alerts") {
    e.waitUntil(notifyClients("SYNC_ALERTS"));
  }
});

async function notifyClients(type) {
  const allClients = await clients.matchAll({ includeUncontrolled: true });
  allClients.forEach((c) => c.postMessage({ type }));
}

/* ─── Messages from page ─────────────────────────────────────────────────────── */

self.addEventListener("message", (e) => {
  if (e.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (e.data?.type === "CLIENTS_CLAIM") self.clients.claim();
  if (e.data?.type === "GET_VERSION") e.source?.postMessage({ type: "VERSION", version: APP_VERSION });
  if (e.data?.type === "CACHE_PROPERTY") {
    // Pre-warm cache for a property the user is viewing
    if (e.data.url) fetch(e.data.url).then(async (res) => {
      if (res.ok) (await caches.open(CACHE_API)).put(e.data.url, res);
    }).catch(() => {});
  }
});
