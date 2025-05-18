// src/App.tsx
import { useEffect, useState } from 'react';
import './App.css';

const CACHE_NAME = 'my-app-cache';

// キャッシュ内の manifest.json から name を取得
async function getCachedAppName(): Promise<string | null> {
  const cache = await caches.open(CACHE_NAME);
  const resp = await cache.match('/manifest.json');
  if (!resp) {
    return null;
  }
  try {
    const text = await resp.text();
    const json = JSON.parse(text);
    return typeof json.name === 'string' ? json.name : null;
  } catch {
    return null;
  }
}

// manifest 用の Blob URL を生成（キャッシュ更新は isAppNameChanged 側で行う想定）
async function getManifestURL(appName: string): Promise<string> {
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
  const str = JSON.stringify(manifest);
  const blob = new Blob([str], { type: 'application/json' });
  return URL.createObjectURL(blob);
}

function App() {
  const [showBanner, setShowBanner] = useState(false);
  const [cachedAppName, setCachedAppName] = useState<string | null>(null);

  // ① マニフェスト名の変更検知ロジック（前回キャッシュと最新を比較）
  useEffect(() => {
    (async () => {
      // キャッシュから前回 name を取得
      const prevName = await getCachedAppName();

      // ネットワークから最新の manifest.json を取得しパース
      const newText = await fetch('/manifest.json').then((r) => r.text());
      let newName: string | null = null;
      try {
        const newJson = JSON.parse(newText);
        newName = typeof newJson.name === 'string' ? newJson.name : null;
      } catch {
        newName = null;
      }

      // 前回と今回で name が違えばバナー表示
      if (prevName !== null && newName !== null && prevName !== newName) {
        setShowBanner(true);
      }

      // 次回比較用にキャッシュを更新
      if (newText) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(
          '/manifest.json',
          new Response(newText, {
            headers: { 'Content-Type': 'application/json' },
          })
        );
      }

      // キャッシュされている最新の name を state にセット
      setCachedAppName(newName);
    })();
  }, []);

  // ② PWA 用 <link rel="manifest"> の設定
  useEffect(() => {
    (async () => {
      const url = await getManifestURL('アプリ名');
      const link: HTMLLinkElement =
        document.querySelector('link[rel="manifest"]') ||
        (() => {
          const el = document.createElement('link');
          el.setAttribute('rel', 'manifest');
          document.head.appendChild(el);
          return el;
        })();
      link.setAttribute('href', url);
    })();
  }, []);

  return (
    <div className='App'>
      {showBanner && (
        <div className='update-banner'>
          ⚠️
          アプリ名が変更されました。最新のバージョンを再インストールしてください。
        </div>
      )}

      {/* キャッシュにある現在の appName を表示 */}
      <div className='cached-app-name'>
        現在キャッシュされているアプリ名:{' '}
        {cachedAppName ?? '（キャッシュなし）'}
      </div>

      {/* 以下、アプリ本体の UI */}
      <h1>My PWA</h1>
      {/* … */}
    </div>
  );
}

export default App;
