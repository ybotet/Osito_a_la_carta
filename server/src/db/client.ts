import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { logger } from '../logger.js';
import { resolveDatabaseUrl } from './database-url.js';
import * as schema from './schema.js';

// La ruta sale de `resolveDatabaseUrl`, el mismo resolvedor que usa `drizzle.config.ts`.
// Antes esta línea leía `env.DATABASE_URL` y la config de drizzle tenía su propia ruta
// hardcodeada: dos fuentes de verdad que podían divergir sin dar error.
const databaseUrl = resolveDatabaseUrl();

const sqlite = new Database(databaseUrl);

sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

const db = drizzle(sqlite, { schema });

logger.debug(`Conexion SQLite abierta en ${databaseUrl}`);

export { db, sqlite };

export default db;
