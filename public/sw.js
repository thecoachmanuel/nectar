// ── Nectar Service Worker for Background Notifications ───────────────────────
const CACHE_NAME = "nectar-cache-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// ── Handle Background Push Notifications ──
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || "Nectar Groceries";
    const options = {
      body: data.body || "You have a new update!",
      icon: data.icon || "/images/theme/theme-favicon-logo.png",
      badge: "/images/theme/theme-favicon-logo.png",
      vibrate: [200, 100, 200],
      data: {
        url: data.url || "/",
        ...data.data,
      },
      tag: data.tag || "nectar-notification",
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
      })
    );
  }
});

// ── Handle Local Notification Trigger via PostMessage (When App is Minimized) ──
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SHOW_NOTIFICATION") {
    const { title, options } = event.data;
    const notificationOptions = {
      body: options?.body || "New update available",
      icon: options?.icon || "/images/theme/theme-favicon-logo.png",
      badge: "/images/theme/theme-favicon-logo.png",
      vibrate: [200, 100, 200],
      data: options?.data || { url: "/" },
      tag: options?.tag || `nectar-alert-${Date.now()}`,
      renotify: true,
      requireInteraction: options?.requireInteraction ?? true,
    };

    self.registration.showNotification(title, notificationOptions);
  }
});

// ── Handle Notification Click ──
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
