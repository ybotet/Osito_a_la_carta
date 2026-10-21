import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const API_TARGET = 'http://localhost:3000';

/**
 * Raíz del alias `@/`, que es el que usan los componentes de shadcn/ui al venir del registro.
 *
 * **Tiene que estar declarado aquí y no solo en `tsconfig.app.json`** porque Vite no lee el
 * tsconfig: con el `paths` puesto en TypeScript pero sin este `resolve.alias`, el typecheck pasa
 * en verde y es el navegador el que falla con un import que no se encuentra. Es el mismo motivo
 * por el que el `paths` y esta línea van juntos.
 *
 * Se usa `import.meta.url` y no `__dirname` porque `client/package.json` es `"type": "module"`:
 * `__dirname` no existe en un módulo ESM.
 */
const SRC_ROOT = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'generateSW',
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'images/osito.jpg',
      ],
      workbox: {
         globPatterns: ['**/*.{js,css,html,svg,png,ico,jpg}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      manifest: {
        name: 'Osito a la carta',
        short_name: 'Osito',
        description: 'Pedidos de comida con envío a domicilio',
        theme_color: '#f59e0b',
        background_color: '#fff7ed',
        display: 'standalone',
        orientation: 'portrait',
        categories: ['restaurant', 'food', 'shopping'],
         icons: [
           {
             src: '/images/osito.jpg',
             sizes: '192x192',
             type: 'image/jpeg',
             purpose: 'any',
           },
           {
             src: '/images/osito.jpg',
             sizes: '192x192',
             type: 'image/jpeg',
             purpose: 'maskable',
           },
           {
             src: '/images/osito.jpg',
             sizes: '512x512',
             type: 'image/jpeg',
             purpose: 'any',
           },
           {
             src: '/images/osito.jpg',
             sizes: '512x512',
             type: 'image/jpeg',
             purpose: 'maskable',
           },
           {
             src: '/icons/osito-icon-192.png',
             sizes: '192x192',
             type: 'image/png',
             purpose: 'any',
           },
           {
             src: '/icons/osito-icon-192.png',
             sizes: '192x192',
             type: 'image/png',
             purpose: 'maskable',
           },
           {
             src: '/icons/osito-icon-512.png',
             sizes: '512x512',
             type: 'image/png',
             purpose: 'any',
           },
           {
             src: '/icons/osito-icon-512.png',
             sizes: '512x512',
             type: 'image/png',
             purpose: 'maskable',
           },
         ],
      },
      devOptions: {
        enabled: false,
      },
      injectRegister: 'auto',
    }),
  ],
  resolve: {
    alias: {
      '@': SRC_ROOT,
    },
  },
  server: {
    strictPort: true,
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
      },
    },
  },
});
