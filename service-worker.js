const CACHE_NAME = 'tripsketch-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/landing.css',
  '/css/explore.css',
  '/js/api.js',
  '/js/ui.js',
  '/js/filter.js',
  '/js/app.js',
  '/js/landing.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching application assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // First return the cached response if available
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Otherwise, attempt to fetch from the network
      return fetch(event.request).then(networkResponse => {
        // Cache dynamic responses if valid
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback for failed network requests (e.g., when offline)
        // If the request was for an image or specific asset, we could return a placeholder here
        console.warn('[Service Worker] Fetch failed, returning offline fallback for:', event.request.url);
      });
    })
  );
});
