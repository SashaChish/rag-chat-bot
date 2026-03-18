import { beforeEach, vi } from 'vitest';

export const mockFromDocuments = vi.fn();
export const mockFromVectorStore = vi.fn();
export const mockQuery = vi.fn();
export const mockRetrieve = vi.fn();
export const mockAsRetriever = vi.fn();

export const mockDocument = {
  id_: 'test-doc-id',
  text: 'Test document content',
  metadata: {
    filename: 'test.txt',
    fileSize: 1024,
    uploadDate: '2026-03-17T00:00:00Z',
  },
};

export const mockNode = {
  node_: {
    id_: 'test-node-id',
    text: 'Test node content',
    metadata: {
      filename: 'test.txt',
      file_url: '/documents/test.txt',
    },
  },
};

export const mockSourceNodes = [
  {
    node_: {
      id_: 'node-1',
      text: 'Content from test.txt',
      metadata: {
        filename: 'test.txt',
        file_url: '/documents/test.txt',
      },
    },
  },
  {
    node_: {
      id_: 'node-2',
      text: 'More content from test.txt',
      metadata: {
        filename: 'test.txt',
        file_url: '/documents/test.txt',
      },
    },
  },
];

export const mockQueryResponse = {
  response: {
    text: 'This is a test response',
    sourceNodes: mockSourceNodes,
  },
};

export const mockVectorStore = {
  client: {
    count: vi.fn().mockResolvedValue(10),
  },
};

beforeEach(() => {
  mockFromDocuments.mockResolvedValue({
    asRetriever: mockAsRetriever.mockReturnValue({
      retrieve: mockRetrieve.mockResolvedValue(mockSourceNodes),
    }),
    asQueryEngine: vi.fn().mockReturnValue({
      query: mockQuery.mockResolvedValue(mockQueryResponse),
    }),
  });

  mockFromVectorStore.mockResolvedValue({
    asRetriever: mockAsRetriever.mockReturnValue({
      retrieve: mockRetrieve.mockResolvedValue(mockSourceNodes),
    }),
    asQueryEngine: vi.fn().mockReturnValue({
      query: mockQuery.mockResolvedValue(mockQueryResponse),
    }),
  });
});
