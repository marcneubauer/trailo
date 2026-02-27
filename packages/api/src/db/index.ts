import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import { config } from '../config.js';

export function createDb(url?: string) {
  const sqlite = new Database(url ?? config.databaseUrl);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  return drizzle(sqlite, { schema });
}

export type Database = ReturnType<typeof createDb>;
