# Project Overview: RAG Chatbot

## Purpose
A Retrieval-Augmented Generation (RAG) chatbot that allows users to upload documents and ask questions, receiving AI-powered responses with source citations.

## Tech Stack
- **Framework**: Next.js 14.2.0 with App Router
- **Frontend**: React 18.3.0 with JSX components
- **Language**: TypeScript (compiled to ES2020)
- **RAG Framework**: LlamaIndex.TS 0.10.0
- **Vector Database**: ChromaDB 1.8.0 with SQLite backend
- **LLM Providers**: OpenAI, Anthropic, Groq
- **Embeddings**: OpenAI text-embedding-3-small (default)
- **Styling**: CSS-in-JS with styled-jsx

## Key Features
- Document upload (PDF, TXT, MD, DOCX, max 10MB)
- Semantic search with vector-based retrieval
- Conversational interface with message history
- Source citations from retrieved documents
- Local Chroma SQLite backend (zero infrastructure overhead)
- Multi-LLM provider support

## Architecture Overview
```
Document Upload → Document Loader → Index Manager (Parse → Chunk → Embed) → Vector Store (Chroma)
User Query → Chat API → Query Engine → Vector Store (Similarity Search) → LLM → Response with Citations
```

## Core Modules
- **lib/llamaindex/index.js** - Document indexing and query engines
- **lib/llamaindex/loaders.js** - Document loaders for various file types
- **lib/llamaindex/vectorstore.js** - Chroma connection and collection management
- **lib/llamaindex/settings.js** - LLM and embedding model configuration
- **app/api/chat/route.js** - Chat message processing API
- **app/api/documents/route.js** - File upload and document management API
