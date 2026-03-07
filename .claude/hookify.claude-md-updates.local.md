---
name: warn-claude-md-updates
enabled: true
event: file
conditions:
  - field: new_text
    operator: regex_match
    pattern: (export\s+(async\s+)?function|class\s+\w+|module\.exports)
---

## ⚠️ CLAUDE.md Update Check

You're implementing new functionality. Before finalizing, verify if this update requires CLAUDE.md documentation.

### 📋 CLAUDE.md Update Criteria

Update CLAUDE.md when implementing:

**✅ Core Features:**
- New API routes (`app/api/*/route.js`)
- New major modules in `lib/llamaindex/`
- New database/vector store integrations
- New document loaders or processors
- New query or chat engine strategies
- Authentication/authorization features
- User management features
- New configuration options/environment variables

**✅ Architecture & Design Patterns:**
- New architectural patterns (Factory, Singleton, etc.)
- New caching strategies
- New error handling approaches
- New data flow patterns
- New integration patterns
- New state management approaches

**✅ Important Configuration:**
- New environment variables (add to Environment Variables section)
- New default configurations
- New feature flags
- New provider integrations

**❌ Don't Update For:**
- Bug fixes
- Minor refactoring
- UI tweaks
- Utility functions
- Small helper functions
- Code style improvements

### 🔍 What to Update in CLAUDE.md

**If adding a new module to `lib/llamaindex/`:**
- Add to "Key Modules" section
- Include filename, purpose, key functions
- Note any architectural decisions

**If adding a new API route:**
- Add to "API Routes" section
- Describe purpose and endpoints

**If adding a new component:**
- Add to "Components" section (only if significant)

**If implementing a new pattern:**
- Add to "Architecture & Design Decisions" section
- Describe the pattern and its purpose

**If adding configuration:**
- Add to "Environment Variables" section
- Include name, purpose, and default

### 📝 Update Format

When updating, follow CLAUDE.md structure:

```markdown
### `lib/llamaindex/module-name.js` - Module Purpose
- **Key Function 1****: Description
- **Key Function 2****: Description
```

Or for design patterns:

```markdown
### Pattern Name

Description of pattern and when to use.
```

### 🎯 Decision Tree

```
Is this a new feature?
├─ Yes ──> Is it core functionality?
│           ├─ Yes ──> UPDATE CLAUDE.md
│           └─ No ──> Is it a new pattern/design?
│                       ├─ Yes ──> UPDATE CLAUDE.md
│                       └─ No ──> Skip (minor feature)
└─ No ──> Is it a bug fix/refactor?
            ├─ Yes ──> Skip
            └─ No ──> Evaluate above
```

### ✅ Quick Checklist

Before committing changes, ask yourself:
- [ ] Is this a core feature that future developers need to understand?
- [ ] Is this a new architectural pattern or design decision?
- [ ] Does this add new configuration options or environment variables?
- [ ] Would a new developer benefit from knowing about this immediately?
- [ ] Is this part of the fundamental system architecture?

If **ANY** answer is "Yes", update CLAUDE.md.

### 💡 Examples

**✅ Update CLAUDE.md for:**
```javascript
// New core module
export function createCustomEngine() { ... }
```

**✅ Update CLAUDE.md for:**
```javascript
// New environment variable usage
const apiKey = process.env.NEW_API_KEY;
```

**❌ Don't update for:**
```javascript
// Bug fix
export function formatDate(date) {
  // Fixed bug with timezones
}
```

**❌ Don't update for:**
```javascript
// Minor utility
export function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
```

### 📌 Action Required

If this change requires CLAUDE.md updates:
1. Read the current CLAUDE.md to understand structure
2. Add/update the relevant section
3. Be concise - focus on what matters for understanding the app
4. Don't duplicate information already in code comments
5. Update the relevant section based on the criteria above
