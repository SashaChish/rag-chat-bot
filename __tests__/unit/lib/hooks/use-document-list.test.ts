import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';

const mockDocumentsData = {
  documents: [
    {
      id: 'doc1',
      file_name: 'document1.txt',
      file_type: 'TEXT',
      upload_date: '2024-01-01T12:00:00Z',
      chunk_count: 3,
      file_size: null,
      can_download: true,
    },
    {
      id: 'doc2',
      file_name: 'document2.pdf',
      file_type: 'PDF',
      upload_date: '2024-01-02T12:00:00Z',
      chunk_count: 5,
      file_size: '1 MB',
      can_download: true,
    },
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

describe('useDocumentList', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should be defined', async () => {
    const { useDocumentList } = await import('@/lib/hooks/use-document-list');
    expect(useDocumentList).toBeDefined();
    expect(typeof useDocumentList).toBe('function');
  });

  it('should fetch documents list successfully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockDocumentsData),
    });

    const { Wrapper } = createWrapper();
    const { useDocumentList } = await import('@/lib/hooks/use-document-list');
    const { result } = renderHook(() => useDocumentList(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const { data } = result.current;
    expect(data?.documents).toEqual(mockDocumentsData.documents);
    expect(global.fetch).toHaveBeenCalledWith('/api/documents/list');
  });

  it('should throw error when fetch fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Server error' }),
    });

    const { Wrapper } = createWrapper();
    const { useDocumentList } = await import('@/lib/hooks/use-document-list');
    const { result } = renderHook(() => useDocumentList(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Failed to load document list'));
  });

  it('should return loading state initially', async () => {
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));

    const { Wrapper } = createWrapper();
    const { useDocumentList } = await import('@/lib/hooks/use-document-list');
    const { result } = renderHook(() => useDocumentList(), { wrapper: Wrapper });

    expect(result.current.isLoading).toBe(true);
  });
});
