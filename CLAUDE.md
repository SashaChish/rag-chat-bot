# CLAUDE.md

## Quick Start

```bash
npm install
cp .env.example .env  # Add OPENAI_API_KEY (required for embeddings)
npm run dev
```

Application runs at `http://localhost:3000`. ChromaDB storage is auto-created in `./data/chroma/`.

## Development Commands

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run lint             # Run ESLint
npm run lint -- --fix    # Auto-fix ESLint issues
npm run type-check       # TypeScript type checking
npm run test             # Run tests in watch mode
npm run test:run         # Run all tests once
npm run test:coverage    # Run tests with coverage
npm run test:e2e         # Run Playwright E2E tests
```

## Project Structure

```
rag-chatbot/
├── __tests__/           # Unit tests, E2E tests, fixtures, mocks
├── app/
│   ├── api/             # Chat and document API routes
│   └── page.tsx         # Main application page
├── components/          # React components (Chat, Upload, DocumentList, MessageList)
├── lib/
│   ├── icons/           # Heroicon components
│   ├── llamaindex/      # RAG pipeline (indexing, chat engines, vectorstore)
│   ├── utils/           # File validation, encoding utilities
│   ├── query-client.ts  # TanStack Query configuration
│   └── types/           # TypeScript definitions
└── data/chroma/         # ChromaDB storage (auto-created)
```

## Code Conventions

### Automated Enforcement

Hookify rules in `.claude/` block problematic patterns:

| Rule | Pattern | Enforcement |
|------|---------|-------------|
| `block-eslint-disable` | `eslint-disable` | Blocked everywhere |
| `block-as-any` | `as any` | Blocked everywhere |
| `block-type-workarounds` | `as never as` / `as unknown as` | Blocked in production (allowed in `__tests__/`) |

### TypeScript & Style

- Components use `.tsx`, library modules use `.ts`
- Use `import type { ... }` for type-only imports
- Use specific types or `unknown` (never `any`)
- No comments - use descriptive names
- Always destructure at call site (props, hook returns)
- Remove unused code immediately

### React Patterns

- Function components with TypeScript props interfaces
- Custom hooks in `lib/hooks/` with `use-*.ts` naming
- TanStack Query for all data fetching and server state management (`useQuery`, `useMutation`) - never use raw `fetch` in components; extract data fetching into custom hooks or use TanStack Query directly

### Testing

- Vitest for unit tests, Playwright for E2E
- `as unknown as` allowed in `__tests__/` for mocking external types
- Focus on business logic, not TypeScript's type system

## Verification Checklist

Before marking tasks complete:

1. `npm run lint` - No ESLint warnings or errors
2. `npm run type-check` - No TypeScript errors
3. `npm run build` - Successful production build
4. `npm run test:run` - All tests pass

## Architecture Decisions

- **Serverless-compatible**: No global state; indexes created on-demand from ChromaDB
- **ChromaVectorStore**: Manages ChromaDB client internally - no manual ChromaClient
- **Chat engines**: Preferred over query engines (includes conversation history + system prompts)
- **Multi-provider LLM**: OpenAI (embeddings required), optional Anthropic/Groq/Ollama

## Environment

Required: `OPENAI_API_KEY` (embeddings)

All other variables (LLM provider, chunk size, timeouts, etc.) are optional with sensible defaults - see `.env.example`.
