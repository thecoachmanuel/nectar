// ── Nectar Service Worker for Background Notifications & Offline PWA ──────
const CACHE_NAME = "nectar-cache-v4";
const OFFLINE_URL = "/offline.html";

const PRECACHE_ASSETS = [
  OFFLINE_URL,
  "/images/theme/theme-logo.png",
  "/images/theme/theme-favicon-logo.png",
  "/images/item/thumb.png",
  "/manifest.json",
];

// ── Install: Precache Offline Assets ─────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn("[SW Precache]", err))
  );
});

// ── Activate: Clean old caches and claim clients ─────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch: Offline Fallback for Navigation & Cache-First for Static Assets ──
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // 1. Navigation requests (User browsing pages or opening app offline)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedOffline = await cache.match(OFFLINE_URL);
        return (
          cachedOffline ||
          new Response(
            `<!DOCTYPE html><html><head><title>Offline</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:sans-serif;text-align:center;padding:40px;background:#f7f7fc"><h2>No Internet Connection</h2><p>Please check your network connection and reload.</p><button onclick="window.location.reload()" style="padding:10px 24px;border-radius:20px;background:#ff006b;color:#fff;border:none">Retry</button></body></html>`,
            { headers: { "Content-Type": "text/html; charset=utf-8" } }
          )
        );
      })
    );
    return;
  }

  // 2. Static Images & Assets (Cache First, Network Fallback)
  if (
    req.destination === "image" ||
    req.destination === "font" ||
    req.url.includes("/images/")
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              const resClone = networkRes.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
            }
            return networkRes;
          })
          .catch(() => {
            // If image fails, return nothing or empty
            return new Response("", { status: 408 });
          });
      })
    );
    return;
  }

  // 3. All other requests — Network with fallback
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});

// ── Handle Background Push Notifications (VAPID) ────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || "Nectar Groceries";
    const options = {
      body: data.body || "You have a new update!",
      icon: data.icon || "/images/theme/theme-favicon-logo.png",
      badge: "/images/theme/theme-favicon-logo.png",
      image: data.image,
      vibrate: [200, 100, 200],
      data: {
        url: data.url || "/",
        body: data.body,
        title,
        image: data.image,
        ...data.data,
      },
      tag: data.tag || `nectar-notif-${Date.now()}`,
      renotify: true,
      requireInteraction: data.requireInteraction ?? true,
      actions: data.actions || [],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification("Nectar Notification", {
        body: text,
        icon: "/images/theme/theme-favicon-logo.png",
        badge: "/images/theme/theme-favicon-logo.png",
        data: { url: "/" },
      })
    );
  }
});

// ── Handle Notification Click ───────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const notifData = event.notification.data || {};
  const targetUrl = notifData.url || "/";
  const title = event.notification.title || "Nectar Notification";
  const body = event.notification.body || "";
  const image = notifData.image;

  const tapPayload = {
    type: "NOTIFICATION_TAPPED",
    title,
    body,
    url: targetUrl,
    image,
    receivedAt: Date.now(),
  };

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            client.postMessage(tapPayload);
            if ("focus" in client) {
              return client.focus();
            }
          }
        }

        if (self.clients.openWindow) {
          const openUrl = new URL(targetUrl, self.location.origin);
          openUrl.searchParams.set("__notif_tap", encodeURIComponent(JSON.stringify(tapPayload)));
          return self.clients.openWindow(openUrl.toString());
        }
      })
  );
});
