---
name: require-verification
enabled: true
event: stop
action: block
conditions:
  - field: transcript
    operator: not_contains
    pattern: npm run lint|npm run type-check|npm run build|npm run test
---

🛑 **Verification not completed!**

Before stopping, you must verify your changes:

**Required checks:**
1. `npm run lint` - No ESLint warnings or errors
2. `npm run type-check` - No TypeScript errors
3. `npm run build` - Successful production build
4. `npm run test:run` - All tests pass

**Run these commands before marking the task complete.**
