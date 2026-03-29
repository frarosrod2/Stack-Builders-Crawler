import Database, { Database as IDatabase } from "better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DB_PATH = join(__dirname, "../data/crawler.db");
const DB_PATH = process.env["DB_PATH"] ?? DEFAULT_DB_PATH;

let _db: IDatabase | null = null;

export const getDb = (): IDatabase => {
  if (!_db) {
    const dir = dirname(DB_PATH);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    runMigrations(_db);
  }
  return _db;
};


const runMigrations = (db: Database.Database): void => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usage_logs (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp         TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      filter_applied    TEXT   DEFAULT NULL,
      items_found       INTEGER NOT NULL DEFAULT 0,
      execution_time_ms INTEGER NOT NULL DEFAULT 0,
      user_agent    TEXT   DEFAULT NULL,
      client_ip    TEXT   DEFAULT NULL
    );
  `);
};