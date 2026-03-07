---
name: enforce-file-naming-conventions
enabled: true
event: file
---

## ⚠️ File Naming Convention Violation

You're creating or editing a file that doesn't follow the project's naming conventions.

### Expected Naming Patterns:

**Components (.jsx files in components/):**
- ✅ Correct: `Chat.jsx`, `Upload.jsx`, `MessageList.jsx` (PascalCase)
- ❌ Incorrect: `chat.jsx`, `my-component.jsx`, `userProfile.jsx` (lowercase, kebab-case)

**Library modules (.js files in lib/):**
- ✅ Correct: `index.js`, `loaders.js`, `utils.js` (lowercase)
- ❌ Incorrect: `Index.js`, `fileHandlers.js`, `VectorStore.js` (PascalCase, camelCase)

**API routes (in app/api/):**
- ✅ Correct: `route.js`, `app/api/chat/route.js`
- ❌ Incorrect: `chat.js`, `handler.js`, `api.js`

### Action Required:
Please rename the file to follow the conventions above. Use PascalCase for components and lowercase for library modules.
