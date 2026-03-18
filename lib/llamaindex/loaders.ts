import { PDFReader } from "@llamaindex/readers/pdf";
import { DocxReader } from "@llamaindex/readers/docx";
import { MarkdownReader } from "@llamaindex/readers/markdown";
import { TextFileReader } from "@llamaindex/readers/text";
import type { BaseReader } from "llamaindex";
import fs from "fs/promises";
import type { RAGDocument } from "../types";

export const SUPPORTED_FORMATS: Record<string, string[]> = {
  PDF: ["pdf"],
  TEXT: ["txt"],
  MARKDOWN: ["md", "markdown"],
  DOCX: ["docx"],
};

const FILE_EXT_TO_READER: Record<string, BaseReader> = {
  txt: new TextFileReader(),
  pdf: new PDFReader(),
  md: new MarkdownReader(),
  markdown: new MarkdownReader(),
  docx: new DocxReader(),
};

export const SUPPORTED_EXTENSIONS: string[] = [
  ...SUPPORTED_FORMATS.PDF,
  ...SUPPORTED_FORMATS.TEXT,
  ...SUPPORTED_FORMATS.MARKDOWN,
  ...SUPPORTED_FORMATS.DOCX,
];

/**
 * Get the file type from a filename
 */
export function getFileType(filename: string): string | null {
  const ext = filename.split(".").pop()?.toLowerCase();

  if (!ext) return null;

  for (const [type, extensions] of Object.entries(SUPPORTED_FORMATS)) {
    if ((extensions as string[]).includes(ext as string)) {
      return type;
    }
  }

  return null;
}

export function isFormatSupported(filename: string): boolean {
  return getFileType(filename) !== null;
}

export async function loadDocument(filePath: string): Promise<RAGDocument[]> {
  try {
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    if (!fileExists) {
      throw new Error(`File not found: ${filePath}`);
    }

    const stats = await fs.stat(filePath);
    const maxSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB || "10", 10);
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

    // Get file extension and corresponding reader
    const filename = filePath.split("/").pop() || filePath;
    const ext = filename.split(".").pop()?.toLowerCase();

    if (!ext) {
      throw new Error("Invalid filename - no extension found");
    }

    const reader = FILE_EXT_TO_READER[ext];
    if (!reader) {
      throw new Error(
        `Unsupported file type: .${ext}. Supported formats: ${SUPPORTED_EXTENSIONS.join(", ")}`
      );
    }

    const documents = await reader.loadData(filePath);

    return documents.map((doc) => ({
      text: doc.getText(),
      metadata: {
        ...doc.metadata,
        file_name: filename,
        file_path: filePath,
        file_type: getFileType(filename) || "unknown",
        upload_date: new Date().toISOString(),
      },
    })) as RAGDocument[];
  } catch (error) {
    console.error(`Error loading document ${filePath}:`, error);
    throw error;
  }
}

export async function loadDocumentFromBuffer(
  buffer: Buffer,
  filename: string
): Promise<{ documents: RAGDocument[] }> {
  const fs = await import("fs");
  const path = await import("path");
  const os = await import("os");

  let tempFilePath = "";

  try {
    const maxSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB || "10", 10);
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (buffer.length > maxSizeBytes) {
      throw new Error(
        `File size (${(buffer.length / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${maxSizeMB}MB)`
      );
    }

    if (buffer.length === 0) {
      throw new Error("File is empty");
    }

    const ext = filename.split(".").pop()?.toLowerCase();

    if (!ext) {
      throw new Error("Invalid filename - no extension found");
    }

    const reader = FILE_EXT_TO_READER[ext];
    if (!reader) {
      throw new Error(
        `Unsupported file type: .${ext}. Supported formats: ${SUPPORTED_EXTENSIONS.join(", ")}`
      );
    }

    tempFilePath = path.join(os.tmpdir(), `upload_${Date.now()}_${filename}`);
    fs.writeFileSync(tempFilePath, buffer);

    const documents = await reader.loadData(tempFilePath);

    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    tempFilePath = "";

    return {
      documents: documents.map((doc) => ({
        text: doc.getText(),
        metadata: {
          ...doc.metadata,
          file_name: filename,
          file_type: getFileType(filename) || "unknown",
          upload_date: new Date().toISOString(),
        },
      })) as RAGDocument[],
    };
  } catch (error) {
    if (tempFilePath) {
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      } catch (cleanupError) {
        console.error("Error cleaning up temporary file:", cleanupError);
      }
    }
    console.error(`Error loading document from buffer ${filename}:`, error);
    throw error;
  }
}

/**
 * Validate a file before loading
 */
export function validateFile(file: File): boolean {
  // Check file type
  if (!isFormatSupported(file.name)) {
    throw new Error(
      `Unsupported file format: ${file.name}. Supported formats: ${SUPPORTED_EXTENSIONS.join(", ")}`
    );
  }

  const maxSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB || "10", 10);
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    throw new Error(
      `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${maxSizeMB}MB)`
    );
  }

  if (file.size === 0) {
    throw new Error("File is empty");
  }

  return true;
}

export function getSupportedFormatsList(): Array<{ type: string; extensions: string }> {
  return Object.entries(SUPPORTED_FORMATS).map(([type, extensions]) => ({
    type,
    extensions: extensions.map((ext) => `.${ext}`).join(", "),
  }));
}