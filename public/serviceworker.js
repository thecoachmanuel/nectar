var staticCacheName = "foodappi-pwa-v" + new Date().getTime();
var filesToCache = [
    '/',
    '/offline.html',
    '/manifest.webmanifest',
    '/images/theme/theme-favicon-logo.png',
    '/images/theme/theme-logo.png',
];

// Cache on install
self.addEventListener("install", event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(staticCacheName)
            .then(cache => {
                return cache.addAll(filesToCache).catch(err => {
                    console.warn("[SW] Some files failed to cache:", err);
                });
            })
    );
});

// Clear old caches on activate
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(cacheName => cacheName.startsWith("foodappi-pwa-"))
                    .filter(cacheName => cacheName !== staticCacheName)
                    .map(cacheName => caches.delete(cacheName))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch strategy: Network first, never store HTML navigation in cache
self.addEventListener("fetch", event => {
    // Skip non-GET and API requests
    if (event.request.method !== 'GET') return;
    if (event.request.url.includes('/api/')) return;

    const isHTML = event.request.mode === 'navigate' || (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'));

    if (isHTML) {
        // Navigation / HTML requests ALWAYS bypass SW cache and go directly to network
        event.respondWith(
            fetch(event.request, { cache: 'no-store' }).catch(() => {
                return caches.match('/offline.html');
            })
        );
        return;
    }

    // Static assets (images, styles, scripts): Network first, cache fallback
    event.respondWith(
        fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                caches.open(staticCacheName).then(cache => {
                    cache.put(event.request, responseClone);
                });
            }
            return networkResponse;
        }).catch(() => {
            return caches.match(event.request);
        })
    );
});

// Push notification handler
self.addEventListener('push', event => {
    if (!event.data) return;
    const data = event.data.json();
    const title = data.notification?.title || 'FoodAppi';
    const options = {
        body: data.notification?.body || '',
        icon: '/images/theme/theme-favicon-logo.png',
        badge: '/images/theme/theme-favicon-logo.png',
        data: data.data || {},
        vibrate: [200, 100, 200],
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handler
self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data?.url || '/')
    );
});
