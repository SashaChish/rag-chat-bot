import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';

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

describe('useDocumentPreview', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should be defined', async () => {
    const { useDocumentPreview } = await import('@/lib/hooks/use-document-preview');
    expect(useDocumentPreview).toBeDefined();
    expect(typeof useDocumentPreview).toBe('function');
  });

  it('should not fetch when enabled is false', async () => {
    global.fetch = vi.fn();

    const { Wrapper } = createWrapper();
    const { useDocumentPreview } = await import('@/lib/hooks/use-document-preview');
    const { result } = renderHook(
      () => useDocumentPreview('test.txt', { enabled: false }),
      { wrapper: Wrapper },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should fetch preview when enabled', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ content: 'Sample preview content' }),
    });

    const { Wrapper } = createWrapper();
    const { useDocumentPreview } = await import('@/lib/hooks/use-document-preview');
    const { result } = renderHook(
      () => useDocumentPreview('test.txt', { enabled: true }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const { data } = result.current;
    expect(data?.content).toBe('Sample preview content');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/documents?action=preview&file_name=test.txt',
    );
  });

  it('should not fetch when fileName is undefined', async () => {
    global.fetch = vi.fn();

    const { Wrapper } = createWrapper();
    const { useDocumentPreview } = await import('@/lib/hooks/use-document-preview');
    const { result } = renderHook(
      () => useDocumentPreview(undefined, { enabled: false }),
      { wrapper: Wrapper },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should throw error when fetch fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Server error' }),
    });

    const { Wrapper } = createWrapper();
    const { useDocumentPreview } = await import('@/lib/hooks/use-document-preview');
    const { result } = renderHook(
      () => useDocumentPreview('test.txt', { enabled: true }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Failed to load preview'));
  });

  it('should encode file name in URL', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ content: 'content' }),
    });

    const { Wrapper } = createWrapper();
    const { useDocumentPreview } = await import('@/lib/hooks/use-document-preview');
    renderHook(
      () => useDocumentPreview('file with spaces.pdf', { enabled: true }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/documents?action=preview&file_name=file%20with%20spaces.pdf',
    );
  });
});
