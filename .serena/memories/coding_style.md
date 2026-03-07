# Coding Style and Conventions

## File Naming
- Components: PascalCase with `.jsx` extension (e.g., `Chat.jsx`, `MessageList.jsx`)
- API routes: `route.js` in API directory
- Utility modules: lowercase with `.js` extension (e.g., `utils.js`, `upload.js`)
- Libraries: lowercase with `.js` extension (e.g., `index.js`, `loaders.js`)

## Code Style

### JavaScript/TypeScript
- Use `import` statements for ES modules
- Use `export function` for named exports
- Use arrow functions for callbacks
- Use template literals for string interpolation
- Use `async/await` for asynchronous code
- Destructure objects when appropriate

### Component Conventions
- Use `"use client"` directive for client-side components
- Use functional components with hooks (useState, useEffect, useRef)
- Props destructuring: `function Chat({ onSendMessage })`
- Event handlers prefixed with `handle`: `handleSendMessage`, `handleKeyPress`

### Documentation
- JSDoc-style comments for functions with /** */
- Describe purpose, parameters, and return values
- File-level docblock at top of each file

### Styling
- CSS-in-JS with styled-jsx `<style jsx>` blocks
- Tailwind-style utility class names in JSX
- BEM-like naming for custom classes: `.chat-container`, `.chat-header`

### API Routes
- Export named handlers: `POST`, `GET`
- Use `NextRequest` and `NextResponse` types
- Error handling with try/catch and appropriate HTTP status codes
- Input validation before processing

### Environment Variables
- Required: `OPENAI_API_KEY`
- Optional: `ANTHROPIC_API_KEY`, `GROQ_API_KEY`
- Configuration: `LLM_PROVIDER`, `LLM_MODEL`, `EMBEDDING_MODEL`

### Error Handling
- Console.error for logging
- User-friendly error messages
- Graceful degradation where possible
