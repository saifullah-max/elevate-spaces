// Service Worker for Elevate Spaces
// Bump this whenever the deployed UI shell or Tailwind output changes.
const CACHE_VERSION = 'v1.0.2';
const CACHE_NAME = `elevate-spaces-${CACHE_VERSION}`;
const RUNTIME_CACHE = `elevate-spaces-runtime-${CACHE_VERSION}`;

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching static assets');
      return cache.addAll(STATIC_ASSETS.filter(url => {
        // Only cache URLs that exist
        return url !== '/offline.html';
      })).catch(() => {
        console.log('[ServiceWorker] Some static assets could not be cached');
      });
    })
  );
  
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Only cache GET requests; pass through others (POST, PUT, DELETE, etc.)
  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  // Skip API calls to backend (let them go through network)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.ok) {
            const responseToCache = response.clone();
            event.waitUntil(
              caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, responseToCache))
            );
          }
          return response;
        })
        .catch(() => {
          // Return cached API response if available
          return caches.match(request).then((cached) => {
            return cached || new Response(
              JSON.stringify({ error: 'Offline - cached data may be stale' }),
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  // For HTML pages, use network-first strategy
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseToCache = response.clone();
            event.waitUntil(
              caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache))
            );
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).catch(() => {
            return new Response(
              'Page not available offline',
              { status: 503, statusText: 'Service Unavailable' }
            );
          });
        })
    );
    return;
  }

  // For CSS and JS, prefer network-first so style/script updates are not stuck behind stale cache.
  if (request.destination === 'style' || request.destination === 'script') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseToCache = response.clone();
            event.waitUntil(
              caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, responseToCache))
            );
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // For images and other static assets, keep cache-first behavior.
  event.respondWith(
    caches.match(request)
      .then((cached) => cached || fetch(request))
      .then((response) => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        const responseToCache = response.clone();
        event.waitUntil(
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, responseToCache))
        );
        return response;
      })
      .catch(() => {
        if (request.destination === 'image') {
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#f0f0f0" width="100" height="100"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999" font-size="12">Offline</text></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        }
        return new Response('Offline - resource not available', { status: 503 });
      })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
