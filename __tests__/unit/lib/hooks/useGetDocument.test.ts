import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";

const mockDocument = {
  id: "doc1",
  filename: "document1.txt",
  fileType: "TEXT",
  uploadDate: "2024-01-01T12:00:00Z",
  chunkCount: 3,
  fileSize: 1024,
  content: "Hello world",
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  return { Wrapper, queryClient };
};

describe("useGetDocument", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("should be defined", async () => {
    const { useGetDocument } = await import("@/lib/hooks/useGetDocument");
    expect(useGetDocument).toBeDefined();
    expect(typeof useGetDocument).toBe("function");
  });

  it("should return query state", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockDocument),
    });

    const { Wrapper } = createWrapper();
    const { useGetDocument } = await import("@/lib/hooks/useGetDocument");
    const { result } = renderHook(() => useGetDocument("doc1"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    expect(result.current.isPending).toBeDefined();
    expect(result.current.isError).toBeDefined();
    expect(result.current.error).toBeNull();
  });

  it("should call GET endpoint with correct URL", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockDocument),
    });

    const { Wrapper } = createWrapper();
    const { useGetDocument } = await import("@/lib/hooks/useGetDocument");
    renderHook(() => useGetDocument("doc1"), { wrapper: Wrapper });

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(global.fetch).toHaveBeenCalledWith("/api/documents/doc1");
  });

  it("should encode document ID in URL", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockDocument),
    });

    const { Wrapper } = createWrapper();
    const { useGetDocument } = await import("@/lib/hooks/useGetDocument");
    renderHook(() => useGetDocument("doc with spaces"), { wrapper: Wrapper });

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/documents/doc%20with%20spaces",
    );
  });

  it("should not fetch when id is undefined", async () => {
    global.fetch = vi.fn();

    const { Wrapper } = createWrapper();
    const { useGetDocument } = await import("@/lib/hooks/useGetDocument");
    const { result } = renderHook(() => useGetDocument(undefined), {
      wrapper: Wrapper,
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should return fetched document data", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockDocument),
    });

    const { Wrapper } = createWrapper();
    const { useGetDocument } = await import("@/lib/hooks/useGetDocument");
    const { result } = renderHook(() => useGetDocument("doc1"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockDocument);
  });

  it("should handle error response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: "Not found" }),
    });

    const { Wrapper } = createWrapper();
    const { useGetDocument } = await import("@/lib/hooks/useGetDocument");
    const { result } = renderHook(() => useGetDocument("missing"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Failed to load preview");
  });

  it("should use correct query key with id", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockDocument),
    });

    const { Wrapper, queryClient } = createWrapper();
    const { useGetDocument } = await import("@/lib/hooks/useGetDocument");
    renderHook(() => useGetDocument("doc1"), { wrapper: Wrapper });

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    const cachedData = queryClient.getQueryData(["document", "doc1"]);
    expect(cachedData).toEqual(mockDocument);
  });
});
