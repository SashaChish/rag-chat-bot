/**
 * Document Validators
 * Validation functions for document-related operations
 */

/**
 * Validate document ID
 */
export function validateDocumentId(id: string): boolean {
  if (!id || typeof id !== 'string') {
    throw new Error('Document ID must be a non-empty string');
  }

  if (id.trim().length === 0) {
    throw new Error('Document ID cannot be empty or whitespace');
  }

  return true;
}

/**
 * Validate document metadata
 */
export function validateDocumentMetadata(metadata: {
  file_name: string;
  file_type: string;
  upload_date: string;
}): boolean {
  if (!metadata.file_name || typeof metadata.file_name !== 'string') {
    throw new Error('Document must have a valid file name');
  }

  if (!metadata.file_type || typeof metadata.file_type !== 'string') {
    throw new Error('Document must have a valid file type');
  }

  if (!metadata.upload_date || typeof metadata.upload_date !== 'string') {
    throw new Error('Document must have a valid upload date');
  }

  // Validate date format
  const date = new Date(metadata.upload_date);
  if (isNaN(date.getTime())) {
    throw new Error('Document upload date must be a valid date string');
  }

  return true;
}

/**
 * Validate document chunk count
 */
export function validateChunkCount(count: number): boolean {
  if (!Number.isInteger(count)) {
    throw new Error('Chunk count must be an integer');
  }

  if (count < 0) {
    throw new Error('Chunk count cannot be negative');
  }

  if (count > 100000) {
    throw new Error('Chunk count exceeds maximum allowed value');
  }

  return true;
}

/**
 * Validate document file URL
 */
export function validateDocumentUrl(url: string | null): boolean {
  if (url === null) return true;

  try {
    new URL(url);
    return true;
  } catch {
    throw new Error('Invalid document URL format');
  }
}
