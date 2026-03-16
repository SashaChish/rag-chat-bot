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

The application runs on `http://localhost:3000` with ChromaDB automatically initialized in local storage.

## Architecture Overview

This is a RAG (Retrieval-Augmented Generation) chatbot built with Next.js 14, LlamaIndex.TS, ChromaDB, and TanStack Query v5. The system supports multiple LLM providers (OpenAI, Anthropic, Groq, Ollama), agent-based querying with ReAct pattern, and multi-strategy retrieval engines.

**Core Technologies:**
- **LlamaIndex.TS**: Document loading, embedding, and RAG orchestration
- **ChromaDB**: Local vector storage with SQLite backend
- **TanStack Query v5**: Client-side state management and caching
- **Next.js 14**: Full-stack framework with API routes and React components

**Key Features:**
- Multi-provider LLM support (OpenAI, Anthropic, Groq, Ollama)
- ReAct agents with streaming support
- Multiple query strategies (default, router, subquestion)
- Chat engines with conversation history
- Document indexing with automatic chunking and embedding
- Source citations for retrieved content

## Development Commands

```bash
npm run dev              # Start development server (http://localhost:3000)
npm run build            # Build for production
npm start                # Start production server (after build)
npm run lint             # Run ESLint
npm run lint -- --fix    # Auto-fix ESLint issues
npm run type-check       # TypeScript type checking
```

## Project Structure

```
rag-chatbot/
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
│   │   ├── agents.ts                  # ReAct agent factory with tools
│   │   ├── queryengines.ts            # Query engine strategies
│   │   ├── chatengines.ts            # Chat engine factory
│   │   ├── vectorstore.ts            # ChromaDB connection & management
│   │   ├── settings.ts               # Multi-provider LLM configuration
│   │   ├── loaders.ts                # Document reader factory
│   │   ├── prompts.ts                # System prompt templates
│   │   └── utils.ts                 # Validation & helpers
│   ├── query-client.ts                # TanStack Query configuration
│   ├── types/                        # TypeScript type definitions
│   └── hooks/                        # Custom React hooks
└── data/
    └── chroma/                       # ChromaDB SQLite storage (auto-created)
```

## Code Conventions

### TypeScript Patterns
- **File Extensions**: Components use `.tsx`, library modules use `.ts`, API routes use `route.ts`
- **No `any` Types**: Use proper type definitions or `unknown` when type cannot be determined
- **Type Imports**: Use `import type { ... }` for type-only imports
- **Interface Definitions**: Define interfaces in `lib/types/` for shared types
- **Generics**: Use generics with proper constraints where applicable

### Code Style
- **No Comments**: Use descriptive variable and function names instead
- **Exports**: Use `export function` and `export const` for named exports
- **Destructuring**: Always destructure at call site (props, hook returns, mutation results)
- **Optional Chaining**: Use with fallback objects for potentially undefined properties
- **Remove Unused Code**: Always remove old implementations, unused functions, and dead code. Never leave unused code in the codebase.

### React Patterns
- **Components**: Function components with TypeScript props interfaces
- **Hooks**: Custom hooks in `lib/hooks/` following `use-*.ts` naming
- **State Management**: Use TanStack Query `useQuery` and `useMutation` hooks
- **Event Handlers**: Define inline or as memoized callbacks for performance

## Environment Configuration

### Required Variables

| Variable | Description | Example |
|-----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for embeddings (required) | `sk-...` |

### Optional Variables - LLM Providers

| Variable | Description | Default |
|-----------|-------------|----------|
| `LLM_PROVIDER` | LLM provider (`openai`, `anthropic`, `groq`, `ollama`) | `openai` |
| `ANTHROPIC_API_KEY` | Anthropic API key | - |
| `GROQ_API_KEY` | Groq API key | - |
| `OLLAMA_BASE_URL` | Ollama API base URL | `http://localhost:11434/v1` |
| `LLM_MODEL` | Model name for selected provider | `gpt-4o-mini` |
| `EMBEDDING_MODEL` | Embedding model name | `text-embedding-3-small` |
| `CONTEXT_WINDOW` | Context window size for LLM | `128000` |

### Optional Variables - RAG Configuration

| Variable | Description | Default |
|-----------|-------------|----------|
| `CHUNK_SIZE` | Document chunk size in characters | `1000` |
| `CHUNK_OVERLAP` | Chunk overlap in characters | `200` |
| `TOP_K_RESULTS` | Number of chunks to retrieve | `3` |
| `QUERY_ENGINE_TYPE` | Query strategy (`default`, `router`, `subquestion`) | `default` |
| `CHAT_ENGINE_TYPE` | Chat strategy (`condense`, `context`) | `condense` |

### Optional Variables - Agent Configuration

| Variable | Description | Default |
|-----------|-------------|----------|
| `ENABLE_AGENT` | Enable ReAct agents | `false` |
| `DEFAULT_AGENT_TYPE` | Agent type (`react`) | `react` |
| `AGENT_MAX_ITERATIONS` | Maximum agent iterations | `10` |
| `AGENT_VERBOSE` | Enable agent logging | `false` |

### Optional Variables - System Configuration

| Variable | Description | Default |
|-----------|-------------|----------|
| `CHROMA_PERSIST_DIR` | ChromaDB storage directory | `./data/chroma` |
| `MAX_FILE_SIZE_MB` | Maximum upload file size | `10` |
| `VERBOSE` | Enable verbose logging | `false` |
| `LLM_TIMEOUT` | LLM request timeout (ms) | `60000` |
| `EMBEDDING_TIMEOUT` | Embedding request timeout (ms) | `60000` |

## Key Patterns & Modules

### RAG Pipeline (`lib/llamaindex/`)

#### `index.ts` - Core Orchestration
Manages document indexing, query execution, and global index caching. Handles index rebuilding from Chroma when cache is empty.

**Key Functions:**
- `addDocuments()`: Add documents to vector index
- `executeQuery()`: Execute queries with chat/agent/agent engines
- `deleteDocument()`: Remove document by ID
- `clearIndex()`: Clear all indexed documents
- `getIndexStats()`: Get index statistics

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

#### `agents.ts` - ReAct Agent Factory
Creates ReAct (Reasoning + Acting) agents with document search tools and streaming support.

**Key Functions:**
- `createReActAgent()`: Create ReAct agent with document search tool
- `createDocumentSearchTool()`: Create search tool for agent use
- `getAgent()`: Get cached agent by type and session
- `clearAgentCache()`: Clear agent cache

**Agent Types:**
- ReAct: Reasoning and acting with iterative tool use
- Streaming: Real-time response streaming

#### `queryengines.ts` - Query Engine Strategies
Factory for creating query engines with different retrieval strategies.

**Key Functions:**
- `createQueryEngine()`: Create default vector search engine
- `createRouterQueryEngine()`: Create LLM-based routing engine
- `createSubQuestionEngine()`: Create sub-question decomposition engine
- `getQueryEngine()`: Get cached engine by type

**Engine Types:**
- Default: Direct vector search with configurable retrieval
- Router: LLM-based routing to appropriate tools
- SubQuestion: Decompose complex queries into sub-questions

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

#### `vectorstore.ts` - ChromaDB Management
ChromaDB connection and collection management using v3.x with local SQLite.

**Key Functions:**
- `initChroma()`: Initialize ChromaDB client
- `getVectorStore()`: Get LlamaIndex Chroma vector store
- `getCollection()`: Get Chroma collection for metadata operations
- `hasDocuments()`: Check if documents exist
- `clearCollection()`: Clear all documents
- `deleteDocument()`: Delete document by ID
- `getCollectionStats()`: Get collection statistics

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

#### `utils.ts` - Utilities
Helper functions for validation, sanitization, and configuration.

**Key Functions:**
- `validateQuery()`: Query validation
- `sanitizeInput()`: Input sanitization
- `formatSources()`: Source formatting for display
- `getChunkConfig()`: Get chunking configuration from environment

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

| Route | Methods | Purpose |
|-------|----------|---------|
| `/api/chat` | POST, GET | Handle chat messages with streaming |
| `/api/documents` | POST, GET | Upload documents, get stats |
| `/api/documents/[id]` | DELETE | Delete document by ID |

**Chat API Features:**
- Streaming responses via SSE
- Multi-engine support (query, chat, agent)
- Source citations in response
- Conversation history support

### Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `Chat` | Main chat interface with streaming | `components/Chat/` |
| `Upload` | Drag-and-drop file upload | `components/Upload/` |
| `DocumentList` | List uploaded documents with actions | `components/DocumentList/` |
| `MessageList` | Display messages with citations | `components/MessageList/` |
| `Modal` | Reusable modal component | `components/Modal/` |
| `Providers` | Query client provider wrapper | `components/Providers.tsx` |

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

### Implementing a New Query Engine

1. Add factory function to `lib/llamaindex/queryengines.ts`
2. Export from `lib/llamaindex/index.ts`
3. Add to `QUERY_ENGINE_TYPE` options in documentation

### Switching LLM Provider

**Runtime:**
```typescript
import { updateLLMProvider } from '@/lib/llamaindex/settings';
updateLLMProvider('anthropic', 'claude-3-5-sonnet-20241022');
```

**Environment:**
```bash
# In .env
LLM_PROVIDER=ollama
LLM_MODEL=llama3.2
OLLAMA_BASE_URL=http://localhost:11434/v1
```

### Debugging Query Issues

1. **No documents found**: Check ChromaDB connection and document indexing
2. **Empty response**: Verify LLM API key and model configuration
3. **Slow queries**: Adjust `TOP_K_RESULTS` or enable streaming
4. **Citation errors**: Check document metadata in `vectorstore.ts`

### Configuring ReAct Agents

1. Set `ENABLE_AGENT=true` in `.env`
2. Optionally configure `AGENT_MAX_ITERATIONS` and `AGENT_VERBOSE`
3. Agents use document search tool automatically for retrieval

## Troubleshooting

### ChromaDB Connection Issues

**Symptom:** "Failed to initialize ChromaDB" error

**Solution:**
- Check `CHROMA_PERSIST_DIR` is writable
- Verify ChromaDB is not running on conflicting port
- System falls back to in-memory storage automatically

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
- Try different query engine types

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

### Index Caching
- Global index cache (`global.indexCache`) for performance
- Rebuilt from Chroma on server restart
- Chat engines cached by session key
- Query engines cached by type

### Streaming
- Chat API supports SSE streaming for real-time responses
- ReAct agents support streaming responses
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

- **Factory Pattern**: Query engines, chat engines, agents created via factory functions
- **Global Caching**: Index and engine instances cached for performance
- **Provider Pattern**: TanStack Query client created in client-side provider
- **Destructuring Pattern**: All object properties and hook returns destructured at call site
- **Lazy Initialization**: ChromaDB and QueryClient initialized on first use
- **Fallback Mechanisms**: In-memory Chroma fallback, automatic retry for failed queries
- **Error Handling**: Graceful degradation with helpful messages
- **Optimistic Updates**: Document deletion updates cache immediately with rollback on error
