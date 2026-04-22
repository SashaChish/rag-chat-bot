import { PDFReader } from "@llamaindex/readers/pdf";
import { DocxReader } from "@llamaindex/readers/docx";
import { MarkdownReader } from "@llamaindex/readers/markdown";
import { TextFileReader } from "@llamaindex/readers/text";
import type { BaseReader } from "llamaindex";
import type { RAGDocument } from "../types";
import { MAX_FILE_SIZE_MB } from "../constants";

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

export async function loadDocumentFromBuffer(
  buffer: Buffer,
  filename: string,
): Promise<{ documents: RAGDocument[] }> {
  const fs = await import("fs");
  const path = await import("path");
  const os = await import("os");

  let tempFilePath = "";

  try {
    const maxSizeBytes = MAX_FILE_SIZE_MB * 1024 * 1024;

    if (buffer.length > maxSizeBytes) {
      throw new Error(
        `File size (${(buffer.length / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${MAX_FILE_SIZE_MB}MB)`,
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
        `Unsupported file type: .${ext}. Supported formats: ${SUPPORTED_EXTENSIONS.join(", ")}`,
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

export function validateFile(file: File): boolean {
  if (getFileType(file.name) === null) {
    throw new Error(
      `Unsupported file format: ${file.name}. Supported formats: ${SUPPORTED_EXTENSIONS.join(", ")}`,
    );
  }

  const maxSizeBytes = MAX_FILE_SIZE_MB * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    throw new Error(
      `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${MAX_FILE_SIZE_MB}MB)`,
    );
  }

  if (file.size === 0) {
    throw new Error("File is empty");
  }

  return true;
}
