const CACHE_NAME = 'sawwirni-cache-v2'; // Increment cache version
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/db.ts',
  '/hooks/useTheme.ts',
  '/utils/imageUtils.ts',
  '/utils/backgroundRemover.ts',
  '/components/icons.tsx',
  '/components/Header.tsx',
  '/components/Modal.tsx',
  '/components/ClassManager.tsx',
  '/components/StudentManager.tsx',
  '/components/CameraView.tsx',
  '/components/CropModal.tsx',
  'https://image2url.com/r2/default/images/1770324189688-19e18e06-e522-42b7-b936-30cf78ff88c2.png',
  'https://image2url.com/r2/default/images/1770536141788-2d571095-0891-4f3b-a07c-5eccee2d377a.jpg',
];

// On install, cache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache. Caching app shell...');
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// On activate, clear old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith('sawwirni-cache-') && name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// On fetch, handle requests
self.addEventListener('fetch', event => {
  // We only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // For navigation requests (e.g., loading the page), use network-first strategy.
  // This ensures the user always gets the latest version of the app shell if they are online.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If the network fails, serve the main app page from the cache.
          return caches.match('/index.html');
        })
    );
    return;
  }

  // For all other requests (assets, scripts, etc.), use a cache-first strategy.
  // This makes the app load faster by serving assets from the cache.
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // If we have a cached response, return it.
        if (response) {
          return response;
        }

        // If not, fetch from the network.
        return fetch(event.request).then(networkResponse => {
          // And cache the new response for future use.
          return caches.open(CACHE_NAME).then(cache => {
            // Check if the response is valid before caching
            if (networkResponse && networkResponse.ok) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
  );
});
