import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { env } from '../config/index.js';
import { logger } from '../logger.js';
import * as schema from './schema.js';

const sqlite = new Database(env.DATABASE_URL);

sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

const db = drizzle(sqlite, { schema });

logger.debug(`Conexion SQLite abierta en ${env.DATABASE_URL}`);

export { db, sqlite };

export default db;
