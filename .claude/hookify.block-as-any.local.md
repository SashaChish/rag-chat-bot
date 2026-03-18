---
name: block-as-any
enabled: true
event: file
action: block
pattern: as any
---

🛑 **`as any` type assertion detected!**

Using `as any` defeats the purpose of TypeScript's type system and is strictly forbidden.

**Instead:**
- Define proper types or interfaces
- Use `unknown` if type truly cannot be determined
- Create a more specific type assertion

**Never use:** `as any`
