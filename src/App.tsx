// src/App.tsx
import { useEffect, useState } from 'react';
import './App.css';

const CACHE_NAME = 'my-app-cache';
const MANIFEST_PATH = '/manifest.json';

async function cacheDynamicManifest(appName: string) {
  const baseUrl = window.location.origin;
  const manifest = {
    name: appName,
    short_name: appName,
    theme_color: '#000000',
    display: 'standalone',
    start_url: baseUrl,
    icons: [
      { src: `${baseUrl}/192.png`, sizes: '192x192', type: 'image/png' },
      { src: `${baseUrl}/512.png`, sizes: '512x512', type: 'image/png' },
    ],
  };

  const manifestString = JSON.stringify(manifest);
  const response = new Response(manifestString, {
    headers: { 'Content-Type': 'application/json' },
  });

  const cache = await caches.open(CACHE_NAME);
  // '/manifest.json' というキーで登録
  await cache.put(MANIFEST_PATH, response);
}

async function getCachedAppName(): Promise<string | null> {
  const cache = await caches.open(CACHE_NAME);
  const resp = await cache.match(MANIFEST_PATH);
  if (!resp) return null;
  const json = await resp.json();
  return typeof json.name === 'string' ? json.name : null;
}

function App() {
  const [cachedAppName, setCachedAppName] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // 1) 動的 manifest をキャッシュに登録
      await cacheDynamicManifest('アプリ名');

      // 2) キャッシュから name を読み出し
      const name = await getCachedAppName();
      setCachedAppName(name);
    })();
  }, []);

  useEffect(() => {
    // `<link rel="manifest">` を manifest.json に向ける
    const link: HTMLLinkElement =
      document.querySelector('link[rel="manifest"]') ||
      (() => {
        const el = document.createElement('link');
        el.setAttribute('rel', 'manifest');
        document.head.appendChild(el);
        return el;
      })();

    link.setAttribute('href', MANIFEST_PATH);
  }, []);

  return (
    <div className='App'>
      <div>
        現在キャッシュされているアプリ名:{' '}
        {cachedAppName ?? '（キャッシュなし）'}
      </div>
      {/* …その他の UI… */}
    </div>
  );
}

export default App;
