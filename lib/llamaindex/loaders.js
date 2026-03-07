/**
 * Document Loader Factory
 * Uses LlamaIndex.TS file readers to load documents and creates LlamaIndex.TS Document objects
 */

import { PDFReader } from "@llamaindex/readers/pdf";
import { DocxReader } from "@llamaindex/readers/docx";
import { MarkdownReader } from "@llamaindex/readers/markdown";
import { TextFileReader } from "@llamaindex/readers/text";
import fs from "fs/promises";

/**
 * Supported file types and their extensions
 */
export const SUPPORTED_FORMATS = {
  PDF: ["pdf"],
  TEXT: ["txt"],
  MARKDOWN: ["md", "markdown"],
  DOCX: ["docx"],
};

/**
 * File extension to reader mapping
 * Uses LlamaIndex.TS specialized readers for each file type
 */
const FILE_EXT_TO_READER = {
  txt: new TextFileReader(),
  pdf: new PDFReader(),
  md: new MarkdownReader(),
  markdown: new MarkdownReader(),
  docx: new DocxReader(),
};

/**
 * All supported extensions
 */
export const SUPPORTED_EXTENSIONS = [
  ...SUPPORTED_FORMATS.PDF,
  ...SUPPORTED_FORMATS.TEXT,
  ...SUPPORTED_FORMATS.MARKDOWN,
  ...SUPPORTED_FORMATS.DOCX,
];

/**
 * Get the file type from a filename
 */
export function getFileType(filename) {
  const ext = filename.split(".").pop().toLowerCase();

  for (const [type, extensions] of Object.entries(SUPPORTED_FORMATS)) {
    if (extensions.includes(ext)) {
      return type;
    }
  }

  return null;
}

/**
 * Check if a file format is supported
 */
export function isFormatSupported(filename) {
  return getFileType(filename) !== null;
}



/**
 * Load documents from a file
 * Uses LlamaIndex.TS specialized file readers for proper parsing
 */
export async function loadDocument(filePath) {
  try {
    // Check if file exists
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    if (!fileExists) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Check file size
    const stats = await fs.stat(filePath);
    const maxSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB || "10");
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (stats.size > maxSizeBytes) {
      throw new Error(
        `File size (${(stats.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${maxSizeMB}MB)`
      );
    }

    // Check if file is empty
    if (stats.size === 0) {
      throw new Error("File is empty");
    }

    // Get the file extension and corresponding reader
    const filename = filePath.split("/").pop();
    const ext = filename.split(".").pop().toLowerCase();

    const reader = FILE_EXT_TO_READER[ext];
    if (!reader) {
      throw new Error(
        `Unsupported file type: .${ext}. Supported formats: ${SUPPORTED_EXTENSIONS.join(", ")}`
      );
    }

    // Use the specialized LlamaIndex.TS reader to parse the file
    const documents = await reader.loadData(filePath);

    // Add custom metadata to each document
    return documents.map((doc) => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        file_name: filename,
        file_path: filePath,
        file_type: getFileType(filename),
        upload_date: new Date().toISOString(),
      },
    }));
  } catch (error) {
    console.error(`Error loading document ${filePath}:`, error);
    throw error;
  }
}

/**
 * Validate a file before loading
 */
export function validateFile(file) {
  // Check file type
  if (!isFormatSupported(file.name)) {
    throw new Error(
      `Unsupported file format: ${file.name}. Supported formats: ${SUPPORTED_EXTENSIONS.join(", ")}`
    );
  }

  // Check file size
  const maxSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB || "10");
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    throw new Error(
      `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${maxSizeMB}MB)`
    );
  }

  // Check if file is empty
  if (file.size === 0) {
    throw new Error("File is empty");
  }

  return true;
}

/**
 * Get supported formats list for UI display
 */
export function getSupportedFormatsList() {
  return Object.entries(SUPPORTED_FORMATS).map(([type, extensions]) => ({
    type,
    extensions: extensions.map((ext) => `.${ext}`).join(", "),
  }));
}
