import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      workbox: {
        cacheId: 'my-app-cache', // ← これでキャッシュID（名前）を上書き
        globPatterns: ['**/*.{js,css,html,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/your-api-domain\/.*$/,
            handler: 'NetworkFirst',
            options: { cacheName: 'my-app-cache' },
          },
        ],
      },
      // その他のオプション…
    }),
  ],
});
