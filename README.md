# RAG Chatbot

A Retrieval-Augmented Generation (RAG) chatbot that allows users to upload documents and ask questions, receiving AI-powered responses with source citations.

Built with:
- **Next.js** - Full-stack React framework
- **LlamaIndex.TS** - Primary RAG framework with document loaders, text splitters, and query engines
- **Chroma** - Local vector database with SQLite backend for zero infrastructure overhead

## Features

- 📄 **Document Upload** - Upload PDF, TXT, MD, and DOCX files for indexing
- 🔍 **Semantic Search** - Vector-based retrieval of relevant document chunks
- 💬 **Chat Interface** - Conversational interface with message history
- 📚 **Source Citations** - Responses include sources from retrieved documents
- 🚀 **Fast Setup** - Single-command startup with local Chroma SQLite backend
- 🔐 **Secure** - API keys stored in environment variables

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd rag-chatbot
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here  # Optional
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Upload a Document**
   - Click the upload zone or drag and drop a file
   - Supported formats: PDF, TXT, MD, DOCX (max 10MB)
   - The document will be automatically indexed

2. **Ask Questions**
   - Type your question in the chat input
   - The system will search your documents and generate a response
   - Sources are displayed at the bottom of each response

3. **Chat History**
   - All messages in your current session are displayed
   - Use "Clear Chat" to start a new conversation

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key (required) | - |
| `ANTHROPIC_API_KEY` | Anthropic API key (optional) | - |
| `GROQ_API_KEY` | Groq API key (optional) | - |
| `LLM_PROVIDER` | Default LLM provider | `openai` |
| `LLM_MODEL` | Default model name | `gpt-4o-mini` |
| `EMBEDDING_MODEL` | Embedding model | `text-embedding-3-small` |
| `CHROMA_PERSIST_DIR` | Chroma persistence directory | `./data/chroma` |
| `MAX_FILE_SIZE_MB` | Maximum upload file size | `10` |
| `CHUNK_SIZE` | Text chunk size in characters | `1000` |
| `CHUNK_OVERLAP` | Overlap between chunks | `200` |
| `TOP_K_RESULTS` | Number of chunks to retrieve | `3` |

### Supported LLM Providers

- **OpenAI**: GPT models (gpt-4o, gpt-4o-mini, etc.)
- **Anthropic**: Claude models (claude-3-haiku, claude-3-sonnet, etc.)
- **Groq**: Fast inference with various models

## Architecture

### Components

- **LlamaIndex.TS Index Manager** (`lib/llamaindex/index.js`) - Manages document indexing and query engines
- **Document Loader Factory** (`lib/llamaindex/loaders.js`) - Uses LlamaIndex.TS specialized file readers (PDFReader, DocxReader, MarkdownReader, TextFileReader)
- **Vector Store Manager** (`lib/llamaindex/vectorstore.js`) - Manages Chroma connection and collections
- **Settings Manager** (`lib/llamaindex/settings.js`) - Configures LLM and embedding models
- **Chat API** (`app/api/chat/route.js`) - Handles chat message requests
- **Documents API** (`app/api/documents/route.js`) - Handles file uploads and document management
- **Chat UI** (`components/Chat.jsx`) - Main chat interface
- **Upload UI** (`components/Upload.jsx`) - File upload interface

### Data Flow

```
User Uploads Document
    ↓
Upload Component → API: POST /api/documents
    ↓
Document Loader → LlamaIndex.TS File Readers (PDFReader/DocxReader/MarkdownReader/TextFileReader)
    ↓
Index Manager → Parse → Chunk → Embed
    ↓
Vector Store Manager → Chroma with SQLite

User Asks Question
    ↓
Chat Component → API: POST /api/chat
    ↓
LlamaIndex.TS QueryEngine
    ├─→ Vector Store Manager → Chroma Similarity Search → Top-k Chunks
    └─→ LlamaIndex.TS Response Synthesis → Combine Context + Question
         ↓
LLM Provider → Generate Response
    ↓
Response to Frontend → Display in Chat UI with Citations
```

## Project Structure

```
rag-chatbot/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.js
│   │   └── documents/
│   │       ├── route.js
│   │       └── [id]/route.js
│   └── page.jsx
├── components/
│   ├── Chat.jsx
│   ├── MessageList.jsx
│   ├── Upload.jsx
│   └── DocumentList.jsx
├── lib/
│   ├── llamaindex/
│   │   ├── index.js
│   │   ├── loaders.js
│   │   ├── vectorstore.js
│   │   ├── settings.js
│   │   └── utils.js
│   └── upload.js
├── data/
│   └── chroma/           # Chroma SQLite persistence
├── public/
│   └── uploads/          # Temporary file storage
├── .env.example
├── package.json
└── README.md
```

## Deployment

### Vercel

1. Set environment variables in your Vercel project settings
2. Deploy using the Vercel CLI:
```bash
vercel
```

### Railway

1. Create a new Railway project
2. Connect your GitHub repository
3. Set environment variables in Railway dashboard
4. Deploy

### Local/Other Platforms

```bash
npm run build
npm start
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Adding Features

The codebase is organized around LlamaIndex.TS abstractions:
- Document loaders in `lib/llamaindex/loaders.js`
- Vector store operations in `lib/llamaindex/vectorstore.js`
- Query engine logic in `lib/llamaindex/index.js`

## Troubleshooting

### Chroma Initialization Failed

If Chroma fails to initialize with the persistent directory, it will fall back to an in-memory instance. Check that:
- The `CHROMA_PERSIST_DIR` directory exists and is writable
- Sufficient disk space is available

### No Documents Indexed

If you see "No documents indexed yet":
- Ensure you've successfully uploaded at least one document
- Check the browser console for upload errors
- Verify file format is supported

### LLM API Errors

If you receive API errors:
- Verify your API keys are correct in `.env`
- Check that your API key has sufficient credits
- Ensure the model name is valid for your provider

## License

MIT

## Credits

- Built with [LlamaIndex.TS](https://github.com/run-llama/LlamaIndex.TS)
- Vector storage by [Chroma](https://www.trychroma.com/)
- UI framework [Next.js](https://nextjs.org/)
