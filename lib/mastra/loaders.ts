import type { RAGDocument } from "../types/core.types";
import { MAX_FILE_SIZE_MB } from "../constants";
import { ValidationError } from "../api/errors";

export const SUPPORTED_FORMATS = ["pdf", "docx", "md", "txt"];

export const SUPPORTED_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".md",
  ".markdown",
  ".txt",
];

export function getFileType(filename: string): string | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext) return null;

  const formatMap: Record<string, string> = {
    pdf: "pdf",
    docx: "docx",
    md: "md",
    markdown: "md",
    txt: "txt",
  };

  return formatMap[ext] || null;
}

export function validateFile(file: File): boolean {
  if (getFileType(file.name) === null) {
    throw new ValidationError(
      `Unsupported file format: ${file.name}. Supported formats: ${SUPPORTED_EXTENSIONS.join(", ")}`,
    );
  }

  const maxSizeBytes = MAX_FILE_SIZE_MB * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    throw new ValidationError(
      `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${MAX_FILE_SIZE_MB}MB)`,
    );
  }

  if (file.size === 0) {
    throw new ValidationError("File is empty");
  }

  return true;
}

export async function loadDocumentFromBuffer(
  buffer: Buffer,
  filename: string,
): Promise<{ documents: RAGDocument[] }> {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext) {
    throw new ValidationError("Invalid filename - no extension found");
  }

  let text: string;
  const fileType = getFileType(filename);

  switch (ext) {
    case "pdf": {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      const { text: extractedText } = await parser.getText();
      text = extractedText;
      break;
    }
    case "docx": {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
      break;
    }
    case "md":
    case "markdown":
      text = buffer.toString("utf-8");
      break;
    case "txt":
      text = buffer.toString("utf-8");
      break;
    default:
      throw new ValidationError(
        `Unsupported file type: .${ext}. Supported formats: ${SUPPORTED_EXTENSIONS.join(", ")}`,
      );
  }

  if (!text || text.trim().length === 0) {
    throw new ValidationError("Could not extract text from file");
  }

  return {
    documents: [
      {
        text,
        metadata: {
          file_name: filename,
          file_type: fileType || ext,
          upload_date: new Date().toISOString(),
        },
      },
    ],
  };
}
