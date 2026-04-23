# RAG Chatbot

A Retrieval-Augmented Generation (RAG) chatbot that allows users to upload documents and ask questions, receiving AI-powered responses with source citations.

Built with:

- **Next.js** - Full-stack React framework
- **Mastra** - TypeScript AI framework for document processing, embeddings, and agent-based chat
- **ChromaDB** - Vector database for similarity search

## Features

- Document upload (PDF, TXT, MD, DOCX) with automatic chunking and indexing
- Semantic search with source citations
- Conversational chat with message history
- Multi-LLM support (OpenAI, Anthropic, Groq, Ollama)

## Quick Start

### Prerequisites

- Node.js 18+
- [ChromaDB](https://www.trychroma.com/) running locally (default: `http://localhost:8000`)

### Installation

```bash
git clone <repository-url>
cd rag-chatbot
npm install
cp .env.example .env
```

Edit `.env` and add your API keys:

```
OPENAI_API_KEY=your_openai_api_key_here   # Required for embeddings
ANTHROPIC_API_KEY=your_anthropic_key      # Optional
GROQ_API_KEY=your_groq_key                # Optional
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Upload a Document** — Drag and drop or click the upload zone. Supported formats: PDF, TXT, MD, DOCX (max 10MB).
2. **Ask Questions** — Type your question in the chat input. The system retrieves relevant chunks and generates a grounded response.
3. **View Sources** — Each response includes cited sources with filenames and relevance scores.

## Configuration

### Environment Variables

| Variable            | Description                                           | Default                 |
| ------------------- | ----------------------------------------------------- | ----------------------- |
| `OPENAI_API_KEY`    | OpenAI API key (required for embeddings)              | -                       |
| `ANTHROPIC_API_KEY` | Anthropic API key                                     | -                       |
| `GROQ_API_KEY`      | Groq API key                                          | -                       |
| `LLM_PROVIDER`      | LLM provider: `openai`, `anthropic`, `groq`, `ollama` | `openai`                |
| `LLM_MODEL`         | Model name override (provider default used if unset)  | -                       |
| `CHROMA_URL`        | ChromaDB server URL                                   | `http://localhost:8000` |
| `CHROMA_API_KEY`    | ChromaDB authentication key                           | -                       |
| `STORAGE_DIR`       | Local storage directory                               | `./data`                |

### Default Models per Provider

| Provider    | Default Model              |
| ----------- | -------------------------- |
| `openai`    | `gpt-4o-mini`              |
| `anthropic` | `claude-sonnet-4-20250514` |
| `groq`      | `llama-3.3-70b-versatile`  |
| `ollama`    | `llama3.2`                 |

Embeddings always use `openai/text-embedding-3-small`.

## Architecture

### RAG Pipeline

```
Document Upload → Parse (pdf-parse / mammoth / text) → Chunk (MDocument) → Embed (OpenAI) → Store (ChromaDB)

User Query → Embed query → ChromaDB similarity search (top 3) → Build context → Agent generates response with citations
```

### Key Modules

| Module                      | Purpose                                   |
| --------------------------- | ----------------------------------------- |
| `lib/mastra/config.ts`      | LLM provider and model configuration      |
| `lib/mastra/vectorstore.ts` | ChromaDB operations (CRUD, queries)       |
| `lib/mastra/loaders.ts`     | Document parsing (PDF, DOCX, MD, TXT)     |
| `lib/mastra/index.ts`       | RAG pipeline (indexing + query execution) |
| `lib/mastra/agent.ts`       | Mastra Agent factory                      |
| `lib/mastra/chat.ts`        | Chat message format conversion            |
| `lib/mastra/prompts.ts`     | System prompt management                  |
| `lib/mastra/sources.ts`     | Source attribution extraction             |

### API Routes

- `POST /api/chat` — Chat with streaming SSE or JSON response
- `POST /api/documents` — Upload documents
- `GET /api/documents` — List documents and stats
- `GET /api/documents/[id]` — Get document info or download
- `DELETE /api/documents/[id]` — Delete a document
- `POST /api/documents/action/clean` — Clear all documents

## Project Structure

```
rag-chatbot/
├── app/
│   ├── api/              # Chat and document API routes
│   └── page.tsx          # Main application page
├── components/
│   ├── Chat/             # Chat interface
│   ├── Upload/           # File upload
│   ├── DocumentList/     # Document management
│   ├── MessageList/      # Message display with sources
│   └── ui/               # Shared UI components (Button, Modal, IconButton)
├── lib/
│   ├── mastra/           # RAG pipeline modules
│   ├── constants/        # File limits, format strings
│   ├── hooks/            # React hooks (TanStack Query)
│   ├── theme/            # Mantine theme config
│   ├── types/            # TypeScript definitions
│   └── utils/            # Formatting, date, file utilities
└── data/chroma/          # ChromaDB storage (auto-created)
```

## Development

```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run lint          # Run ESLint
npm run type-check    # TypeScript type checking
npm run test          # Run tests in watch mode
npm run test:run      # Run all tests once
npm run test:e2e      # Run Playwright E2E tests
```
