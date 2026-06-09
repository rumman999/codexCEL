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
  const storage = multer.memoryStorage();

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
