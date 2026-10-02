import { defineConfig } from 'drizzle-kit';
import { resolveDatabaseUrl } from './src/db/database-url.js';

/**
 * La ruta de la base sale de `resolveDatabaseUrl`, el mismo sitio que usa la aplicación
 * (`client.ts`). Antes cada uno tenía la suya: la config tenía `'./osito.db'` hardcodeado
 * y la app leía `env.DATABASE_URL`. Si divergían, las migraciones y la aplicación
 * apuntaban a bases distintas sin ningún error, y el síntoma era "tabla inexistente".
 *
 * No se importa `config/env.ts` a propósito: `db:generate` no debería depender de que
 * existan `MAILGUN_API_KEY` o `TELEGRAM_BOT_TOKEN`. Ver `src/db/database-url.ts`.
 */
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dbCredentials: {
    url: resolveDatabaseUrl(),
  },
  strict: true,
  verbose: true,
});
