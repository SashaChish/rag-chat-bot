export function validateFileSize(fileSize: number, maxSizeMB: number): { valid: boolean; message?: string } {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (fileSize === 0) {
    return { valid: false, message: "File is empty" };
  }

  if (fileSize > maxSizeBytes) {
    return {
      valid: false,
      message: `File size (${(fileSize / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${maxSizeMB}MB)`,
    };
  }

  return { valid: true };
}
