import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Rutas del proyecto que se resuelven **subiendo en el árbol**, nunca contando niveles.
 *
 * Antes de T-044 el código hacía `resolve(moduleDir, '../../..')`, y funcionaba solo porque
 * todo estaba a la misma distancia de la raíz: en desarrollo (`server/src/...`) y en el
 * build anterior (`server/dist/...`) eran tres niveles los dos. T-044 movió el `rootDir` del
 * servidor a la raíz del repositorio para que el backend pudiera importar
 * `shared/schemas.ts`, y el compilado pasó a `server/dist/server/src/...`: cinco niveles. Con
 * el `resolve` fijo, el `.env` dejó de encontrarse (el servidor moría con "Copia
 * .env.example a .env"), `package.json` dejó de resolverse y el módulo de health no arrancaba.
 *
 * Un `resolve` con niveles fijos ata el arranque a la profundidad del fichero, que es
 * exactamente lo que cambia cuando se mueve el `rootDir` o se anida un directorio más. Buscar
 * el fichero "hacia arriba" no depende de nada de eso.
 */

/** Directorio del propio módulo, que es desde donde se sube. */
const moduleDir = (): string => dirname(fileURLToPath(import.meta.url));

/**
 * Primer `fileName` que aparece al subir desde `startDir`, o `undefined` si se llega a la
 * raíz del sistema de ficheros sin encontrarlo.
 */
const findUpwards = (
  startDir: string,
  fileName: string,
): string | undefined => {
  let current = startDir;

  for (;;) {
    const candidate = resolve(current, fileName);

    if (existsSync(candidate)) {
      return candidate;
    }

    const parent = dirname(current);

    if (parent === current) {
      return undefined;
    }

    current = parent;
  }
};

/**
 * `.env` de la raíz del repositorio.
 *
 * Es el primer `.env` hacia arriba porque la raíz del monorepo es el único directorio que lo
 * tiene: `server/` no tiene ninguno y así el fichero se busca una sola vez, tanto en
 * desarrollo como en el build. Si no existe ninguno, se devuelve `undefined` y las variables
 * tienen que venir del entorno del proceso, que es lo que pasaba antes también.
 */
const findEnvFile = (): string | undefined => findUpwards(moduleDir(), '.env');

/**
 * `package.json` del workspace `@osito/server`, que es de donde sale la versión que devuelve
 * `GET /api/health`.
 *
 * Se busca hacia arriba desde este módulo y no desde quien llama, para que la respuesta no
 * dependa de quién pregunta: en los dos layouts el primer `package.json` que aparece es el
 * del workspace del servidor.
 */
const findServerPackageJson = (): string | undefined =>
  findUpwards(moduleDir(), 'package.json');

/**
 * Carga el `.env` de la raíz del repositorio en `process.env`, si existe.
 *
 * **Vive en un solo sitio porque lo necesitaban dos ficheros** que además tenían la misma
 * copia: `config/env.ts` (que valida y mata el proceso si falta algo) y `db/database-url.ts`
 * (que solo lee `DATABASE_URL` para que `drizzle.config.ts` no dependa de `env.ts`). Copiarlo
 * era la forma de que el `.env` se encontrara en un sitio y no en el otro según la
 * profundidad del fichero que se importara primero.
 */
const loadEnvFile = (): void => {
  const envPath = findEnvFile();

  if (envPath !== undefined) {
    process.loadEnvFile(envPath);
  }
};

export { findEnvFile, findServerPackageJson, loadEnvFile };
