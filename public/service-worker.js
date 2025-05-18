// public/service-worker.js
self.addEventListener('install', (e) => {
  console.log('[SW] install');
  // キャッシュ処理など
});

self.addEventListener('activate', (e) => {
  console.log('[SW] activate');
});

self.addEventListener('fetch', (e) => {
  // ネットワークリクエストの挙動を制御できる
});
