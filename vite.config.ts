import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      workbox: {
        cacheId: 'my-app-cache', // ← これでキャッシュID（名前）を上書き
        runtimeCaching: [
          /* … */
        ],
      },
      // その他のオプション…
    }),
  ],
});
