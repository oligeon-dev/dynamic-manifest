// src/App.tsx
import { useEffect, useState } from 'react';

const INSTALLED_KEY = 'installedAppName';
const DYNAMIC_APP_NAME = 'アプリ名X'; // ここはビルド時／サーバー想定の値に置き換えてください

export default function App() {
  const [showBanner, setShowBanner] = useState(false);
  const [installedName, setInstalledName] = useState<string | null>(null);

  // インストール済みの名前を localStorage から読み込む
  useEffect(() => {
    const prev = localStorage.getItem(INSTALLED_KEY);
    setInstalledName(prev);
    // もし前回保存があって、かつ名前が変わっていればバナー表示
    if (prev !== null && prev !== DYNAMIC_APP_NAME) {
      setShowBanner(true);
    }
  }, []);

  // iOS Safari のスタンドアロン起動 or Chrome の appinstalled を検出して保存
  useEffect(() => {
    const markInstalled = () => {
      localStorage.setItem(INSTALLED_KEY, DYNAMIC_APP_NAME);
      setInstalledName(DYNAMIC_APP_NAME);
      setShowBanner(false);
    };

    // Android Chrome, Edge, etc.
    window.addEventListener('appinstalled', markInstalled);

    // iOS Safari の standalone 起動検出
    const checkStandalone = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        // iOS <13
        (navigator as any).standalone === true;
      if (isStandalone) {
        markInstalled();
      }
    };
    window.addEventListener('load', checkStandalone);
    // ナビゲーション時も (例えば戻るボタン)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkStandalone();
      }
    });

    return () => {
      window.removeEventListener('appinstalled', markInstalled);
      window.removeEventListener('load', checkStandalone);
      document.removeEventListener('visibilitychange', checkStandalone);
    };
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
  };

  return (
    <div>
      {showBanner && (
        <div className='update-banner'>
          ⚠️ アプリ名が変更されました。再インストールしてください。
          <button onClick={handleDismiss}>閉じる</button>
        </div>
      )}
      <div>
        インストール済みのアプリ名: {installedName ?? '（未インストール）'}
      </div>
      <div>これからインストールするアプリ名: {DYNAMIC_APP_NAME}</div>
      {/* …他の UI… */}
    </div>
  );
}
