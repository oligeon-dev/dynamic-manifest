// src/App.tsx
import { useEffect, useState } from 'react';
import './App.css';

const CACHE_NAME = 'my-app-cache';
const MANIFEST_CACHE_KEY = '/manifest.json';

// キャッシュ内の name を取得
async function getCachedAppName(): Promise<string | null> {
  const cache = await caches.open(CACHE_NAME);
  const resp = await cache.match(MANIFEST_CACHE_KEY);
  if (!resp) return null;
  const { name } = await resp.json();
  return typeof name === 'string' ? name : null;
}

// 動的 manifest をキャッシュに登録
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
  const str = JSON.stringify(manifest);
  const resp = new Response(str, {
    headers: { 'Content-Type': 'application/json' },
  });
  const cache = await caches.open(CACHE_NAME);
  await cache.put(MANIFEST_CACHE_KEY, resp);
}

// Blob URL を生成
function makeBlobURL(appName: string) {
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
  return URL.createObjectURL(
    new Blob([JSON.stringify(manifest)], { type: 'application/json' })
  );
}

function App() {
  // 動的にフェッチ／計算してくるアプリ名
  const [dynamicAppName, setDynamicAppName] = useState<string | null>(null);

  // キャッシュされたアプリ名
  const [cachedAppName, setCachedAppName] = useState<string | null>(null);

  // バナー表示フラグ
  const [showBanner, setShowBanner] = useState(false);

  // 1) 動的 appName を取得（例：APIからフェッチ）
  useEffect(() => {
    (async () => {
      // --- ここをあなたのロジックに置き換えてください ---
      // 例：const data = await api.getAppSettings();
      //     const fetchedName = data.app_name;
      const fetchedName = await Promise.resolve('サーバーから取得したアプリ名');
      // -----------------------------------------------
      setDynamicAppName(fetchedName);
    })();
  }, []);

  // 2) dynamicAppName が決まったら、キャッシュ登録と比較を行う
  useEffect(() => {
    if (dynamicAppName === null) return;

    (async () => {
      // 読み出し：過去キャッシュ
      const prev = await getCachedAppName();
      setCachedAppName(prev);

      // 書き込み：動的 manifest をキャッシュに登録
      await cacheDynamicManifest(dynamicAppName);

      // 比較してバナー制御
      if (prev !== null && prev !== dynamicAppName) {
        setShowBanner(true);
      }
    })();
  }, [dynamicAppName]);

  // 3) manifest リンクを Blob URL でセット（PWA インストール用）
  useEffect(() => {
    if (dynamicAppName === null) return;

    const link: HTMLLinkElement =
      document.querySelector('link[rel="manifest"]') ||
      (() => {
        const el = document.createElement('link');
        el.setAttribute('rel', 'manifest');
        document.head.appendChild(el);
        return el;
      })();
    link.setAttribute('href', makeBlobURL(dynamicAppName));
  }, [dynamicAppName]);

  return (
    <div className='App'>
      {showBanner && (
        <div className='update-banner'>
          ⚠️
          アプリ名が変更されました。最新バージョンを再インストールしてください。
        </div>
      )}
      <div>過去のキャッシュ名: {cachedAppName ?? '（キャッシュなし）'}</div>
      <div>これからインストールする名前: {dynamicAppName ?? '…取得中…'}</div>
      {/* 他の UI */}
    </div>
  );
}

export default App;
