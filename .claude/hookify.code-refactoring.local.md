---
name: warn-code-refactoring
enabled: true
event: file
conditions:
  - field: new_text
    operator: regex_match
    pattern: (function\s+\w+|const\s+\w+\s*=|class\s+\w+)
---

## ⚠️ Refactoring Guideline Check

You're adding new code. Before continuing, verify:

### ✅ Replacement Check:
Are you replacing existing functionality?
- **YES**: Remove the old code completely (don't keep both for "compatibility")
- **NO**: Check if existing utilities/modules can handle this use case

### 🔍 Search Before Creating:
Before adding new utility functions, check existing modules:
- `lib/llamaindex/utils.js` - Common utilities
- `lib/llamaindex/loaders.js` - Document loading utilities
- Other `lib/llamaindex/*.js` files

### ❌ Dead Code Patterns:
- Commented-out code blocks (remove them, don't comment)
- Unused variables/imports
- Functions with `// Old implementation` comments
- Duplicated functionality

### 📝 Refactoring Principles:
1. **Replace, don't append**: New functionality should replace old code
2. **Remove obsolete code**: Delete it completely
3. **Simplify**: If new logic covers old use cases, remove the old implementation
4. **No dead code**: Never leave unused code for compatibility

### Example:

❌ **Bad (keeping both):**
```javascript
// Old implementation
function oldFormatData(data) {
  // ...
}

// New implementation
function formatData(data) {
  // ...
}
```

✅ **Good (replacement):**
```javascript
function formatData(data) {
  // Updated implementation
}
```

### Action Required:
If you're adding new code, verify:
1. Existing utilities can't handle the need
2. You're not duplicating functionality
3. You're removing obsolete code when replacing
