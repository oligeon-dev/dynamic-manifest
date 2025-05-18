// public/service-worker.js
self.addEventListener('install', (e) => {
  console.log('[SW] install');
  // キャッシュ処理など
});

self.addEventListener('activate', (e) => {
  console.log('[SW] activate');
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const clone = response.clone();
        caches.open('runtime-cache').then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      });
    })
  );
});
