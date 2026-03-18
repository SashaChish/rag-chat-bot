---
name: block-eslint-disable
enabled: true
event: file
action: block
pattern: eslint-disable
---

🛑 **ESLint disable detected!**

You are NOT permitted to disable ESLint rules. ESLint rules exist for a reason - to maintain code quality and consistency.

**Instead:**
- Fix the underlying issue causing the lint error
- Refactor the code to comply with the rule
- Ask the user for permission if you believe the rule should be modified

**Never use:**
- `// eslint-disable-next-line`
- `/* eslint-disable */`
- `// eslint-disable @typescript-eslint/no-explicit-any`
