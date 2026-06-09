import { Router } from 'express';
import * as XLSX from 'xlsx';
import rateLimit from 'express-rate-limit';
import OpenAI from 'openai';

// Rate limiter for /api/chat
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per `window`
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Create the API router with all endpoints.
 * @param {object} deps - Dependencies injected into the router.
 * @param {import('better-sqlite3').Database} deps.db - SQLite database instance.
 * @param {import('multer').Multer} deps.upload - Multer upload middleware.
 * @returns {Router} - Express Router.
 */
export function createRouter({ db, upload }) {
  const router = Router();

  // Initialize OpenAI SDK here so dotenv.config() has already populated process.env
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-dev',
  });

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
        INSERT INTO Spreadsheets (sessionId, filename, uploadDate, data)
        VALUES (?, ?, ?, ?)
      `);

      const uploadDate = new Date().toISOString();
      const result = stmt.run(req.sessionID, originalname, uploadDate, stringifiedData);

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
  router.get('/files', (req, res) => {
    try {
      const rows = db.prepare(`
        SELECT id, filename, uploadDate
        FROM Spreadsheets
        WHERE sessionId = ?
        ORDER BY id DESC
      `).all(req.sessionID);

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
      const file = db.prepare('SELECT data FROM Spreadsheets WHERE id = ? AND sessionId = ?').get(req.params.id, req.sessionID);

      if (!file) {
        return res.status(404).json({ error: 'File not found or access denied' });
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
      const file = db.prepare('SELECT id FROM Spreadsheets WHERE id = ? AND sessionId = ?').get(req.params.id, req.sessionID);

      if (!file) {
        return res.status(404).json({ error: 'File not found or access denied' });
      }

      db.prepare('DELETE FROM Spreadsheets WHERE id = ?').run(req.params.id);
      console.log(`[File] Deleted file ID: ${req.params.id}`);

      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      console.error('[File] Delete error:', error.message);
      res.status(500).json({ error: 'Failed to delete file' });
    }
  });

  // ─── OpenAI Chat Integration ───────────────────────────
  router.post('/chat', chatLimiter, async (req, res) => {
    try {
      const { fileId, message } = req.body;
      
      if (!fileId || !message) {
        return res.status(400).json({ error: 'fileId and message are required' });
      }

      console.log(`[Chat] Processing message for file ID: ${fileId} from session: ${req.sessionID}`);
      
      // Fetch data and strictly verify sessionId
      const file = db.prepare('SELECT data FROM Spreadsheets WHERE id = ? AND sessionId = ?').get(fileId, req.sessionID);
      
      if (!file) {
        return res.status(404).json({ error: 'File not found or access denied' });
      }

      // Parse and truncate data heavily to save tokens
      let parsedData = JSON.parse(file.data);
      let dataSnippet = parsedData;
      let truncatedNote = '';
      
      if (parsedData.length > 50) {
        dataSnippet = parsedData.slice(0, 50);
        truncatedNote = '\\n\\n[NOTE: Data truncated to first 50 rows]';
      }

      const stringifiedSnippet = JSON.stringify(dataSnippet) + truncatedNote;

      const systemPrompt = `You are codexCEL's Business Intelligence Assistant. Here is the user's data (first 50 rows max): ${stringifiedSnippet}. Answer their question concisely. If they ask for a chart, graph, or visual comparison, you MUST include a JSON code block in your markdown response formatted EXACTLY like this for Recharts:
\`\`\`json
{
  "chartType": "bar", // or "line", "pie"
  "data": [{"name": "Jan", "value": 400}, {"name": "Feb", "value": 300}]
}
\`\`\``;

      // Send to OpenAI using the new Responses API
      const completion = await openai.responses.create({
        model: 'gpt-5.5',
        input: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        // max_tokens and temperature might still be supported, we will leave them or remove them if they cause issues.
        // The docs didn't explicitly show them in the simple snippet, but they are standard.
      });

      const aiResponse = completion.output_text;
      res.json({ response: aiResponse });

    } catch (error) {
      console.error('[Chat] OpenAI integration error:', error.message);
      res.status(500).json({ error: 'Failed to process chat response' });
    }
  });

  return router;
}
