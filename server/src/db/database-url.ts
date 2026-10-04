import { loadEnvFile } from '../shared/project-paths.js';

const DEFAULT_DATABASE_URL = './osito.db';

/**
 * Resuelve la ruta del fichero SQLite **sin** validar el resto de variables de entorno.
 *
 * Existe para que `drizzle.config.ts` y `client.ts` lean la ruta del mismo sitio. Importar
 * `config/env.ts` desde la config de drizzle-kit se comprobó que funciona, pero rompe:
 * `env.ts` hace `process.exit(1)` si falta cualquier variable, así que `db:generate`
 * moría pidiendo `MAILGUN_API_KEY` o `TELEGRAM_BOT_TOKEN` para generar una migración que
 * no tiene nada que ver con el correo. Aquí solo se lee `DATABASE_URL`, y si no está se
 * usa el default en vez de morir.
 *
 * El `loadEnvFile` es el de `shared/env-file.ts`, el mismo que usa `config/env.ts`: las dos
 * copias que había se buscaban el `.env` contando niveles, y con el `rootDir` del servidor
 * en la raíz del repositorio (T-044) solo una de las dos encontraba el fichero.
 */
const resolveDatabaseUrl = (): string => {
  loadEnvFile();

  return process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
};

export { DEFAULT_DATABASE_URL, resolveDatabaseUrl };
