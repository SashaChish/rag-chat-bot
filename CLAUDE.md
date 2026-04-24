# CLAUDE.md

## Quick Start

```bash
npm install
cp .env.example .env  # Add OPENAI_API_KEY (required for embeddings)
npm run dev
```

Application runs at `http://localhost:3000`. ChromaDB connects to the remote server configured via `CHROMA_URL`.

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
│   ├── api/             # REST API routes (chat, documents CRUD)
│   ├── error.tsx        # Root error boundary
│   ├── layout.tsx       # Root layout with next/font
│   ├── loading.tsx      # Root loading state
│   ├── not-found.tsx    # Custom 404 page
│   └── page.tsx         # Main application page
├── components/          # React components (Chat, Upload, DocumentList, MessageList)
├── lib/
│   ├── api/             # API infrastructure (errors, handler, schemas, streaming, validation)
│   ├── constants/       # App-wide constants (file limits, format strings)
│   ├── hooks/           # Custom React hooks
│   ├── icons/           # Tabler icon components (@tabler/icons-react)
│   ├── mastra/          # RAG pipeline (indexing, chat, vectorstore, loaders)
│   ├── theme/           # Mantine theme configuration
│   ├── utils/           # Formatting, date, and file encoding utilities
│   ├── query-client.ts  # TanStack Query configuration
│   └── types/           # TypeScript definitions
├── middleware.ts         # CORS middleware for /api/* routes
├── next.config.ts       # Next.js config (optimizePackageImports)
└── postcss.config.mjs   # PostCSS config (postcss-preset-mantine)
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
| `warn-eslint-config` | Modifying ESLint config files | Warn — requires explicit user permission |
| `code-refactoring` | Adding new functions/classes | Warn — check for existing utilities first, don't duplicate |

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
- Mantine UI v7 for all components (Paper, Group, Stack, Text, Button, Modal, etc.)
- MantineProvider wraps app in `components/Providers.tsx` with violet theme
- @tabler/icons-react for icons (not @heroicons)
- TanStack Query for all data fetching and server state management (`useQuery`, `useMutation`) - never use raw `fetch` in components; extract data fetching into custom hooks or use TanStack Query directly

### Typography

- Use `Title` with `order` prop for all headings (never `Text` with large `fw`/`size`)
- Use `Text` for body text, labels, captions — use Mantine props (`c`, `size`, `fw`, `truncate`) instead of inline styles
- No raw `<p>`/`<span>`/`<div>` for text. No inline `style` for fontSize, lineHeight, fontWeight, or fontFamily
- Use `Code` with `block` prop for preformatted content

### Testing

- Vitest for unit tests, Playwright for E2E
- MantineProvider required in test wrappers for component tests
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
- **Centralized API error handling**: `lib/api/errors.ts` provides `AppError` hierarchy (`ValidationError`, `NotFoundError`); all routes use `withErrorHandler()` from `lib/api/handler.ts`; errors return `{ error: { code, message } }`
- **Input validation with Zod**: Request bodies validated via `lib/api/schemas.ts` schemas and `validateBody()` from `lib/api/validate.ts`
- **RESTful API routes**: Each endpoint handles one operation — no `?action=` dispatch. Route map: `GET/POST /api/documents`, `GET /api/documents/list`, `GET /api/documents/[id]`, `DELETE /api/documents/[id]`, `GET /api/documents/[id]/preview`, `GET /api/documents/[id]/download`, `POST /api/documents/bulk-delete`, `POST /api/documents/clear`, `GET/POST /api/chat` (no `chatEngineType` parameter — agent handles retrieval autonomously)
- **CORS via middleware**: `middleware.ts` handles OPTIONS for all `/api/*` routes
- **Mastra RAG pipeline**: `lib/mastra/` handles chunking (MDocument), embeddings (Vercel AI SDK), vector storage (@mastra/chroma), and chat (Mastra Agent with `createVectorQueryTool`)
- **Agent-based chat**: Mastra Agent uses `createVectorQueryTool` from `@mastra/rag` to autonomously retrieve documents. Sources are extracted from `toolResults` in the agent response. Agent instructions include `CHROMA_PROMPT` from `@mastra/chroma` for metadata filtering.
- **Multi-provider LLM**: OpenAI (embeddings required), optional Anthropic/Groq/Ollama via Mastra model router
- **Turbopack**: Default bundler (Next.js 16+); no webpack config needed
- **ESLint flat config**: Uses `eslint.config.mjs` with `typescript-eslint` and `@next/eslint-plugin-next`
- **Mantine UI v7**: All styling via Mantine components and theme; no Tailwind/CSS modules. Theme uses Radix Colors palette (violet, gray, red, green, blue, amber) — never hardcode hex values in components, use Mantine color props or CSS variables (`var(--mantine-color-{name}-{shade})`) instead.
- **AppShell layout**: Responsive layout with collapsible navbar via Mantine AppShell and useDisclosure

## Environment

Required: `OPENAI_API_KEY` (embeddings)

All other variables (LLM provider, chunk size, timeouts, etc.) are optional with sensible defaults - see `.env.example`.
