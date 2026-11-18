/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
      // Illustrations are precached so the how-to works offline at the gym.
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,jpg}'],
        // The largest file (a muscle chart or animation strip) is well under this; the default 2 MB is fine
        // today, but a bigger image must fail the build rather than silently miss the offline cache.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // Old precaches from earlier versions are removed, so updates do not pile up on the phone.
        cleanupOutdatedCaches: true,
      },
      manifest: {
        name: 'Trening',
        short_name: 'Trening',
        description: 'Dziennik treningu siłowego',
        lang: 'pl',
        display: 'standalone',
        id: './',
        start_url: '.',
        scope: '.',
        orientation: 'portrait',
        categories: ['health', 'fitness', 'sports'],
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
