---
name: warn-claude-md-updates
enabled: true
event: stop
action: warn
conditions:
  - field: transcript
    operator: regex_match
    pattern: (Edit|Write).*\.(ts|tsx|js|jsx|mjs|json|css)
---

## CLAUDE.md Update Reminder

You've made file changes in this session. Before finalizing, consider whether CLAUDE.md needs updating.

### When to Update CLAUDE.md

- New API routes or route changes
- New components with significant behavior
- Architecture or design pattern changes
- New configuration options or environment variables
- Changes to build/dev/test commands

### When NOT to Update

- Bug fixes, refactoring, style changes, minor utilities

### How to Update

1. Read current CLAUDE.md to understand existing structure
2. Add or update the relevant section(s) concisely
3. Focus on what matters for understanding the system — don't duplicate code comments
