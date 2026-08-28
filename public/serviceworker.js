var staticCacheName = "foodappi-pwa-v" + new Date().getTime();
var filesToCache = [
    '/',
    '/offline.html',
    '/manifest.webmanifest',
    '/images/icons/icon-72x72.png',
    '/images/icons/icon-96x96.png',
    '/images/icons/icon-128x128.png',
    '/images/icons/icon-144x144.png',
    '/images/icons/icon-152x152.png',
    '/images/icons/icon-192x192.png',
    '/images/icons/icon-384x384.png',
    '/images/icons/icon-512x512.png',
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

// Serve from cache, fallback to network, then offline page
self.addEventListener("fetch", event => {
    // Skip non-GET and API requests
    if (event.request.method !== 'GET') return;
    if (event.request.url.includes('/api/')) return;

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
            return caches.match(event.request).then(response => {
                return response || caches.match('/offline.html');
            });
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
        icon: '/images/icons/icon-192x192.png',
        badge: '/images/icons/icon-72x72.png',
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
