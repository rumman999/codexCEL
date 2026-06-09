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

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original_name TEXT NOT NULL,
      stored_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT,
      row_count INTEGER DEFAULT 0,
      column_count INTEGER DEFAULT 0,
      sheet_names TEXT,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'uploaded' CHECK(status IN ('uploaded', 'processing', 'analyzed', 'error'))
    );

    CREATE TABLE IF NOT EXISTS analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_id INTEGER NOT NULL,
      analysis_type TEXT NOT NULL,
      result TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
    );
  `);

  console.log('[DB] Database initialized at:', dbPath);
  return db;
}
