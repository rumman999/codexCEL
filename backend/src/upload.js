import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

/**
 * Configure multer for file uploads.
 * Stores files with unique names in the configured upload directory.
 * @param {string} uploadDir - Directory to store uploaded files.
 * @param {number} maxSizeMB - Maximum file size in megabytes.
 * @returns {multer.Multer} - Configured multer instance.
 */
export function createUploadMiddleware(uploadDir, maxSizeMB = 25) {
  // Ensure upload directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`[Upload] Created upload directory: ${uploadDir}`);
  }

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      const uniqueName = `${randomUUID()}${ext}`;
      cb(null, uniqueName);
    },
  });

  const fileFilter = (_req, file, cb) => {
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type "${ext}". Allowed: ${allowedExtensions.join(', ')}`), false);
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxSizeMB * 1024 * 1024,
    },
  });
}
