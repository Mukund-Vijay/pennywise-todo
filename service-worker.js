const CACHE_NAME = 'pennywise-todo-v7';
const urlsToCache = [
  '/',
  '/auth.html',
  '/index.html',
  '/style.css',
  '/auth.css',
  '/app.js',
  '/auth.js',
  '/manifest.json'
];

// Install service worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing v7...');
  self.skipWaiting(); // Force immediate activation
  event.waitUntil(
    caches.keys().then(cacheNames => {
      // Delete all old caches
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return caches.open(CACHE_NAME)
        .then(cache => {
          console.log('[Service Worker] Caching files');
          return cache.addAll(urlsToCache);
        });
    })
  );
});

// Fetch with network-first strategy for API, cache-first for assets
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Network-first for API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(request).then(response => {
          // Cache new requests
          if (request.method === 'GET' && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
  );
});

// Update service worker and clean old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
