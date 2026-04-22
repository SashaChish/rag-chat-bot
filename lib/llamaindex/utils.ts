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
