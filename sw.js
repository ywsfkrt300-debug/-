const CACHE_NAME = 'sawwirni-cache-v3'; // Increment cache version for update

const LOCAL_ASSETS = [
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
];

const EXTERNAL_ASSETS = [
  // Images
  'https://image2url.com/r2/default/images/1770324189688-19e18e06-e522-42b7-b936-30cf78ff88c2.png',
  'https://image2url.com/r2/default/images/1770536141788-2d571095-0891-4f3b-a07c-5eccee2d377a.jpg',
  // Scripts & Styles
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap',
  'https://esm.sh/react-easy-crop@^5.0.7/style.css',
  'https://esm.sh/react@^19.2.4',
  'https://esm.sh/react-dom@^19.2.4/client',
  'https://esm.sh/react-easy-crop@^5.0.7'
];

const URLS_TO_CACHE = [...LOCAL_ASSETS, ...EXTERNAL_ASSETS];

// On install, cache all assets more robustly
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        console.log('Opened cache. Caching app assets...');
        const cachePromises = URLS_TO_CACHE.map(async (url) => {
          try {
            // cache.add() fetches and puts the response in the cache.
            await cache.add(url);
          } catch (error) {
            // If a single asset fails to cache, log it but don't stop the whole installation.
            console.warn(`Failed to cache ${url}, but continuing install.`, error);
          }
        });
        // Wait for all caching attempts to complete.
        await Promise.all(cachePromises);
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
  if (event.request.method !== 'GET') {
    return;
  }

  // For navigation requests, use network-first strategy.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // For all other requests (assets, scripts), use cache-first strategy.
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        return fetch(event.request).then(networkResponse => {
          return caches.open(CACHE_NAME).then(cache => {
            if (networkResponse && networkResponse.ok) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
  );
});
