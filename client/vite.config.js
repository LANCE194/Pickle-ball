import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
// The API runs on :4000 in development. Same-origin proxy keeps tokens in headers and avoids CORS surprises.
export default defineConfig({
  plugins: [react(), VitePWA({ registerType: 'autoUpdate', manifest: { name: 'DinkNest', short_name: 'DinkNest', description: 'Book. Play. Compete.', theme_color: '#0B6E4F', background_color: '#F6F8F5', display: 'standalone', start_url: '/', icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }] }, workbox: { navigateFallbackDenylist: [/^\/api/, /^\/ws/] } })],
  server: { port: 5173, proxy: { '/api': 'http://localhost:4000', '/ws': { target: 'ws://localhost:4000', ws: true } } },
  build: { sourcemap: false },
});
