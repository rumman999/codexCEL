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

      const { originalname, filename, path: filePath, size, mimetype } = req.file;
      console.log(`[Upload] Processing file: ${originalname} (${(size / 1024).toFixed(1)} KB)`);

      // Parse the Excel/CSV file
      const workbook = XLSX.readFile(filePath);
      const sheetNames = workbook.SheetNames;
      const firstSheet = workbook.Sheets[sheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

      const rowCount = jsonData.length;
      const columnCount = jsonData[0] ? jsonData[0].length : 0;

      // Store metadata in SQLite
      const stmt = db.prepare(`
        INSERT INTO files (original_name, stored_name, file_path, file_size, mime_type, row_count, column_count, sheet_names)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        originalname,
        filename,
        filePath,
        size,
        mimetype,
        rowCount,
        columnCount,
        JSON.stringify(sheetNames)
      );

      console.log(`[Upload] File stored with ID: ${result.lastInsertRowid}`);

      res.status(201).json({
        id: result.lastInsertRowid,
        originalName: originalname,
        rowCount,
        columnCount,
        sheetNames,
        uploadedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[Upload] Error:', error.message);
      res.status(500).json({ error: 'Failed to process file', details: error.message });
    }
  });

  // ─── List Files ───────────────────────────────────────
  router.get('/files', (_req, res) => {
    try {
      const files = db.prepare(`
        SELECT id, original_name, file_size, row_count, column_count, sheet_names, uploaded_at, status
        FROM files
        ORDER BY uploaded_at DESC
      `).all();

      res.json({ files });
    } catch (error) {
      console.error('[Files] Error:', error.message);
      res.status(500).json({ error: 'Failed to retrieve files' });
    }
  });

  // ─── Get Single File ─────────────────────────────────
  router.get('/files/:id', (req, res) => {
    try {
      const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id);

      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      res.json({ file });
    } catch (error) {
      console.error('[File] Error:', error.message);
      res.status(500).json({ error: 'Failed to retrieve file' });
    }
  });

  // ─── Delete File ──────────────────────────────────────
  router.delete('/files/:id', (req, res) => {
    try {
      const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id);

      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Delete from DB (cascades to analyses)
      db.prepare('DELETE FROM files WHERE id = ?').run(req.params.id);
      console.log(`[File] Deleted file ID: ${req.params.id}`);

      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      console.error('[File] Delete error:', error.message);
      res.status(500).json({ error: 'Failed to delete file' });
    }
  });

  return router;
}
