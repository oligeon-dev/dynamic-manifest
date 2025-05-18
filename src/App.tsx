// src/App.tsx
import { useEffect, useState } from 'react';
import './App.css';

const CACHE_NAME = 'my-app-cache';
const MANIFEST_CACHE_KEY = '/manifest.json';

// 動的に生成した manifest オブジェクト
function makeManifest(appName: string) {
  const baseUrl = window.location.origin;
  return {
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
}

// Cache Storage に「仮想的な /manifest.json」として登録
async function cacheDynamicManifest(appName: string) {
  const manifest = makeManifest(appName);
  const manifestString = JSON.stringify(manifest);
  const response = new Response(manifestString, {
    headers: { 'Content-Type': 'application/json' },
  });
  const cache = await caches.open(CACHE_NAME);
  await cache.put(MANIFEST_CACHE_KEY, response);
}

// キャッシュにある manifest から name を取得
async function getCachedAppName(): Promise<string | null> {
  const cache = await caches.open(CACHE_NAME);
  const resp = await cache.match(MANIFEST_CACHE_KEY);
  if (!resp) return null;
  try {
    const json = await resp.json();
    return typeof json.name === 'string' ? json.name : null;
  } catch {
    return null;
  }
}

// Blob URL を生成して <link> に設定する
function getBlobURL(appName: string) {
  const manifestString = JSON.stringify(makeManifest(appName));
  const blob = new Blob([manifestString], { type: 'application/json' });
  return URL.createObjectURL(blob);
}

function App() {
  const [cachedAppName, setCachedAppName] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // 1) Cache Storage に動的 manifest を登録
      await cacheDynamicManifest('アプリ名');

      // 2) キャッシュされた appName を state に読み込む
      const name = await getCachedAppName();
      setCachedAppName(name);
    })();
  }, []);

  useEffect(() => {
    // PWA インストール用の <link rel="manifest"> は Blob URL を向く
    const link: HTMLLinkElement =
      document.querySelector('link[rel="manifest"]') ||
      (() => {
        const el = document.createElement('link');
        el.setAttribute('rel', 'manifest');
        document.head.appendChild(el);
        return el;
      })();
    link.setAttribute('href', getBlobURL('アプリ名2'));
  }, []);

  return (
    <div className='App'>
      <div className='cached-app-name'>
        現在キャッシュされているアプリ名:{' '}
        {cachedAppName ?? '（キャッシュなし）'}
      </div>
      {/* …他の UI… */}
    </div>
  );
}

export default App;
