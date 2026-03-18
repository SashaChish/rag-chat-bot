export const sampleTextDocument = `This is a sample text document for testing purposes.

It contains multiple paragraphs to demonstrate document processing capabilities.

The RAG chatbot system uses this content for testing document upload, indexing, and retrieval operations.

This document is used in unit tests to verify the file validation, encoding, and processing logic works correctly.`;

export const sampleMarkdownDocument = `# Sample Markdown Document

This is a markdown document for testing the RAG chatbot system.

## Features

- **Document Upload**: Support for various file formats
- **Indexing**: Automatic chunking and embedding generation
- **Retrieval**: Query-based content retrieval with citations

## Testing

This document helps verify:
1. Markdown parsing
2. Content extraction
3. Metadata generation`;

export const mockPDFBuffer = Buffer.from(
  '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Count 1\n/Kids [3 0 R]\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Resources <<\n/Font <<\n/F1 4 0 R\n>>\n>>\n/Contents 5 0 R\n>>\nendobj\n4 0 obj\n<<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\nendobj\n5 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(Mock PDF) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000234 00000 n\n0000000289 00000 n\ntrailer\n<<\n/Size 6\n/Root 1 0 R\n>>\nstartxref\n359\n%%EOF',
  'utf-8'
);

export const mockDOCXBuffer = Buffer.from(
  'PK\x03\x04\x14\x00\x00\x00\x08\x00' + 'MockDOCXContentPlaceholder'.repeat(100),
  'utf-8'
);

export const sampleFileMetadata = {
  filename: 'test.txt',
  fileSize: 512,
  fileType: 'text/plain',
  uploadDate: new Date('2026-03-17T00:00:00Z'),
};

export const mockDocumentList = [
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
  {
    id: 'doc-3',
    filename: 'document3.pdf',
    fileSize: 4096,
    uploadDate: '2026-03-17T14:15:00Z',
    chunkCount: 15,
  },
];
