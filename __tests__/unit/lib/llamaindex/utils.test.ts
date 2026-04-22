import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/llamaindex/settings", () => ({
  initializeSettings: vi.fn(),
}));

describe("utils", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe("initializeLlamaIndex", () => {
    it("should initialize settings and return true", async () => {
      const { initializeLlamaIndex } = await import("@/lib/llamaindex/utils");
      const { initializeSettings } = await import("@/lib/llamaindex/settings");

      const result = initializeLlamaIndex();

      expect(initializeSettings).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("should log success message", async () => {
      const consoleLogSpy = vi.spyOn(console, "log");
      const { initializeLlamaIndex } = await import("@/lib/llamaindex/utils");

      initializeLlamaIndex();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "LlamaIndex.TS settings initialized",
      );
    });

    it("should throw and log error when initializeSettings fails", async () => {
      const { initializeSettings } = await import("@/lib/llamaindex/settings");
      const error = new Error("Initialization failed");
      vi.mocked(initializeSettings).mockImplementation(() => {
        throw error;
      });

      const consoleErrorSpy = vi.spyOn(console, "error");
      vi.resetModules();

      const { initializeLlamaIndex: initializeLlamaIndexFresh } =
        await import("@/lib/llamaindex/utils");

      expect(() => initializeLlamaIndexFresh()).toThrow(
        "Initialization failed",
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to initialize LlamaIndex.TS:",
        error,
      );
    });
  });
});
