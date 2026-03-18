# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

### Prerequisites

- Node.js 18+ installed
- OpenAI API key (required for embeddings)
- Optional: Anthropic, Groq, or Ollama for alternative LLM providers

### First-Time Setup

```bash
npm install
cp .env.example .env
# Edit .env with your API keys
npm run dev
```

The application runs on `http://localhost:3000` with ChromaDB automatically managed through ChromaVectorStore using local file-based storage.

## Architecture Overview

This is a RAG (Retrieval-Augmented Generation) chatbot built with Next.js 14, LlamaIndex.TS, ChromaDB, and TanStack Query v5. The system supports multiple LLM providers (OpenAI, Anthropic, Groq, Ollama) and multi-strategy chat engines.

**Core Technologies:**

- **LlamaIndex.TS**: Document loading, embedding, and RAG orchestration
- **@llamaindex/chroma**: ChromaVectorStore integration for persistent vector storage
- **ChromaDB**: Local vector storage with SQLite backend
- **TanStack Query v5**: Client-side state management and caching
- **Next.js 14**: Full-stack framework with API routes and React components

**Key Features:**

- Multi-provider LLM support (OpenAI, Anthropic, Groq, Ollama)
- Chat engines with conversation history and system prompt support
- Document indexing with automatic chunking and embedding
- Source citations for retrieved content
- Serverless-compatible architecture (no global state)

## Development Commands

```bash
npm run dev              # Start development server (http://localhost:3000)
npm run build            # Build for production
npm start                # Start production server (after build)
npm run lint             # Run ESLint
npm run lint -- --fix    # Auto-fix ESLint issues
npm run type-check       # TypeScript type checking
npm run test             # Run tests in watch mode
npm run test:run         # Run all tests once
npm run test:coverage    # Run tests with coverage report
npm run test:e2e         # Run Playwright E2E tests
npm run test:e2e:ui      # Run E2E tests with UI
```

## Project Structure

```
rag-chatbot/
├── __tests__/
│   ├── unit/                         # Unit tests for utilities and components
│   ├── e2e/                          # End-to-end tests with Playwright
│   ├── fixtures/                     # Test data files and mock responses
│   ├── helpers/                      # Test utility functions
│   └── mocks/                        # Mock implementations (MSW, LlamaIndex)
├── app/
│   ├── api/
│   │   ├── chat/route.ts              # Chat API with streaming support
│   │   └── documents/
│   │       ├── route.ts               # Document upload and listing
│   │       └── [id]/route.ts         # Document deletion
│   └── page.tsx                       # Main application page
├── components/
│   ├── Chat/                          # Chat interface with streaming
│   ├── Upload/                        # File upload with TanStack Query
│   ├── DocumentList/                   # Document management UI
│   ├── MessageList/                    # Message display with citations
│   └── Modal/                         # Reusable modal component
├── lib/
│   ├── llamaindex/
│   │   ├── index.ts                   # Core orchestration (add, query, delete)
│   │   ├── chatengines.ts            # Chat engine factory
│   │   ├── sources.ts                # Source extraction utility
│   │   ├── vectorstore.ts            # ChromaDB connection & ChromaVectorStore
│   │   ├── settings.ts               # Multi-provider LLM configuration
│   │   ├── loaders.ts                # Document reader factory
│   │   ├── prompts.ts                # System prompt templates
│   │   └── utils.ts                  # Initialization & ID generation
│   ├── utils/
│   │   ├── file-encoding/            # File extension & MIME type utilities
│   │   ├── file-validation/          # File size validation
│   │   └── index.ts                  # Utility exports
│   ├── query-client.ts                # TanStack Query configuration
│   ├── types/                        # TypeScript type definitions
│   └── hooks/                        # Custom React hooks
└── data/
    └── chroma/                       # ChromaDB SQLite storage (auto-created)
```

## Code Conventions

### Automated Enforcement

Code quality rules are automatically enforced via hookify rules in `.claude/`. These rules block problematic patterns during file writes:

| Rule | Pattern | Enforcement |
|------|---------|-------------|
| `block-eslint-disable` | `eslint-disable` | Blocked in all files |
| `block-as-any` | `as any` | Blocked in all files |
| `block-type-workarounds` | `as never as` / `as unknown as` | Blocked in production code (allowed in `__tests__/` for mocking) |
| `warn-eslint-config` | ESLint config changes | Warning with permission reminder |

### TypeScript Patterns

- **File Extensions**: Components use `.tsx`, library modules use `.ts`, API routes use `route.ts`
- **Type Imports**: Use `import type { ... }` for type-only imports
- **Interface Definitions**: Define interfaces in `lib/types/` for shared types
- **Generics**: Use generics with proper constraints where applicable
- **Proper Typing**: Use specific types or `unknown` when type cannot be determined (never `any`)

### Code Style

- **No Comments**: Use descriptive variable and function names instead
- **Exports**: Use `export function` and `export const` for named exports
- **Destructuring**: Always destructure at call site (props, hook returns, mutation results)
- **Optional Chaining**: Use with fallback objects for potentially undefined properties
- **Remove Unused Code**: Always remove old implementations, unused functions, and dead code

### React Patterns

- **Components**: Function components with TypeScript props interfaces
- **Hooks**: Custom hooks in `lib/hooks/` following `use-*.ts` naming
- **State Management**: Use TanStack Query `useQuery` and `useMutation` hooks
- **Event Handlers**: Define inline or as memoized callbacks for performance

### Testing Guidelines

- **Focus on business logic**: Test actual functionality, not TypeScript's type system
- **Mocking external types**: `as unknown as` is allowed in `__tests__/` for mocking external library types (e.g., `NextRequest`, `VectorStoreIndex`)
- **No ESLint disables in tests**: Tests must follow the same ESLint rules as production code
- **Trust the type system**: If TypeScript prevents a scenario at compile time, don't test it
- **Valid test data**: Use properly typed test objects that match function signatures
- **Edge cases that matter**: Test empty strings, whitespace, boundary values - not null/undefined when the type is non-nullable

### Verification Checklist

When adding new functionality or fixing issues, always ensure all checks pass:

1. `npm run lint` - No ESLint warnings or errors
2. `npm run type-check` - No TypeScript errors
3. `npm run build` - Successful production build
4. `npm run test:run` - All tests pass

### Testing Infrastructure

**Test Framework:** Vitest for unit tests, Playwright for E2E tests

**Test Structure:**
- `__tests__/unit/` - Unit tests for utilities and components
- `__tests__/e2e/` - End-to-end tests with Playwright
- `__tests__/fixtures/` - Test data files and mock API responses
- `__tests__/helpers/` - Test utility functions
- `__tests__/mocks/` - Mock implementations (MSW, LlamaIndex, ChromaDB)

**Mocking Strategy:**
- MSW (Mock Service Worker) for API mocking
- Vitest mocks for LlamaIndex and ChromaDB modules
- Test fixtures for document files and API responses

**Coverage Thresholds:**
- Statements: 80%
- Branches: 75%
- Functions: 85%
- Lines: 80%

## Environment Configuration

### Required Variables

| Variable         | Description                              | Example  |
| ---------------- | ---------------------------------------- | -------- |
| `OPENAI_API_KEY` | OpenAI API key for embeddings (required) | `sk-...` |

### Optional Variables - LLM Providers

| Variable            | Description                                            | Default                     |
| ------------------- | ------------------------------------------------------ | --------------------------- |
| `LLM_PROVIDER`      | LLM provider (`openai`, `anthropic`, `groq`, `ollama`) | `openai`                    |
| `ANTHROPIC_API_KEY` | Anthropic API key                                      | -                           |
| `GROQ_API_KEY`      | Groq API key                                           | -                           |
| `OLLAMA_BASE_URL`   | Ollama API base URL                                    | `http://localhost:11434/v1` |
| `LLM_MODEL`         | Model name for selected provider                       | `gpt-4o-mini`               |
| `EMBEDDING_MODEL`   | Embedding model name                                   | `text-embedding-3-small`    |
| `CONTEXT_WINDOW`    | Context window size for LLM                            | `128000`                    |

### Optional Variables - RAG Configuration

| Variable            | Description                                         | Default    |
| ------------------- | --------------------------------------------------- | ---------- |
| `CHUNK_SIZE`        | Document chunk size in characters                   | `1000`     |
| `CHUNK_OVERLAP`     | Chunk overlap in characters                         | `200`      |
| `TOP_K_RESULTS`     | Number of chunks to retrieve                        | `3`        |
| `CHAT_ENGINE_TYPE`  | Chat strategy (`condense`, `context`)               | `condense` |

### Optional Variables - System Configuration

| Variable             | Description                    | Default         |
| -------------------- | ------------------------------ | --------------- |
| `CHROMA_PERSIST_DIR` | ChromaDB storage directory     | `./data/chroma` |
| `MAX_FILE_SIZE_MB`   | Maximum upload file size       | `10`            |
| `VERBOSE`            | Enable verbose logging         | `false`         |
| `LLM_TIMEOUT`        | LLM request timeout (ms)       | `60000`         |
| `EMBEDDING_TIMEOUT`  | Embedding request timeout (ms) | `60000`         |

## Key Patterns & Modules

### RAG Pipeline (`lib/llamaindex/`)

#### `index.ts` - Core Orchestration

Manages document indexing and query execution using ChromaVectorStore for persistent vector storage. Indexes are created directly from ChromaDB on each query.

**Key Functions:**

- `addDocuments()`: Add documents to ChromaVectorStore
- `executeQuery()`: Execute queries with chat engines
- `deleteDocument()`: Remove document by ID
- `clearIndex()`: Clear all indexed documents from ChromaDB
- `getIndexStats()`: Get index statistics from ChromaDB

**Design Decision:** No global caching - indexes are created on-demand from persistent ChromaDB for serverless compatibility. Query engine routing removed in favor of chat engines which provide all query engine functionality plus conversation history and system prompt support.

#### `settings.ts` - Multi-Provider LLM Configuration

Configures LLM and embedding models via LlamaIndex.TS `Settings`. Supports runtime provider switching.

**Key Functions:**

- `initializeSettings()`: Initialize global LLM and embedding settings
- `configureLLM()`: Configure LLM based on provider
- `configureEmbedding()`: Configure embedding model
- `updateLLMProvider()`: Switch LLM provider at runtime

**Supported Providers:**

- OpenAI (GPT models)
- Anthropic (Claude models)
- Groq (Llama models)
- Ollama (local models)

#### `chatengines.ts` - Chat Engine Factory

Creates chat engines for conversation history support with streaming.

**Key Functions:**

- `createCondenseChatEngine()`: Condense history into standalone query
- `createContextChatEngine()`: Provide retrieved context explicitly
- `getChatEngine()`: Get cached chat engine
- `convertToChatMessages()`: Convert client format to LlamaIndex format

**Engine Types:**

- Condense: Condenses history, retrieves, then answers
- Context: Retrieves context first, provides to LLM with history

#### `sources.ts` - Source Extraction Utility

Provides reusable source extraction functionality for chat and query responses.

**Key Functions:**

- `extractSources()`: Extract source information from LlamaIndex source nodes

### Utility Modules (`lib/utils/`)

#### `file-encoding/` - File Extension & MIME Type Utilities

Handles file extension detection and MIME type mapping for supported document formats.

**Key Functions:**

- `getFileExtension()`: Extract file extension from filename
- `getExtensionFromMime()`: Map MIME type to file extension
- `SUPPORTED_MIME_TYPES`: Supported MIME type registry

#### `file-validation/` - File Size Validation

Validates file sizes against configured limits before upload processing.

**Key Functions:**

- `validateFileSize()`: Check file size against MAX_FILE_SIZE_MB limit
- `formatFileSize()`: Format bytes to human-readable size string

#### `vectorstore.ts` - ChromaDB Management

ChromaDB management through ChromaVectorStore using @llamaindex/chroma for persistent vector storage. ChromaVectorStore creates and manages its own ChromaDB client internally.

**Key Functions:**

- `getChromaVectorStore()`: Get LlamaIndex ChromaVectorStore for document indexing
- `getCollection()`: Get Chroma collection for metadata operations via ChromaVectorStore
- `hasDocuments()`: Check if documents exist
- `clearCollection()`: Clear all documents by deleting all IDs
- `deleteDocument()`: Delete document by ID
- `getCollectionStats()`: Get collection statistics
- `getAllDocuments()`: Get all documents with metadata
- `deleteDocumentByName()`: Delete document by file name

**Design Decision:** ChromaVectorStore manages ChromaDB client internally - no manual ChromaClient initialization required. Uses chromadb v1.10.3 compatible API with IncludeEnum for type-safe include parameters.

#### `loaders.ts` - Document Loader Factory

Factory for selecting appropriate LlamaIndex.TS file readers.

**Supported Formats:**

- PDF: `PDFReader`
- DOCX: `DocxReader`
- Markdown: `MarkdownReader`
- TXT: `TextFileReader`

**Key Functions:**

- `loadDocument()`: Load document with validation
- `getLoaderForFile()`: Select loader by file type

#### `prompts.ts` - System Prompt Templates

Provides customizable system prompt templates for different use cases.

**Templates:**

- RAG system prompt for document-based queries
- Custom prompt support via environment variable

#### `utils.ts` - Initialization & ID Generation

Helper functions for LlamaIndex initialization and document ID generation.

**Key Functions:**

- `initializeLlamaIndex()`: Initialize LlamaIndex.TS settings
- `generateDocumentId()`: Generate unique document IDs from filenames

### State Management

#### TanStack Query Configuration (`lib/query-client.ts`)

**Default QueryClient Settings:**

- Stale time: 5 minutes
- Cache time: 10 minutes
- Retry: 3 attempts with exponential backoff
- Refetch on window focus: enabled
- Refetch on reconnect: enabled

**Query Keys:**

- `['documents-stats']`: Document statistics and supported formats
- `['documents-list']`: List of uploaded documents
- `['upload-document']`: Document upload mutation
- `['delete-document']`: Document deletion mutation
- `['download-document']`: Document download mutation

**Patterns:**

- Always destructure hook returns: `const { data, isLoading, error } = useQuery(...)`
- Use `useMutation` with `invalidateQueries` for cache updates
- Optimistic updates for deletions with automatic rollback

### API Routes

| Route                 | Methods   | Purpose                             |
| --------------------- | --------- | ----------------------------------- |
| `/api/chat`           | POST, GET | Handle chat messages with streaming |
| `/api/documents`      | POST, GET | Upload documents, get stats         |
| `/api/documents/[id]` | DELETE    | Delete document by ID               |

**Chat API Features:**

- Streaming responses via SSE
- Chat engine support (condense, context)
- Source citations in response
- Conversation history support
- System prompt support via chat engines

### Components

| Component      | Purpose                              | Location                   |
| -------------- | ------------------------------------ | -------------------------- |
| `Chat`         | Main chat interface with streaming   | `components/Chat/`         |
| `Upload`       | Drag-and-drop file upload            | `components/Upload/`       |
| `DocumentList` | List uploaded documents with actions | `components/DocumentList/` |
| `MessageList`  | Display messages with citations      | `components/MessageList/`  |
| `Modal`        | Reusable modal component             | `components/Modal/`        |
| `Providers`    | Query client provider wrapper        | `components/Providers.tsx` |

**Component Patterns:**

- Each component directory contains: `.tsx`, `.types.ts`, `.utils.ts`, `.module.css`
- TanStack Query hooks for data fetching
- TypeScript props interfaces in `.types.ts` files
- Utility functions in `.utils.ts` files

## Common Tasks

### Adding a New Document Reader

1. Add reader import to `lib/llamaindex/loaders.ts`
2. Update `getLoaderForFile()` function to handle new extension
3. Update supported formats in `.env.example` and API documentation

### Switching LLM Provider

**Runtime:**

```typescript
import { updateLLMProvider } from "@/lib/llamaindex/settings";
updateLLMProvider("anthropic", "claude-3-5-sonnet-20241022");
```

**Environment:**

```bash
# In .env
LLM_PROVIDER=ollama
LLM_MODEL=llama3.2
OLLAMA_BASE_URL=http://localhost:11434/v1
```

### Debugging Query Issues

1. **No documents found**: Check ChromaVectorStore collection and document indexing via getCollectionStats()
2. **Empty response**: Verify LLM API key and model configuration
3. **Slow queries**: Adjust `TOP_K_RESULTS` or enable streaming
4. **Citation errors**: Check document metadata in ChromaVectorStore collection
5. **ChromaVectorStore errors**: Verify chromadb version compatibility and IncludeEnum usage

## Troubleshooting

### ChromaDB Connection Issues

**Symptom:** ChromaDB operations fail or return connection errors

**Solution:**

- Check file system permissions for ChromaDB storage directory
- ChromaVectorStore handles ChromaDB client initialization automatically
- Uses local file-based storage (no server required for basic operations)
- Verify storage directory is accessible and not locked

### ChromaVectorStore Version Mismatch

**Symptom:** Type errors or runtime errors with ChromaDB operations

**Solution:**

- Ensure `chromadb@1.10.3` matches `@llamaindex/chroma@0.0.36` requirements
- ChromaVectorStore requires specific chromadb version for API compatibility
- Use chromadb's `IncludeEnum` for type-safe collection operations (metadatas, documents, embeddings, distances)
- ChromaVectorStore manages ChromaDB client internally - do not manually instantiate ChromaClient

### Document Upload Fails

**Symptom:** File upload rejected or fails processing

**Solution:**

- Check file size < `MAX_FILE_SIZE_MB` (default 10MB)
- Verify file format is supported (PDF, TXT, MD, DOCX)
- Check LlamaIndex.TS reader for file type
- Review server logs for parsing errors

### No Query Results

**Symptom:** Query returns "no relevant documents found"

**Solution:**

- Verify documents are indexed: Check `/api/documents` stats
- Adjust `CHUNK_SIZE` and `CHUNK_OVERLAP` for better retrieval
- Increase `TOP_K_RESULTS` for more candidates
- Try different chat engine types (condense vs context)

### LLM API Errors

**Symptom:** "API key invalid" or "rate limit exceeded"

**Solution:**

- Verify API key in `.env` is correct
- Check provider status page for outages
- Switch to alternative provider using `updateLLMProvider()`
- Configure appropriate timeouts: `LLM_TIMEOUT`, `EMBEDDING_TIMEOUT`

### TypeScript Build Errors

**Symptom:** Type errors in build

**Solution:**

- Run `npm run type-check` for detailed error messages
- Check imports use correct file extensions (`.ts`, `.tsx`)
- Verify all interfaces are properly defined
- Run `npm run lint -- --fix` for auto-fixable issues

## Performance Notes

### ChromaDB Vector Store

- ChromaVectorStore provides persistent vector storage with automatic ChromaDB client management
- ChromaVectorStore creates and manages ChromaDB client internally
- Indexes are created on-demand from ChromaVectorStore (no caching)
- Query performance with local file-based storage for fast retrieval
- Chat engines cached by session key (separate from index)

### Streaming

- Chat API supports SSE streaming for real-time responses
- TanStack Query does not support streaming (custom fetch in Chat component)

### Optimizations

- Automatic query deduplication via TanStack Query
- Optimistic updates for immediate UI feedback
- Refetch on window focus for fresh data
- Configurable chunking for optimal retrieval

### ChromaDB Performance

- Local SQLite backend for fast queries
- Metadata-only operations for document management
- Automatic persistence to disk

## Design Patterns

- **Factory Pattern**: Chat engines created via factory functions
- **Vector Store Pattern**: ChromaVectorStore for persistent storage via ChromaDB with automatic client management
- **Provider Pattern**: TanStack Query client created in client-side provider
- **Destructuring Pattern**: All object properties and hook returns destructured at call site
- **Lazy Initialization**: ChromaVectorStore and QueryClient initialized on first use
- **On-Demand Indexing**: Indexes created from ChromaVectorStore when needed (no global cache)
- **Error Handling**: Graceful degradation with helpful messages
- **Optimistic Updates**: Document deletion updates cache immediately with rollback on error
- **Type-Safe Operations**: Use chromadb IncludeEnum for collection operations instead of string literals
