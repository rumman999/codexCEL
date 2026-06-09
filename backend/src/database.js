import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

/**
 * Initialize SQLite database with schema.
 * Creates the data directory and database file if they don't exist.
 * @param {string} dbPath - Path to the SQLite database file.
 * @returns {Database} - better-sqlite3 Database instance.
 */
export function initDatabase(dbPath) {
  // Ensure the directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`[DB] Created data directory: ${dir}`);
  }

  const db = new Database(dbPath);

  // Enable WAL mode for better concurrent read performance
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Drop old tables if they exist (to ensure a clean state for the new schema)
  try {
    db.exec('DROP TABLE IF EXISTS analyses;');
    db.exec('DROP TABLE IF EXISTS files;');
  } catch (err) {
    console.error('[DB] Error dropping old tables:', err.message);
  }

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS Spreadsheets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      uploadDate TEXT NOT NULL,
      data TEXT NOT NULL
    );
  `);

  console.log('[DB] Database initialized at:', dbPath);
  return db;
}
