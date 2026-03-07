# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

```bash
npm run dev              # Start development server (http://localhost:3000)
npm run build            # Build for production
npm start                # Start production server (after build)
npm run lint             # Run ESLint
npm run lint -- --fix    # Auto-fix ESLint issues
```

## Architecture Overview

This is a RAG (Retrieval-Augmented Generation) chatbot built with Next.js 14, LlamaIndex.TS, and ChromaDB. The system allows users to upload documents (PDF, TXT, MD, DOCX) which are chunked, embedded, and stored in a local Chroma vector store. Users can then ask questions and receive AI-generated answers with source citations.

### Document Upload Flow
```
User uploads file → POST /api/documents → saveUploadedFile() → loadDocument()
→ LlamaIndex.TS File Readers (PDFReader/DocxReader/MarkdownReader/TextFileReader) → addDocuments()
→ createEmbeddings() → addEmbeddings() [Chroma]
```

### Query Flow
```
User submits question → POST /api/chat → executeQuery()
→ queryDocuments() → createEmbeddings() [query] → queryCollection() [Chroma]
→ Build context with retrieved chunks → LLM chat() → Response with sources
```

## Key Modules

### `lib/llamaindex/` - Core RAG Implementation
- **`index.js`** - Document indexing and query orchestration. Manages embedding creation, document addition to Chroma, and query execution. Key functions: `addDocuments()`, `queryDocuments()`, `executeQuery()`.
- **`vectorstore.js`** - ChromaDB connection and collection management. Uses local SQLite persistence at `./data/chroma`. Functions: `initChroma()`, `getCollection()`, `addEmbeddings()`, `queryCollection()`.
- **`settings.js`** - LLM and embedding model configuration via `llamaindex.Settings`. Supports OpenAI and Anthropic providers via environment variables.
- **`loaders.js`** - Document loading using LlamaIndex.TS specialized file readers. Supports PDF (PDFReader), DOCX (DocxReader), Markdown (MarkdownReader), TXT (TextFileReader). Validates file size and type. Key function: `loadDocument()`.
- **`utils.js`** - Utility functions for query validation, input sanitization, source formatting, and environment-based configuration (chunk size, overlap, top-k).

### API Routes (`app/api/`)
- **`chat/route.js`** - POST handles chat messages, validates queries, calls `executeQuery()`, returns response with formatted sources. GET returns chat status.
- **`documents/route.js`** - POST handles file uploads, validates files, loads documents, adds to index. GET returns index stats and supported formats.
- **`documents/[id]/route.js`** - DELETE handler for removing documents from the index.

### Components (`components/`)
- **`Chat.jsx`** - Main chat interface with message history, input handling, and auto-scroll.
- **`Upload.jsx`** - Drag-and-drop file upload interface.
- **`MessageList.jsx`** - Display of user and assistant messages with source citations.
- **`DocumentList.jsx`** - List of uploaded documents with metadata.

## Environment Variables

Required in `.env`:
- `OPENAI_API_KEY` - Required for embeddings and OpenAI LLM provider

Optional configuration:
- `ANTHROPIC_API_KEY` - For Anthropic LLM provider
- `LLM_PROVIDER` - Default: `openai` (also supports `anthropic`)
- `LLM_MODEL` - Default: `gpt-4o-mini`
- `EMBEDDING_MODEL` - Default: `text-embedding-3-small`
- `CHROMA_PERSIST_DIR` - Default: `./data/chroma`
- `MAX_FILE_SIZE_MB` - Default: `10`
- `CHUNK_SIZE` - Default: `1000`
- `CHUNK_OVERLAP` - Default: `200`
- `TOP_K_RESULTS` - Default: `3`

## File Naming Conventions
- Components: PascalCase with `.jsx` extension
- API routes: `route.js` in API directory
- Library modules: lowercase with `.js` extension
- Use `export function` for named exports

## Styling
- CSS-in-JS with styled-jsx (`<style jsx>`)
- Global styles in `<style jsx global>`
- Tailwind-style utility class naming (e.g., `.chat-container`, `.chat-input`)

## Initialization
- LlamaIndex.TS settings initialized via `initializeLlamaIndex()` in API routes on module load
- Chroma client initialized lazily on first use with fallback to in-memory if persistence fails
- Embedding model singleton cached in `index.js`

## Important Notes
- LlamaIndex.TS uses `Settings.llm` global for LLM access and `Settings.embedModel` for embeddings
- Document IDs are generated as `{filename}-{timestamp}-{random}` but stored chunks have separate IDs
- Chroma queries return distances, which are converted to similarity scores (1 - distance)
- Document metadata includes: `file_name`, `file_path`, `file_type`, `upload_date`
- Temporary uploaded files are cleaned up after processing
