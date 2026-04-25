import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
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
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  return { Wrapper, queryClient };
};

describe('useDocumentDelete', () => {
  const originalFetch = global.fetch;
  const originalAlert = global.alert;

  beforeEach(() => {
    vi.clearAllMocks();
    global.alert = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    global.alert = originalAlert;
    vi.restoreAllMocks();
  });

  it('should be defined', async () => {
    const { useDocumentDelete } = await import('@/lib/hooks/use-document-delete');
    expect(useDocumentDelete).toBeDefined();
    expect(typeof useDocumentDelete).toBe('function');
  });

  it('should return mutation functions', async () => {
    const { Wrapper } = createWrapper();
    const { useDocumentDelete } = await import('@/lib/hooks/use-document-delete');
    const { result } = renderHook(() => useDocumentDelete(), { wrapper: Wrapper });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
    expect(result.current.isPending).toBeDefined();
  });

  it('should call DELETE endpoint with correct URL', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const { Wrapper } = createWrapper();
    const { useDocumentDelete } = await import('@/lib/hooks/use-document-delete');
    const { result } = renderHook(() => useDocumentDelete(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate('doc1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/documents/doc1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('should encode document ID in URL', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const { Wrapper } = createWrapper();
    const { useDocumentDelete } = await import('@/lib/hooks/use-document-delete');
    const { result } = renderHook(() => useDocumentDelete(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate('doc with spaces');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/documents/doc%20with%20spaces',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('should optimistically remove document from cache', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('action=list')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDocumentsData),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
    });

    const { Wrapper, queryClient } = createWrapper();

    queryClient.setQueryData(['documents'], mockDocumentsData);

    const { useDocumentDelete } = await import('@/lib/hooks/use-document-delete');
    const { result } = renderHook(() => useDocumentDelete(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate('doc1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cachedData = queryClient.getQueryData<{ documents: Array<{ id: string }> }>(['documents']);
    expect(cachedData?.documents).toEqual([{ id: 'doc2', file_name: 'document2.pdf', file_type: 'PDF', upload_date: '2024-01-02T12:00:00Z', chunk_count: 5, file_size: '1 MB', can_download: true }]);
  });

  it('should rollback cache on error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Delete failed' }),
    });

    const { Wrapper, queryClient } = createWrapper();

    queryClient.setQueryData(['documents'], mockDocumentsData);

    const { useDocumentDelete } = await import('@/lib/hooks/use-document-delete');
    const { result } = renderHook(() => useDocumentDelete(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate('doc1');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const cachedData = queryClient.getQueryData(['documents']);
    expect(cachedData).toEqual(mockDocumentsData);
  });

  it('should invalidate stats and list queries on settled', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { useDocumentDelete } = await import('@/lib/hooks/use-document-delete');
    const { result } = renderHook(() => useDocumentDelete(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate('doc1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['documents'] });
  });
});
