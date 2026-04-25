import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import type { DocumentEntry } from "@/lib/db/types";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  return { Wrapper, queryClient };
};

const createMockDocument = (
  overrides: Partial<DocumentEntry> = {},
): DocumentEntry => ({
  id: "test-doc",
  filename: "test.txt",
  fileType: "TEXT",
  uploadDate: "2024-01-01T00:00:00Z",
  chunkCount: 1,
  content: "",
  fileSize: 100,
  ...overrides,
});

describe("useDocumentDownload", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("should be defined", async () => {
    const { useDocumentDownload } =
      await import("@/lib/hooks/useDocumentDownload");
    expect(useDocumentDownload).toBeDefined();
    expect(typeof useDocumentDownload).toBe("function");
  });

  it("should return mutation functions", async () => {
    const { Wrapper } = createWrapper();
    const { useDocumentDownload } =
      await import("@/lib/hooks/useDocumentDownload");
    const { result } = renderHook(() => useDocumentDownload(), {
      wrapper: Wrapper,
    });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
    expect(result.current.isPending).toBeDefined();
  });

  it("should throw error when fetch fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
    });

    const { Wrapper } = createWrapper();
    const { useDocumentDownload } =
      await import("@/lib/hooks/useDocumentDownload");
    const { result } = renderHook(() => useDocumentDownload(), {
      wrapper: Wrapper,
    });

    const doc = createMockDocument();

    await act(async () => {
      try {
        await result.current.mutateAsync(doc);
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect((error as Error).message).toBe("Failed to download document");
      }
    });
  });

  it("should call fetch with correct URL", async () => {
    const mockBlob = new Blob(["test content"], { type: "text/plain" });
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });
    global.fetch = mockFetch;

    // Mock URL.createObjectURL and revokeObjectURL to avoid actual blob URL creation
    const mockCreateObjectURL = vi.fn(() => "blob:test-url");
    const mockRevokeObjectURL = vi.fn();
    const originalCreateObjectURL = window.URL.createObjectURL;
    const originalRevokeObjectURL = window.URL.revokeObjectURL;
    window.URL.createObjectURL = mockCreateObjectURL;
    window.URL.revokeObjectURL = mockRevokeObjectURL;

    const { Wrapper } = createWrapper();
    const { useDocumentDownload } =
      await import("@/lib/hooks/useDocumentDownload");
    const { result } = renderHook(() => useDocumentDownload(), {
      wrapper: Wrapper,
    });

    const doc = createMockDocument({ filename: "custom-file.pdf" });

    await act(async () => {
      await result.current.mutateAsync(doc);
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/documents/test-doc/download");
    expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:test-url");

    // Restore
    window.URL.createObjectURL = originalCreateObjectURL;
    window.URL.revokeObjectURL = originalRevokeObjectURL;
  });
});
