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
npm run db:push          # Push schema changes to Neon Postgres
npm run db:generate      # Generate Drizzle migration files
npm run db:migrate       # Run Drizzle migrations
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
│   ├── db/              # Neon Postgres + Drizzle ORM (schema, client)
│   ├── constants/       # App-wide constants (file limits, format strings)
│   ├── hooks/           # Custom React hooks
│   ├── icons/           # Tabler icon components (@tabler/icons-react)
│   ├── mastra/          # RAG pipeline (indexing, chat, vectorstore, loaders)
│   ├── theme/           # Mantine theme configuration
│   ├── utils/           # Formatting, date, and file encoding utilities
│   ├── query-client.ts  # TanStack Query configuration
│   └── types/           # TypeScript definitions
├── middleware.ts         # CORS middleware for /api/* routes
├── drizzle.config.ts    # Drizzle Kit config (schema, migrations)
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

- **API**: RESTful routes with centralized error handling (`AppError` hierarchy), Zod validation, and CORS middleware
- **RAG**: Mastra pipeline — ChromaDB for vector storage, Agent with `createVectorQueryTool` for autonomous retrieval
- **Database**: Neon Postgres + Drizzle ORM for document metadata; ChromaDB for vector chunks
- **UI**: Mantine v7 with Radix Colors palette (never hardcode hex values), AppShell layout
- **Build**: Next.js 16 with Turbopack, ESLint flat config

## Environment

Required: `OPENAI_API_KEY` (embeddings), `DATABASE_URL` (Neon Postgres)

All other variables (LLM provider, chunk size, timeouts, etc.) are optional with sensible defaults - see `.env.example`.
