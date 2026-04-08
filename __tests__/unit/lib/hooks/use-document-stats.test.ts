import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';

const mockStatsData = {
  stats: {
    exists: true,
    collectionName: 'documents',
    count: 10,
  },
  supportedFormats: [
    { type: 'PDF', extensions: '.pdf' },
    { type: 'TEXT', extensions: '.txt' },
  ],
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

describe('useDocumentStats', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should be defined', async () => {
    const { useDocumentStats } = await import('@/lib/hooks/use-document-stats');
    expect(useDocumentStats).toBeDefined();
    expect(typeof useDocumentStats).toBe('function');
  });

  it('should fetch stats successfully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockStatsData),
    });

    const { Wrapper } = createWrapper();
    const { useDocumentStats } = await import('@/lib/hooks/use-document-stats');
    const { result } = renderHook(() => useDocumentStats(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const { data } = result.current;
    expect(data?.stats).toEqual(mockStatsData.stats);
    expect(data?.supportedFormats).toEqual(mockStatsData.supportedFormats);
    expect(global.fetch).toHaveBeenCalledWith('/api/documents');
  });

  it('should throw error when fetch fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Server error' }),
    });

    const { Wrapper } = createWrapper();
    const { useDocumentStats } = await import('@/lib/hooks/use-document-stats');
    const { result } = renderHook(() => useDocumentStats(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Failed to load document stats'));
  });

  it('should return loading state initially', async () => {
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));

    const { Wrapper } = createWrapper();
    const { useDocumentStats } = await import('@/lib/hooks/use-document-stats');
    const { result } = renderHook(() => useDocumentStats(), { wrapper: Wrapper });

    expect(result.current.isLoading).toBe(true);
  });
});
