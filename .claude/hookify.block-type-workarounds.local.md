---
name: block-type-workarounds
enabled: true
event: file
action: block
pattern: as never as|as unknown as
conditions:
  - field: file_path
    operator: not_contains
    pattern: __tests__/
---

🛑 **Type assertion workaround detected!**

Using patterns like `as never as Type` or `as unknown as Type` to bypass type checking is forbidden in production code.

**Instead:**
- Fix the underlying type issue
- Use proper type guards
- Restructure the code to be type-safe

**Allowed in test files (`__tests__/`):**
- Mocking external library types (e.g., `NextRequest`, `VectorStoreIndex`)
- Creating partial mock objects for testing

**Never use in production code:**
- `as never as SomeType`
- `as unknown as SomeType`
