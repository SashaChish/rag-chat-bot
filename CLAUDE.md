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

This is a RAG (Retrieval-Augmented Generation) chatbot built with Next.js 14, LlamaIndex.TS, ChromaDB, and TanStack Query v5. The system allows users to upload documents (PDF, TXT, MD, DOCX) which are chunked, embedded, and stored in a local Chroma vector store. Users can then ask questions and receive AI-generated answers with source citations. TanStack Query provides robust server state management, caching, and automatic refetching for all client-side data fetching.

### Document Upload Flow
```
User uploads file → POST /api/documents → saveUploadedFile() → loadDocument()
→ LlamaIndex.TS File Readers (PDFReader/DocxReader/MarkdownReader/TextFileReader) → addDocuments()
→ VectorStoreIndex.fromDocuments() → Automatic embedding creation & storage [Chroma]
```

### Query Flow
```
User submits question → POST /api/chat → executeQuery()
→ Chat Engine Routing (if chatEngineType provided) → Chat Engine with conversation history
→ Query Engine Fallback (if no chat engine) → Query Engine with selected strategy (default/router/subquestion)
→ Retrieval & Synthesis → Response with sources
```

## Key Modules

### `lib/llamaindex/` - Core RAG Implementation

- **`index.js`** - Document indexing and query orchestration. Manages global index caching, document addition via `VectorStoreIndex.fromDocuments()`, and query execution with chat engine support. Handles index rebuilding from Chroma when cache is empty. Key functions: `addDocuments()`, `executeQuery()`, `getIndexStats()`, `deleteDocument()`, `clearIndex()`.

- **`queryengines.js`** - Query engine factory providing multiple retrieval strategies. Implements factory pattern for engine creation with default vector search, router-based selection, and subquestion decomposition. Functions: `createQueryEngine()`, `createRouterQueryEngine()`, `createSubQuestionEngine()`, `getQueryEngine()`. Supports different query engine types via `queryEngineType` parameter.

- **`chatengines.js`** - Chat engine factory for conversation history support. Provides two strategies: CondenseQuestionChatEngine (condenses history into standalone query) and ContextChatEngine (provides retrieved context directly). Includes history format conversion and engine caching. Functions: `convertToChatMessages()`, `createCondenseChatEngine()`, `createContextChatEngine()`, `getChatEngine()`, `clearChatEngineCache()`.

- **`vectorstore.js`** - ChromaDB connection and collection management. Uses ChromaDB v3.x with local server or in-memory fallback. Provides metadata-only operations: collection retrieval, document counting, clearing, and deletion. Embedding storage is handled by LlamaIndex.TS VectorStoreIndex. Functions: `initChroma()`, `getVectorStore()`, `getChromaClient()`, `getCollection()`, `hasDocuments()`, `clearCollection()`, `deleteDocument()`, `getCollectionStats()`.

- **`settings.js`** - LLM and embedding model configuration via `llamaindex.Settings`. Supports OpenAI and Anthropic providers via environment variables. Initializes global settings for LLM and embedding model access.

- **`loaders.js`** - Document loading using LlamaIndex.TS specialized file readers. Supports PDF (PDFReader), DOCX (DocxReader), Markdown (MarkdownReader), TXT (TextFileReader). Validates file size and type. Key function: `loadDocument()`.

- **`utils.js`** - Utility functions for query validation, input sanitization, source formatting, and environment-based configuration (chunk size, overlap, top-k). Provides helper functions for document ID generation, file size formatting, and system prompts.

### Client State Management

- **`lib/query-client.ts`** - TanStack Query client configuration. Provides factory functions for QueryClient creation with optimized defaults: 5-minute stale time, 10-minute cache time, 3-retry exponential backoff, refetch on window focus and reconnect. Includes `getQueryClient()` with browser caching for Next.js 14 compatibility.

- **`lib/hooks/use-document-download.ts`** - Custom hook for document downloads using TanStack Query mutation.

- **`components/Providers.tsx`** - Client-side provider component wrapping the application with QueryClientProvider and ReactQueryDevtools.

### API Routes (`app/api/`)

- **`chat/route.js`** - POST handles chat messages, validates queries, calls `executeQuery()` with streaming support, returns response with formatted sources. Supports both chat engines (with conversation history) and query engines (backward compatibility). GET returns chat status.

- **`documents/route.js`** - POST handles file uploads, validates files, loads documents, adds to index via `VectorStoreIndex`. GET returns index stats and supported formats. Includes CORS preflight handling.

- **`documents/[id]/route.js`** - DELETE handler for removing documents from the index.

### Components (`components/`)

Components are organized in subdirectories with TypeScript (`.tsx`) and module CSS:

- **`Chat/Chat.tsx`** - Main chat interface with message history, input handling, and auto-scroll. Maintains custom SSE streaming implementation for real-time responses.

- **`Upload/Upload.tsx`** - Drag-and-drop file upload interface. Uses `useMutation` for uploads with progress tracking and automatic query invalidation.

- **`UploadWrapper.tsx`** (in `app/`) - Wraps Upload component and fetches supported formats using `useQuery`.

- **`DocumentList/DocumentList.tsx`** - List of uploaded documents with metadata. Uses `useQuery` for stats/list fetching and `useMutation` for document deletion with optimistic updates.

- **`MessageList/MessageList.tsx`** - Display of user and assistant messages with source citations.

- **`Modal/Modal.tsx`** - Reusable modal component for confirmations and dialogs.

- **`shared/`** - Shared UI components (e.g., Button).

## Architecture & Design Decisions

### Vector Store Architecture

The system uses native LlamaIndex.TS `VectorStoreIndex` for all vector operations, replacing manual ChromaDB embedding management. This approach provides:

- Automatic embedding creation via configured embedding model
- Automatic document chunking with environment-configurable size and overlap
- Automatic persistence to ChromaDB collection
- Global index caching in `global.indexCache` for performance
- Index rebuilding from Chroma when cache is empty

ChromaDB is used exclusively for persistent storage and metadata operations. The vectorstore.js module provides a compatibility layer for direct Chroma operations when needed for collection management.

### Query Engine Architecture

Multiple query strategies are available through the factory pattern in `queryengines.js`:

- **Default Query Engine**: Direct vector search with configurable retrieval mode, response mode, and top-k results. Supports streaming.
- **Router Query Engine**: Uses LLM-based selector to route queries to appropriate tools. Provides verbose logging for debugging.
- **Sub-Question Query Engine**: Decomposes complex queries into sub-questions for comprehensive retrieval.

Query engines are selected via the `queryEngineType` parameter and created on demand. The default engine supports streaming responses.

### Chat Engine Architecture

Conversation history support is provided through chat engines in `chatengines.js`:

- **CondenseQuestionChatEngine**: Condenses conversation history into a standalone query, then retrieves relevant documents. Suitable for maintaining context while keeping queries focused.
- **ContextChatEngine**: Retrieves relevant documents and provides them as context to the LLM along with the conversation history. Suitable for when context needs to be explicit.

Chat engines are prioritized over query engines when `chatEngineType` is provided. They include:

- Conversation history format conversion from client to LlamaIndex ChatMessage format
- Engine caching by session key for performance
- Support for both single queries and streaming responses

### TanStack Query Architecture

Client-side state management uses TanStack Query v5 for server state:

- **Query Keys**: Standardized query keys for cache management:
  - `['documents-stats']` - Document statistics and supported formats
  - `['documents-list']` - List of uploaded documents
  - `['documents-formats']` - Supported file formats
  - `['upload-document']` - Document upload mutations
  - `['delete-document']` - Document deletion mutations
  - `['download-document']` - Document download mutations

- **Query Configuration**: Default QueryClient settings in `lib/query-client.ts`:
  - Stale time: 5 minutes (data remains fresh for 5 min)
  - Cache time: 10 minutes (data kept in cache for 10 min)
  - Retry: 3 attempts with exponential backoff
  - Refetch on window focus: true
  - Refetch on reconnect: true

- **Optimistic Updates**: Document deletion uses optimistic updates with automatic rollback on error, improving perceived performance.

- **Query Invalidation**: Mutations automatically invalidate related queries to keep UI in sync with server state.

- **Provider Pattern**: QueryClient is created in a client-side `Providers` component to avoid issues with passing instances from Server to Client Components in Next.js 14.

- **Minimal Abstraction**: Components use `useQuery` and `useMutation` hooks directly rather than a complex abstraction layer, keeping code maintainable.

- **SSE Streaming Preservation**: Chat component maintains custom fetch with ReadableStream for streaming responses as TanStack Query does not natively support streaming.

### Design Patterns

- **Factory Pattern**: Used for creating query engines and chat engines with different strategies
- **QueryClient Pattern**: TanStack Query client created in client-side provider component to avoid issues with Server/Client Component boundaries in Next.js 14
- **Global Caching**: Index instances cached in `global.indexCache` for performance across requests; TanStack Query provides additional query caching
- **Lazy Initialization**: ChromaDB client initialized on first use with fallback to in-memory; QueryClient cached in browser
- **Fallback Mechanisms**: Index rebuilt from Chroma when cache empty, in-memory Chroma fallback when server unavailable, automatic retry for failed queries
- **Error Handling**: Graceful degradation with helpful messages for expected conditions (no documents, server unavailable)
- **Optimistic Updates**: Document deletion updates cache immediately with rollback on error for improved perceived performance

## Environment Variables

Required in `.env`:

- `OPENAI_API_KEY` - Required for embeddings and OpenAI LLM provider

Optional configuration:

- `ANTHROPIC_API_KEY` - For Anthropic LLM provider
- `LLM_PROVIDER` - Default: `openai` (also supports `anthropic`)
- `LLM_MODEL` - Default: `gpt-4o-mini`
- `EMBEDDING_MODEL` - Default: `text-embedding-3-small`
- `CHROMA_HOST` - Default: `localhost` (ChromaDB server host)
- `CHROMA_PORT` - Default: `8000` (ChromaDB server port)
- `MAX_FILE_SIZE_MB` - Default: `10`
- `CHUNK_SIZE` - Default: `1000` (document chunking size)
- `CHUNK_OVERLAP` - Default: `200` (document chunking overlap)
- `TOP_K_RESULTS` - Default: `3` (number of results to retrieve)
- `QUERY_ENGINE_TYPE` - Default: `default` (also supports `router`, `subquestion`)
- `CHAT_ENGINE_TYPE` - Default: `condense` (also supports `context`)
- `VERBOSE` - Default: `false` (enables verbose logging for router engine)
- `CONTEXT_WINDOW` - Default: `128000` (context window size for the LLM - varies by model)

**TanStack Query Configuration**:
- No additional environment variables required
- Default configuration set in `lib/query-client.ts`
- React Query DevTools available in development mode

## Code Conventions

Project conventions are enforced via Hookify rules in `.claude/` directory:

- **File naming**: Enforced by `hookify.file-naming.local.md`
- **Code commenting**: Enforced by `hookify.code-commenting.local.md`
- **Code refactoring**: Enforced by `hookify.code-refactoring.local.md`
- **Styling**: Enforced by `hookify.styling.local.md`

**File Naming**: Components use PascalCase (`.jsx`), library modules use lowercase (`.js`), API routes use `route.js`

**Exports**: Use `export function` for named exports

**No `any` Types**: Do not use the `any` type. Use proper type definitions or `unknown` when the type cannot be determined at compile time.

**Descriptive Names Over Comments**: When adding new functionality or fixing issues, do not add explanatory comments to code unless truly necessary. Use descriptive variable and function names instead to make code self-documenting.

## Initialization

- LlamaIndex.TS settings initialized via `initializeLlamaIndex()` in API routes on module load
- ChromaDB client initialized lazily on first use with fallback to in-memory if server unavailable
- Global index cache initialized as `global.indexCache` for performance
- TanStack Query client initialized in client-side `Providers` component with browser caching via `getQueryClient()`
- React Query DevTools enabled in development mode

## Important Notes

- LlamaIndex.TS uses `Settings.llm` global for LLM access and `Settings.embedModel` for embeddings
- Document metadata includes: `file_name`, `file_path`, `file_type`, `upload_date`, `file_url`, `stored_file_path`
- VectorStoreIndex handles automatic embedding creation and similarity scoring internally
- Index is cached in global scope for performance across requests
- TanStack Query provides automatic caching, deduplication, and refetching for all client-side data
- Query invalidation happens automatically after upload and delete mutations to keep UI in sync
- Chat engines support conversation history with format conversion
- Query engines and chat engines provide streaming support for real-time responses
- SSE streaming in Chat component uses custom fetch implementation (TanStack Query doesn't support streaming natively)
- Multiple query strategies available via `queryEngineType` parameter
- Multiple chat strategies available via `chatEngineType` parameter
- Document deletion uses optimistic updates with automatic rollback on error
