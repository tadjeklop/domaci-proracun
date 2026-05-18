import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: { port: 5174 },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        cleanupOutdatedCaches: true,
      },
      manifest: {
        name: 'Domači proračun',
        short_name: 'Proračun',
        description: 'Zasebni upravljalnik družinskega proračuna',
        theme_color: '#2563eb',
        background_color: '#f8f7f4',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        lang: 'sl',
        icons: [
          { src: '/pwa-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/pwa-512.svg', sizes: '512x512', type: 'image/svg+xml' },
          { src: '/pwa-maskable.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
