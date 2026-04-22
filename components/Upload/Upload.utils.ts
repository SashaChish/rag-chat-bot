import { EXTENSION_TO_MIME, FILE_EXTENSIONS } from "@/lib/constants";

export function getSupportedMimeTypes(): string[] {
  return [
    ...new Set(
      FILE_EXTENSIONS.map((ext) => EXTENSION_TO_MIME[ext]).filter(Boolean),
    ),
  ];
}

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

export function validateFileExtension(filename: string): boolean {
  const ext = getFileExtension(filename);

  return FILE_EXTENSIONS.includes(ext);
}

export function validateFileSize(file: File, maxSizeMB = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

export function getUploadErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error occurred";
}
