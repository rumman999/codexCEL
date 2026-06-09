import { Router } from 'express';
import * as XLSX from 'xlsx';

/**
 * Create the API router with all endpoints.
 * @param {object} deps - Dependencies injected into the router.
 * @param {import('better-sqlite3').Database} deps.db - SQLite database instance.
 * @param {import('multer').Multer} deps.upload - Multer upload middleware.
 * @returns {Router} - Express Router.
 */
export function createRouter({ db, upload }) {
  const router = Router();

  // ─── Health Check ─────────────────────────────────────
  router.get('/health', (_req, res) => {
    try {
      // Test DB connection
      db.prepare('SELECT 1').get();
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    } catch (error) {
      console.error('[Health] Database check failed:', error.message);
      res.status(500).json({ status: 'error', message: 'Database unavailable' });
    }
  });

  // ─── Upload File ──────────────────────────────────────
  router.post('/upload', upload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const { originalname, buffer, size } = req.file;
      console.log(`[Upload] Processing file: ${originalname} (${(size / 1024).toFixed(1)} KB)`);

      // Parse the Excel/CSV file from buffer
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetNames = workbook.SheetNames;
      const firstSheet = workbook.Sheets[sheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

      const rowCount = jsonData.length;
      const columnCount = jsonData[0] ? jsonData[0].length : 0;
      const stringifiedData = JSON.stringify(jsonData);

      // Store metadata and data in SQLite Spreadsheets table
      const stmt = db.prepare(`
        INSERT INTO Spreadsheets (filename, uploadDate, data)
        VALUES (?, ?, ?)
      `);

      const uploadDate = new Date().toISOString();
      const result = stmt.run(originalname, uploadDate, stringifiedData);

      console.log(`[Upload] File stored with ID: ${result.lastInsertRowid}`);

      res.status(201).json({
        id: result.lastInsertRowid,
        originalName: originalname,
        rowCount,
        columnCount
      });
    } catch (error) {
      console.error('[Upload] Error:', error.message);
      res.status(500).json({ error: 'Failed to process file', details: error.message });
    }
  });

  // ─── List Files ───────────────────────────────────────
  router.get('/files', (_req, res) => {
    try {
      const rows = db.prepare(`
        SELECT id, filename, uploadDate
        FROM Spreadsheets
        ORDER BY id DESC
      `).all();

      // Map to format expected by frontend sidebar
      const files = rows.map(r => ({
        id: r.id,
        original_name: r.filename,
        uploaded_at: r.uploadDate,
        // Provide defaults for stats since they aren't stored in this schema
        row_count: '?',
        file_size: null
      }));

      res.json({ files });
    } catch (error) {
      console.error('[Files] Error:', error.message);
      res.status(500).json({ error: 'Failed to retrieve files' });
    }
  });

  // ─── Get Single File Data ─────────────────────────────────
  router.get('/data/:id', (req, res) => {
    try {
      console.log(`[Data] Fetching data for file ID: ${req.params.id}`);
      const file = db.prepare('SELECT data FROM Spreadsheets WHERE id = ?').get(req.params.id);

      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Parse JSON array string back into object
      const parsedData = JSON.parse(file.data);
      res.json({ rows: parsedData });
    } catch (error) {
      console.error('[Data] Error:', error.message);
      res.status(500).json({ error: 'Failed to retrieve file data' });
    }
  });

  // ─── Delete File ──────────────────────────────────────
  router.delete('/files/:id', (req, res) => {
    try {
      const file = db.prepare('SELECT id FROM Spreadsheets WHERE id = ?').get(req.params.id);

      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      db.prepare('DELETE FROM Spreadsheets WHERE id = ?').run(req.params.id);
      console.log(`[File] Deleted file ID: ${req.params.id}`);

      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      console.error('[File] Delete error:', error.message);
      res.status(500).json({ error: 'Failed to delete file' });
    }
  });

  return router;
}
