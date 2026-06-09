import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './database.js';
import { createUploadMiddleware } from './upload.js';
import { createRouter } from './routes.js';

import session from 'express-session';

// ─── Config ─────────────────────────────────────────────
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const PORT = process.env.PORT || 3001;
const DB_PATH = path.resolve(ROOT_DIR, process.env.DB_PATH || './data/database.sqlite');
const UPLOAD_DIR = path.resolve(ROOT_DIR, process.env.UPLOAD_DIR || './uploads');
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '25', 10);

// ─── Initialize ─────────────────────────────────────────
const db = initDatabase(DB_PATH);
const upload = createUploadMiddleware(UPLOAD_DIR, MAX_FILE_SIZE_MB);

const app = express();

// ─── Middleware ──────────────────────────────────────────
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? false
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'codexcel-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// ─── Request Logger (dev only) ──────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
  });
}

// ─── API Routes ─────────────────────────────────────────
app.use('/api', createRouter({ db, upload }));

// ─── Error Handling ─────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Error]', err.stack || err.message);

  // Multer errors (file too large, invalid type, etc.)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: `File too large. Maximum size: ${MAX_FILE_SIZE_MB}MB` });
  }

  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start Server ───────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║           codexCEL Backend API           ║');
  console.log('  ╠══════════════════════════════════════════╣');
  console.log(`  ║  Server:   http://localhost:${PORT}         ║`);
  console.log(`  ║  Health:   http://localhost:${PORT}/api/health ║`);
  console.log(`  ║  Env:      ${(process.env.NODE_ENV || 'development').padEnd(28)}║`);
  console.log(`  ║  Database: ${path.basename(DB_PATH).padEnd(28)}║`);
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');
});

// ─── Graceful Shutdown ──────────────────────────────────
process.on('SIGINT', () => {
  console.log('\n[Server] Shutting down gracefully...');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[Server] Received SIGTERM, shutting down...');
  db.close();
  process.exit(0);
});

export default app;
