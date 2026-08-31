// ── Nectar Service Worker for Background Notifications ───────────────────────
const CACHE_NAME = "nectar-cache-v3";

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
      icon: data.icon || "/images/theme/theme-favicon-logo.png?v=3",
      badge: "/images/theme/theme-favicon-logo.png?v=3",
      image: data.image,
      vibrate: [200, 100, 200],
      data: {
        url: data.url || "/",
        body: data.body,
        title,
        image: data.image,
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
        icon: "/images/theme/theme-favicon-logo.png?v=3",
        badge: "/images/theme/theme-favicon-logo.png?v=3",
        data: { url: "/" },
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
      icon: options?.icon || "/images/theme/theme-favicon-logo.png?v=3",
      badge: "/images/theme/theme-favicon-logo.png?v=3",
      image: options?.image,
      vibrate: [200, 100, 200],
      data: options?.data || { url: "/" },
      tag: options?.tag || `nectar-alert-${Date.now()}`,
      renotify: true,
      requireInteraction: options?.requireInteraction ?? true,
    };

    self.registration.showNotification(title, notificationOptions);
  }
});

// ── Handle Notification Click ──────────────────────────────────────────────
// When a user taps a push notification:
// 1. Close the notification banner
// 2. Find or open an app window
// 3. Post a message to the app to open the detail modal
// 4. Store in localStorage as fallback if the app wasn't open
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
        // If app is open — bring it to focus, then post message to show modal
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            client.postMessage(tapPayload);
            if ("focus" in client) {
              return client.focus();
            }
          }
        }

        // App was closed — store payload in localStorage for when it re-opens
        // We can't access localStorage from SW directly, so we open the URL
        // with a special query param that NotificationListener reads on mount
        if (self.clients.openWindow) {
          const openUrl = new URL(targetUrl, self.location.origin);
          openUrl.searchParams.set("__notif_tap", encodeURIComponent(JSON.stringify(tapPayload)));
          return self.clients.openWindow(openUrl.toString());
        }
      })
  );
});
