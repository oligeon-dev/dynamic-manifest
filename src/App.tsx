// src/App.tsx
import { useEffect, useState } from 'react';
import './App.css';

const CACHE_NAME = 'my-app-cache';

// キャッシュから旧 manifest を取って、新 manifest と name フィールドだけ比較
async function isAppNameChanged(): Promise<boolean> {
  const cache = await caches.open(CACHE_NAME);
  const cachedResp = await cache.match('/manifest.json');
  if (!cachedResp) {
    // 初回インストールやキャッシュ未登録時は「変更なし」とみなす
    return false;
  }

  // キャッシュ内とネットワーク上の manifest を同時にテキスト取得
  const [oldText, newText] = await Promise.all([
    cachedResp.text(),
    fetch('/manifest.json').then((r) => r.text()),
  ]);

  try {
    const oldJson = JSON.parse(oldText);
    const newJson = JSON.parse(newText);
    // name フィールドだけを見る
    return oldJson.name !== newJson.name;
  } catch {
    // パース失敗時は安全のため非表示
    return false;
  }
}

// キャッシュに最新 manifest.json を登録
async function cacheManifest(manifestString: string) {
  const cache = await caches.open(CACHE_NAME);
  const response = new Response(manifestString, {
    headers: { 'Content-Type': 'application/json' },
  });
  await cache.put('/manifest.json', response);
}

// 実際の manifest.json を fetch → キャッシュ登録 → Blob URL 生成
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

  const manifestString = JSON.stringify(manifest);
  // キャッシュに登録しておく（次回比較のため）
  await cacheManifest(manifestString);

  const blob = new Blob([manifestString], { type: 'application/json' });
  return URL.createObjectURL(blob);
}

function App() {
  const [showBanner, setShowBanner] = useState(false);

  // 1) appName が変わっていればバナーを表示し、
  // 2) バナー表示タイミングで最新 manifest をキャッシュ更新
  useEffect(() => {
    (async () => {
      try {
        const changed = await isAppNameChanged();
        if (changed) {
          setShowBanner(true);

          // 「検知したら」キャッシュも最新化しておく
          const latestText = await fetch('/manifest.json').then((r) =>
            r.text()
          );
          await cacheManifest(latestText);
        }
      } catch (err) {
        console.error('[appName-checker]', err);
      }
    })();
  }, []);

  // manifest リンクを生成して設定
  useEffect(() => {
    (async () => {
      try {
        const url = await getManifestURL('アプリ名2');
        const link: HTMLLinkElement =
          document.querySelector('link[rel="manifest"]') ||
          (() => {
            const el = document.createElement('link');
            el.setAttribute('rel', 'manifest');
            document.head.appendChild(el);
            return el;
          })();
        link.setAttribute('href', url);
      } catch (err) {
        console.error('[App] manifest setup failed', err);
      }
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

      {/* 以下、アプリ本体の UI */}
      <h1>My PWA</h1>
      {/* … */}
    </div>
  );
}

export default App;
