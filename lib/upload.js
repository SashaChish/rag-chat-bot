/**
 * File upload utilities
 */

import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/**
 * Ensure upload directory exists
 */
export function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Save an uploaded file
 */
export async function saveUploadedFile(file) {
  ensureUploadDir();

  // Generate unique filename
  const ext = path.extname(file.name);
  const filename = `${nanoid()}${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);

  // Write file to disk
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filepath, buffer);

  return {
    path: filepath,
    filename: filename,
    originalName: file.name,
    size: file.size,
    type: file.type,
  };
}

/**
 * Delete an uploaded file
 */
export function deleteUploadedFile(filepath) {
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
}

/**
 * Get file info
 */
export function getFileInfo(filepath) {
  if (!fs.existsSync(filepath)) {
    return null;
  }

  const stats = fs.statSync(filepath);
  return {
    path: filepath,
    size: stats.size,
    created: stats.birthtime,
    modified: stats.mtime,
  };
}

/**
 * Clean up old upload files
 */
export function cleanupOldUploads(maxAgeHours = 24) {
  const now = Date.now();
  const maxAge = maxAgeHours * 60 * 60 * 1000;

  try {
    const files = fs.readdirSync(UPLOAD_DIR);
    let deleted = 0;

    for (const file of files) {
      const filepath = path.join(UPLOAD_DIR, file);
      const stats = fs.statSync(filepath);
      const age = now - stats.mtime.getTime();

      if (age > maxAge) {
        fs.unlinkSync(filepath);
        deleted++;
      }
    }

    return { deleted };
  } catch (error) {
    console.error("Error cleaning up old uploads:", error);
    return { deleted: 0, error: error.message };
  }
}
