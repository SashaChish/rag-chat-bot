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
npm run dev              # Start development server (Turbopack)
npm run build            # Build for production (Turbopack)
npm run lint             # Run ESLint
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
│   ├── error.tsx        # Root error boundary
│   ├── layout.tsx       # Root layout with next/font
│   ├── loading.tsx      # Root loading state
│   ├── not-found.tsx    # Custom 404 page
│   └── page.tsx         # Main application page
├── components/          # React components (Chat, Upload, DocumentList, MessageList)
├── lib/
│   ├── icons/           # Heroicon components
│   ├── llamaindex/      # RAG pipeline (indexing, chat engines, vectorstore)
│   ├── utils/           # File validation, encoding utilities
│   ├── query-client.ts  # TanStack Query configuration
│   └── types/           # TypeScript definitions
├── data/chroma/         # ChromaDB storage (auto-created)
├── next.config.ts       # Next.js config (serverExternalPackages, strict mode)
└── eslint.config.mjs    # ESLint flat config
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
- React 19: omit explicit return types on components (TypeScript infers them); use `React.ReactElement` when a type annotation is needed
- Route handler `params` are async: `{ params }: { params: Promise<{ id: string }> }` — always `await params`

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
- **Native module isolation**: `serverExternalPackages` in `next.config.ts` excludes ChromaDB/ONNX from bundling
- **Chat engines**: Preferred over query engines (includes conversation history + system prompts)
- **Multi-provider LLM**: OpenAI (embeddings required), optional Anthropic/Groq/Ollama
- **Turbopack**: Default bundler (Next.js 16+); no webpack config needed
- **ESLint flat config**: Uses `eslint.config.mjs` with `typescript-eslint` and `@next/eslint-plugin-next`

## Environment

Required: `OPENAI_API_KEY` (embeddings)

All other variables (LLM provider, chunk size, timeouts, etc.) are optional with sensible defaults - see `.env.example`.
