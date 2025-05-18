// src/App.tsx
import { useEffect, useState } from 'react';
import './App.css';

const CACHE_NAME = 'my-app-cache';

// ① 比較＆変更検知 ⇒ 変更があればキャッシュを「新しい manifest.json のテキスト」で更新する
async function isAppNameChanged(): Promise<boolean> {
  const cache = await caches.open(CACHE_NAME);
  const cachedResp = await cache.match('/manifest.json');

  // 初回キャッシュ未登録時は「変更なし」で扱い（バナーは出さない）
  if (!cachedResp) {
    return false;
  }

  // キャッシュ内 vs ネットワーク のテキストを取得
  const [oldText, newText] = await Promise.all([
    cachedResp.text(),
    fetch('/manifest.json').then((r) => r.text()),
  ]);

  // JSON パースして name フィールドのみ比較
  let changed = false;
  try {
    const oldJson = JSON.parse(oldText);
    const newJson = JSON.parse(newText);
    changed = oldJson.name !== newJson.name;
  } catch {
    // JSON パース失敗は無視（バナー出さない）
    changed = false;
  }

  if (changed) {
    // 変更検知後にだけキャッシュを入れ替える
    const response = new Response(newText, {
      headers: { 'Content-Type': 'application/json' },
    });
    await cache.put('/manifest.json', response);
  }

  return changed;
}

// ② Blob URL 生成だけを行う関数
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
  const blob = new Blob([manifestString], { type: 'application/json' });
  return URL.createObjectURL(blob);
}

function App() {
  const [showBanner, setShowBanner] = useState(false);

  // マウント時に「名前が変わっていれば」バナー表示
  useEffect(() => {
    (async () => {
      try {
        const changed = await isAppNameChanged();
        if (changed) {
          setShowBanner(true);
        }
      } catch (err) {
        console.error('[appName-checker]', err);
      }
    })();
  }, []);

  // マウント時に Blob URL を生成して <link> にセット
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
      {/* 以下、アプリの UI */}
      <h1>My PWA</h1>
      {/* … */}
    </div>
  );
}

export default App;
