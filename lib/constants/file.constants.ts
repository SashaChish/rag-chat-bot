/**
 * File Constants
 * Constants related to file operations
 */

/**
 * Maximum file size in MB
 */
export const MAX_FILE_SIZE_MB = 10;

/**
 * Maximum file size in bytes
 */
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * Maximum filename length
 */
export const MAX_FILENAME_LENGTH = 255;

/**
 * Allowed MIME types for upload
 */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

/**
 * File size display units
 */
export const FILE_SIZE_UNITS = ['Bytes', 'KB', 'MB', 'GB', 'TB'] as const;

/**
 * Upload cleanup age in hours
 */
export const UPLOAD_CLEANUP_AGE_HOURS = 24;
