import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

const mockMutate = vi.fn();

vi.mock('@/lib/hooks/use-document-download', () => ({
  useDocumentDownload: vi.fn(() => ({
    mutate: mockMutate,
  })),
}));

const mockStatsData = {
  stats: {
    exists: true,
    collectionName: 'documents',
    count: 10,
    documentCount: 3,
  },
  supportedFormats: [
    { type: 'PDF', extensions: '.pdf' },
    { type: 'TEXT', extensions: '.txt' },
  ],
};

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
      queries: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  return { Wrapper, queryClient };
};

describe('DocumentList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutate.mockClear();

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('action=list')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDocumentsData),
        });
      }
      if (url.includes('action=preview')) {
        const fileName = url.match(/file_name=([^&]+)/)?.[1];
        const decodedName = fileName ? decodeURIComponent(fileName) : '';
        const content = decodedName === 'document1.txt' ? 'Sample content for document 1' : '';
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ content }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockStatsData),
      });
    });
  });

  it('should show loading state initially', async () => {
    const { Wrapper } = createWrapper();

    const DocumentList = (await import('@/components/DocumentList/DocumentList')).default;
    render(
      <Wrapper>
        <DocumentList />
      </Wrapper>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render documents after loading', async () => {
    const { Wrapper } = createWrapper();

    const DocumentList = (await import('@/components/DocumentList/DocumentList')).default;
    render(
      <Wrapper>
        <DocumentList />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('document1.txt')).toBeInTheDocument();
    });

    expect(screen.getByText('document2.pdf')).toBeInTheDocument();
  });

  it('should display document stats', async () => {
    const { Wrapper } = createWrapper();

    const DocumentList = (await import('@/components/DocumentList/DocumentList')).default;
    render(
      <Wrapper>
        <DocumentList />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('10 Chunks')).toBeInTheDocument();
    });
  });

  it('should show empty state when no documents', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('action=list')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ documents: [] }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          stats: { exists: false, collectionName: 'documents', count: 0, documentCount: 0 },
          supportedFormats: [],
        }),
      });
    });

    const { Wrapper } = createWrapper();

    const DocumentList = (await import('@/components/DocumentList/DocumentList')).default;
    render(
      <Wrapper>
        <DocumentList />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('No documents indexed yet')).toBeInTheDocument();
    });
  });

  it('should show delete confirmation modal', async () => {
    const { Wrapper } = createWrapper();

    const DocumentList = (await import('@/components/DocumentList/DocumentList')).default;
    render(
      <Wrapper>
        <DocumentList />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('document1.txt')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByLabelText(/Delete document1\.txt/);
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    });
  });

  it('should show document name in delete confirmation modal', async () => {
    const { Wrapper } = createWrapper();

    const DocumentList = (await import('@/components/DocumentList/DocumentList')).default;
    render(
      <Wrapper>
        <DocumentList />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('document1.txt')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByLabelText(/Delete document1\.txt/);
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Are you sure you want to delete "document1\.txt"\?/)
    ).toBeInTheDocument();
  });

  it('should close delete confirmation modal when cancel is clicked', async () => {
    const { Wrapper } = createWrapper();

    const DocumentList = (await import('@/components/DocumentList/DocumentList')).default;
    render(
      <Wrapper>
        <DocumentList />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('document1.txt')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByLabelText(/Delete document1\.txt/);
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Confirm Delete')).not.toBeInTheDocument();
    });
  });

  it('should trigger delete when confirm button is clicked', async () => {
    global.fetch = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
      if (options?.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }
      if (url.includes('action=list')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDocumentsData),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockStatsData),
      });
    });

    const { Wrapper } = createWrapper();

    const DocumentList = (await import('@/components/DocumentList/DocumentList')).default;
    render(
      <Wrapper>
        <DocumentList />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('document1.txt')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByLabelText(/Delete document1\.txt/);
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    });

    const confirmButton = screen.getByText('Delete');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/documents/'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  it('should render supported formats when available', async () => {
    const { Wrapper } = createWrapper();

    const DocumentList = (await import('@/components/DocumentList/DocumentList')).default;
    render(
      <Wrapper>
        <DocumentList />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('document1.txt')).toBeInTheDocument();
    });

    const pdfElements = screen.getAllByText('PDF');
    expect(pdfElements.length).toBeGreaterThan(0);
  });

  it('should handle refresh button click', async () => {
    const { Wrapper } = createWrapper();

    const DocumentList = (await import('@/components/DocumentList/DocumentList')).default;
    render(
      <Wrapper>
        <DocumentList />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Refresh').closest('button');
    if (refreshButton) {
      fireEvent.click(refreshButton);
    }

    expect(global.fetch).toHaveBeenCalled();
  });

  it('should open details modal when view details button is clicked', async () => {
    const { Wrapper } = createWrapper();

    const DocumentList = (await import('@/components/DocumentList/DocumentList')).default;
    render(
      <Wrapper>
        <DocumentList />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('document1.txt')).toBeInTheDocument();
    });

    const detailsButtons = screen.getAllByLabelText(/View details for document1\.txt/);
    fireEvent.click(detailsButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Document Details')).toBeInTheDocument();
    });
  });

  it('should display document information in details modal', async () => {
    const { Wrapper } = createWrapper();

    const DocumentList = (await import('@/components/DocumentList/DocumentList')).default;
    render(
      <Wrapper>
        <DocumentList />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('document1.txt')).toBeInTheDocument();
    });

    const detailsButtons = screen.getAllByLabelText(/View details for document1\.txt/);
    fireEvent.click(detailsButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Document Details')).toBeInTheDocument();
      expect(screen.getByText('File Name:')).toBeInTheDocument();
      expect(screen.getByText('File Type:')).toBeInTheDocument();
      expect(screen.getByText('Upload Date:')).toBeInTheDocument();
      expect(screen.getByText('Chunks:')).toBeInTheDocument();
    });
  });

  it('should close details modal when overlay is clicked', async () => {
    const { Wrapper } = createWrapper();

    const DocumentList = (await import('@/components/DocumentList/DocumentList')).default;
    render(
      <Wrapper>
        <DocumentList />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('document1.txt')).toBeInTheDocument();
    });

    const detailsButtons = screen.getAllByLabelText(/View details for document1\.txt/);
    fireEvent.click(detailsButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Document Details')).toBeInTheDocument();
    });

    const overlay = screen.getByTestId('details-modal-overlay');
    fireEvent.click(overlay);

    await waitFor(() => {
      expect(screen.queryByText('Document Details')).not.toBeInTheDocument();
    });
  });

  it('should close details modal when close button is clicked', async () => {
    const { Wrapper } = createWrapper();

    const DocumentList = (await import('@/components/DocumentList/DocumentList')).default;
    render(
      <Wrapper>
        <DocumentList />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('document1.txt')).toBeInTheDocument();
    });

    const detailsButtons = screen.getAllByLabelText(/View details for document1\.txt/);
    fireEvent.click(detailsButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Document Details')).toBeInTheDocument();
    });

    const closeButton = screen.getByText('✕');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Document Details')).not.toBeInTheDocument();
    });
  });

  it('should open preview modal when preview button is clicked', async () => {
    const { Wrapper } = createWrapper();

    const DocumentList = (await import('@/components/DocumentList/DocumentList')).default;
    render(
      <Wrapper>
        <DocumentList />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('document1.txt')).toBeInTheDocument();
    });

    const previewButtons = screen.getAllByLabelText(/Preview document1\.txt/);
    fireEvent.click(previewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Document Preview')).toBeInTheDocument();
    });
  });

  it('should display content in preview modal', async () => {
    const { Wrapper } = createWrapper();

    const DocumentList = (await import('@/components/DocumentList/DocumentList')).default;
    render(
      <Wrapper>
        <DocumentList />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('document1.txt')).toBeInTheDocument();
    });

    const previewButtons = screen.getAllByLabelText(/Preview document1\.txt/);
    fireEvent.click(previewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Document Preview')).toBeInTheDocument();
      expect(screen.getByText('Sample content for document 1')).toBeInTheDocument();
    });
  });

  it('should show no preview message when content is empty', async () => {
    const { Wrapper } = createWrapper();

    const DocumentList = (await import('@/components/DocumentList/DocumentList')).default;
    render(
      <Wrapper>
        <DocumentList />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('document2.pdf')).toBeInTheDocument();
    });

    const previewButtons = screen.getAllByLabelText(/Preview document2\.pdf/);
    fireEvent.click(previewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Document Preview')).toBeInTheDocument();
      expect(screen.getByText('No content available for preview')).toBeInTheDocument();
    });
  });

  it('should close preview modal when overlay is clicked', async () => {
    const { Wrapper } = createWrapper();

    const DocumentList = (await import('@/components/DocumentList/DocumentList')).default;
    render(
      <Wrapper>
        <DocumentList />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('document1.txt')).toBeInTheDocument();
    });

    const previewButtons = screen.getAllByLabelText(/Preview document1\.txt/);
    fireEvent.click(previewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Document Preview')).toBeInTheDocument();
    });

    const overlay = screen.getByTestId('preview-modal-overlay');
    fireEvent.click(overlay);

    await waitFor(() => {
      expect(screen.queryByText('Document Preview')).not.toBeInTheDocument();
    });
  });

  it('should trigger download when download button is clicked in document list', async () => {
    const { Wrapper } = createWrapper();

    const DocumentList = (await import('@/components/DocumentList/DocumentList')).default;
    render(
      <Wrapper>
        <DocumentList />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('document1.txt')).toBeInTheDocument();
    });

    const downloadButtons = screen.getAllByLabelText(/Download document1\.txt/);
    fireEvent.click(downloadButtons[0]);

    expect(mockMutate).toHaveBeenCalled();
  });

  it('should trigger download when download button in details modal is clicked', async () => {
    const { Wrapper } = createWrapper();

    const DocumentList = (await import('@/components/DocumentList/DocumentList')).default;
    render(
      <Wrapper>
        <DocumentList />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('document1.txt')).toBeInTheDocument();
    });

    const detailsButtons = screen.getAllByLabelText(/View details for document1\.txt/);
    fireEvent.click(detailsButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Document Details')).toBeInTheDocument();
    });

    const downloadLink = screen.getByText('Download file');
    fireEvent.click(downloadLink);

    expect(mockMutate).toHaveBeenCalled();
  });

  it('should show error state when stats query fails', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('action=list')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDocumentsData),
        });
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to load document stats' }),
      });
    });

    const { Wrapper } = createWrapper();

    const DocumentList = (await import('@/components/DocumentList/DocumentList')).default;
    render(
      <Wrapper>
        <DocumentList />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load document stats')).toBeInTheDocument();
    });
  });

  it('should show error state when documents query fails', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('action=list')) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Failed to load document list' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockStatsData),
      });
    });

    const { Wrapper } = createWrapper();

    const DocumentList = (await import('@/components/DocumentList/DocumentList')).default;
    render(
      <Wrapper>
        <DocumentList />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load document list')).toBeInTheDocument();
    });
  });

  it('should refetch documents when documentUploaded event is fired', async () => {
    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const DocumentList = (await import('@/components/DocumentList/DocumentList')).default;
    render(
      <Wrapper>
        <DocumentList />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('document1.txt')).toBeInTheDocument();
    });

    invalidateSpy.mockClear();

    await act(async () => {
      window.dispatchEvent(new CustomEvent('documentUploaded'));
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['documents-stats'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['documents-list'] });
  });

  it('should close delete confirmation modal when clicking overlay', async () => {
    const { Wrapper } = createWrapper();

    const DocumentList = (await import('@/components/DocumentList/DocumentList')).default;
    render(
      <Wrapper>
        <DocumentList />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('document1.txt')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByLabelText(/Delete document1\.txt/);
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    });

    const overlay = screen.getByTestId('delete-modal-overlay');
    fireEvent.click(overlay);

    await waitFor(() => {
      expect(screen.queryByText('Confirm Delete')).not.toBeInTheDocument();
    });
  });
});
