/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      // The app asks before switching to a new version (src/ui/UpdateBanner.tsx), which also registers the worker.
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
      // Illustrations are precached so the how-to works offline at the gym.
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,jpg,svg}'],
        // The largest file (a muscle chart or animation strip) is well under this; the default 2 MB is fine
        // today, but a bigger image must fail the build rather than silently miss the offline cache.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // Old precaches from earlier versions are removed, so updates do not pile up on the phone.
        cleanupOutdatedCaches: true,
        // The label reader's engine (worker script and WebAssembly core) comes from jsDelivr the first time a label
        // is read, at fixed versions; kept here so reading works offline afterwards. The Polish model itself is
        // cached by Tesseract in IndexedDB. Product data from Open Food Facts is never cached.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/npm\/tesseract\.js(-core)?@/,
            handler: 'CacheFirst',
            options: { cacheName: 'tesseract-engine', expiration: { maxEntries: 10 }, cacheableResponse: { statuses: [0, 200] } },
          },
        ],
      },
      manifest: {
        name: 'Trening',
        short_name: 'Trening',
        description: 'Dziennik treningu siłowego i diety',
        lang: 'pl',
        display: 'standalone',
        id: './',
        start_url: '.',
        scope: '.',
        orientation: 'portrait',
        categories: ['health', 'fitness', 'sports', 'food'],
        background_color: '#0e0e0e',
        theme_color: '#0e0e0e',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: { environment: 'node' },
});
