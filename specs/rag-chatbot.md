# Feature: RAG Chatbot

## Overview

### Purpose
This feature implements a minimal Retrieval-Augmented Generation (RAG) chatbot that allows users to ask questions, retrieve relevant context from uploaded documents, and receive AI-powered responses. The system uses LlamaIndex.TS as the primary RAG framework and Chroma (with local SQLite backend) for vector storage, achieving near-zero infrastructure overhead while leveraging battle-tested components.

### Goals
- Enable users to upload and index documents for semantic search
- Provide a conversational interface for querying document content
- Deliver contextually relevant AI responses using retrieved document chunks
- Maintain simple deployment with minimal external dependencies
- Support flexible LLM provider configuration
- Leverage LlamaIndex.TS for rapid development and proven RAG patterns

### Scope
**In Scope:**
- Chat interface with message history display
- Document upload and indexing using LlamaIndex.TS document loaders
- Semantic vector search via Chroma with local SQLite storage
- LLM integration using LlamaIndex.TS multi-provider support
- Source/citation display for retrieved documents
- RAG pipeline orchestration via LlamaIndex.TS QueryEngine

**Out of Scope:**
- User authentication and authorization
- Multi-user support with isolated document collections
- Advanced document processing (OCR, image extraction)
- Real-time collaboration features
- Document editing after upload
- Conversation memory beyond chat history display
- Document versioning
- Custom vector store implementations (use LlamaIndex.TS abstractions)

## Requirements

### Functional Requirements

1. **FR-1: Chat Interface** - User can type questions/prompts into a chat interface
   - Acceptance Criteria: Text input field is available and functional, messages are displayed in chronological order
   - Priority: High

2. **FR-2: Vector Search** - System uses LlamaIndex.TS to search Chroma vector store for relevant context
   - Acceptance Criteria: Query is embedded using LlamaIndex.TS embedding models, top-k similar chunks retrieved via QueryEngine
   - Priority: High

3. **FR-3: Prompt Enrichment** - Retrieved context is combined with the user question via LlamaIndex.TS
   - Acceptance Criteria: Retrieved chunks are formatted and injected into prompt template using LlamaIndex.TS patterns
   - Priority: High

4. **FR-4: LLM Response Generation** - LLM generates response using LlamaIndex.TS QueryEngine
   - Acceptance Criteria: Response is generated via LlamaIndex.TS QueryEngine, supports multiple LLM providers
   - Priority: High

5. **FR-5: Response Display** - Response is displayed to the user in the chat interface
   - Acceptance Criteria: Assistant messages appear in chat, markdown formatting supported, loading state shown during generation
   - Priority: High

6. **FR-6: Document Upload** - Documents can be uploaded and indexed via LlamaIndex.TS
   - Acceptance Criteria: File upload dialog accepts supported formats, LlamaIndex.TS document loaders process files, Chroma stores embeddings
   - Priority: Medium

7. **FR-7: Chat History** - Chat history is displayed with user and bot messages
   - Acceptance Criteria: All messages in session displayed, messages styled differently for user vs assistant, scroll handles long conversations
   - Priority: Medium

8. **FR-8: Source Citations** - Response includes sources/citations of retrieved documents
   - Acceptance Criteria: Source documents listed with filenames, chunk references provided, users can link to context
   - Priority: Low

### Non-Functional Requirements

#### Performance
- Response time < 5 seconds for typical queries
- Vector search via Chroma must complete in < 2 seconds for 10K+ chunks
- Document indexing must complete in reasonable time for files up to 10MB

#### Security
- API keys for LLM providers stored securely (environment variables)
- File upload size limits to prevent abuse
- Input sanitization for all user queries

#### Usability
- Intuitive chat interface similar to familiar messaging apps
- Clear loading states during processing
- Helpful error messages for failures

#### Deployment
- Single-command startup (Chroma runs locally with SQLite backend)
- Self-contained data storage in Chroma SQLite file
- Compatible with common hosting platforms (Vercel, Railway, local)

## Architecture

### Design Decisions

1. **LlamaIndex.TS as Primary RAG Framework**
   - Rationale: Provides battle-tested document loaders, text splitters, vector store abstractions, and query engines. Dramatically reduces development time compared to manual implementation.
   - Alternative: Manual implementation would require building all RAG components from scratch
   - Trade-offs: Additional dependency (llamaindex), but provides proven patterns, multi-provider support, and easier maintenance

2. **Chroma with Local SQLite Backend for Vector Storage**
   - Rationale: Chroma provides LlamaIndex.TS integration and can run locally with SQLite backend, maintaining near-zero infrastructure overhead while using a proven vector database
   - Alternative: Manual sqlite-vec implementation would avoid Chroma dependency but require custom vector store implementation
   - Trade-offs: Chroma adds dependency but provides features like metadata filtering, collection management, and official LlamaIndex.TS support

3. **Next.js All-in-One Approach**
   - Rationale: Single codebase for frontend and backend reduces complexity, API routes handle backend logic naturally
   - Alternative: Separate React frontend + Express backend would require managing two builds
   - Trade-offs: Next.js learning curve if team unfamiliar, but widely adopted and well-documented

4. **LlamaIndex.TS Multi-Provider LLM Support**
   - Rationale: Built-in support for OpenAI, Anthropic, Groq, Ollama, and more allows easy model switching without additional abstraction layers
   - Alternative: Using LiteLLM would add another abstraction layer on top of LlamaIndex.TS
   - Trade-offs: LlamaIndex.TS provider API may have fewer features than LiteLLM but sufficient for requirements

### Components

1. **LlamaIndex.TS Index Manager** - Manages document indexing and query engines
   - Location: `lib/llamaindex/index.js`
   - Interfaces: `createIndex()`, `addDocuments()`, `createQueryEngine()`, `deleteDocument()`

2. **Document Loader Factory** - Wraps LlamaIndex.TS document loaders
   - Location: `lib/llamaindex/loaders.js`
   - Interfaces: `getLoaderForFile()`, supported formats: PDF, TXT, MD, DOCX

3. **Vector Store Manager** - Manages Chroma connection and collections
   - Location: `lib/llamaindex/vectorstore.js`
   - Interfaces: `initChroma()`, `getCollection()`, `persistData()`

4. **Settings Manager** - Configures LlamaIndex.TS LLM and embedding models
   - Location: `lib/llamaindex/settings.js`
   - Interfaces: `configureLLM()`, `configureEmbedding()`, `updateModel()`

5. **Chat API Route** - Handles chat message requests using LlamaIndex.TS
   - Location: `app/api/chat/route.js`
   - Interfaces: POST `/api/chat`

6. **Document API Route** - Handles file uploads and document management
   - Location: `app/api/documents/route.js`
   - Interfaces: POST `/api/documents` (upload), GET `/api/documents` (list), DELETE `/api/documents/[id]`

7. **Chat UI Component** - Main chat interface
   - Location: `components/Chat.jsx`
   - Interfaces: `Chat`, streaming response handling

8. **Document Upload Component** - File upload interface
   - Location: `components/Upload.jsx`
   - Interfaces: `Upload`, progress tracking, error handling

### Data Flow

```
[User Uploads Document]
       ↓
[Upload Component] → [API: POST /api/documents]
       ↓
[Document Loader Factory] → [LlamaIndex.TS SimpleDirectoryReader]
       ↓
[LlamaIndex.TS Index Manager] → [Parse] → [Chunk] → [Embed]
       ↓
[Vector Store Manager] → [Chroma with SQLite Backend]

[User Asks Question]
       ↓
[Chat Component] → [API: POST /api/chat]
       ↓
[LlamaIndex.TS QueryEngine]
       ↓
   ├─→ [Settings Manager] → [Get LLM Model]
   │
   ├─→ [Vector Store Manager] → [Chroma Similarity Search] → [Top-k Chunks]
   │
   └─→ [LlamaIndex.TS Response Synthesis] → [Combine Context + Question]
       ↓
[LLM Provider] → [Generate Response]
       ↓
[Response to Frontend] → [Display in Chat UI with Citations]
```

### Dependencies
- **Internal**: None (greenfield project)
- **External**:
  - `llamaindex` - Primary RAG framework (v0.10+)
  - `@llamaindex/chroma` - Chroma vector store integration
  - `chromadb` - Local vector database with SQLite backend
  - `@llamaindex/openai` - OpenAI LLM and embedding provider
  - `@llamaindex/anthropic` - Anthropic Claude LLM provider (optional)
  - `next` - Full-stack React framework
  - `@langchain/textsplitters` - Alternative text splitting (optional, LlamaIndex.TS has built-in)
  - `pdf-parse` - PDF parsing (LlamaIndex.TS has built-in loaders)
  - `mammoth` - DOCX parsing (LlamaIndex.TS has built-in loaders)

## Edge Cases

### Known Edge Cases

1. **No Relevant Documents Found**
   - Handling: LlamaIndex.TS QueryEngine returns response with empty context, display helpful message to user
   - Priority: Medium

2. **Empty Document Upload**
   - Handling: LlamaIndex.TS document loaders will detect empty files, reject upload with error message
   - Priority: High

3. **Query with Very Short Text**
   - Handling: LlamaIndex.TS handles short queries, but implement warning if query < 5 characters
   - Priority: Low

4. **Large File Upload**
   - Handling: Reject files exceeding 10MB, show progress for processing via LlamaIndex.TS
   - Priority: Medium

5. **LLM API Failure/Rate Limit**
   - Handling: LlamaIndex.TS has built-in retry logic, display error to user with retry option
   - Priority: High

6. **Unsupported File Format**
   - Handling: Document Loader Factory returns null, reject with clear error listing supported formats
   - Priority: Medium

7. **Chroma Connection Failed**
   - Handling: Fallback to in-memory Chroma instance, warn user about persistence issues
   - Priority: High

8. **Empty Chat History on Refresh**
   - Handling: Chat history is ephemeral in UI, but responses and sources are logged
   - Priority: Low

### Error Handling

- **Chroma Initialization Failed**:
  - Recovery: Fall back to in-memory Chroma, warn user about persistence
  - Logging: Log Chroma connection error with details

- **Document Loading Failed**:
  - Recovery: Notify user of parsing error, suggest checking file format
  - Logging: Log file details and LlamaIndex.TS loader error

- **Indexing Failed**:
  - Recovery: Rollback partial document insertion, notify user
  - Logging: Log embedding API response, chunk details

- **Query Execution Failed**:
  - Recovery: Display error to user, suggest retrying
  - Logging: Log query details, LlamaIndex.TS error trace

- **LLM Response Timeout**:
  - Recovery: LlamaIndex.TS supports timeout configuration, cancel and notify user
  - Logging: Log timeout duration, query length, model used

### Validation

- **Document Upload**:
  - File type must be supported (PDF, TXT, MD, DOCX via LlamaIndex.TS loaders)
  - File size < 10MB (configurable)
  - File content must not be empty (LlamaIndex.TS handles this)

- **Chat Query**:
  - Query not empty or whitespace-only
  - Query length 5-1000 characters

- **LLM Configuration**:
  - API key provided for configured provider
  - Model name valid for provider (LlamaIndex.TS validates)

- **Chroma Persistence**:
  - Persist directory writable
  - Sufficient disk space for embeddings

## Testing Strategy

### Unit Tests

- **LlamaIndex.TS Index Manager**: Test document insertion, retrieval, and deletion
- **Document Loader Factory**: Test file type detection, loader selection for each format
- **Vector Store Manager**: Test Chroma connection, collection management, persistence
- **Settings Manager**: Test LLM configuration, model switching
- **API Routes**: Test request parsing, LlamaIndex.TS integration, error responses

### Integration Tests

- **Document Upload Flow**: Upload via API → verify LlamaIndex.TS indexing → verify Chroma storage
- **RAG Pipeline**: Upload document → query via LlamaIndex.TS → verify retrieval → verify response
- **End-to-End Query**: Upload document → ask question → verify LlamaIndex.TS citations
- **Chat History**: Multiple message exchange → verify responses streamed correctly
- **Error Scenarios**: Test LlamaIndex.TS error handling, Chroma failures

### E2E Tests

- **Happy Path**: Upload document → ask relevant question → receive accurate answer with citations
- **No Context Scenario**: Ask question with no documents → receive generic LLM response
- **Multiple Documents**: Upload multiple documents → query → verify correct document used
- **File Format Support**: Test each LlamaIndex.TS supported format
- **Large Document**: Test near size limit → verify performance < 5s
- **Model Switching**: Change LLM provider → verify queries work with new model

### Manual Testing Checklist

- [ ] Start Next.js server successfully
- [ ] Chroma initializes with SQLite backend
- [ ] Upload PDF document via UI
- [ ] Verify document appears in LlamaIndex.TS index
- [ ] Ask question about uploaded content
- [ ] Receive relevant answer with LlamaIndex.TS citations
- [ ] Answer references specific information from document
- [ ] Multiple chat turns work correctly
- [ ] Switch LLM model (e.g., OpenAI → Anthropic)
- [ ] Verify queries work with new model
- [ ] Chat history persists during session
- [ ] Upload unsupported file type → see appropriate error
- [ ] Upload empty file → see LlamaIndex.TS error
- [ ] Test with no documents → see helpful message
- [ ] Verify Chroma SQLite file created and contains data
- [ ] Test rapid consecutive queries → verify LlamaIndex.TS handles concurrent requests

## Implementation Notes

### LlamaIndex.TS Patterns to Follow

- Use `Settings` global to configure LLM and embedding models
- Document loaders follow pattern: `SimpleDirectoryReader`, `PDFReader`, etc.
- Create `VectorStoreIndex` from documents, then `asQueryEngine()` for queries
- Leverage built-in text splitters: `SentenceSplitter`, `TokenTextSplitter`
- Use streaming responses for better UX: `queryEngine.query({ query, streaming: true })`
- Extract source information from response nodes: `response.sourceNodes`

### Configuration Required

- **Environment Variables**:
  - `OPENAI_API_KEY` - OpenAI API key for embeddings and GPT models
  - `ANTHROPIC_API_KEY` - Anthropic API key (optional, for Claude models)
  - `GROQ_API_KEY` - Groq API key (optional, for fast inference)
  - `LLM_PROVIDER` - Default LLM provider (default: "openai")
  - `LLM_MODEL` - Default model name (default: "gpt-4o-mini")
  - `EMBEDDING_MODEL` - Embedding model name (default: "text-embedding-3-small")
  - `CHROMA_PERSIST_DIR` - Chroma persistence directory (default: "./data/chroma")
  - `MAX_FILE_SIZE_MB` - Maximum upload file size (default: 10)
  - `CHUNK_SIZE` - Text chunk size in characters (default: 1000)
  - `CHUNK_OVERLAP` - Overlap between chunks in characters (default: 200)
  - `TOP_K_RESULTS` - Number of chunks to retrieve (default: 3)

### LlamaIndex.TS Setup

```typescript
// lib/llamaindex/settings.js
import { Settings, OpenAI, OpenAIEmbedding } from "llamaindex";

// Configure LLM
Settings.llm = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.LLM_MODEL || "gpt-4o-mini",
});

// Configure Embeddings
Settings.embedModel = new OpenAIEmbedding({
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
});
```

### Chroma Integration

```typescript
// lib/llamaindex/vectorstore.js
import { Chroma } from "@llamaindex/chroma";

const chroma = new Chroma({
  persistDirectory: process.env.CHROMA_PERSIST_DIR || "./data/chroma",
});

export const getVectorStore = () => chroma;
```

### Document Indexing

```typescript
// app/api/documents/route.js (simplified)
import { VectorStoreIndex, SimpleDirectoryReader } from "llamaindex";
import { getVectorStore } from "@/lib/llamaindex/vectorstore";

async function handleUpload(file) {
  // Save file temporarily
  const filePath = await saveUpload(file);

  // Load document using LlamaIndex.TS
  const reader = new SimpleDirectoryReader();
  const documents = await reader.loadData(filePath);

  // Create index with Chroma
  const index = await VectorStoreIndex.fromDocuments(documents, {
    vectorStore: getVectorStore(),
  });

  // Return document info
  return { id: extractDocumentId(index), filename: file.name };
}
```

### Querying with LlamaIndex.TS

```typescript
// app/api/chat/route.js (simplified)
import { VectorStoreIndex } from "llamaindex";
import { getVectorStore } from "@/lib/llamaindex/vectorstore";

async function handleChat(question) {
  // Load existing index
  const index = await VectorStoreIndex.fromVectorStore(getVectorStore());

  // Create query engine
  const queryEngine = index.asQueryEngine({
    retrieverMode: "hybrid", // Uses vector + keyword search
    similarityTopK: parseInt(process.env.TOP_K_RESULTS || "3"),
  });

  // Execute query
  const response = await queryEngine.query({ query: question, streaming: true });

  // Extract sources for citations
  const sources = response.sourceNodes.map((node) => ({
    filename: node.metadata?.file_name,
    score: node.score,
    text: node.text?.substring(0, 200),
  }));

  return { response, sources };
}
```

### Migration/Backwards Compatibility

- Chroma handles schema and index management automatically
- Document IDs tracked in metadata for deletion/updates
- Chroma version compatibility: use Chroma >= 0.4.x

### Open Questions

- **Q1**: Should chat history persist across sessions?
  - Context: LlamaIndex.TS ChatMemory can persist conversations
  - Recommendation: Add chat persistence for analytics, provide "clear chat" button

- **Q2**: Which embedding model should be default?
  - Context: OpenAI text-embedding-3-small is cost-effective; local models avoid API costs
  - Recommendation: Support both OpenAI and local (Ollama) embeddings

- **Q3**: Should we use LlamaIndex.TS ChatMemory for conversation context?
  - Context: ChatMemory can maintain context across multiple turns
  - Recommendation: Implement for better multi-turn conversations

- **Q4**: How to handle LlamaIndex.TS streaming responses in Next.js?
  - Context: Streaming requires proper SSE or Next.js streaming response handling
  - Recommendation: Use Next.js streaming response API with LlamaIndex.TS streaming

## LlamaIndex.TS Core Concepts

### Document Loaders
LlamaIndex.TS provides built-in document loaders:
- `SimpleDirectoryReader` - Load files from directories
- `PDFReader` - Parse PDF files
- `MarkdownReader` - Parse Markdown files
- `TextReader` - Parse plain text files

### Text Splitters
Built-in text splitters for chunking:
- `SentenceSplitter` - Split by sentences
- `TokenTextSplitter` - Split by token count
- `RecursiveCharacterTextSplitter` - Recursive character-based splitting

### Vector Stores
Supported vector stores:
- `Chroma` - Local or cloud (we use local with SQLite)
- `Pinecone` - Managed cloud
- `MongoDB Atlas` - Cloud MongoDB with vector search
- And more...

### Query Engines
- `VectorStoreQueryEngine` - Pure vector similarity search
- `HybridQueryEngine` - Vector + keyword search
- `ChatEngine` - Conversational with memory

## Prompt Template

LlamaIndex.TS uses configurable prompts via `ServiceContext`. Default system prompts can be overridden:

```typescript
import { TextNode, serviceContextFromDefaults } from "llamaindex";

const serviceContext = serviceContextFromDefaults({
  systemPrompt: `You are a helpful assistant. Use the following context from uploaded documents to answer the user's question.
If the context doesn't contain relevant information, acknowledge this and provide a general response based on your knowledge.`,
});
```

## Project Structure

```
rag-chatbot/
├── specs/
│   └── rag-chatbot.md              # This specification
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.js           # Chat API with LlamaIndex.TS QueryEngine
│   │   └── documents/
│   │       ├── route.js           # Document upload with LlamaIndex.TS loaders
│   │       └── [id]/
│   │           └── route.js       # Document deletion via LlamaIndex.TS
│   └── page.jsx                   # Main application page
├── components/
│   ├── Chat.jsx                   # Chat interface with streaming
│   ├── MessageList.jsx            # Message display with citations
│   ├── Upload.jsx                 # Document upload with progress
│   └── DocumentList.jsx           # List of indexed documents
├── lib/
│   ├── llamaindex/
│   │   ├── index.js             # Index management
│   │   ├── loaders.js           # Document loader factory
│   │   ├── vectorstore.js       # Chroma wrapper
│   │   ├── settings.js          # LLM/embedding configuration
│   │   └── utils.js            # Helper functions
│   └── upload.js                  # File upload utilities
├── data/
│   └── chroma/                   # Chroma SQLite persistence (created on init)
├── public/
│   └── uploads/                   # Temporary storage for uploaded files
├── .env.example                  # Environment variable template
├── package.json
├── next.config.js
└── README.md
```

## Key Benefits of Using LlamaIndex.TS

1. **Faster Development**: Battle-tested components reduce implementation time from weeks to days
2. **Proven Patterns**: Industry-standard RAG implementations backed by active community
3. **Multi-Provider Support**: Easy switching between OpenAI, Anthropic, Groq, Ollama, etc.
4. **Extensibility**: Plugin system for custom components and integrations
5. **Streaming Support**: Built-in streaming for better UX
6. **Citations**: Automatic source tracking from retrieved nodes
7. **Maintenance**: Active development and regular updates
8. **Documentation**: Comprehensive guides and examples

## Comparison: LlamaIndex.TS vs Manual Implementation

| Metric | LlamaIndex.TS | Manual (sqlite-vec) |
|---------|----------------|----------------------|
| Development Time | 3-5 days | 2-3 weeks |
| Lines of Code | ~500 LOC | ~1500 LOC |
| Dependencies | 3 main packages | 5+ utilities |
| Maintenance | Community-supported | Custom maintenance |
| Extensibility | Plugin system | Custom code |
| Learning Curve | Learn LlamaIndex | Learn LLM + vector DB |
| Production Ready | ✅ Proven at scale | ⚠️ Custom testing |

## Next Steps

1. Initialize Next.js project with TypeScript
2. Install LlamaIndex.TS and Chroma dependencies
3. Set up Chroma with local SQLite backend
4. Implement document loaders and indexing
5. Create QueryEngine for chat responses
6. Build React UI components
7. Connect and test end-to-end
