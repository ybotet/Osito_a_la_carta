import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

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
  plugins: [react(), tailwindcss()],
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
