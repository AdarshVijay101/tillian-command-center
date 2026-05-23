import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'server', 'data', 'tillian.db');

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

export const getDbStatus = () => {
  return {
    dbExists: true,
    dbPath: DB_PATH
  };
};
