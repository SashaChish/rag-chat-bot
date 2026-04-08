export const MAX_FILE_SIZE_MB = 10;

export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const MAX_FILENAME_LENGTH = 255;

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const FILE_SIZE_UNITS = ["Bytes", "KB", "MB", "GB", "TB"] as const;

export const UPLOAD_CLEANUP_AGE_HOURS = 24;
