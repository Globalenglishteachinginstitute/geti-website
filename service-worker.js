const GETI_CACHE = 'geti-pwa-v1';
const CORE_ASSETS = [
  '/',
  '/site.webmanifest',
  '/geti-icon-192.png',
  '/geti-icon-512.png',
  '/offline.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(GETI_CACHE)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== GETI_CACHE)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;

  // Only handle normal GET requests.
  if (request.method !== 'GET') return;

  // Navigation: prefer network so login/results/exams stay current.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(GETI_CACHE).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match('/offline.html');
        })
    );
    return;
  }

  // Static assets: cache-first, then network.
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const copy = response.clone();
        caches.open(GETI_CACHE).then(cache => cache.put(request, copy));
        return response;
      });
    })
  );
});
