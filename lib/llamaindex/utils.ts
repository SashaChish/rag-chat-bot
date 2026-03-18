import { initializeSettings } from "./settings";

export function initializeLlamaIndex(): boolean {
  try {
    initializeSettings();
    console.log("LlamaIndex.TS settings initialized");
    return true;
  } catch (error) {
    console.error("Failed to initialize LlamaIndex.TS:", error);
    throw error;
  }
}

export function generateDocumentId(filename: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${filename}-${timestamp}-${random}`;
}
