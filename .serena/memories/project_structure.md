# Project Structure

```
rag-chatbot/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.js           # Chat API endpoint
│   │   └── documents/
│   │       ├── route.js          # Document upload/management
│   │       └── [id]/route.js     # Document deletion
│   ├── layout.js                  # Root layout
│   ├── page.jsx                  # Main page
│   └── globals.css               # Global styles
├── components/
│   ├── Chat.jsx                  # Chat interface component
│   ├── MessageList.jsx           # Message display list
│   ├── Upload.jsx                # File upload interface
│   └── DocumentList.jsx          # Uploaded documents list
├── lib/
│   ├── llamaindex/
│   │   ├── index.js              # Index manager (document indexing, queries)
│   │   ├── loaders.js            # Document loaders (PDF, TXT, MD, DOCX)
│   │   ├── vectorstore.js        # ChromaDB connection & collections
│   │   ├── settings.js           # LLM/embedding model configuration
│   │   └── utils.js              # Utility functions
│   └── upload.js                 # Upload utilities
├── data/
│   └── chroma/                   # Chroma SQLite persistence directory
├── public/
│   └── uploads/                  # Temporary file storage for uploads
├── .env                          # Environment variables (not in git)
├── .env.example                  # Environment variable template
├── .eslintrc.json               # ESLint configuration
├── .gitignore                   # Git ignore patterns
├── next.config.js               # Next.js configuration
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration
└── README.md                    # Project documentation
```

## Key File Locations
- **Entry point**: `app/page.jsx` (main page)
- **Chat API**: `app/api/chat/route.js`
- **Document API**: `app/api/documents/route.js`
- **Index manager**: `lib/llamaindex/index.js`
- **Vector store**: `lib/llamaindex/vectorstore.js`
- **Settings**: `lib/llamaindex/settings.js`
