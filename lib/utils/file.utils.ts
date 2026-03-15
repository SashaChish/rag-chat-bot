/**
 * File Utility Functions
 * Helper functions for file operations
 */

import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export interface UploadedFile {
  path: string;
  filename: string;
  originalName: string;
  size: number;
  type: string;
}

export interface FileInfo {
  path: string;
  size: number;
  created: Date;
  modified: Date;
}

export interface CleanupResult {
  deleted: number;
  error?: string;
}

/**
 * Ensure upload directory exists
 */
export function ensureUploadDir(): void {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Save an uploaded file
 */
export async function saveUploadedFile(file: File): Promise<UploadedFile> {
  ensureUploadDir();

  const ext = path.extname(file.name);
  const filename = `${nanoid()}${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);

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
export function deleteUploadedFile(filepath: string): void {
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
}

/**
 * Get file information
 */
export function getFileInfo(filepath: string): FileInfo | null {
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
 * Clean up old uploaded files
 */
export function cleanupOldUploads(maxAgeHours = 24): CleanupResult {
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
    console.error('Error cleaning up old uploads:', error);
    return { deleted: 0, error: (error as Error).message };
  }
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase().slice(1);
}

/**
 * Validate file type
 */
export function isValidFileType(filename: string, allowedTypes: string[]): boolean {
  const ext = getFileExtension(filename);
  return allowedTypes.includes(ext);
}

/**
 * Get file type from extension
 */
export function getFileType(filename: string): string {
  const ext = getFileExtension(filename);
  const typeMap: Record<string, string> = {
    pdf: 'PDF',
    txt: 'TEXT',
    md: 'MARKDOWN',
    markdown: 'MARKDOWN',
    docx: 'DOCX',
  };
  return typeMap[ext] || 'UNKNOWN';
}
