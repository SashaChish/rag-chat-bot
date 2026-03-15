/**
 * Upload Component Utilities
 * Helper functions specific to the Upload component
 */

import { FORMAT_NAME_TO_EXTENSIONS } from '../../lib/constants/format.constants';

/**
 * Get supported file extensions for upload
 */
export function getSupportedExtensions(formatNames?: string[]): string[] {
  if (!formatNames || formatNames.length === 0) {
    return ['pdf', 'txt', 'md', 'markdown', 'docx'];
  }

  const extensions: string[] = [];
  for (const formatName of formatNames) {
    const formatExts = FORMAT_NAME_TO_EXTENSIONS[formatName];
    if (formatExts) {
      extensions.push(...formatExts);
    }
  }

  return extensions.length > 0 ? extensions : ['pdf', 'txt', 'md', 'markdown', 'docx'];
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Validate file extension
 */
export function validateFileExtension(filename: string, formatNames?: string[]): boolean {
  const ext = getFileExtension(filename);
  const supportedExtensions = getSupportedExtensions(formatNames);
  return supportedExtensions.includes(ext);
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSizeMB = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Generate file upload error message
 */
export function getUploadErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error occurred';
}

/**
 * Generate supported formats display text
 */
export function getSupportedFormatsText(formatNames?: string[]): string {
  if (!formatNames || formatNames.length === 0) {
    return 'PDF, TEXT, MARKDOWN, DOCX';
  }
  return formatNames.join(', ');
}
