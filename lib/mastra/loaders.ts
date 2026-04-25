import { v4 as uuidv4 } from "uuid";
import { MAX_FILE_SIZE_MB } from "../constants";
import { ValidationError } from "../api/errors";
import { getFileExtension } from "../utils";

export const SUPPORTED_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".md",
  ".markdown",
  ".txt",
];

export function getFileType(filename: string): string | null {
  const ext = getFileExtension(filename);

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

export function validateFile(file: FormDataEntryValue | null) {
  if (!file || !(file instanceof File)) {
    throw new ValidationError("No file provided");
  }

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

  return { isValid: true, file };
}

export async function loadDocumentFromBuffer(buffer: Buffer, filename: string) {
  const ext = getFileExtension(filename);

  if (!ext) throw new ValidationError("Invalid filename - no extension found");

  let content: string;

  switch (ext) {
    case "pdf": {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      const { text: extractedText } = await parser.getText();
      content = extractedText;
      break;
    }
    case "docx": {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      content = result.value;
      break;
    }
    case "md":
    case "markdown":
    case "txt":
      content = buffer.toString("utf-8");
      break;
    default:
      throw new ValidationError(
        `Unsupported file type: .${ext}. Supported formats: ${SUPPORTED_EXTENSIONS.join(", ")}`,
      );
  }

  if (content.trim().length === 0) {
    throw new ValidationError("Could not extract text from file");
  }

  return {
    id: uuidv4(),
    content,
    filename,
    fileType: getFileType(filename),
    uploadDate: new Date().toISOString(),
  };
}
