export const mockChatResponse = {
  message: 'This is a mock chat response',
  sources: [
    {
      filename: 'test.txt',
      fileUrl: '/documents/test.txt',
      similarity: 0.95,
      content: 'Test document content snippet',
    },
  ],
};

export const mockUploadResponse = {
  id: 'doc-123',
  filename: 'test.txt',
  fileSize: 1024,
  uploadDate: '2026-03-17T00:00:00Z',
  chunkCount: 5,
};

export const mockDocumentStatsResponse = {
  totalDocuments: 5,
  supportedFormats: ['pdf', 'docx', 'txt', 'md'],
};

export const mockDocumentListResponse = [
  {
    id: 'doc-1',
    filename: 'document1.txt',
    fileSize: 1024,
    uploadDate: '2026-03-17T10:00:00Z',
    chunkCount: 5,
  },
  {
    id: 'doc-2',
    filename: 'document2.md',
    fileSize: 2048,
    uploadDate: '2026-03-17T11:30:00Z',
    chunkCount: 10,
  },
];

export const mockDeleteResponse = {
  success: true,
  message: 'Document deleted successfully',
};

export const mockErrorResponse = {
  error: 'An error occurred',
  message: 'Failed to process request',
};

export const mockValidationErrorResponse = {
  error: 'Validation failed',
  details: {
    fileSize: 'File size exceeds limit',
    fileType: 'Unsupported file type',
  },
};
