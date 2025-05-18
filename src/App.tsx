// src/App.tsx
import { useEffect, useState } from 'react';
import './App.css';

const CACHE_NAME = 'my-app-cache';
const MANIFEST_CACHE_KEY = '/manifest.json';

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

async function cacheDynamicManifest(appName: string) {
  const manifestString = JSON.stringify(makeManifest(appName));
  const resp = new Response(manifestString, {
    headers: { 'Content-Type': 'application/json' },
  });
  const cache = await caches.open(CACHE_NAME);
  await cache.put(MANIFEST_CACHE_KEY, resp);
}

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

function getBlobURL(appName: string) {
  return URL.createObjectURL(
    new Blob([JSON.stringify(makeManifest(appName))], {
      type: 'application/json',
    })
  );
}

export default function App() {
  const [cachedAppName, setCachedAppName] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  // ← ここで本当にインストールさせたい「新しい appName」をセット
  // 例: 画面上の入力や props, あるいはビルド時に変わる値など
  const dynamicAppName = 'アプリ名2';

  useEffect(() => {
    (async () => {
      // 1) 以前のキャッシュ名を取得
      const prevName = await getCachedAppName();

      // 2) 新しい名前でキャッシュを上書き
      // await cacheDynamicManifest(dynamicAppName);

      // 3) 比較。以前あって、かつ変わっていればバナーを出す
      console.info('prevName', prevName);
      if (prevName !== null && prevName !== dynamicAppName) {
        setShowBanner(true);
      } else {
        await cacheDynamicManifest(dynamicAppName);
      }

      // 4) 最新を画面表示用にセット
      setCachedAppName(dynamicAppName);
    })();
  }, [dynamicAppName]);

  useEffect(() => {
    // PWA 用リンクは Blob URL のまま
    const link: HTMLLinkElement =
      document.querySelector('link[rel="manifest"]') ||
      (() => {
        const el = document.createElement('link');
        el.setAttribute('rel', 'manifest');
        document.head.appendChild(el);
        return el;
      })();
    link.setAttribute('href', getBlobURL(dynamicAppName));
  }, [dynamicAppName]);

  return (
    <div className='App'>
      {showBanner && (
        <div className='update-banner'>
          ⚠️ アプリ名が変更されました。再インストールしてください。
        </div>
      )}

      <div className='cached-app-name'>
        {/* 画面上で、キャッシュにある「最新の」名前を表示 */}
        現在キャッシュされているアプリ名: {cachedAppName}
      </div>
    </div>
  );
}
