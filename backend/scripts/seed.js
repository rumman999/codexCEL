import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DB_PATH = path.resolve(ROOT_DIR, './data/database.sqlite');

console.log('[Seed] Starting database seed...');

// Ensure directory exists
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Open DB
const db = new Database(DB_PATH);

// Ensure table exists
db.exec(`
  CREATE TABLE IF NOT EXISTS Spreadsheets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    uploadDate TEXT NOT NULL,
    data TEXT NOT NULL
  );
`);

const dummyData = [
  ['Month', 'Revenue', 'Expenses', 'Profit'],
  ['January', 50000, 30000, 20000],
  ['February', 55000, 32000, 23000],
  ['March', 60000, 31000, 29000],
  ['April', 58000, 35000, 23000],
  ['May', 62000, 33000, 29000],
  ['June', 65000, 34000, 31000]
];

const stringifiedData = JSON.stringify(dummyData);
const uploadDate = new Date().toISOString();
const filename = 'Q1-Q2_Financials.xlsx';

try {
  const stmt = db.prepare(`
    INSERT INTO Spreadsheets (filename, uploadDate, data)
    VALUES (?, ?, ?)
  `);

  const result = stmt.run(filename, uploadDate, stringifiedData);
  console.log(`[Seed] Success! Inserted dummy financial data with ID: ${result.lastInsertRowid}`);
} catch (error) {
  console.error('[Seed] Error inserting data:', error.message);
} finally {
  db.close();
  console.log('[Seed] Finished.');
}
