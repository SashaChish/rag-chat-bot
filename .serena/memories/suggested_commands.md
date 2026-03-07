# Development Commands

## Available NPM Scripts
```bash
npm run dev      # Start development server on http://localhost:3000
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## Development Workflow
1. **Start development server**: `npm run dev`
2. **Make code changes**
3. **Run linting**: `npm run lint` (fix any issues)
4. **Test in browser**: http://localhost:3000

## Testing
- Currently no automated tests configured
- Manual testing through browser
- Test document upload, chat functionality, and source citations

## Linting
- ESLint with `next/core-web-vitals` config
- Run `npm run lint` before committing
- Fix linting issues automatically with `npm run lint -- --fix`

## Build Verification
- Before deployment: `npm run build`
- Check for TypeScript errors
- Verify production build starts: `npm start`

## Git Commands (macOS/Darwin)
```bash
git init              # Initialize git repository (not yet initialized)
git status            # Check status
git add .             # Stage all changes
git commit -m "msg"   # Commit changes
git branch            # List branches
git checkout -b name  # Create and switch to branch
```

## File System Commands (Darwin)
```bash
ls -la                # List all files with details
cd path               # Change directory
pwd                   # Print working directory
rm -rf dir            # Remove directory recursively
mkdir -p dir          # Create directory with parents
cp src dst            # Copy file
mv src dst            # Move/rename file
cat file              # Print file contents
```
