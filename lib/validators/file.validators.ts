/**
 * File Validators
 * Validation functions for file-related operations
 */

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSizeMB = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error(
      `File size exceeds ${maxSizeMB}MB limit. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    );
  }
  return true;
}

/**
 * Validate file type
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      `Unsupported file type: ${file.type}. Allowed types: ${allowedTypes.join(', ')}`,
    );
  }
  return true;
}

/**
 * Validate file extension
 */
export function validateFileExtension(
  filename: string,
  allowedExtensions: string[],
): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (!allowedExtensions.includes(ext)) {
    throw new Error(
      `Unsupported file extension: ${ext}. Allowed extensions: ${allowedExtensions.join(', ')}`,
    );
  }
  return true;
}

/**
 * Validate filename
 */
export function validateFilename(filename: string): boolean {
  if (!filename || filename.trim().length === 0) {
    throw new Error('Filename cannot be empty');
  }

  if (filename.length > 255) {
    throw new Error('Filename cannot exceed 255 characters');
  }

  // Check for invalid characters
  const invalidChars = /[<>:"|?*]/;
  if (invalidChars.test(filename)) {
    throw new Error('Filename contains invalid characters');
  }

  // Check for reserved names (Windows)
  const reservedNames = [
    'CON', 'PRN', 'AUX', 'NUL',
    ...Array.from({ length: 9 }, (_, i) => `COM${i + 1}`),
    ...Array.from({ length: 9 }, (_, i) => `LPT${i + 1}`)
  ];
  const basename = filename.split('.')[0].toUpperCase();
  if (reservedNames.includes(basename)) {
    throw new Error('Filename is a reserved system name');
  }

  return true;
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {},
): void {
  validateFilename(file.name);

  if (options.maxSizeMB) {
    validateFileSize(file, options.maxSizeMB);
  }

  if (options.allowedTypes) {
    validateFileType(file, options.allowedTypes);
  }

  if (options.allowedExtensions) {
    validateFileExtension(file.name, options.allowedExtensions);
  }
}
