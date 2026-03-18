---
name: warn-eslint-config
enabled: true
event: file
action: warn
conditions:
  - field: file_path
    operator: regex_match
    pattern: \.eslintrc|eslint\.config
---

⚠️ **ESLint configuration file modification detected!**

You are modifying an ESLint configuration file. This requires explicit user permission.

**Before proceeding:**
- Explain why the change is needed
- Get user approval
- Document the change reason

**Do NOT:**
- Modify rules to silence errors
- Disable rules without permission
- Add exceptions without discussion
