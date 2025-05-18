// public/service-worker.js

const CACHE_NAME = 'my-app-cache';
const PRECACHE_URLS = [
  '/manifest.json',
  // ほかに初回キャッシュしたいリソースがあればここに列挙
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        const urls = ['/manifest.json' /*…*/];
        await Promise.all(
          urls.map((url) =>
            cache.add(url).catch((err) => {
              console.warn('[SW] failed to cache', url, err);
            })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  console.log('[SW] activate');
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      });
    })
  );
});
