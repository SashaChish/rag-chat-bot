---
name: enforce-styling-conventions
enabled: true
event: file
---

## ⚠️ Styling Convention Violation

You're not following the project's styling guidelines.

### Expected Styling Approach:

**Use CSS-in-JS with styled-jsx:**
```jsx
export function MyComponent() {
  return (
    <div className="chat-container">
      <h1>Title</h1>
      <style jsx>{`
        .chat-container {
          padding: 1rem;
        }
        h1 {
          color: #333;
        }
      `}</style>
    </div>
  );
}
```

**For global styles:**
```jsx
<style jsx global>{`
  body {
    margin: 0;
  }
`}</style>
```

### ❌ Avoid:

**CSS Modules:**
```jsx
// Don't do this
import styles from './MyComponent.module.css';
<div className={styles.container}>
```

**External CSS files:**
```jsx
// Don't do this
import './MyComponent.css';
<div className="my-component">
```

### Tailwind-Style Naming:
Use descriptive, kebab-case utility class names:
- ✅ Correct: `.chat-container`, `.chat-input`, `.message-list`, `.upload-area`
- ❌ Incorrect: `.container`, `.box`, `.myDiv`, `.styledDiv`

### Action Required:
Convert your styling to use `<style jsx>` tags with Tailwind-style class naming.
