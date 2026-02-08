const CACHE_NAME = 'sawwirni-cache-v1';

// On install, cache the app shell and other critical assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // We don't precache anything here, we'll cache on the fly
      // This is a more robust approach for assets from various CDNs
      return self.skipWaiting();
    })
  );
});

// On activate, clear old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim()) // Take control of open pages
  );
});

// On fetch, use a "cache, falling back to network" strategy
self.addEventListener('fetch', event => {
  // We only want to cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request)
        .then(cachedResponse => {
          // A cached response is found, return it
          if (cachedResponse) {
            return cachedResponse;
          }

          // No cached response, fetch from network
          return fetch(event.request).then(networkResponse => {
            // If the fetch is successful, clone it and store it in the cache
            if (networkResponse && networkResponse.ok) {
              const responseToCache = networkResponse.clone();
              cache.put(event.request, responseToCache);
            }
            return networkResponse;
          });
        });
    })
  );
});
